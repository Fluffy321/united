create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  route text,
  message text not null,
  stack text,
  user_agent text
);

create index if not exists idx_error_logs_created_at
  on public.error_logs(created_at desc);

create index if not exists idx_error_logs_user_id
  on public.error_logs(user_id);

alter table public.error_logs enable row level security;

create policy "error_logs_insert"
  on public.error_logs for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "error_logs_admin_select"
  on public.error_logs for select
  to authenticated
  using (public.is_admin());

grant insert on public.error_logs to anon, authenticated;
grant select on public.error_logs to authenticated;
