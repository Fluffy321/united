-- Profile privacy hardening.
-- Public profile reads must not expose email or auth/private account data.

alter table public.profiles
  add column if not exists username text,
  add column if not exists public_community text,
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists is_profile_complete boolean not null default false,
  add column if not exists interests jsonb,
  add column if not exists notification_settings jsonb,
  add column if not exists message_settings jsonb,
  add column if not exists app_settings jsonb,
  add column if not exists community_settings jsonb;

create table if not exists public.account_private (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  auth_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.account_private (id, email)
select id, email
from public.profiles
where email is not null
on conflict (id) do update
set email = excluded.email,
    updated_at = now();

alter table public.account_private enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;

do $$
begin
  if not exists (
    select 1 from pg_policies
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'account_private'
    and policyname = 'Users can read their own private account data'
  ) then
    create policy "Users can read their own private account data"
      on public.account_private
      for select
      using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'account_private'
    and policyname = 'Users can create their own private account data'
  ) then
    create policy "Users can create their own private account data"
      on public.account_private
      for insert
      with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'account_private'
    and policyname = 'Users can update their own private account data'
  ) then
    create policy "Users can update their own private account data"
      on public.account_private
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

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
