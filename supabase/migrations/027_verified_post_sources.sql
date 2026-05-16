alter table public.posts
  add column if not exists source_name text,
  add column if not exists source_ref text,
  add column if not exists source_url text,
  add column if not exists migrated_from text;

create index if not exists posts_migrated_from_idx
  on public.posts (migrated_from)
  where migrated_from is not null;
