-- Community Forms, Signups & Volunteer Coordination
-- Tables: community_forms, community_form_fields, community_form_submissions
-- Security: RLS + security-definer submit RPC (validates membership + form constraints).

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS allow_forms BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.communities.allow_forms IS
  'Enables the Forms & Signups module for this community.';

CREATE TABLE public.community_forms (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID         NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by       UUID         NOT NULL REFERENCES auth.users(id),
  title            TEXT         NOT NULL,
  description      TEXT,
  form_type        TEXT         NOT NULL DEFAULT 'general',
  status           TEXT         NOT NULL DEFAULT 'open',
  allow_multiple   BOOLEAN      NOT NULL DEFAULT false,
  max_submissions  INTEGER,
  due_date         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE public.community_form_fields (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID         NOT NULL REFERENCES public.community_forms(id) ON DELETE CASCADE,
  label       TEXT         NOT NULL,
  field_type  TEXT         NOT NULL DEFAULT 'short_text',
  required    BOOLEAN      NOT NULL DEFAULT false,
  options     JSONB,
  placeholder TEXT,
  field_order SMALLINT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE public.community_form_submissions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id        UUID         NOT NULL REFERENCES public.community_forms(id) ON DELETE CASCADE,
  community_id   UUID         NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  submitter_id   UUID         NOT NULL REFERENCES auth.users(id),
  submitter_name TEXT,
  answers        JSONB        NOT NULL DEFAULT '{}',
  submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ON public.community_forms (community_id, status);
CREATE INDEX ON public.community_form_fields (form_id, field_order);
CREATE INDEX ON public.community_form_submissions (form_id, submitted_at DESC);
CREATE INDEX ON public.community_form_submissions (community_id, submitter_id);

ALTER TABLE public.community_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage community forms" ON public.community_forms FOR ALL
  USING (public.can_manage_community(community_id)) WITH CHECK (public.can_manage_community(community_id));
CREATE POLICY "Members can read open or closed forms" ON public.community_forms FOR SELECT
  USING (status IN ('open','closed') AND auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_forms.community_id AND cm.user_id = auth.uid() AND cm.status = 'active'));

ALTER TABLE public.community_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage form fields" ON public.community_form_fields FOR ALL
  USING (public.can_manage_community((SELECT community_id FROM public.community_forms WHERE id = form_id)))
  WITH CHECK (public.can_manage_community((SELECT community_id FROM public.community_forms WHERE id = form_id)));
CREATE POLICY "Members can read fields of accessible forms" ON public.community_form_fields FOR SELECT
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_forms f JOIN public.community_memberships cm ON cm.community_id = f.community_id
    WHERE f.id = community_form_fields.form_id AND f.status IN ('open','closed') AND cm.user_id = auth.uid() AND cm.status = 'active'));

ALTER TABLE public.community_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can read all submissions" ON public.community_form_submissions FOR SELECT
  USING (public.can_manage_community(community_id));
CREATE POLICY "Submitters can read their own submission" ON public.community_form_submissions FOR SELECT
  USING (submitter_id = auth.uid());
CREATE POLICY "Managers can delete submissions" ON public.community_form_submissions FOR DELETE
  USING (public.can_manage_community(community_id));

CREATE OR REPLACE FUNCTION public.submit_community_form(p_form_id UUID, p_answers JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_form community_forms; v_count INTEGER; v_new_id UUID;
BEGIN
  SELECT * INTO v_form FROM community_forms WHERE id = p_form_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Form not found' USING ERRCODE = 'no_data_found'; END IF;
  IF v_form.status <> 'open' THEN RAISE EXCEPTION 'This form is not currently accepting submissions' USING ERRCODE = 'check_violation'; END IF;
  IF v_form.due_date IS NOT NULL AND v_form.due_date < now() THEN RAISE EXCEPTION 'This form has passed its submission deadline' USING ERRCODE = 'check_violation'; END IF;
  IF NOT EXISTS (SELECT 1 FROM community_memberships WHERE community_id = v_form.community_id AND user_id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'You must be an active member to submit this form' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF NOT v_form.allow_multiple THEN
    SELECT COUNT(*) INTO v_count FROM community_form_submissions WHERE form_id = p_form_id AND submitter_id = auth.uid();
    IF v_count > 0 THEN RAISE EXCEPTION 'You have already submitted this form' USING ERRCODE = 'unique_violation'; END IF;
  END IF;
  IF v_form.max_submissions IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM community_form_submissions WHERE form_id = p_form_id;
    IF v_count >= v_form.max_submissions THEN RAISE EXCEPTION 'This form has reached its maximum number of submissions' USING ERRCODE = 'check_violation'; END IF;
  END IF;
  INSERT INTO community_form_submissions (form_id, community_id, submitter_id, submitter_name, answers)
  VALUES (p_form_id, v_form.community_id, auth.uid(), (SELECT display_name FROM profiles WHERE id = auth.uid()), COALESCE(p_answers, '{}'))
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END; $$;

REVOKE ALL ON FUNCTION public.submit_community_form(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_community_form(UUID, JSONB) TO authenticated;
