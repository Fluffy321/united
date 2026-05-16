-- Add junk/spam flag to app_feedback.
-- Items marked junk are never deleted — they move to a separate admin bucket.
-- Rule-based auto-flagging is UI-only (client-side heuristics); only admins can
-- set is_junk = true via the UPDATE policy that already exists.
ALTER TABLE public.app_feedback
  ADD COLUMN IF NOT EXISTS is_junk boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_app_feedback_is_junk
  ON public.app_feedback(is_junk);
