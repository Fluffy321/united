-- Public (unauthenticated) read access for a single meal train.
--
-- Applied directly to the database ahead of this commit; recorded here to keep
-- migration history in sync.
--
-- Why functions and not an RLS policy: an RLS policy is a row predicate and
-- cannot see the caller's WHERE clause, so any policy permitting anon to read
-- one open train also permits `select * from meal_train_requests` returning
-- every open train. Only a function that takes the id as an argument can
-- enforce by-id access. RLS is also row-level and cannot hide columns.
--
-- These are SECURITY DEFINER, so they bypass RLS and the function body IS the
-- security boundary:
--   * the status = 'open' check lives inside each function — closed and
--     cancelled trains return zero rows;
--   * every column in RETURNS TABLE is a deliberate disclosure. Intentionally
--     absent: delivery_address, contact_phone, created_by, created_by_name,
--     notes, community_id, and (on slots) claimed_by / claimed_by_name.
--     Slot occupancy is exposed only as the boolean is_claimed, so claimer
--     identity never leaves the database.
--
-- anon is granted EXECUTE on these two functions and nothing else. No table
-- grants. Existing meal_train_requests / meal_slots policies are all scoped
-- `to authenticated` and are untouched.

create or replace function public.public_meal_train(p_train_id uuid)
returns table (
  id            uuid,
  family_name   text,
  period_start  date,
  period_end    date,
  meals_needed  integer,
  dietary_notes text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    t.id,
    t.family_name,
    t.period_start,
    t.period_end,
    t.meals_needed,
    t.dietary_notes
  from public.meal_train_requests t
  where t.id = p_train_id
    and t.status = 'open';
$$;

create or replace function public.public_meal_train_slots(p_train_id uuid)
returns table (
  id         uuid,
  slot_date  date,
  meal_type  text,
  is_claimed boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id,
    s.slot_date,
    s.meal_type,
    (s.claimed_by is not null) as is_claimed
  from public.meal_slots s
  join public.meal_train_requests t on t.id = s.train_id
  where s.train_id = p_train_id
    and t.status = 'open'
  order by s.slot_date, s.meal_type;
$$;

revoke all on function public.public_meal_train(uuid) from public;
revoke all on function public.public_meal_train_slots(uuid) from public;
grant execute on function public.public_meal_train(uuid) to anon, authenticated;
grant execute on function public.public_meal_train_slots(uuid) to anon, authenticated;

comment on function public.public_meal_train(uuid) is
  'Unauthenticated single-train read for /meals/:id. By-id only; open trains only. Excludes delivery_address, contact_phone, notes, and all creator identity.';

comment on function public.public_meal_train_slots(uuid) is
  'Unauthenticated slot list for /meals/:id. Exposes occupancy as is_claimed only — never claimed_by or claimed_by_name.';
