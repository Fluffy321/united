-- Server-side rate limiting via a ledger table + advisory-locked upsert.
-- Each (user, action, window_bucket) row tracks how many times the user has
-- performed that action in the current fixed-time window. Rows for expired
-- windows are pruned lazily inside the function so they never accumulate.

-- ── Ledger table ──────────────────────────────────────────────────────────────
create table if not exists public.rate_limit_ledger (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  action       text        not null,
  window_start timestamptz not null,
  count        integer     not null default 1,
  primary key (user_id, action, window_start)
);

alter table public.rate_limit_ledger enable row level security;

-- Users may read their own rows (useful for client-side display); writes go
-- through the security-definer function below, not direct client DML.
create policy "users read own rate limit rows"
  on public.rate_limit_ledger
  for select
  using (user_id = auth.uid());

-- ── check_rate_limit ──────────────────────────────────────────────────────────
-- Returns true when the caller is within the limit, raises
-- insufficient_privilege (SQLSTATE 42501) when they are over it.
--
-- p_action         – action key from the allowlist below
-- p_limit          – maximum allowed events in the window
-- p_window_seconds – window width (60 = per-minute, 3600 = per-hour, 86400 = per-day)
create or replace function public.check_rate_limit(
  p_action         text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid;
  v_window_start timestamptz;
  v_count        integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated'
      using errcode = 'insufficient_privilege';
  end if;

  -- Allowlist prevents arbitrary key injection into the ledger.
  if p_action not in ('new_conversation', 'send_message', 'react', 'create_post') then
    raise exception 'Unknown rate-limit action: %', p_action
      using errcode = 'invalid_parameter_value';
  end if;

  -- Fixed-window bucket: floor(epoch / window_seconds) * window_seconds
  v_window_start := to_timestamp(
    (extract(epoch from now())::bigint / p_window_seconds) * p_window_seconds
  );

  -- Serialize concurrent requests for the same (user, action) with an
  -- advisory transaction lock keyed on a stable hash.
  perform pg_advisory_xact_lock(
    ('x' || substr(md5(v_user_id::text || ':' || p_action), 1, 16))::bit(64)::bigint
  );

  -- Prune expired rows for this (user, action) pair lazily.
  delete from public.rate_limit_ledger
  where user_id     = v_user_id
    and action      = p_action
    and window_start < v_window_start;

  -- Upsert: increment the counter for the current window.
  insert into public.rate_limit_ledger (user_id, action, window_start, count)
  values (v_user_id, p_action, v_window_start, 1)
  on conflict (user_id, action, window_start)
  do update set count = rate_limit_ledger.count + 1
  returning count into v_count;

  if v_count > p_limit then
    -- Clamp the stored count so subsequent checks within the window don't
    -- accumulate unboundedly and skew the ledger.
    update public.rate_limit_ledger
    set count = p_limit
    where user_id     = v_user_id
      and action      = p_action
      and window_start = v_window_start;

    raise exception 'Rate limit exceeded for %: % per % seconds', p_action, p_limit, p_window_seconds
      using errcode = 'insufficient_privilege';
  end if;

  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer)
  to authenticated;
