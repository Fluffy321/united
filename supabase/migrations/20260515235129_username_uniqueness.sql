-- Enforce username uniqueness and format constraints across all signup paths.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');
  END IF;
END $$;

-- Case-insensitive partial unique index; allows multiple NULLs (no existing data remediation needed).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- RPC for frontend availability checks. Excludes the calling user so edits don't self-conflict.
CREATE OR REPLACE FUNCTION public.check_username_available(
  p_username        text,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(p_username)
      AND (p_exclude_user_id IS NULL OR id <> p_exclude_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_username_available TO authenticated, anon;
