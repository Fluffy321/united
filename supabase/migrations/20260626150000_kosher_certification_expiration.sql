-- Track kosher certification expiration so a disclosed agency claim does not
-- remain "certified" forever after a certification lapses or goes stale.

alter table public.business_listings
  add column if not exists kosher_certification_expires_at date,
  add column if not exists kosher_certification_no_expiration boolean not null default false;

alter table public.business_claim_requests
  add column if not exists kosher_certification_expires_at_claim date,
  add column if not exists kosher_certification_no_expiration_claim boolean not null default false;

alter table public.business_listings
  drop constraint if exists business_listings_kosher_certified_expiration_check;
alter table public.business_listings
  add constraint business_listings_kosher_certified_expiration_check
  check (
    kosher_status <> 'certified'
    or kosher_certification_no_expiration = true
    or kosher_certification_expires_at is not null
  );

create or replace function public.expire_kosher_certifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.business_listings
  set kosher_status = 'pending',
      reviewed_at = now(),
      review_note = concat_ws(
        E'\n',
        nullif(review_note, ''),
        'Kosher certification moved to pending because the recorded expiration date has passed.'
      ),
      updated_at = now()
  where kosher_status = 'certified'
    and kosher_certification_no_expiration is not true
    and kosher_certification_expires_at is not null
    and kosher_certification_expires_at < current_date;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_kosher_certifications() from public, anon, authenticated;
grant execute on function public.expire_kosher_certifications() to service_role;

create or replace function public.admin_verify_business(
  p_business_id uuid,
  p_verification_status text default null,
  p_jewish_owned_status text default null,
  p_kosher_status text default null,
  p_review_note text default null,
  p_kosher_certifying_agency text default null,
  p_kosher_certification_expires_at date default null,
  p_kosher_certification_no_expiration boolean default false
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
  v_resulting_expires_at date;
  v_resulting_no_expiration boolean;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_business_id is null then
    raise exception 'Business id is required';
  end if;

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

  if p_kosher_status = 'certified' then
    v_resulting_agency := nullif(trim(coalesce(p_kosher_certifying_agency, v_business.kosher_certifying_agency, '')), '');
    v_resulting_expires_at := coalesce(p_kosher_certification_expires_at, v_business.kosher_certification_expires_at);
    v_resulting_no_expiration := coalesce(p_kosher_certification_no_expiration, false) or coalesce(v_business.kosher_certification_no_expiration, false);

    if v_resulting_agency is null then
      raise exception 'Cannot mark kosher_status as certified without a certifying agency name';
    end if;
    if v_resulting_expires_at is null and v_resulting_no_expiration is not true then
      raise exception 'Cannot mark kosher_status as certified without an expiration date or explicit no-expiration flag';
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
      kosher_certification_expires_at = case
        when p_kosher_status = 'certified' then p_kosher_certification_expires_at
        else kosher_certification_expires_at
      end,
      kosher_certification_no_expiration = case
        when p_kosher_status = 'certified' then coalesce(p_kosher_certification_no_expiration, false)
        else kosher_certification_no_expiration
      end,
      reviewed_by         = auth.uid(),
      reviewed_at         = now(),
      review_note         = coalesce(p_review_note, review_note),
      updated_at          = now()
  where id = p_business_id
  returning * into v_business;

  v_is_approval :=
       coalesce(p_verification_status = 'verified_owner', false)
    or coalesce(p_jewish_owned_status = 'verified', false)
    or coalesce(p_kosher_status = 'certified', false);
  v_is_rejection :=
       coalesce(p_verification_status = 'rejected', false)
    or coalesce(p_jewish_owned_status = 'rejected', false)
    or coalesce(p_kosher_status = 'rejected', false);

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
        'kosher_certifying_agency', v_business.kosher_certifying_agency,
        'kosher_certification_expires_at', v_business.kosher_certification_expires_at,
        'kosher_certification_no_expiration', v_business.kosher_certification_no_expiration
      ),
      false
    );
  end if;

  return v_business;
end;
$$;

revoke all on function public.admin_verify_business(uuid, text, text, text, text) from public, anon;
revoke all on function public.admin_verify_business(uuid, text, text, text, text, text) from public, anon;
revoke all on function public.admin_verify_business(uuid, text, text, text, text, text, date, boolean) from public, anon;
grant execute on function public.admin_verify_business(uuid, text, text, text, text, text, date, boolean) to authenticated;

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
  if p_verify_kosher
     and v_claim.kosher_certification_expires_at_claim is null
     and v_claim.kosher_certification_no_expiration_claim is not true then
    raise exception 'Cannot verify kosher certification without an expiration date or explicit no-expiration flag on the claim';
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
      end,
      kosher_certification_expires_at = case
        when p_verify_kosher and v_agency is not null then v_claim.kosher_certification_expires_at_claim
        else kosher_certification_expires_at
      end,
      kosher_certification_no_expiration = case
        when p_verify_kosher and v_agency is not null then coalesce(v_claim.kosher_certification_no_expiration_claim, false)
        else kosher_certification_no_expiration
      end
  where id = v_claim.business_id;

  return v_claim;
end;
$$;

revoke all on function public.approve_business_claim_request(uuid, text, boolean, boolean) from public, anon;
grant execute on function public.approve_business_claim_request(uuid, text, boolean, boolean) to authenticated;

select cron.schedule(
  'expire-kosher-certifications',
  '15 8 * * *',
  $$ select public.expire_kosher_certifications(); $$
)
where not exists (
  select 1 from cron.job where jobname = 'expire-kosher-certifications'
);

comment on column public.business_listings.kosher_certification_expires_at is
  'Date the disclosed kosher certification is known to expire. If passed, daily cron moves kosher_status back to pending.';
comment on column public.business_listings.kosher_certification_no_expiration is
  'True only when the admin explicitly recorded that no expiration date was provided by the certifying agency/business.';
