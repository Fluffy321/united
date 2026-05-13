-- ─────────────────────────────────────────────────────────────────────────────
-- 020_community_feature_backbone.sql
--
-- Production backend foundation for richer JUnited Communities:
-- events, RSVPs, resources, marketplace listings, community group chat,
-- pinned announcements, and configurable community templates/settings.
--
-- This migration is additive/idempotent. It preserves existing data and keeps
-- Base44-era field names where current UI code still writes them.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;


-- ─── COMMUNITY SETTINGS / TEMPLATE FIELDS ───────────────────────────────────

alter table public.communities
  add column if not exists accent_color text,
  add column if not exists icon_name text,
  add column if not exists tagline text,
  add column if not exists template_key text,
  add column if not exists theme_style text,
  add column if not exists default_tab text,
  add column if not exists allow_member_posts boolean not null default true,
  add column if not exists allow_member_events boolean not null default false,
  add column if not exists allow_member_listings boolean not null default false,
  add column if not exists allow_group_chat boolean not null default false,
  add column if not exists allow_resources boolean not null default false,
  add column if not exists allow_mitzvah_requests boolean not null default false,
  add column if not exists settings jsonb not null default '{}'::jsonb;

create index if not exists communities_template_key_idx
  on public.communities (template_key);


-- ─── SHARED COMMUNITY ACCESS HELPERS ────────────────────────────────────────
--
-- These helpers are security-definer because RLS policies must be able to test
-- membership/role reliably even if community_memberships policies change later.
-- They only return booleans, never rows.

create or replace function public.is_active_community_member(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    case when auth.uid() is null then false else public.is_admin() end
    or exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = p_community_id
        and cm.user_id = auth.uid()
        and lower(cm.status) = 'active'
    ),
    false
  )
$$;

create or replace function public.can_access_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.communities c
      where c.id = p_community_id
        and (
          case when auth.uid() is null then false else public.is_admin() end
          or lower(coalesce(c.privacy, 'public')) = 'public'
          or public.is_active_community_member(c.id)
        )
    ),
    false
  )
$$;

create or replace function public.can_manage_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    case when auth.uid() is null then false else public.is_admin() end
    or exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = p_community_id
        and cm.user_id = auth.uid()
        and lower(cm.status) = 'active'
        and lower(cm.role) in ('admin', 'moderator')
    ),
    false
  )
$$;

revoke all on function public.is_active_community_member(uuid) from public;
revoke all on function public.can_access_community(uuid) from public;
revoke all on function public.can_manage_community(uuid) from public;
grant execute on function public.is_active_community_member(uuid) to authenticated, anon;
grant execute on function public.can_access_community(uuid) to authenticated, anon;
grant execute on function public.can_manage_community(uuid) to authenticated;


-- ─── COMMUNITY EVENTS ───────────────────────────────────────────────────────

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  cover_url text,
  location_text text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  capacity integer check (capacity is null or capacity >= 0),
  visibility text not null default 'community',
  status text not null default 'published',
  category text,
  start_date date,
  start_time text,
  end_date date,
  end_time text,
  event_date date,
  event_time text,
  location text,
  is_seeded boolean not null default false,
  is_official boolean not null default false,
  created_by_name text,
  has_tickets boolean not null default false,
  is_free boolean not null default true,
  ticket_price numeric(10,2) not null default 0 check (ticket_price >= 0),
  ticket_quantity integer check (ticket_quantity is null or ticket_quantity >= 0),
  tickets_sold integer not null default 0 check (tickets_sold >= 0),
  ticket_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_events_status_allowed check (status in ('draft', 'published', 'cancelled', 'archived')),
  constraint community_events_visibility_allowed check (visibility in ('public', 'community', 'private'))
);

create index if not exists community_events_community_starts_idx
  on public.community_events (community_id, starts_at);
create index if not exists community_events_status_starts_idx
  on public.community_events (status, starts_at);
create index if not exists community_events_created_by_idx
  on public.community_events (created_by);

create or replace function public.sync_community_event_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.location_text := coalesce(NEW.location_text, NEW.location);
  NEW.location := coalesce(NEW.location, NEW.location_text);

  if NEW.starts_at is null then
    if NEW.start_date is null then
      raise exception 'community_events requires starts_at or start_date'
        using errcode = 'not_null_violation';
    end if;
    NEW.starts_at := (
      NEW.start_date::text || ' ' || coalesce(nullif(NEW.start_time, ''), '00:00')
    )::timestamptz;
  end if;

  NEW.start_date := coalesce(NEW.start_date, NEW.starts_at::date);
  NEW.start_time := coalesce(NEW.start_time, to_char(NEW.starts_at, 'HH24:MI'));
  NEW.event_date := coalesce(NEW.event_date, NEW.start_date);
  NEW.event_time := coalesce(NEW.event_time, NEW.start_time);

  if NEW.ends_at is null and NEW.end_date is not null then
    NEW.ends_at := (
      NEW.end_date::text || ' ' || coalesce(nullif(NEW.end_time, ''), '23:59')
    )::timestamptz;
  end if;

  if NEW.ends_at is not null then
    NEW.end_date := coalesce(NEW.end_date, NEW.ends_at::date);
    NEW.end_time := coalesce(NEW.end_time, to_char(NEW.ends_at, 'HH24:MI'));
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_community_event_compat_fields on public.community_events;
create trigger trg_sync_community_event_compat_fields
  before insert or update on public.community_events
  for each row
  execute function public.sync_community_event_compat_fields();

alter table public.community_events enable row level security;

drop policy if exists "Users can read accessible community events" on public.community_events;
create policy "Users can read accessible community events"
  on public.community_events
  for select
  using (
    status <> 'archived'
    and (
      visibility = 'public'
      or public.can_access_community(community_id)
    )
  );

drop policy if exists "Community managers can create events" on public.community_events;
create policy "Community managers can create events"
  on public.community_events
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.can_manage_community(community_id)
      or (
        exists (
          select 1 from public.communities c
          where c.id = community_id
            and c.allow_member_events is true
        )
        and public.is_active_community_member(community_id)
      )
    )
  );

drop policy if exists "Community managers or event creators can update events" on public.community_events;
create policy "Community managers or event creators can update events"
  on public.community_events
  for update
  to authenticated
  using (public.can_manage_community(community_id) or created_by = auth.uid())
  with check (public.can_manage_community(community_id) or created_by = auth.uid());

drop policy if exists "Community managers or event creators can delete events" on public.community_events;
create policy "Community managers or event creators can delete events"
  on public.community_events
  for delete
  to authenticated
  using (public.can_manage_community(community_id) or created_by = auth.uid());


create table if not exists public.community_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  status text not null default 'going',
  ticket_purchased boolean not null default false,
  ticket_quantity integer not null default 1 check (ticket_quantity > 0),
  order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id),
  constraint community_event_rsvps_status_allowed check (status in ('going', 'interested', 'maybe', 'not_going', 'not_attending', 'cancelled'))
);

create index if not exists community_event_rsvps_event_id_idx
  on public.community_event_rsvps (event_id);
create index if not exists community_event_rsvps_user_id_idx
  on public.community_event_rsvps (user_id);
create index if not exists community_event_rsvps_community_id_idx
  on public.community_event_rsvps (community_id);

create or replace function public.sync_community_event_rsvp_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if NEW.community_id is null then
    select community_id into NEW.community_id
    from public.community_events
    where id = NEW.event_id;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_community_event_rsvp_compat_fields on public.community_event_rsvps;
create trigger trg_sync_community_event_rsvp_compat_fields
  before insert or update on public.community_event_rsvps
  for each row
  execute function public.sync_community_event_rsvp_compat_fields();

alter table public.community_event_rsvps enable row level security;

drop policy if exists "Users can read accessible event rsvps" on public.community_event_rsvps;
create policy "Users can read accessible event rsvps"
  on public.community_event_rsvps
  for select
  using (
    public.can_access_community(community_id)
    or user_id = auth.uid()
  );

drop policy if exists "Users can create their own event rsvps" on public.community_event_rsvps;
create policy "Users can create their own event rsvps"
  on public.community_event_rsvps
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.community_events e
      where e.id = event_id
        and public.can_access_community(e.community_id)
    )
  );

drop policy if exists "Users can update their own event rsvps" on public.community_event_rsvps;
create policy "Users can update their own event rsvps"
  on public.community_event_rsvps
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own event rsvps" on public.community_event_rsvps;
create policy "Users can delete their own event rsvps"
  on public.community_event_rsvps
  for delete
  to authenticated
  using (user_id = auth.uid());


-- ─── COMMUNITY RESOURCES ────────────────────────────────────────────────────

create table if not exists public.community_resources (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  resource_type text not null default 'link',
  url text,
  link_url text,
  file_url text,
  file_name text,
  category text,
  is_pinned boolean not null default false,
  uploaded_by_id uuid references public.profiles(id) on delete set null,
  uploaded_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_resources_type_allowed check (resource_type in ('link', 'file', 'document', 'guide', 'schedule', 'form'))
);

create index if not exists community_resources_community_created_idx
  on public.community_resources (community_id, created_at desc);
create index if not exists community_resources_created_by_idx
  on public.community_resources (created_by);
create index if not exists community_resources_pinned_idx
  on public.community_resources (community_id, is_pinned, created_at desc);

create or replace function public.sync_community_resource_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.created_by := coalesce(NEW.created_by, NEW.uploaded_by_id);
  NEW.uploaded_by_id := coalesce(NEW.uploaded_by_id, NEW.created_by);
  NEW.url := coalesce(NEW.url, NEW.link_url);
  NEW.link_url := coalesce(NEW.link_url, NEW.url);
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_community_resource_compat_fields on public.community_resources;
create trigger trg_sync_community_resource_compat_fields
  before insert or update on public.community_resources
  for each row
  execute function public.sync_community_resource_compat_fields();

alter table public.community_resources enable row level security;

drop policy if exists "Users can read accessible community resources" on public.community_resources;
create policy "Users can read accessible community resources"
  on public.community_resources
  for select
  using (public.can_access_community(community_id));

drop policy if exists "Community members can create allowed resources" on public.community_resources;
create policy "Community members can create allowed resources"
  on public.community_resources
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.can_manage_community(community_id)
      or (
        exists (
          select 1 from public.communities c
          where c.id = community_id
            and c.allow_resources is true
        )
        and public.is_active_community_member(community_id)
      )
    )
  );

drop policy if exists "Community managers or resource creators can update resources" on public.community_resources;
create policy "Community managers or resource creators can update resources"
  on public.community_resources
  for update
  to authenticated
  using (public.can_manage_community(community_id) or created_by = auth.uid())
  with check (public.can_manage_community(community_id) or created_by = auth.uid());

drop policy if exists "Community managers or resource creators can delete resources" on public.community_resources;
create policy "Community managers or resource creators can delete resources"
  on public.community_resources
  for delete
  to authenticated
  using (public.can_manage_community(community_id) or created_by = auth.uid());


-- ─── COMMUNITY LISTINGS / MARKETPLACE ───────────────────────────────────────

create table if not exists public.community_listings (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  seller_name text,
  title text not null,
  description text,
  price numeric(10,2) check (price is null or price >= 0),
  currency text not null default 'USD',
  category text,
  condition text,
  image_urls text[],
  image_url text,
  status text not null default 'available',
  pickup_location_text text,
  type text not null default 'product',
  billing_period text not null default 'one_time',
  perks text[] not null default '{}'::text[],
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  orders_count integer not null default 0 check (orders_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_listings_status_allowed check (status in ('available', 'pending', 'sold', 'removed')),
  constraint community_listings_type_allowed check (type in ('subscription', 'product', 'service', 'listing')),
  constraint community_listings_billing_period_allowed check (billing_period in ('one_time', 'monthly', 'yearly'))
);

create index if not exists community_listings_community_status_idx
  on public.community_listings (community_id, status, created_at desc);
create index if not exists community_listings_seller_id_idx
  on public.community_listings (seller_id);
create index if not exists community_listings_is_active_idx
  on public.community_listings (community_id, is_active, created_at desc);

create or replace function public.sync_community_listing_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if NEW.image_url is not null and (NEW.image_urls is null or array_length(NEW.image_urls, 1) is null) then
    NEW.image_urls := array[NEW.image_url];
  end if;

  if NEW.status = 'removed' then
    NEW.is_active := false;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_community_listing_compat_fields on public.community_listings;
create trigger trg_sync_community_listing_compat_fields
  before insert or update on public.community_listings
  for each row
  execute function public.sync_community_listing_compat_fields();

alter table public.community_listings enable row level security;

drop policy if exists "Users can read active accessible community listings" on public.community_listings;
create policy "Users can read active accessible community listings"
  on public.community_listings
  for select
  using (
    is_active is true
    and status in ('available', 'pending', 'sold')
    and public.can_access_community(community_id)
  );

drop policy if exists "Community members can create allowed listings" on public.community_listings;
create policy "Community members can create allowed listings"
  on public.community_listings
  for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and (
      public.can_manage_community(community_id)
      or (
        exists (
          select 1 from public.communities c
          where c.id = community_id
            and c.allow_member_listings is true
        )
        and public.is_active_community_member(community_id)
      )
    )
  );

drop policy if exists "Listing sellers and managers can update listings" on public.community_listings;
create policy "Listing sellers and managers can update listings"
  on public.community_listings
  for update
  to authenticated
  using (seller_id = auth.uid() or public.can_manage_community(community_id))
  with check (seller_id = auth.uid() or public.can_manage_community(community_id));

drop policy if exists "Listing sellers and managers can delete listings" on public.community_listings;
create policy "Listing sellers and managers can delete listings"
  on public.community_listings
  for delete
  to authenticated
  using (seller_id = auth.uid() or public.can_manage_community(community_id));


-- ─── COMMUNITY GROUP CHAT ───────────────────────────────────────────────────
--
-- The existing direct-message tables store fixed participant arrays, which is
-- not a good fit for community membership-based chat. This table stores group
-- chat message rows directly and maps to the current CommunityGroupChat entity.

create table if not exists public.community_group_chats (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  message text not null,
  body text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_group_chats_community_created_idx
  on public.community_group_chats (community_id, created_at desc);
create index if not exists community_group_chats_author_id_idx
  on public.community_group_chats (author_id);

create or replace function public.sync_community_group_chat_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.message := coalesce(NEW.message, NEW.body);
  NEW.body := coalesce(NEW.body, NEW.message);
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_community_group_chat_compat_fields on public.community_group_chats;
create trigger trg_sync_community_group_chat_compat_fields
  before insert or update on public.community_group_chats
  for each row
  execute function public.sync_community_group_chat_compat_fields();

alter table public.community_group_chats enable row level security;

drop policy if exists "Community members can read group chat" on public.community_group_chats;
create policy "Community members can read group chat"
  on public.community_group_chats
  for select
  to authenticated
  using (
    is_deleted is false
    and public.is_active_community_member(community_id)
  );

drop policy if exists "Community members can send group chat messages" on public.community_group_chats;
create policy "Community members can send group chat messages"
  on public.community_group_chats
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_active_community_member(community_id)
    and (
      public.can_manage_community(community_id)
      or exists (
        select 1 from public.communities c
        where c.id = community_id
          and c.allow_group_chat is true
      )
    )
  );

drop policy if exists "Users can update their own group chat messages" on public.community_group_chats;
create policy "Users can update their own group chat messages"
  on public.community_group_chats
  for update
  to authenticated
  using (author_id = auth.uid() or public.can_manage_community(community_id))
  with check (author_id = auth.uid() or public.can_manage_community(community_id));

drop policy if exists "Users can delete their own group chat messages" on public.community_group_chats;
create policy "Users can delete their own group chat messages"
  on public.community_group_chats
  for delete
  to authenticated
  using (author_id = auth.uid() or public.can_manage_community(community_id));


-- ─── POSTS: PINNED ANNOUNCEMENTS / COMPATIBILITY ────────────────────────────

alter table public.posts
  add column if not exists body text,
  add column if not exists content text,
  add column if not exists type text not null default 'post',
  add column if not exists post_type text,
  add column if not exists post_kind text not null default 'standard',
  add column if not exists author_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text,
  add column if not exists author_avatar_url text,
  add column if not exists is_official boolean not null default false,
  add column if not exists org_id text,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid references public.profiles(id) on delete set null,
  add column if not exists event_date date,
  add column if not exists event_time text,
  add column if not exists location_text text;

create index if not exists posts_community_pinned_idx
  on public.posts (community_id, is_pinned, pinned_at desc)
  where is_pinned is true;
create index if not exists posts_community_post_kind_idx
  on public.posts (community_id, post_kind, created_at desc);
create index if not exists posts_community_post_type_idx
  on public.posts (community_id, post_type, created_at desc);

create or replace function public.sync_post_compat_and_guard_pins()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.body := coalesce(NEW.body, NEW.content);
  NEW.content := coalesce(NEW.content, NEW.body);
  NEW.post_type := coalesce(NEW.post_type, NEW.type);
  NEW.type := coalesce(NEW.type, NEW.post_type, 'post');
  NEW.post_kind := coalesce(NEW.post_kind, NEW.post_type, NEW.type, 'standard');
  NEW.user_id := coalesce(NEW.user_id, NEW.author_user_id);
  NEW.author_user_id := coalesce(NEW.author_user_id, NEW.user_id);

  if TG_OP = 'INSERT' and NEW.is_pinned is true then
    if NEW.community_id is null or not public.can_manage_community(NEW.community_id) then
      raise exception 'Only community managers can create pinned posts'
        using errcode = 'insufficient_privilege';
    end if;
    NEW.pinned_at := coalesce(NEW.pinned_at, now());
    NEW.pinned_by := coalesce(NEW.pinned_by, auth.uid());
  end if;

  if TG_OP = 'UPDATE' and (
    NEW.is_pinned is distinct from OLD.is_pinned
    or NEW.pinned_at is distinct from OLD.pinned_at
    or NEW.pinned_by is distinct from OLD.pinned_by
  ) then
    if NEW.community_id is null or not public.can_manage_community(NEW.community_id) then
      raise exception 'Only community managers can change pinned posts'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if NEW.is_pinned is true then
    NEW.pinned_at := coalesce(NEW.pinned_at, now());
    NEW.pinned_by := coalesce(NEW.pinned_by, auth.uid());
  else
    NEW.pinned_at := null;
    NEW.pinned_by := null;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_post_compat_and_guard_pins on public.posts;
create trigger trg_sync_post_compat_and_guard_pins
  before insert or update on public.posts
  for each row
  execute function public.sync_post_compat_and_guard_pins();

-- Replace the original broad insert policy with one that prevents user_id
-- spoofing. Existing stricter policies are left in place.
drop policy if exists "Signed in users can create posts" on public.posts;
create policy "Signed in users can create posts"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);


-- ─── STORAGE FOR COMMUNITY RESOURCE FILES ───────────────────────────────────

insert into storage.buckets (id, name, public)
values ('community-resources', 'community-resources', true)
on conflict (id) do update
set public = true,
    updated_at = now();

drop policy if exists "Public image buckets are readable" on storage.objects;
drop policy if exists "public image buckets are readable" on storage.objects;
create policy "Public image buckets are readable"
  on storage.objects
  for select
  using (
    bucket_id in (
      'avatars',
      'post-images',
      'community-images',
      'profile-covers',
      'community-resources'
    )
  );

drop policy if exists "Logged in users can upload images" on storage.objects;
drop policy if exists "logged in users can upload images" on storage.objects;
create policy "Logged in users can upload images"
  on storage.objects
  for insert
  with check (
    auth.uid() is not null
    and bucket_id in (
      'avatars',
      'post-images',
      'community-images',
      'profile-covers',
      'community-resources'
    )
  );

drop policy if exists "Logged in users can update their uploaded images" on storage.objects;
create policy "Logged in users can update their uploaded images"
  on storage.objects
  for update
  to authenticated
  using (
    owner = auth.uid()
    and bucket_id in (
      'avatars',
      'post-images',
      'community-images',
      'profile-covers',
      'community-resources'
    )
  )
  with check (
    owner = auth.uid()
    and bucket_id in (
      'avatars',
      'post-images',
      'community-images',
      'profile-covers',
      'community-resources'
    )
  );


-- ─── COMMENTS ───────────────────────────────────────────────────────────────

comment on table public.community_events is 'Production community events with Base44-compatible date/time/ticket fields.';
comment on table public.community_event_rsvps is 'Per-user RSVP rows for community events.';
comment on table public.community_resources is 'Links/files/guides shared inside a community.';
comment on table public.community_listings is 'Community marketplace/store listings. No checkout/payment processing.';
comment on table public.community_group_chats is 'Community group chat message rows, access controlled by active membership.';
comment on column public.communities.settings is 'Future-safe community settings JSON. Main feature flags remain first-class columns.';
comment on column public.posts.is_pinned is 'Pinned community post/announcement flag guarded by trigger permissions.';
