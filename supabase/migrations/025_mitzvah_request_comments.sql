-- Discussion threads attached directly to mitzvah/help requests.

create table if not exists public.mitzvah_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mitzvah_requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_date timestamptz
);

create index if not exists mitzvah_request_comments_request_id_created_at_idx
  on public.mitzvah_request_comments (request_id, created_at);

create index if not exists mitzvah_request_comments_author_id_idx
  on public.mitzvah_request_comments (author_id);

alter table public.mitzvah_request_comments enable row level security;

drop policy if exists "Users can read mitzvah request comments" on public.mitzvah_request_comments;
create policy "Users can read mitzvah request comments"
  on public.mitzvah_request_comments
  for select
  using (auth.uid() is not null);

drop policy if exists "Users can create their own mitzvah request comments" on public.mitzvah_request_comments;
create policy "Users can create their own mitzvah request comments"
  on public.mitzvah_request_comments
  for insert
  with check (auth.uid() = author_id);
