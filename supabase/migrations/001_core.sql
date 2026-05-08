create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user',
  is_profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  logo_url text,
  follower_count integer not null default 0,
  description text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  community_id text,
  type text not null default 'post',
  title text,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'profiles'
    and policyname = 'Profiles are readable'
  ) then
    create policy "Profiles are readable"
      on public.profiles
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'profiles'
    and policyname = 'Users can create their profile'
  ) then
    create policy "Users can create their profile"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'profiles'
    and policyname = 'Users can update their profile'
  ) then
    create policy "Users can update their profile"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'communities'
    and policyname = 'Communities are readable'
  ) then
    create policy "Communities are readable"
      on public.communities
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'communities'
    and policyname = 'Signed in users can create communities'
  ) then
    create policy "Signed in users can create communities"
      on public.communities
      for insert
      with check (auth.uid() is not null);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'posts'
    and policyname = 'Posts are readable'
  ) then
    create policy "Posts are readable"
      on public.posts
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'posts'
    and policyname = 'Signed in users can create posts'
  ) then
    create policy "Signed in users can create posts"
      on public.posts
      for insert
      with check (auth.uid() is not null);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true),
  ('community-images', 'community-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Public image buckets are readable'
  ) then
    create policy "Public image buckets are readable"
      on storage.objects
      for select
      using (bucket_id in ('avatars', 'post-images', 'community-images'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Logged in users can upload images'
  ) then
    create policy "Logged in users can upload images"
      on storage.objects
      for insert
      with check (
        auth.uid() is not null
        and bucket_id in ('avatars', 'post-images', 'community-images')
      );
  end if;
end $$;
