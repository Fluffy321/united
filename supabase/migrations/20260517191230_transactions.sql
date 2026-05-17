-- Transactions table for Stripe payment tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount                    integer     NOT NULL CHECK (amount > 0),   -- cents
  currency                  text        NOT NULL DEFAULT 'usd',
  stripe_session_id         text        UNIQUE NOT NULL,
  stripe_payment_intent_id  text,
  purpose                   text,        -- 'support_junited_supporter' | 'donation' etc.
  tier                      text,        -- 'supporter' | 'champion' | 'patron'
  status                    text        NOT NULL DEFAULT 'pending'
                                          CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  completed_at              timestamptz
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- updated_at auto-stamp
CREATE OR REPLACE FUNCTION public.set_transaction_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_transaction_updated_at();

-- Users read only their own transaction history
CREATE POLICY "transactions_user_read"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

-- Platform admins read all
CREATE POLICY "transactions_admin_read"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- Also allow reading by stripe_session_id for ThankYou page lookup
-- (user reads their own row by session_id)
CREATE POLICY "transactions_user_read_by_session"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE from frontend — service role (webhook Edge Function) only
-- Service role bypasses RLS entirely.

CREATE INDEX IF NOT EXISTS transactions_user_id_idx
  ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_session_id_idx
  ON public.transactions (stripe_session_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx
  ON public.transactions (status, created_at DESC);
