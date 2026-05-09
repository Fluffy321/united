-- Migration 009: Atomic counter columns and increment RPC
-- Replaces all client-side read-modify-write counter updates with a single
-- server-side function. Concurrent increments/decrements on the same row are
-- now serialised by Postgres, eliminating counter drift.

-- ── 1. Add counter columns to posts ──────────────────────────────────────────
-- These fields are used by the app but were not yet present in the schema.
alter table public.posts
  add column if not exists likes_count    integer not null default 0,
  add column if not exists comments_count integer not null default 0;

-- ── 2. Atomic increment / decrement function ──────────────────────────────────
-- Usage: select increment_counter('posts', 'likes_count', '<uuid>', 1);
--        select increment_counter('communities', 'follower_count', '<uuid>', -1);
--
-- Security: the allowlist below is the only way to expand this surface.
-- Dynamic identifiers are quoted via %I so even if a value somehow bypassed
-- the allowlist it could not inject arbitrary SQL.
create or replace function public.increment_counter(
  p_table  text,
  p_column text,
  p_id     uuid,
  p_delta  integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allowlist: only permitted (table, column) pairs reach the UPDATE.
  if (p_table, p_column) not in (
    ('posts',       'likes_count'),
    ('posts',       'comments_count'),
    ('communities', 'follower_count'),
    ('communities', 'post_count')
  ) then
    raise exception 'increment_counter: disallowed table/column pair: %.%', p_table, p_column;
  end if;

  execute format(
    'update %I set %I = greatest(0, coalesce(%I, 0) + $1), updated_at = now() where id = $2',
    p_table, p_column, p_column
  )
  using p_delta, p_id;
end;
$$;

-- Any authenticated user may call this function.
-- Who may call it and with what delta is enforced by the application layer;
-- the allowlist above prevents table/column injection.
grant execute on function public.increment_counter(text, text, uuid, integer) to authenticated;
