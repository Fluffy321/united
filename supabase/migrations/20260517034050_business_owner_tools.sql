-- ─────────────────────────────────────────────────────────────────────────────
-- Business owner tools
--
-- Adds the minimum production-backed fields needed for claimed business owners
-- to manage their listings from the Map page. This is intentionally additive:
-- it does not publish unreviewed content and it keeps owner actions behind the
-- business_managers role model.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

alter table public.business_listings
  add column if not exists view_count integer not null default 0,
  add column if not exists business_hours jsonb not null default '{}'::jsonb;

alter table public.business_managers
  drop constraint if exists business_managers_role_check;

alter table public.business_managers
  add constraint business_managers_role_check
  check (role in ('owner', 'admin', 'manager'));

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_listings(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_name text,
  rating integer not null,
  body text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_reviews_rating_check check (rating between 1 and 5),
  constraint business_reviews_status_check check (status in ('pending', 'published', 'hidden', 'rejected'))
);

create index if not exists business_reviews_business_status_idx
  on public.business_reviews (business_id, status, created_at desc);

create index if not exists business_reviews_reviewer_idx
  on public.business_reviews (reviewer_id, created_at desc);

alter table public.business_reviews enable row level security;

grant select, insert, update, delete on public.business_reviews to authenticated;

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
        and bm.role in ('owner', 'admin')
    ),
    false
  )
$$;

revoke all on function public.can_manage_business(uuid) from public, anon;
grant execute on function public.can_manage_business(uuid) to authenticated;

create or replace function public.increment_business_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_listings
  set view_count = view_count + 1
  where id = p_listing_id
    and status = 'published';
end;
$$;

revoke all on function public.increment_business_listing_view(uuid) from public, anon;
grant execute on function public.increment_business_listing_view(uuid) to authenticated;

create or replace function public.update_business_owner_profile(
  p_listing_id uuid,
  p_description text default null,
  p_phone text default null,
  p_email text default null,
  p_website text default null,
  p_instagram_url text default null,
  p_logo_url text default null,
  p_cover_url text default null,
  p_business_hours jsonb default '{}'::jsonb
)
returns public.business_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.business_listings;
begin
  if not exists (
    select 1
    from public.business_managers bm
    where bm.business_id = p_listing_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin')
  ) and not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_listings
  set description = nullif(trim(coalesce(p_description, '')), ''),
      phone = nullif(trim(coalesce(p_phone, '')), ''),
      email = nullif(trim(coalesce(p_email, '')), ''),
      website = nullif(trim(coalesce(p_website, '')), ''),
      instagram_url = nullif(trim(coalesce(p_instagram_url, '')), ''),
      logo_url = nullif(trim(coalesce(p_logo_url, '')), ''),
      cover_url = nullif(trim(coalesce(p_cover_url, '')), ''),
      business_hours = coalesce(p_business_hours, '{}'::jsonb)
  where id = p_listing_id
  returning * into v_listing;

  if v_listing.id is null then
    raise exception 'Business listing does not exist';
  end if;

  return v_listing;
end;
$$;

revoke all on function public.update_business_owner_profile(
  uuid, text, text, text, text, text, text, text, jsonb
) from public, anon;
grant execute on function public.update_business_owner_profile(
  uuid, text, text, text, text, text, text, text, jsonb
) to authenticated;

drop policy if exists "Business managers and admins can update listings" on public.business_listings;
drop policy if exists "Platform admins can update business listings directly" on public.business_listings;
create policy "Platform admins can update business listings directly"
  on public.business_listings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Published business reviews are readable" on public.business_reviews;
create policy "Published business reviews are readable"
  on public.business_reviews
  for select
  to authenticated
  using (
    status = 'published'
    or reviewer_id = auth.uid()
    or public.can_manage_business(business_id)
  );

drop policy if exists "Users can submit business reviews" on public.business_reviews;
create policy "Users can submit business reviews"
  on public.business_reviews
  for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and status in ('pending', 'published')
    and exists (
      select 1
      from public.business_listings bl
      where bl.id = business_id
        and bl.status = 'published'
    )
  );

drop policy if exists "Review authors can update own pending reviews" on public.business_reviews;
create policy "Review authors can update own pending reviews"
  on public.business_reviews
  for update
  to authenticated
  using (reviewer_id = auth.uid() and status = 'pending')
  with check (reviewer_id = auth.uid() and status = 'pending');

drop policy if exists "Platform admins can moderate business reviews" on public.business_reviews;
create policy "Platform admins can moderate business reviews"
  on public.business_reviews
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_touch_business_reviews_updated_at on public.business_reviews;
create trigger trg_touch_business_reviews_updated_at
  before update on public.business_reviews
  for each row
  execute function public.touch_business_directory_updated_at();

comment on column public.business_listings.view_count is
  'Simple view counter incremented when authenticated users open a published business detail view.';

comment on column public.business_listings.business_hours is
  'Owner-editable structured hours/settings JSON for the business listing.';

comment on table public.business_reviews is
  'Production-backed business reviews. Public creation UI can remain deferred while owner tools can display real reviews.';
