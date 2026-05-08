-- Profile fields used by the first-time onboarding flow.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists is_profile_complete boolean not null default false,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists neighborhood text,
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

create or replace view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  username,
  public_community,
  city,
  bio,
  is_profile_complete,
  created_at,
  updated_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
