-- Require an authenticated caller in release_meal_slot().
--
-- Applied directly to the database ahead of this migration; committed here to
-- keep history in sync.
--
-- Why: `null is distinct from null` is false, so an unauthenticated caller
-- passed the ownership test on an *unclaimed* slot and the update ran as a
-- null -> null no-op. Not reachable in practice (anon has no EXECUTE grant),
-- but it was the one asymmetry with claim_meal_slot(), which has checked
-- auth.uid() since 20260622223000_meal_trains.sql:173.
--
-- Byte-identical to 20260622223000_meal_trains.sql:208 apart from the guard
-- added as the first statement of begin. In particular this preserves
-- `not public.is_admin()` (admins may release another person's slot) and the
-- ownership raise's lack of an errcode. CREATE OR REPLACE keeps the existing
-- REVOKE/GRANT from that migration, so privileges are not restated here.

create or replace function public.release_meal_slot(p_slot_id uuid)
returns public.meal_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.meal_slots;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to release a meal slot';
  end if;

  select * into v_slot from public.meal_slots where id = p_slot_id for update;
  if v_slot.id is null then
    raise exception 'Meal slot not found' using errcode = 'no_data_found';
  end if;

  if v_slot.claimed_by is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Only the person who claimed this slot can release it';
  end if;

  update public.meal_slots
  set claimed_by = null,
      claimed_by_name = null,
      claimed_at = null
  where id = p_slot_id
  returning * into v_slot;

  return v_slot;
end;
$$;
