-- Basic notifications system used by the frontend notification service.
-- 004_core_feature_tables.sql already creates this table; this migration keeps it safe
-- if it is run independently or after older databases.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  link_url text,
  post_id uuid references public.posts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications add column if not exists updated_at timestamptz not null default now();

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_read_at_idx
  on public.notifications (user_id, read_at);

create index if not exists notifications_user_id_type_idx
  on public.notifications (user_id, type);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications" on public.notifications;
create policy "Users can mark their own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can create notifications they caused" on public.notifications;
create policy "Users can create notifications they caused"
  on public.notifications
  for insert
  with check (auth.uid() = actor_id or actor_id is null);
