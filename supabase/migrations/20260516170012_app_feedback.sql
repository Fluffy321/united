-- ── app_feedback ─────────────────────────────────────────────────────────────
-- Dedicated in-app feedback table. Separate from content-moderation reports
-- because this is a user→team communication channel, not user→user reporting.

CREATE TABLE public.app_feedback (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_name   text,
  feedback_type    text        NOT NULL DEFAULT 'other',
  urgency          text        NOT NULL DEFAULT 'normal',
  message          text        NOT NULL,
  contact_ok       boolean     NOT NULL DEFAULT false,
  route_path       text,
  page_name        text,
  route_context    jsonb       NOT NULL DEFAULT '{}',
  user_agent       text,
  viewport         jsonb,
  status           text        NOT NULL DEFAULT 'new',
  internal_note    text,
  reviewed_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_feedback_status     ON public.app_feedback(status);
CREATE INDEX idx_app_feedback_created_at ON public.app_feedback(created_at DESC);
CREATE INDEX idx_app_feedback_user_id    ON public.app_feedback(user_id);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION public.touch_app_feedback_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_feedback_updated_at
  BEFORE UPDATE ON public.app_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_feedback_updated_at();

-- RLS
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users may insert their own feedback
CREATE POLICY "app_feedback_insert"
  ON public.app_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users read their own rows; platform admins read all
CREATE POLICY "app_feedback_select"
  ON public.app_feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Only platform admins may update (status, note, reviewed_by, etc.)
CREATE POLICY "app_feedback_admin_update"
  ON public.app_feedback FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
