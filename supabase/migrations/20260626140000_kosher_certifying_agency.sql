-- Require a structured certifying-agency name before a business can be marked
-- "kosher_status = certified". Previously certification could be set from an
-- admin's unilateral judgment plus a free-text "kosher_certification" note,
-- with no requirement that a real kashrus agency be named. This does not
-- verify the agency claim itself (JUnited has no kashrus authority and never
-- will) — it only ensures the certified badge always discloses which agency
-- the business says certifies it, so the badge reads as a disclosed claim
-- rather than an unqualified guarantee from JUnited.

alter table public.business_listings
  add column if not exists kosher_certifying_agency text;

alter table public.business_claim_requests
  add column if not exists kosher_certifying_agency_claim text;

-- A business cannot be "certified" without naming the agency it claims
-- certifies it. Other kosher_status values are unaffected.
alter table public.business_listings
  drop constraint if exists business_listings_kosher_certified_requires_agency_check;
alter table public.business_listings
  add constraint business_listings_kosher_certified_requires_agency_check
  check (
    kosher_status <> 'certified'
    or nullif(trim(kosher_certifying_agency), '') is not null
  );

create or replace function public.admin_verify_business(
  p_business_id uuid,
  p_verification_status text default null,
  p_jewish_owned_status text default null,
  p_kosher_status text default null,
  p_review_note text default null,
  p_kosher_certifying_agency text default null
)
returns public.business_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.business_listings;
  v_owner_id uuid;
  v_is_approval boolean := false;
  v_is_rejection boolean := false;
  v_title text;
  v_body text;
  v_resulting_agency text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_business_id is null then
    raise exception 'Business id is required';
  end if;

  -- Validate each provided value against the real check-constraint domains.
  if p_verification_status is not null
     and p_verification_status not in ('unverified', 'pending', 'verified_owner', 'rejected') then
    raise exception 'Invalid verification_status: %', p_verification_status;
  end if;

  if p_jewish_owned_status is not null
     and p_jewish_owned_status not in ('none', 'pending', 'verified', 'rejected') then
    raise exception 'Invalid jewish_owned_status: %', p_jewish_owned_status;
  end if;

  if p_kosher_status is not null
     and p_kosher_status not in ('none', 'pending', 'certified', 'claimed', 'rejected') then
    raise exception 'Invalid kosher_status: %', p_kosher_status;
  end if;

  if p_verification_status is null
     and p_jewish_owned_status is null
     and p_kosher_status is null then
    raise exception 'Nothing to update';
  end if;

  select * into v_business
  from public.business_listings
  where id = p_business_id
  for update;

  if v_business.id is null then
    raise exception 'Business does not exist';
  end if;

  -- Certifying a business requires naming the agency, either newly supplied
  -- here or already on file from a prior submission/claim.
  if p_kosher_status = 'certified' then
    v_resulting_agency := nullif(trim(coalesce(p_kosher_certifying_agency, v_business.kosher_certifying_agency, '')), '');
    if v_resulting_agency is null then
      raise exception 'Cannot mark kosher_status as certified without a certifying agency name';
    end if;
  end if;

  update public.business_listings
  set verification_status     = coalesce(p_verification_status, verification_status),
      jewish_owned_status      = coalesce(p_jewish_owned_status, jewish_owned_status),
      kosher_status            = coalesce(p_kosher_status, kosher_status),
      kosher_certifying_agency = case
        when p_kosher_certifying_agency is not null then nullif(trim(p_kosher_certifying_agency), '')
        else kosher_certifying_agency
      end,
      reviewed_by         = auth.uid(),
      reviewed_at         = now(),
      review_note         = coalesce(p_review_note, review_note),
      updated_at          = now()
  where id = p_business_id
  returning * into v_business;

  -- Decide whether this change reads as an approval or a rejection so the
  -- owner notification is phrased correctly.
  v_is_approval :=
       coalesce(p_verification_status = 'verified_owner', false)
    or coalesce(p_jewish_owned_status = 'verified', false)
    or coalesce(p_kosher_status = 'certified', false);
  v_is_rejection :=
       coalesce(p_verification_status = 'rejected', false)
    or coalesce(p_jewish_owned_status = 'rejected', false)
    or coalesce(p_kosher_status = 'rejected', false);

  -- Notify the business owner (claimed owner first, else original submitter).
  v_owner_id := coalesce(v_business.verified_owner_id, v_business.submitted_by);

  if v_owner_id is not null and (v_is_approval or v_is_rejection) then
    if v_is_rejection and not v_is_approval then
      v_title := 'Business verification update';
      v_body  := 'An update was made to the verification status of "' || v_business.name || '".'
                 || coalesce(' Note: ' || nullif(trim(p_review_note), ''), '');
    else
      v_title := 'Your business was verified';
      v_body  := '"' || v_business.name || '" has been verified by the JUnited team.';
    end if;

    insert into public.notifications (user_id, actor_id, type, title, body, link_url, data, is_read)
    values (
      v_owner_id,
      auth.uid(),
      case when v_is_rejection and not v_is_approval then 'business_rejected' else 'business_verified' end,
      v_title,
      v_body,
      '/Map',
      jsonb_build_object(
        'business_id', v_business.id,
        'verification_status', v_business.verification_status,
        'jewish_owned_status', v_business.jewish_owned_status,
        'kosher_status', v_business.kosher_status,
        'kosher_certifying_agency', v_business.kosher_certifying_agency
      ),
      false
    );
  end if;

  return v_business;
end;
$$;

revoke all on function public.admin_verify_business(uuid, text, text, text, text) from public, anon;
revoke all on function public.admin_verify_business(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.admin_verify_business(uuid, text, text, text, text, text) to authenticated;

-- approve_business_claim_request: a claim's free-text kosher_claim alone may
-- no longer flip kosher_status to 'certified'. Certification now requires the
-- claimant to have named an agency (kosher_certifying_agency_claim) and the
-- admin to explicitly confirm it via p_verify_kosher, mirroring the agency
-- requirement enforced on business_listings above.
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
  v_agency text;
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

  v_agency := nullif(trim(coalesce(v_claim.kosher_certifying_agency_claim, '')), '');

  if p_verify_kosher and v_agency is null then
    raise exception 'Cannot verify kosher certification without a certifying agency name on the claim';
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
        when p_verify_kosher and v_agency is not null then 'certified'
        when nullif(trim(coalesce(v_claim.kosher_claim, '')), '') is not null then 'pending'
        else kosher_status
      end,
      kosher_certification = coalesce(nullif(trim(v_claim.kosher_claim), ''), kosher_certification),
      kosher_certifying_agency = case
        when p_verify_kosher and v_agency is not null then v_agency
        else kosher_certifying_agency
      end
  where id = v_claim.business_id;

  return v_claim;
end;
$$;

revoke all on function public.approve_business_claim_request(uuid, text, boolean, boolean) from public, anon;
grant execute on function public.approve_business_claim_request(uuid, text, boolean, boolean) to authenticated;

comment on column public.business_listings.kosher_certifying_agency is
  'Name of the kashrus agency the business claims certifies it. Self-reported by the business/admin and disclosed on the badge; JUnited does not independently verify kashrus certifications.';

comment on column public.business_claim_requests.kosher_certifying_agency_claim is
  'Name of the kashrus agency claimed by the business owner when submitting/claiming a listing.';
