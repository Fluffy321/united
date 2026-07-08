-- Expose deleted_at on public_profiles so people-pickers (user search, friend
-- suggestions, global search) can exclude anonymized deleted accounts.
-- Historical by-id joins keep working: rows remain in the view.

create or replace view public.public_profiles
with (security_invoker = false)
as
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
  updated_at,
  deleted_at
from public.profiles;

revoke all on public.public_profiles from public, anon, authenticated;
grant select on public.public_profiles to authenticated;
