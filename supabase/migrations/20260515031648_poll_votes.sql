-- ─────────────────────────────────────────────────────────────────────────────
-- 030_poll_votes.sql
--
-- Creates poll_votes table so feed polls can persist real votes.
-- One vote per user per post, enforced by unique constraint.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.poll_votes (
  id            uuid        primary key default gen_random_uuid(),
  post_id       uuid        not null references public.posts(id) on delete cascade,
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  option_index  int         not null check (option_index >= 0),
  created_at    timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists poll_votes_post_id_idx on public.poll_votes (post_id);
create index if not exists poll_votes_user_id_idx on public.poll_votes (user_id);

alter table public.poll_votes enable row level security;

-- Authenticated users can cast one vote per poll (unique constraint prevents double-voting).
drop policy if exists "Users can vote on polls" on public.poll_votes;
create policy "Users can vote on polls"
  on public.poll_votes
  for insert
  with check (auth.uid() = user_id);

-- Anyone authenticated can read votes (needed to compute counts + show user's own vote).
drop policy if exists "Anyone can read poll votes" on public.poll_votes;
create policy "Anyone can read poll votes"
  on public.poll_votes
  for select
  using (auth.role() = 'authenticated');

-- Users can delete their own vote (allows changing vote).
drop policy if exists "Users can delete their own vote" on public.poll_votes;
create policy "Users can delete their own vote"
  on public.poll_votes
  for delete
  using (auth.uid() = user_id);

comment on table public.poll_votes is 'One row per user per poll post. unique(post_id,user_id) enforces one-vote-per-user.';
