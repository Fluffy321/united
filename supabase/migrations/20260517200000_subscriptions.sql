-- Add Stripe Customer ID to profiles (1:1 relationship)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Subscriptions table for Stripe recurring billing
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  text        UNIQUE NOT NULL,
  stripe_customer_id      text        NOT NULL,
  tier                    text        NOT NULL CHECK (tier IN ('supporter', 'builder', 'champion')),
  interval                text        NOT NULL CHECK (interval IN ('monthly', 'annual')),
  status                  text        NOT NULL DEFAULT 'active'
                                        CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  stripe_status           text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     NOT NULL DEFAULT false,
  canceled_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_subscription_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_subscription_updated_at();

CREATE POLICY "subscriptions_user_read"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_read"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

-- No INSERT/UPDATE from frontend — service role (Edge Functions) only

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_id_idx
  ON public.subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx
  ON public.subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx
  ON public.subscriptions (status, user_id);
