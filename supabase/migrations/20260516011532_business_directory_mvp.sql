-- ─────────────────────────────────────────────────────────────────────────────
-- Business directory MVP
--
-- Production-backed foundation for the Map page's "Support a Local Jewish
-- Business" experience. This is deliberately review-first:
--   • users may submit businesses and claim existing businesses
--   • platform admins approve/reject submissions and claims
--   • verified/trust badges are only shown from approved database state
--
-- This migration is additive and idempotent. It does not import or trust any
-- hardcoded/static map pins.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists public.business_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'other',
  listing_type text not null default 'physical',
  status text not null default 'pending',
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_by_name text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  address text,
  city text,
  neighborhood text,
  location_lat double precision,
  location_lng double precision,
  hide_exact_address boolean not null default false,
  service_area_text text,
  phone text,
  email text,
  website text,
  instagram_url text,
  logo_url text,
  cover_url text,
  source_label text,
  source_url text,
  claim_status text not null default 'unclaimed',
  is_claimed boolean not null default false,
  verified_owner_id uuid references public.profiles(id) on delete set null,
  verification_status text not null default 'unverified',
  jewish_owned_status text not null default 'none',
  serves_jewish_community boolean not null default false,
  kosher_status text not null default 'none',
  kosher_certification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_listings_listing_type_check
    check (listing_type in ('physical', 'online', 'service_area')),
  constraint business_listings_status_check
    check (status in ('pending', 'published', 'rejected', 'hidden')),
  constraint business_listings_claim_status_check
    check (claim_status in ('unclaimed', 'pending', 'claimed')),
  constraint business_listings_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified_owner', 'rejected')),
  constraint business_listings_jewish_owned_status_check
    check (jewish_owned_status in ('none', 'pending', 'verified', 'rejected')),
  constraint business_listings_kosher_status_check
    check (kosher_status in ('none', 'pending', 'certified', 'claimed', 'rejected'))
);

create table if not exists public.business_claim_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_listings(id) on delete cascade,
  business_name text,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requester_name text,
  requester_email text,
  claimant_name text not null,
  claimant_email text not null,
  role_at_business text,
  proof_method text,
  proof_notes text,
  jewish_owned_claim boolean not null default false,
  serves_jewish_community_claim boolean not null default false,
  kosher_claim text,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_claim_requests_status_check
    check (status in ('pending', 'under_review', 'approved', 'rejected', 'more_info_requested'))
);

create table if not exists public.business_managers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'manager',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint business_managers_role_check check (role in ('owner', 'manager')),
  constraint business_managers_business_user_unique unique (business_id, user_id)
);

create index if not exists business_listings_status_created_idx
  on public.business_listings (status, created_at desc);

create index if not exists business_listings_category_idx
  on public.business_listings (category);

create index if not exists business_listings_listing_type_idx
  on public.business_listings (listing_type);

create index if not exists business_listings_submitted_by_idx
  on public.business_listings (submitted_by);

create index if not exists business_listings_claim_status_idx
  on public.business_listings (claim_status);

create index if not exists business_listings_map_points_idx
  on public.business_listings (location_lat, location_lng)
  where status = 'published'
    and listing_type = 'physical'
    and location_lat is not null
    and location_lng is not null
    and hide_exact_address = false;

create index if not exists business_claim_requests_business_status_idx
  on public.business_claim_requests (business_id, status, created_at desc);

create index if not exists business_claim_requests_requester_idx
  on public.business_claim_requests (requester_id, created_at desc);

create unique index if not exists business_claim_requests_one_open_idx
  on public.business_claim_requests (business_id, requester_id)
  where status in ('pending', 'under_review', 'more_info_requested');

create index if not exists business_managers_business_idx
  on public.business_managers (business_id);

create index if not exists business_managers_user_idx
  on public.business_managers (user_id);

alter table public.business_listings enable row level security;
alter table public.business_claim_requests enable row level security;
alter table public.business_managers enable row level security;

grant select, insert, update, delete on public.business_listings to authenticated;
grant select, insert, update, delete on public.business_claim_requests to authenticated;
grant select, insert, update, delete on public.business_managers to authenticated;

create or replace function public.can_manage_business(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    case when auth.uid() is null then false else public.is_admin() end
    or exists (
      select 1
      from public.business_managers bm
      where bm.business_id = p_business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    ),
    false
  )
$$;

revoke all on function public.can_manage_business(uuid) from public, anon;
grant execute on function public.can_manage_business(uuid) to authenticated;

drop policy if exists "Published businesses are readable" on public.business_listings;
create policy "Published businesses are readable"
  on public.business_listings
  for select
  to authenticated
  using (
    status = 'published'
    or submitted_by = auth.uid()
    or public.can_manage_business(id)
  );

drop policy if exists "Users can submit businesses for review" on public.business_listings;
create policy "Users can submit businesses for review"
  on public.business_listings
  for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and is_claimed = false
    and claim_status in ('unclaimed', 'pending')
    and verification_status in ('unverified', 'pending')
    and jewish_owned_status in ('none', 'pending')
    and kosher_status in ('none', 'pending', 'claimed')
  );

drop policy if exists "Business managers and admins can update listings" on public.business_listings;
create policy "Business managers and admins can update listings"
  on public.business_listings
  for update
  to authenticated
  using (public.can_manage_business(id))
  with check (public.can_manage_business(id));

drop policy if exists "Platform admins can delete business listings" on public.business_listings;
create policy "Platform admins can delete business listings"
  on public.business_listings
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can read their business claims" on public.business_claim_requests;
create policy "Users can read their business claims"
  on public.business_claim_requests
  for select
  to authenticated
  using (requester_id = auth.uid() or public.is_admin());

drop policy if exists "Users can submit business claims" on public.business_claim_requests;
create policy "Users can submit business claims"
  on public.business_claim_requests
  for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and exists (
      select 1
      from public.business_listings bl
      where bl.id = business_id
        and bl.status = 'published'
        and bl.claim_status <> 'claimed'
    )
  );

drop policy if exists "Platform admins can update business claims" on public.business_claim_requests;
create policy "Platform admins can update business claims"
  on public.business_claim_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Platform admins can delete business claims" on public.business_claim_requests;
create policy "Platform admins can delete business claims"
  on public.business_claim_requests
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can read own business manager rows" on public.business_managers;
create policy "Users can read own business manager rows"
  on public.business_managers
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Platform admins manage business managers" on public.business_managers;
create policy "Platform admins manage business managers"
  on public.business_managers
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_business_directory_updated_at()
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

drop trigger if exists trg_touch_business_listings_updated_at on public.business_listings;
create trigger trg_touch_business_listings_updated_at
  before update on public.business_listings
  for each row
  execute function public.touch_business_directory_updated_at();

drop trigger if exists trg_touch_business_claim_requests_updated_at on public.business_claim_requests;
create trigger trg_touch_business_claim_requests_updated_at
  before update on public.business_claim_requests
  for each row
  execute function public.touch_business_directory_updated_at();

create or replace function public.approve_business_listing_submission(
  p_listing_id uuid,
  p_review_note text default null
)
returns public.business_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.business_listings;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_listings
  set status = 'published',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note
  where id = p_listing_id
    and status = 'pending'
  returning * into v_listing;

  if v_listing.id is null then
    raise exception 'Business listing is not pending or does not exist';
  end if;

  return v_listing;
end;
$$;

create or replace function public.reject_business_listing_submission(
  p_listing_id uuid,
  p_review_note text default null
)
returns public.business_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.business_listings;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_listings
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note
  where id = p_listing_id
    and status = 'pending'
  returning * into v_listing;

  if v_listing.id is null then
    raise exception 'Business listing is not pending or does not exist';
  end if;

  return v_listing;
end;
$$;

create or replace function public.approve_business_claim_request(
  p_claim_id uuid,
  p_review_note text default null,
  p_verify_jewish_owned boolean default false,
  p_verify_kosher boolean default false
)
returns public.business_claim_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.business_claim_requests;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select *
  into v_claim
  from public.business_claim_requests
  where id = p_claim_id
    and status in ('pending', 'under_review', 'more_info_requested')
  for update;

  if v_claim.id is null then
    raise exception 'Business claim is not open or does not exist';
  end if;

  update public.business_claim_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note
  where id = p_claim_id
  returning * into v_claim;

  insert into public.business_managers (business_id, user_id, role, approved_by, approved_at)
  values (v_claim.business_id, v_claim.requester_id, 'owner', auth.uid(), now())
  on conflict (business_id, user_id) do update
    set role = 'owner',
        approved_by = excluded.approved_by,
        approved_at = excluded.approved_at;

  update public.business_listings
  set is_claimed = true,
      claim_status = 'claimed',
      verified_owner_id = v_claim.requester_id,
      verification_status = 'verified_owner',
      jewish_owned_status = case
        when p_verify_jewish_owned and v_claim.jewish_owned_claim then 'verified'
        when v_claim.jewish_owned_claim then 'pending'
        else jewish_owned_status
      end,
      serves_jewish_community = serves_jewish_community or v_claim.serves_jewish_community_claim,
      kosher_status = case
        when p_verify_kosher and nullif(trim(coalesce(v_claim.kosher_claim, '')), '') is not null then 'certified'
        when nullif(trim(coalesce(v_claim.kosher_claim, '')), '') is not null then 'pending'
        else kosher_status
      end,
      kosher_certification = coalesce(nullif(trim(v_claim.kosher_claim), ''), kosher_certification)
  where id = v_claim.business_id;

  return v_claim;
end;
$$;

create or replace function public.reject_business_claim_request(
  p_claim_id uuid,
  p_review_note text default null
)
returns public.business_claim_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.business_claim_requests;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_claim_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note
  where id = p_claim_id
    and status in ('pending', 'under_review', 'more_info_requested')
  returning * into v_claim;

  if v_claim.id is null then
    raise exception 'Business claim is not open or does not exist';
  end if;

  update public.business_listings
  set claim_status = 'unclaimed',
      verification_status = case when verification_status = 'pending' then 'unverified' else verification_status end
  where id = v_claim.business_id
    and not exists (
      select 1
      from public.business_claim_requests other_claim
      where other_claim.business_id = v_claim.business_id
        and other_claim.id <> v_claim.id
        and other_claim.status in ('pending', 'under_review', 'more_info_requested')
    )
    and not exists (
      select 1
      from public.business_managers bm
      where bm.business_id = v_claim.business_id
    );

  return v_claim;
end;
$$;

revoke all on function public.approve_business_listing_submission(uuid, text) from public, anon;
revoke all on function public.reject_business_listing_submission(uuid, text) from public, anon;
revoke all on function public.approve_business_claim_request(uuid, text, boolean, boolean) from public, anon;
revoke all on function public.reject_business_claim_request(uuid, text) from public, anon;

grant execute on function public.approve_business_listing_submission(uuid, text) to authenticated;
grant execute on function public.reject_business_listing_submission(uuid, text) to authenticated;
grant execute on function public.approve_business_claim_request(uuid, text, boolean, boolean) to authenticated;
grant execute on function public.reject_business_claim_request(uuid, text) to authenticated;

comment on table public.business_listings is
  'Review-first business directory listings for the JUnited Map business discovery experience.';

comment on table public.business_claim_requests is
  'Business ownership/verification requests submitted by users and reviewed by platform admins.';

comment on table public.business_managers is
  'Approved users who can manage a business listing after admin verification.';
