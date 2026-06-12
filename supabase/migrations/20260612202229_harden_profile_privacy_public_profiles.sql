-- Make public_profiles the authenticated safe surface for other-user profile reads
-- while keeping public.profiles owner-readable only.

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
  updated_at
from public.profiles;

revoke all on public.public_profiles from public, anon, authenticated;
grant select on public.public_profiles to authenticated;

drop policy if exists "profiles are readable by everyone" on public.profiles;
drop policy if exists "Profiles are readable" on public.profiles;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read their own profile'
  ) then
    create policy "Users can read their own profile"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;
end $$;
