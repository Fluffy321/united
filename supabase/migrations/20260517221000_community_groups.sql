-- Community Groups: sub-groups within communities (and optional standalone groups)
-- Entities: community_groups, group_members, group_posts, group_join_requests
-- community_id is nullable to support both community-scoped and app-wide groups.

-- ── community_groups ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id        uuid        REFERENCES public.communities(id)  ON DELETE CASCADE,
  name                text        NOT NULL,
  description         text,
  category            text        NOT NULL DEFAULT 'General',
  cover_image_url     text,
  location            text,
  is_private          boolean     NOT NULL DEFAULT false,
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'archived')),
  member_count        integer     NOT NULL DEFAULT 0,
  post_count          integer     NOT NULL DEFAULT 0,
  created_by_user_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_groups_community_id_idx
  ON public.community_groups (community_id)
  WHERE community_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS community_groups_creator_idx
  ON public.community_groups (created_by_user_id);

CREATE INDEX IF NOT EXISTS community_groups_status_idx
  ON public.community_groups (status);

-- ── group_members ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid        NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  user_name  text,
  role       text        NOT NULL DEFAULT 'member'
                         CHECK (role IN ('owner', 'admin', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx  ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members (group_id);

-- ── group_posts ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  user_name   text,
  body        text,
  post_type   text        NOT NULL DEFAULT 'post'
                          CHECK (post_type IN ('post', 'announcement')),
  attachment  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_posts_group_id_idx       ON public.group_posts (group_id);
CREATE INDEX IF NOT EXISTS group_posts_user_id_idx        ON public.group_posts (user_id);
CREATE INDEX IF NOT EXISTS group_posts_group_type_idx     ON public.group_posts (group_id, post_type);

-- ── group_join_requests ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  user_name   text,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'denied')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_join_requests_group_id_idx ON public.group_join_requests (group_id);
CREATE INDEX IF NOT EXISTS group_join_requests_user_id_idx  ON public.group_join_requests (user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.community_groups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- community_groups: SELECT
-- Active groups are readable by all authenticated users.
CREATE POLICY "community_groups_select"
  ON public.community_groups FOR SELECT TO authenticated
  USING (status = 'active' OR public.is_admin());

-- community_groups: INSERT
-- Any authenticated user may create a standalone group (community_id IS NULL).
-- For community-scoped groups the creator must also be a community owner/admin.
CREATE POLICY "community_groups_insert"
  ON public.community_groups FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND (
      community_id IS NULL
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = community_id
          AND c.created_by_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.community_memberships cm
        WHERE cm.community_id = community_groups.community_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- community_groups: UPDATE
-- Group creator and group admins may update; platform admins bypass.
CREATE POLICY "community_groups_update"
  ON public.community_groups FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- community_groups: DELETE
CREATE POLICY "community_groups_delete"
  ON public.community_groups FOR DELETE TO authenticated
  USING (created_by_user_id = auth.uid() OR public.is_admin());

-- ── group_members policies ────────────────────────────────────────────────────

CREATE POLICY "group_members_select"
  ON public.group_members FOR SELECT TO authenticated
  USING (true);

-- Users may join as 'member'. The group creator may join as 'admin'.
CREATE POLICY "group_members_insert"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      role = 'member'
      OR (
        role = 'admin'
        AND EXISTS (
          SELECT 1 FROM public.community_groups cg
          WHERE cg.id = group_id
            AND cg.created_by_user_id = auth.uid()
        )
      )
    )
  );

-- Group admins may change roles, but may not escalate to 'owner'.
CREATE POLICY "group_members_update"
  ON public.group_members FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    role IN ('member', 'admin')
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('owner', 'admin')
      )
    )
  );

-- Users may remove themselves; group admins may remove others.
CREATE POLICY "group_members_delete"
  ON public.group_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- ── group_posts policies ──────────────────────────────────────────────────────

-- Public groups: any authenticated user may read.
-- Private groups: only members may read.
CREATE POLICY "group_posts_select"
  ON public.group_posts FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.community_groups cg
      WHERE cg.id = group_id
        AND (
          cg.is_private = false
          OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_posts.group_id
              AND gm.user_id = auth.uid()
          )
        )
    )
  );

-- Members may post 'post'. Only admins may post 'announcement'.
CREATE POLICY "group_posts_insert"
  ON public.group_posts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
    )
    AND (
      post_type = 'post'
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_posts.group_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "group_posts_update"
  ON public.group_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "group_posts_delete"
  ON public.group_posts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- ── group_join_requests policies ──────────────────────────────────────────────

-- Users see their own requests; group admins see all for their group.
CREATE POLICY "group_join_requests_select"
  ON public.group_join_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_join_requests.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "group_join_requests_insert"
  ON public.group_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins approve/deny; users may withdraw their own request.
CREATE POLICY "group_join_requests_update"
  ON public.group_join_requests FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_join_requests.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "group_join_requests_delete"
  ON public.group_join_requests FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_join_requests.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );
