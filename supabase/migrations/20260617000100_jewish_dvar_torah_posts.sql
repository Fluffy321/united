alter table public.posts
  add column if not exists dvar_torah_parsha_title text,
  add column if not exists dvar_torah_parsha_date date,
  add column if not exists dvar_torah_status text not null default 'pending',
  add column if not exists dvar_torah_author_title text;

create index if not exists posts_dvar_torah_week_status_idx
  on public.posts (activity_kind, dvar_torah_parsha_date, dvar_torah_status, created_at desc)
  where activity_kind = 'jewish_dvar_torah';
