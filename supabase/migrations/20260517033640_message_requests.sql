-- Message Requests
-- Stores incoming direct-message requests from users outside the recipient's
-- network (non-friend, non-community-member). The recipient can accept
-- (creating a real conversation) or decline.

CREATE TABLE IF NOT EXISTS public.message_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name     text        NOT NULL DEFAULT '',
  sender_avatar   text,
  message_preview text,
  status          text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT message_requests_unique UNIQUE (sender_id, recipient_id, status)
                               DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS message_requests_recipient_status_idx
  ON public.message_requests (recipient_id, status, created_at DESC);

ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- Recipients see their own pending requests
CREATE POLICY "Recipients can view their own requests"
  ON public.message_requests FOR SELECT
  USING (auth.uid() = recipient_id);

-- Senders can insert (one pending request per pair enforced by UNIQUE)
CREATE POLICY "Senders can create requests"
  ON public.message_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can update status (accept / decline)
CREATE POLICY "Recipients can update status"
  ON public.message_requests FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Senders can see their sent requests
CREATE POLICY "Senders can view their sent requests"
  ON public.message_requests FOR SELECT
  USING (auth.uid() = sender_id);
