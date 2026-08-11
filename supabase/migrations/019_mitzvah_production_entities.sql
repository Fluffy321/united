-- ─────────────────────────────────────────────────────────────────────────────
-- 014_mitzvah_production_entities.sql
--
-- Adds production tables for user mitzvah progress, logs, points, actions,
-- and blocking. Safe to re-run: table creation and indexes use IF NOT EXISTS;
-- policies are dropped/recreated so their definitions stay current.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;


-- ─── USER STREAKS ────────────────────────────────────────────────────────────

create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_activity_date date,
  badge_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists user_streaks_user_id_idx
  on public.user_streaks (user_id);

alter table public.user_streaks enable row level security;

drop policy if exists "Users can read their own user streak" on public.user_streaks;
create policy "Users can read their own user streak"
  on public.user_streaks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own user streak" on public.user_streaks;
create policy "Users can create their own user streak"
  on public.user_streaks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own user streak" on public.user_streaks;
create policy "Users can update their own user streak"
  on public.user_streaks
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own user streak" on public.user_streaks;
create policy "Users can delete their own user streak"
  on public.user_streaks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ─── MITZVAH LOGS ────────────────────────────────────────────────────────────

create table if not exists public.mitzvah_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  community_id uuid references public.communities(id) on delete set null,
  date date not null default current_date,
  category text,
  description text,
  reflection text,
  hours_completed numeric(7,2) check (hours_completed is null or hours_completed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mitzvah_logs_user_id_date_idx
  on public.mitzvah_logs (user_id, date desc);
create index if not exists mitzvah_logs_user_id_idx
  on public.mitzvah_logs (user_id);
create index if not exists mitzvah_logs_community_id_idx
  on public.mitzvah_logs (community_id);

alter table public.mitzvah_logs enable row level security;

drop policy if exists "Users can read their own mitzvah logs" on public.mitzvah_logs;
create policy "Users can read their own mitzvah logs"
  on public.mitzvah_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own mitzvah logs" on public.mitzvah_logs;
create policy "Users can create their own mitzvah logs"
  on public.mitzvah_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own mitzvah logs" on public.mitzvah_logs;
create policy "Users can update their own mitzvah logs"
  on public.mitzvah_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own mitzvah logs" on public.mitzvah_logs;
create policy "Users can delete their own mitzvah logs"
  on public.mitzvah_logs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ─── MITZVAH ACTIONS ─────────────────────────────────────────────────────────

create table if not exists public.mitzvah_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  request_id uuid references public.mitzvah_requests(id) on delete set null,
  request_title text,
  action_type text,
  description text,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mitzvah_actions_user_id_idx
  on public.mitzvah_actions (user_id);
create index if not exists mitzvah_actions_request_id_idx
  on public.mitzvah_actions (request_id);
create index if not exists mitzvah_actions_user_id_created_at_idx
  on public.mitzvah_actions (user_id, created_at desc);

alter table public.mitzvah_actions enable row level security;

drop policy if exists "Users can read their own mitzvah actions" on public.mitzvah_actions;
create policy "Users can read their own mitzvah actions"
  on public.mitzvah_actions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own mitzvah actions" on public.mitzvah_actions;
create policy "Users can create their own mitzvah actions"
  on public.mitzvah_actions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own mitzvah actions" on public.mitzvah_actions;
create policy "Users can update their own mitzvah actions"
  on public.mitzvah_actions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own mitzvah actions" on public.mitzvah_actions;
create policy "Users can delete their own mitzvah actions"
  on public.mitzvah_actions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ─── MITZVAH POINTS ──────────────────────────────────────────────────────────

create table if not exists public.mitzvah_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  total_points integer not null default 0 check (total_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists mitzvah_points_user_id_idx
  on public.mitzvah_points (user_id);
create index if not exists mitzvah_points_total_points_idx
  on public.mitzvah_points (total_points desc);

alter table public.mitzvah_points enable row level security;

drop policy if exists "Mitzvah points are publicly readable" on public.mitzvah_points;
create policy "Mitzvah points are publicly readable"
  on public.mitzvah_points
  for select
  using (true);

drop policy if exists "Users can create their own mitzvah points" on public.mitzvah_points;
create policy "Users can create their own mitzvah points"
  on public.mitzvah_points
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own mitzvah points" on public.mitzvah_points;
create policy "Users can update their own mitzvah points"
  on public.mitzvah_points
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own mitzvah points" on public.mitzvah_points;
create policy "Users can delete their own mitzvah points"
  on public.mitzvah_points
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ─── USER BLOCKS ─────────────────────────────────────────────────────────────

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_id_idx
  on public.user_blocks (blocker_id);
create index if not exists user_blocks_blocked_id_idx
  on public.user_blocks (blocked_id);
create index if not exists user_blocks_blocker_blocked_idx
  on public.user_blocks (blocker_id, blocked_id);
create index if not exists user_blocks_blocked_blocker_idx
  on public.user_blocks (blocked_id, blocker_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can read blocks they created" on public.user_blocks;
create policy "Users can read blocks they created"
  on public.user_blocks
  for select
  to authenticated
  using ((select auth.uid()) = blocker_id);

drop policy if exists "Users can create blocks as themselves" on public.user_blocks;
create policy "Users can create blocks as themselves"
  on public.user_blocks
  for insert
  to authenticated
  with check ((select auth.uid()) = blocker_id);

drop policy if exists "Users can update blocks they created" on public.user_blocks;
create policy "Users can update blocks they created"
  on public.user_blocks
  for update
  to authenticated
  using ((select auth.uid()) = blocker_id)
  with check ((select auth.uid()) = blocker_id);

drop policy if exists "Users can delete blocks they created" on public.user_blocks;
create policy "Users can delete blocks they created"
  on public.user_blocks
  for delete
  to authenticated
  using ((select auth.uid()) = blocker_id);


comment on table public.user_streaks is 'Private per-user mitzvah streak state.';
comment on table public.mitzvah_logs is 'Private per-user mitzvah log entries.';
comment on table public.mitzvah_actions is 'Private per-user mitzvah actions, optionally linked to a help request.';
comment on table public.mitzvah_points is 'Publicly readable per-user mitzvah point totals.';
comment on table public.user_blocks is 'Private block list rows visible only to the blocker.';
