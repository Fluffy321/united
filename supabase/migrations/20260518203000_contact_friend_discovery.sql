-- Contact-based friend discovery.
-- The app sends emails/phones selected from the user's device contacts.
-- This function returns only public profile fields for matching accounts.

alter table public.account_private
  add column if not exists phone text;

create or replace function public.match_contact_profiles(
  p_emails text[] default '{}',
  p_phones text[] default '{}'
)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  username text,
  city text
)
language sql
security definer
set search_path = public
as $$
  with normalized_input as (
    select
      array(
        select lower(regexp_replace(value, '[^a-zA-Z0-9@.+]', '', 'g'))
        from unnest(coalesce(p_emails, '{}')) as value
        where nullif(trim(value), '') is not null
      ) as emails,
      array(
        select regexp_replace(value, '[^0-9+]', '', 'g')
        from unnest(coalesce(p_phones, '{}')) as value
        where nullif(trim(value), '') is not null
      ) as phones
  )
  select p.id, p.display_name, p.avatar_url, p.username, p.city
  from public.account_private ap
  join public.profiles p on p.id = ap.id
  cross join normalized_input ni
  where ap.id <> auth.uid()
    and (
      lower(regexp_replace(coalesce(ap.email, ''), '[^a-zA-Z0-9@.+]', '', 'g')) = any(ni.emails)
      or regexp_replace(coalesce(ap.phone, ''), '[^0-9+]', '', 'g') = any(ni.phones)
    )
  order by p.display_name nulls last
  limit 50;
$$;

revoke all on function public.match_contact_profiles(text[], text[]) from public;
grant execute on function public.match_contact_profiles(text[], text[]) to authenticated;
