-- Community Activity Digest: track each user's last visit per community.
-- Enables showing "X new since your last visit" in CommunityWelcomeHub.

create table if not exists public.community_last_visits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  visited_at   timestamptz not null default now(),
  primary key (user_id, community_id)
);

alter table public.community_last_visits enable row level security;

create policy "Users can read own last visits"
  on public.community_last_visits
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own last visits"
  on public.community_last_visits
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own last visits"
  on public.community_last_visits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
