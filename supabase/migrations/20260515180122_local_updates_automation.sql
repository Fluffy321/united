-- ─────────────────────────────────────────────────────────────────────────────
-- Local updates automation
--
-- Review-first pipeline for official/public local update sources. Ingestion is
-- performed server-side by the ingest-local-updates Edge Function. Community
-- managers review pending queue items before they become real community posts.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.local_update_sources (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  source_type text not null,
  source_url text not null,
  category text,
  enabled boolean not null default true,
  requires_review boolean not null default true,
  auto_publish boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_update_sources_source_type_check check (source_type in ('rss', 'api')),
  constraint local_update_sources_unique_url_per_community unique (community_id, source_url)
);

create table if not exists public.local_update_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.local_update_sources(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  external_key text not null,
  source_url text not null,
  title text not null,
  source_name text not null,
  source_published_at timestamptz,
  short_description text,
  category text,
  raw_payload jsonb,
  status text not null default 'pending',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  published_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_update_items_status_check check (status in ('pending', 'approved', 'rejected', 'published')),
  constraint local_update_items_unique_external_key unique (source_id, external_key)
);

create index if not exists local_update_sources_community_enabled_idx
  on public.local_update_sources (community_id, enabled);

create index if not exists local_update_sources_last_checked_idx
  on public.local_update_sources (last_checked_at);

create index if not exists local_update_items_community_status_idx
  on public.local_update_items (community_id, status, source_published_at desc, created_at desc);

create index if not exists local_update_items_source_status_idx
  on public.local_update_items (source_id, status, created_at desc);

alter table public.local_update_sources enable row level security;
alter table public.local_update_items enable row level security;

grant select on public.local_update_sources to authenticated;
grant select on public.local_update_items to authenticated;
grant execute on function public.can_manage_community(uuid) to authenticated;

drop policy if exists "Community managers can read local update sources" on public.local_update_sources;
create policy "Community managers can read local update sources"
  on public.local_update_sources
  for select
  to authenticated
  using (public.can_manage_community(community_id));

drop policy if exists "Community managers can update local update sources" on public.local_update_sources;
create policy "Community managers can update local update sources"
  on public.local_update_sources
  for update
  to authenticated
  using (public.can_manage_community(community_id))
  with check (public.can_manage_community(community_id));

drop policy if exists "Platform admins can create local update sources" on public.local_update_sources;
create policy "Platform admins can create local update sources"
  on public.local_update_sources
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Platform admins can delete local update sources" on public.local_update_sources;
create policy "Platform admins can delete local update sources"
  on public.local_update_sources
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Community managers can read local update items" on public.local_update_items;
create policy "Community managers can read local update items"
  on public.local_update_items
  for select
  to authenticated
  using (public.can_manage_community(community_id));

create or replace function public.touch_local_update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_touch_local_update_sources_updated_at on public.local_update_sources;
create trigger trg_touch_local_update_sources_updated_at
  before update on public.local_update_sources
  for each row
  execute function public.touch_local_update_updated_at();

drop trigger if exists trg_touch_local_update_items_updated_at on public.local_update_items;
create trigger trg_touch_local_update_items_updated_at
  before update on public.local_update_items
  for each row
  execute function public.touch_local_update_updated_at();

create or replace function public.update_local_update_item(
  p_item_id uuid,
  p_title text,
  p_short_description text default null,
  p_category text default null
)
returns public.local_update_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.local_update_items;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select *
    into v_item
  from public.local_update_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Local update item not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_community(v_item.community_id) then
    raise exception 'Not allowed to manage this local update item' using errcode = '42501';
  end if;

  if v_item.status <> 'pending' then
    raise exception 'Only pending local update items can be edited' using errcode = '23514';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Title is required' using errcode = '23502';
  end if;

  update public.local_update_items
  set title = trim(p_title),
      short_description = nullif(trim(coalesce(p_short_description, '')), ''),
      category = nullif(trim(coalesce(p_category, '')), '')
  where id = p_item_id
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.reject_local_update_item(p_item_id uuid)
returns public.local_update_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.local_update_items;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select *
    into v_item
  from public.local_update_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Local update item not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_community(v_item.community_id) then
    raise exception 'Not allowed to manage this local update item' using errcode = '42501';
  end if;

  if v_item.status <> 'pending' then
    raise exception 'Only pending local update items can be rejected' using errcode = '23514';
  end if;

  update public.local_update_items
  set status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = now()
  where id = p_item_id
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.publish_local_update_item(
  p_item_id uuid,
  p_title text default null,
  p_short_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.local_update_items;
  v_post_id uuid;
  v_title text;
  v_summary text;
  v_content text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select *
    into v_item
  from public.local_update_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Local update item not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_community(v_item.community_id) then
    raise exception 'Not allowed to publish this local update item' using errcode = '42501';
  end if;

  if v_item.status <> 'pending' then
    raise exception 'Only pending local update items can be published' using errcode = '23514';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), v_item.title);
  v_summary := coalesce(nullif(trim(p_short_description), ''), v_item.short_description, '');
  v_content := trim(concat_ws(E'\n\n',
    v_summary,
    'Source: ' || v_item.source_name,
    'Read source: ' || v_item.source_url
  ));

  insert into public.posts (
    user_id,
    author_user_id,
    community_id,
    title,
    body,
    content,
    type,
    post_type,
    post_kind,
    is_official
  )
  values (
    auth.uid(),
    auth.uid(),
    v_item.community_id,
    v_title,
    v_content,
    v_content,
    'announcement',
    'announcement',
    'local_update',
    true
  )
  returning id into v_post_id;

  update public.local_update_items
  set title = v_title,
      short_description = nullif(v_summary, ''),
      status = 'published',
      approved_by = auth.uid(),
      approved_at = now(),
      published_post_id = v_post_id
  where id = p_item_id;

  return v_post_id;
end;
$$;

revoke all on function public.update_local_update_item(uuid, text, text, text) from public;
revoke all on function public.reject_local_update_item(uuid) from public;
revoke all on function public.publish_local_update_item(uuid, text, text) from public;

grant execute on function public.update_local_update_item(uuid, text, text, text) to authenticated;
grant execute on function public.reject_local_update_item(uuid) to authenticated;
grant execute on function public.publish_local_update_item(uuid, text, text) to authenticated;

comment on table public.local_update_sources is 'Official/public local update sources ingested into community admin review queues.';
comment on table public.local_update_items is 'Review queue for official/public local updates before publishing to community posts.';
comment on function public.publish_local_update_item(uuid, text, text) is 'Publishes one pending local update item as a real community post after verifying community manager permissions.';

with target_community as (
  select id
  from public.communities
  where lower(name) = 'five towns news & updates'
  order by created_at desc
  limit 1
)
insert into public.local_update_sources (
  community_id,
  name,
  source_type,
  source_url,
  category,
  enabled,
  requires_review,
  auto_publish
)
select
  target_community.id,
  source.name,
  source.source_type,
  source.source_url,
  source.category,
  true,
  true,
  false
from target_community
cross join (
  values
    (
      'Town of Hempstead News Flash',
      'rss',
      'https://hempsteadny.gov/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml',
      'Town Updates'
    ),
    (
      'Town of Hempstead Alert Center',
      'rss',
      'https://hempsteadny.gov/RSSFeed.aspx?ModID=63&CID=All-0',
      'Town Updates'
    ),
    (
      'National Weather Service - Nassau County Alerts',
      'api',
      'https://api.weather.gov/alerts/active?zone=NYC059',
      'Weather Alerts'
    )
) as source(name, source_type, source_url, category)
on conflict (community_id, source_url) do update
set name = excluded.name,
    source_type = excluded.source_type,
    category = excluded.category,
    enabled = true,
    requires_review = true,
    auto_publish = false,
    updated_at = now();
