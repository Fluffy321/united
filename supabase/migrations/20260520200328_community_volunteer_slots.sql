-- Community Volunteer Slots & Claims
-- Extends community_forms with named time-based shifts that volunteers can claim.
-- claimed_count is maintained atomically via trigger so members can read remaining capacity
-- without needing access to the full claims roster.

CREATE TABLE public.community_volunteer_slots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID        NOT NULL REFERENCES public.community_forms(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL,
  start_time    TIMESTAMPTZ,
  end_time      TIMESTAMPTZ,
  capacity      INTEGER     NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  claimed_count INTEGER     NOT NULL DEFAULT 0 CHECK (claimed_count >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.community_volunteer_claims (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id      UUID        NOT NULL REFERENCES public.community_volunteer_slots(id) ON DELETE CASCADE,
  submitter_id UUID        NOT NULL REFERENCES auth.users(id),
  community_id UUID        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  claimed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slot_id, submitter_id)
);

CREATE INDEX ON public.community_volunteer_slots (form_id);
CREATE INDEX ON public.community_volunteer_claims (slot_id);
CREATE INDEX ON public.community_volunteer_claims (submitter_id, community_id);

-- Trigger: keep claimed_count in sync so members can read remaining capacity
CREATE OR REPLACE FUNCTION public.update_volunteer_slot_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_volunteer_slots SET claimed_count = claimed_count + 1 WHERE id = NEW.slot_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_volunteer_slots SET claimed_count = claimed_count - 1 WHERE id = OLD.slot_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_volunteer_claim_count
AFTER INSERT OR DELETE ON public.community_volunteer_claims
FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_slot_count();

-- RLS: community_volunteer_slots
ALTER TABLE public.community_volunteer_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage volunteer slots" ON public.community_volunteer_slots FOR ALL
  USING (public.can_manage_community((SELECT community_id FROM public.community_forms WHERE id = form_id)))
  WITH CHECK (public.can_manage_community((SELECT community_id FROM public.community_forms WHERE id = form_id)));
CREATE POLICY "Members can read slots of accessible forms" ON public.community_volunteer_slots FOR SELECT
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_forms f
    JOIN public.community_memberships cm ON cm.community_id = f.community_id
    WHERE f.id = community_volunteer_slots.form_id
      AND f.status IN ('open', 'closed')
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'));

-- RLS: community_volunteer_claims
ALTER TABLE public.community_volunteer_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can read all claims" ON public.community_volunteer_claims FOR SELECT
  USING (public.can_manage_community(community_id));
CREATE POLICY "Members can read their own claims" ON public.community_volunteer_claims FOR SELECT
  USING (submitter_id = auth.uid());
CREATE POLICY "Managers can delete claims" ON public.community_volunteer_claims FOR DELETE
  USING (public.can_manage_community(community_id));

-- Atomic claim RPC — FOR UPDATE lock prevents double-claiming the last spot
CREATE OR REPLACE FUNCTION public.claim_volunteer_slot(p_slot_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_slot   community_volunteer_slots;
  v_form   community_forms;
  v_new_id UUID;
BEGIN
  SELECT * INTO v_slot FROM community_volunteer_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found' USING ERRCODE = 'no_data_found'; END IF;

  SELECT * INTO v_form FROM community_forms WHERE id = v_slot.form_id;
  IF v_form.status <> 'open' THEN
    RAISE EXCEPTION 'This form is no longer accepting signups' USING ERRCODE = 'check_violation';
  END IF;
  IF v_form.due_date IS NOT NULL AND v_form.due_date < now() THEN
    RAISE EXCEPTION 'This form has passed its deadline' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = v_form.community_id AND user_id = auth.uid() AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You must be an active member to claim a slot' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF EXISTS (
    SELECT 1 FROM community_volunteer_claims WHERE slot_id = p_slot_id AND submitter_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You have already claimed this slot' USING ERRCODE = 'unique_violation';
  END IF;
  IF v_slot.claimed_count >= v_slot.capacity THEN
    RAISE EXCEPTION 'This slot is full' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO community_volunteer_claims (slot_id, submitter_id, community_id, claimed_at)
  VALUES (p_slot_id, auth.uid(), v_form.community_id, now())
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END; $$;

REVOKE ALL ON FUNCTION public.claim_volunteer_slot(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_volunteer_slot(UUID) TO authenticated;
