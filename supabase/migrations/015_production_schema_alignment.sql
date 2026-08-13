-- Production schema alignment for profile covers, Mitzvah entities, and
-- Base44 compatibility fields.
--
-- This migration is intentionally additive/idempotent. It preserves existing
-- data, keeps legacy status values valid, and avoids generated columns so the
-- frontend can write the fields it already sends.

-- ─── Profile and community display fields ───────────────────────────────────

alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists age_range text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_type text,
  add column if not exists communities_joined_count integer not null default 0 check (communities_joined_count >= 0),
  add column if not exists helper_actions_count integer not null default 0 check (helper_actions_count >= 0);

alter table public.communities
  add column if not exists cover_url text;

drop view if exists public.public_profiles;
create view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  cover_url,
  username,
  public_community,
  city,
  bio,
  age_range,
  is_verified,
  verified_type,
  communities_joined_count,
  helper_actions_count,
  is_profile_complete,
  created_at,
  updated_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;


-- ─── Storage bucket for profile covers ──────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('profile-covers', 'profile-covers', true)
on conflict (id) do update
set public = true,
    updated_at = now();

-- Keep the same broad public-image policy pattern as avatars/post/community
-- images, but include the new profile-covers bucket.
drop policy if exists "Public image buckets are readable" on storage.objects;
drop policy if exists "public image buckets are readable" on storage.objects;
create policy "Public image buckets are readable"
  on storage.objects
  for select
  using (bucket_id in ('avatars', 'post-images', 'community-images', 'profile-covers'));

drop policy if exists "Logged in users can upload images" on storage.objects;
drop policy if exists "logged in users can upload images" on storage.objects;
create policy "Logged in users can upload images"
  on storage.objects
  for insert
  with check (
    auth.uid() is not null
    and bucket_id in ('avatars', 'post-images', 'community-images', 'profile-covers')
  );


-- ─── Mitzvah request status compatibility ───────────────────────────────────

alter table public.mitzvah_requests
  drop constraint if exists mitzvah_requests_status_allowed;

-- 004_core_feature_tables.sql created a narrow generated check constraint.
-- Drop it before adding the expanded production-compatible status list.
alter table public.mitzvah_requests
  drop constraint if exists mitzvah_requests_status_check;

alter table public.mitzvah_requests
  add constraint mitzvah_requests_status_allowed
  check (
    status in (
      'open',
      'offered',
      'accepted',
      'in_progress',
      'pending_verify',
      'verified',
      'cancelled',
      -- Legacy values currently used by older app flows / seed data.
      'volunteer_offered',
      'completed',
      'closed',
      'Open',
      'Offered',
      'Claimed',
      'InProgress',
      'Completed',
      'Cancelled'
    )
  )
  not valid;

alter table public.mitzvah_requests
  validate constraint mitzvah_requests_status_allowed;

drop policy if exists "Users can read visible mitzvah requests" on public.mitzvah_requests;
create policy "Users can read visible mitzvah requests"
  on public.mitzvah_requests
  for select
  using (
    status in ('open', 'offered', 'accepted', 'in_progress', 'pending_verify', 'verified', 'volunteer_offered', 'completed', 'Open', 'Offered', 'Claimed', 'InProgress', 'Completed')
    or visibility = 'public'
    or auth.uid() = requester_id
    or auth.uid() = claimed_by_user_id
  );

create or replace function public.sync_mitzvah_request_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.requester_id := coalesce(NEW.requester_id, NEW.created_by_user_id);
  NEW.created_by_user_id := coalesce(NEW.created_by_user_id, NEW.requester_id);

  if NEW.requester_id is null then
    raise exception 'mitzvah_requests requires requester_id or created_by_user_id'
      using errcode = 'not_null_violation';
  end if;

  if NEW.requester_id is distinct from NEW.created_by_user_id then
    raise exception 'mitzvah_requests requester_id conflicts with created_by_user_id'
      using errcode = 'check_violation';
  end if;

  NEW.requester_name := coalesce(NEW.requester_name, NEW.created_by_name);
  NEW.created_by_name := coalesce(NEW.created_by_name, NEW.requester_name);
  NEW.updated_at := now();

  return NEW;
end;
$$;

drop trigger if exists trg_sync_mitzvah_request_compat_fields on public.mitzvah_requests;
create trigger trg_sync_mitzvah_request_compat_fields
  before insert or update on public.mitzvah_requests
  for each row
  execute function public.sync_mitzvah_request_compat_fields();


-- ─── Mitzvah offers Base44 compatibility ────────────────────────────────────

alter table public.mitzvah_offers
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists helper_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists user_name text,
  add column if not exists helper_name text,
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null,
  add column if not exists completed_by_helper boolean not null default false,
  add column if not exists completed_at timestamptz,
  add column if not exists chesed_log_id uuid references public.chesed_hours_logs(id) on delete set null;

update public.mitzvah_offers
set user_id = coalesce(user_id, volunteer_id),
    helper_user_id = coalesce(helper_user_id, user_id, volunteer_id),
    user_name = coalesce(user_name, volunteer_name, helper_name),
    helper_name = coalesce(helper_name, user_name, volunteer_name)
where user_id is null
   or helper_user_id is null
   or user_name is null
   or helper_name is null;

alter table public.mitzvah_offers
  alter column user_id set not null,
  alter column helper_user_id set not null;

create index if not exists mitzvah_offers_user_id_idx
  on public.mitzvah_offers (user_id);
create index if not exists mitzvah_offers_helper_user_id_idx
  on public.mitzvah_offers (helper_user_id);
create index if not exists mitzvah_offers_conversation_id_idx
  on public.mitzvah_offers (conversation_id);
create index if not exists mitzvah_offers_chesed_log_id_idx
  on public.mitzvah_offers (chesed_log_id);

create or replace function public.sync_mitzvah_offer_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(NEW.volunteer_id, NEW.user_id, NEW.helper_user_id);

  if v_user_id is null then
    raise exception 'mitzvah_offers requires volunteer_id, user_id, or helper_user_id'
      using errcode = 'not_null_violation';
  end if;

  if NEW.volunteer_id is not null and NEW.volunteer_id <> v_user_id then
    raise exception 'mitzvah_offers volunteer_id conflicts with user_id/helper_user_id'
      using errcode = 'check_violation';
  end if;

  if NEW.user_id is not null and NEW.user_id <> v_user_id then
    raise exception 'mitzvah_offers user_id conflicts with volunteer_id/helper_user_id'
      using errcode = 'check_violation';
  end if;

  if NEW.helper_user_id is not null and NEW.helper_user_id <> v_user_id then
    raise exception 'mitzvah_offers helper_user_id conflicts with volunteer_id/user_id'
      using errcode = 'check_violation';
  end if;

  NEW.volunteer_id := v_user_id;
  NEW.user_id := v_user_id;
  NEW.helper_user_id := v_user_id;

  NEW.volunteer_name := coalesce(NEW.volunteer_name, NEW.user_name, NEW.helper_name);
  NEW.user_name := coalesce(NEW.user_name, NEW.volunteer_name, NEW.helper_name);
  NEW.helper_name := coalesce(NEW.helper_name, NEW.user_name, NEW.volunteer_name);
  NEW.updated_at := now();

  return NEW;
end;
$$;

drop trigger if exists trg_sync_mitzvah_offer_compat_fields on public.mitzvah_offers;
create trigger trg_sync_mitzvah_offer_compat_fields
  before insert or update on public.mitzvah_offers
  for each row
  execute function public.sync_mitzvah_offer_compat_fields();

drop policy if exists "Requesters and volunteers can read mitzvah offers" on public.mitzvah_offers;
create policy "Requesters and volunteers can read mitzvah offers"
  on public.mitzvah_offers
  for select
  using (
    auth.uid() in (volunteer_id, user_id, helper_user_id)
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
        and mitzvah_requests.requester_id = auth.uid()
    )
  );

drop policy if exists "Users can offer themselves for mitzvah requests" on public.mitzvah_offers;
create policy "Users can offer themselves for mitzvah requests"
  on public.mitzvah_offers
  for insert
  with check (
    auth.uid() in (volunteer_id, user_id, helper_user_id)
  );

drop policy if exists "Requesters and volunteers can update mitzvah offers" on public.mitzvah_offers;
create policy "Requesters and volunteers can update mitzvah offers"
  on public.mitzvah_offers
  for update
  using (
    auth.uid() in (volunteer_id, user_id, helper_user_id)
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
        and mitzvah_requests.requester_id = auth.uid()
    )
  )
  with check (
    auth.uid() in (volunteer_id, user_id, helper_user_id)
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
        and mitzvah_requests.requester_id = auth.uid()
    )
  );


-- ─── Chesed log compatibility ───────────────────────────────────────────────

alter table public.chesed_hours_logs
  add column if not exists signup_id uuid references public.mitzvah_offers(id) on delete set null;

create index if not exists chesed_hours_logs_signup_id_idx
  on public.chesed_hours_logs (signup_id);

create or replace function public.sync_chesed_hours_log_compat_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.volunteer_id := coalesce(NEW.volunteer_id, NEW.user_id);
  NEW.user_id := coalesce(NEW.user_id, NEW.volunteer_id);

  if NEW.volunteer_id is null then
    raise exception 'chesed_hours_logs requires volunteer_id or user_id'
      using errcode = 'not_null_violation';
  end if;

  if NEW.volunteer_id is distinct from NEW.user_id then
    raise exception 'chesed_hours_logs volunteer_id conflicts with user_id'
      using errcode = 'check_violation';
  end if;

  NEW.volunteer_name := coalesce(NEW.volunteer_name, NEW.user_name);
  NEW.user_name := coalesce(NEW.user_name, NEW.volunteer_name);
  NEW.task_title := coalesce(NEW.task_title, NEW.title);
  NEW.title := coalesce(NEW.title, NEW.task_title);
  NEW.date_completed := coalesce(NEW.date_completed, NEW.date, current_date);
  NEW.date := coalesce(NEW.date, NEW.date_completed);
  NEW.hours_completed := coalesce(NEW.hours_completed, NEW.hours, 0);
  NEW.hours := coalesce(NEW.hours, NEW.hours_completed);
  NEW.description := coalesce(NEW.description, NEW.notes);
  NEW.notes := coalesce(NEW.notes, NEW.description);
  NEW.updated_at := now();

  return NEW;
end;
$$;

drop trigger if exists trg_sync_chesed_hours_log_compat_fields on public.chesed_hours_logs;
create trigger trg_sync_chesed_hours_log_compat_fields
  before insert or update on public.chesed_hours_logs
  for each row
  execute function public.sync_chesed_hours_log_compat_fields();

drop policy if exists "Volunteers and verifiers can read chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers and verifiers can read chesed hour logs"
  on public.chesed_hours_logs
  for select
  using (auth.uid() in (volunteer_id, user_id, verifier_id));

drop policy if exists "Volunteers can create their own chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers can create their own chesed hour logs"
  on public.chesed_hours_logs
  for insert
  with check (auth.uid() in (volunteer_id, user_id, verifier_id));

drop policy if exists "Volunteers and verifiers can update chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers and verifiers can update chesed hour logs"
  on public.chesed_hours_logs
  for update
  using (auth.uid() in (volunteer_id, user_id, verifier_id))
  with check (auth.uid() in (volunteer_id, user_id, verifier_id));
