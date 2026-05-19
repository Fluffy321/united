-- ─────────────────────────────────────────────────────────────────────────────
-- 20260519200000_protect_profile_role.sql
--
-- Closes the privilege-escalation attack vector where any authenticated user
-- could PATCH their own profiles row and set role = 'admin', gaining full
-- admin RLS access via public.is_admin().
--
-- Fix: BEFORE UPDATE trigger that raises an exception when a non-admin actor
-- attempts to change the role column.
--
-- Safety notes:
--   • Normal self-profile edits (display_name, bio, avatar_url, city, etc.)
--     are completely unaffected — the trigger only fires when NEW.role differs
--     from OLD.role.
--   • Platform admins retain full ability to change any user's role (the
--     "Admins can update any profile" policy + is_admin() check both pass).
--   • Service-role / postgres actors (auth.uid() IS NULL) are explicitly
--     allowed through — they represent server-side backend operations
--     (migrations, Edge Functions using service key, Supabase dashboard).
--     End users cannot obtain null-auth context; they always have a JWT.
--   • public.is_admin() is SECURITY DEFINER and performs a SELECT on profiles.
--     Calling it from a BEFORE UPDATE trigger on profiles does NOT recurse
--     because it is a SELECT, not an UPDATE — Postgres triggers only re-fire
--     on the statement type they were registered for (UPDATE here). The SELECT
--     reads the committed value of the actor's own row before this statement
--     modifies anything.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Trigger function ───────────────────────────────────────────────────────

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Short-circuit: if role is not being changed, do nothing.
  if NEW.role is not distinct from OLD.role then
    return NEW;
  end if;

  -- Allow service-role and postgres actors (auth.uid() IS NULL).
  -- These are server-side callers — migrations, Edge Functions using the
  -- service key, and the Supabase dashboard. End users always have a JWT
  -- and therefore a non-null auth.uid(), so this bypass is not exploitable.
  if auth.uid() is null then
    return NEW;
  end if;

  -- Authenticated (JWT) actors must be platform admins.
  -- public.is_admin() is SECURITY DEFINER; it reads the actor's own
  -- profiles row directly (bypassing RLS) and returns true iff role = 'admin'.
  if not public.is_admin() then
    raise exception 'Role changes are restricted to administrators.'
      using errcode = 'insufficient_privilege';
  end if;

  return NEW;
end;
$$;


-- ── 2. Attach trigger ────────────────────────────────────────────────────────
-- Drop first so this migration is safe to re-run.

drop trigger if exists trg_guard_profile_role_change on public.profiles;

create trigger trg_guard_profile_role_change
  before update on public.profiles
  for each row
  execute function public.guard_profile_role_change();
