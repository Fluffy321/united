-- Push subscription storage for Web Push API.
-- Each row is one browser/device subscription for one user.
-- Multiple devices per user are supported via UNIQUE(user_id, endpoint).
-- The service-role key (Edge Function) reads all rows — it bypasses RLS.
-- Users may only insert/delete their own rows.

CREATE TABLE public.push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL,
  p256dh     text        NOT NULL,
  auth_key   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_insert_own"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_delete_own"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view subscriptions for support/debugging
CREATE POLICY "push_subs_admin_select"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());
