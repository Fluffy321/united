-- ─────────────────────────────────────────────────────────────────────────────
-- Meal Train Requests
--
-- Coordinate meal deliveries for a family in need. A meal train request
-- defines who needs meals and over what period; meal_slots are the
-- individual dated slots neighbors can claim ("I'll bring dinner on the 3rd").
--
-- Mirrors the visibility model already used by mitzvah_requests: requests are
-- readable app-wide while open, optionally scoped to a community, and slot
-- claiming is atomic via a SECURITY DEFINER RPC (same pattern as
-- claim_volunteer_slot in 20260520200328_community_volunteer_slots.sql) so two
-- neighbors can't double-book the same slot.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists public.meal_train_requests (
  id                  uuid primary key default gen_random_uuid(),
  created_by          uuid not null references public.profiles(id) on delete cascade,
  created_by_name     text,
  community_id        uuid references public.communities(id) on delete set null,
  family_name         text not null,
  period_start        date not null,
  period_end          date,
  meals_needed        integer not null default 1 check (meals_needed >= 1),
  notes               text,
  dietary_notes       text,
  delivery_address    text,
  hide_exact_address  boolean not null default false,
  contact_phone       text,
  status              text not null default 'open',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint meal_train_requests_status_check check (status in ('open', 'closed', 'cancelled'))
);

create table if not exists public.meal_slots (
  id              uuid primary key default gen_random_uuid(),
  train_id        uuid not null references public.meal_train_requests(id) on delete cascade,
  slot_date       date not null,
  meal_type       text not null default 'dinner',
  notes           text,
  claimed_by      uuid references public.profiles(id) on delete set null,
  claimed_by_name text,
  claimed_at      timestamptz,
  created_at      timestamptz not null default now(),
  constraint meal_slots_meal_type_check check (meal_type in ('breakfast', 'lunch', 'dinner', 'other')),
  constraint meal_slots_one_per_train_date_type unique (train_id, slot_date, meal_type)
);

create index if not exists meal_train_requests_status_idx
  on public.meal_train_requests (status, created_at desc);
create index if not exists meal_train_requests_created_by_idx
  on public.meal_train_requests (created_by);
create index if not exists meal_train_requests_community_id_idx
  on public.meal_train_requests (community_id);

create index if not exists meal_slots_train_id_idx
  on public.meal_slots (train_id);
create index if not exists meal_slots_claimed_by_idx
  on public.meal_slots (claimed_by);

alter table public.meal_train_requests enable row level security;
alter table public.meal_slots enable row level security;

grant select, insert, update, delete on public.meal_train_requests to authenticated;
grant select, insert, update, delete on public.meal_slots to authenticated;

-- meal_train_requests policies ────────────────────────────────────────────────

drop policy if exists "Open meal trains are readable" on public.meal_train_requests;
create policy "Open meal trains are readable"
  on public.meal_train_requests
  for select
  to authenticated
  using (
    status in ('open', 'closed')
    or created_by = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users can create meal trains" on public.meal_train_requests;
create policy "Users can create meal trains"
  on public.meal_train_requests
  for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Creators and admins can update meal trains" on public.meal_train_requests;
create policy "Creators and admins can update meal trains"
  on public.meal_train_requests
  for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Creators and admins can delete meal trains" on public.meal_train_requests;
create policy "Creators and admins can delete meal trains"
  on public.meal_train_requests
  for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- meal_slots policies ──────────────────────────────────────────────────────────

drop policy if exists "Slots of readable meal trains are readable" on public.meal_slots;
create policy "Slots of readable meal trains are readable"
  on public.meal_slots
  for select
  to authenticated
  using (
    exists (
      select 1 from public.meal_train_requests t
      where t.id = meal_slots.train_id
        and (t.status in ('open', 'closed') or t.created_by = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Train creators and admins can add slots" on public.meal_slots;
create policy "Train creators and admins can add slots"
  on public.meal_slots
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.meal_train_requests t
      where t.id = meal_slots.train_id
        and (t.created_by = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Train creators and admins can delete slots" on public.meal_slots;
create policy "Train creators and admins can delete slots"
  on public.meal_slots
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.meal_train_requests t
      where t.id = meal_slots.train_id
        and (t.created_by = auth.uid() or public.is_admin())
    )
  );

-- updated_at trigger ───────────────────────────────────────────────────────────

create or replace function public.touch_meal_train_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_touch_meal_train_requests_updated_at on public.meal_train_requests;
create trigger trg_touch_meal_train_requests_updated_at
  before update on public.meal_train_requests
  for each row
  execute function public.touch_meal_train_updated_at();

-- Atomic claim/release RPCs ────────────────────────────────────────────────────
-- Mirrors claim_volunteer_slot's FOR UPDATE lock so two neighbors can't claim
-- the same date/meal at once.

create or replace function public.claim_meal_slot(p_slot_id uuid, p_claimed_by_name text default null)
returns public.meal_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.meal_slots;
  v_train public.meal_train_requests;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to claim a meal slot';
  end if;

  select * into v_slot from public.meal_slots where id = p_slot_id for update;
  if v_slot.id is null then
    raise exception 'Meal slot not found' using errcode = 'no_data_found';
  end if;

  select * into v_train from public.meal_train_requests where id = v_slot.train_id;
  if v_train.status <> 'open' then
    raise exception 'This meal train is no longer accepting signups' using errcode = 'check_violation';
  end if;

  if v_slot.claimed_by is not null then
    raise exception 'This slot is already claimed' using errcode = 'check_violation';
  end if;

  update public.meal_slots
  set claimed_by = auth.uid(),
      claimed_by_name = p_claimed_by_name,
      claimed_at = now()
  where id = p_slot_id
  returning * into v_slot;

  return v_slot;
end;
$$;

create or replace function public.release_meal_slot(p_slot_id uuid)
returns public.meal_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.meal_slots;
begin
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

revoke all on function public.claim_meal_slot(uuid, text) from public, anon;
revoke all on function public.release_meal_slot(uuid) from public, anon;
grant execute on function public.claim_meal_slot(uuid, text) to authenticated;
grant execute on function public.release_meal_slot(uuid) to authenticated;

comment on table public.meal_train_requests is
  'Meal train requests for the Mitzvah Circle — a family in need over a date range, with meal_slots neighbors can claim.';

comment on table public.meal_slots is
  'Individual dated/meal-type slots within a meal train, atomically claimed via claim_meal_slot().';
