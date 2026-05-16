-- iOS App Store Readiness progress tracker
-- Each row tracks the status of one task from src/config/iosReadiness.js

CREATE TABLE public.ios_app_store_readiness_progress (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       text        NOT NULL UNIQUE,
  status        text        NOT NULL DEFAULT 'not_started'
                            CHECK (status IN ('not_started', 'in_progress', 'done', 'na')),
  notes         text,
  evidence_url  text,
  completed_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Admins only — no end-user access
ALTER TABLE public.ios_app_store_readiness_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to ios readiness"
  ON public.ios_app_store_readiness_progress
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_ios_readiness_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ios_readiness_updated_at
  BEFORE UPDATE ON public.ios_app_store_readiness_progress
  FOR EACH ROW EXECUTE FUNCTION touch_ios_readiness_updated_at();
