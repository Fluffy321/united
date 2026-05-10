-- Ensure public profile reads use the querying user's permissions/RLS context
-- instead of the view owner's privileges.

alter view public.public_profiles
  set (security_invoker = true);
