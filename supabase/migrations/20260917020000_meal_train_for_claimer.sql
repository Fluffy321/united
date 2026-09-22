-- Delivery details for someone who has actually claimed a slot on this train.
--
-- Applied directly to the database ahead of this commit; recorded here to keep
-- migration history in sync.
--
-- Companion to public_meal_train() / public_meal_train_slots()
-- (20260917010000_public_meal_train_read.sql), which deliberately return no
-- address to anyone. This is the one path that discloses it, and the gate is
-- membership in the claim set: at least one meal_slots row on this train with
-- claimed_by = auth.uid(). Anyone else — signed in or not — gets zero rows.
--
-- SECURITY DEFINER, so the function body is the security boundary:
--   * the claim check is an EXISTS against meal_slots, evaluated inside the
--     function, so it cannot be bypassed by the caller's query;
--   * status = 'open' matches the sibling functions — a closed or cancelled
--     train discloses nothing even to a past claimer;
--   * only delivery_address and contact_phone are returned. created_by_name,
--     notes, and other claimers' identities stay out, exactly as in the
--     anonymous payload.
--
-- EXECUTE is granted to authenticated ONLY. anon is not granted, and would
-- fail the auth.uid() check regardless.
--
-- Note on hide_exact_address: that flag means "only share exact address after
-- someone claims a day" (the creator-facing label in MealTrainsSection). This
-- function is only reachable after claiming, so the flag's condition is
-- already satisfied and it is deliberately not re-checked here. Gating on it
-- would hide the address from the very people it was meant to reach.

create or replace function public.meal_train_for_claimer(p_train_id uuid)
returns table (
  id               uuid,
  delivery_address text,
  contact_phone    text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    t.id,
    t.delivery_address,
    t.contact_phone
  from public.meal_train_requests t
  where t.id = p_train_id
    and t.status = 'open'
    and auth.uid() is not null
    and exists (
      select 1
      from public.meal_slots s
      where s.train_id = t.id
        and s.claimed_by = auth.uid()
    );
$$;

revoke all on function public.meal_train_for_claimer(uuid) from public, anon;
grant execute on function public.meal_train_for_claimer(uuid) to authenticated;

comment on function public.meal_train_for_claimer(uuid) is
  'Delivery address and phone for /meals/:id, disclosed only to a caller holding at least one claimed slot on that train. Open trains only. Not granted to anon.';
