-- ─────────────────────────────────────────────────────────────────────────────
-- 012_protect_profile_role.sql
--
-- Defense-in-depth for the profiles.role column.
--
-- SECURITY MODEL
-- ──────────────
-- Two independent layers protect this column:
--
--   1. Client layer (toDbPatch in base44Client.js): strips `role` from every
--      profile update payload before it leaves the browser.  This stops the
--      accidental case — a code path that passes user-controlled data through
--      updateMe without explicitly setting role.
--
--   2. Database trigger (this file): a BEFORE UPDATE trigger that raises
--      insufficient_privilege whenever NEW.role IS DISTINCT FROM OLD.role and
--      the caller is not already an admin.  This fires regardless of how the
--      UPDATE reaches Postgres — direct API call, Supabase Studio, a future
--      code path that forgets to strip the field, or a service-key request.
--
-- Why a trigger and not an RLS WITH CHECK policy?
--   Postgres RLS WITH CHECK expressions cannot reference OLD, so the condition
--   "new value must equal old value unless caller is admin" is not expressible
--   as a pure policy.  A BEFORE UPDATE trigger is the standard pattern for
--   column-level mutation control in Postgres.
--
-- Why SECURITY INVOKER on the trigger function?
--   The trigger runs in the calling session's security context so that
--   auth.uid() returns the actual caller's ID.  is_admin() (defined in
--   008_admin_rls.sql) is itself SECURITY DEFINER, so it can read profiles
--   freely even from within an INVOKER trigger.
--
-- Service-key sessions:
--   When a Supabase service-key caller runs an UPDATE, auth.uid() returns
--   null.  is_admin() returns false for null callers, so service-key sessions
--   are also blocked from changing roles.  This is intentional — legitimate
--   role management should be done through the admin portal with a real admin
--   session, or through a dedicated security-definer RPC that is explicitly
--   audited and allow-listed.
--
-- Safe to re-run: CREATE OR REPLACE + DROP TRIGGER IF EXISTS + CREATE TRIGGER.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── Trigger function ────────────────────────────────────────────────────────

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Role column is unchanged — nothing to enforce.
  if NEW.role is not distinct from OLD.role then
    return NEW;
  end if;

  -- Role is changing — only an existing admin may do this.
  if public.is_admin() then
    return NEW;
  end if;

  raise exception
    'Insufficient privilege: only admins may change profile roles'
    using errcode = 'insufficient_privilege';
end;
$$;

-- Prevent direct invocation; the function is only meaningful as a trigger.
revoke all on function public.guard_profile_role_change() from public;


-- ─── Attach trigger ──────────────────────────────────────────────────────────

drop trigger if exists trg_guard_profile_role_change on public.profiles;

create trigger trg_guard_profile_role_change
  before update on public.profiles
  for each row
  execute function public.guard_profile_role_change();
