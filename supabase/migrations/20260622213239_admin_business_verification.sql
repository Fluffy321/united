-- Admin Business Verification workflow
-- SECURITY DEFINER RPC that lets an admin set verification / Jewish-owned /
-- kosher status on a business listing and notifies the owner. Each parameter
-- is optional (null = leave that dimension unchanged) and is validated against
-- the business_listings check constraints before any write.

create or replace function public.admin_verify_business(
  p_business_id uuid,
  p_verification_status text default null,
  p_jewish_owned_status text default null,
  p_kosher_status text default null,
  p_review_note text default null
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

  update public.business_listings
  set verification_status = coalesce(p_verification_status, verification_status),
      jewish_owned_status = coalesce(p_jewish_owned_status, jewish_owned_status),
      kosher_status       = coalesce(p_kosher_status, kosher_status),
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
        'kosher_status', v_business.kosher_status
      ),
      false
    );
  end if;

  return v_business;
end;
$$;

revoke all on function public.admin_verify_business(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_verify_business(uuid, text, text, text, text) to authenticated;
