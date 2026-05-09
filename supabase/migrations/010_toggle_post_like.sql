-- Migration 010: Atomic post like toggle
-- Moves post likes into Supabase so Like records and likes_count are
-- always updated in the same transaction. Eliminates the class of bug
-- where the client writes the Like row and the counter separately and
-- one of them fails, leaving them permanently out of sync.

-- ── 1. post_likes table ───────────────────────────────────────────────────────
create table if not exists public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

-- Anyone authenticated can see who liked what (needed for liked-by lists).
create policy "Post likes are publicly readable"
  on public.post_likes for select using (true);

-- Defense in depth: direct writes must belong to the authenticated user.
-- The preferred write path is the toggle_post_like() RPC below.
create policy "Users manage their own likes"
  on public.post_likes for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 2. Atomic toggle function ─────────────────────────────────────────────────
-- Deletes the like if it exists, inserts it if it doesn't, and updates
-- posts.likes_count — all in the same implicit PL/pgSQL transaction.
-- Returns {"liked": true/false} reflecting the new state.
create or replace function public.toggle_post_like(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid    := auth.uid();
  v_delta   integer;
begin
  if v_user_id is null then
    raise exception 'toggle_post_like: not authenticated';
  end if;

  -- Try to remove an existing like.
  delete from public.post_likes
  where post_id = p_post_id
    and user_id = v_user_id;

  if found then
    -- Was liked — decrement.
    v_delta := -1;
  else
    -- Not yet liked — insert.
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, v_user_id);
    v_delta := 1;
  end if;

  -- Counter update is in the same transaction: if either the row mutation
  -- or this update fails, the whole function rolls back automatically.
  update public.posts
  set likes_count = greatest(0, coalesce(likes_count, 0) + v_delta),
      updated_at  = now()
  where id = p_post_id;

  return jsonb_build_object('liked', v_delta = 1);
end;
$$;

grant execute on function public.toggle_post_like(uuid) to authenticated;
