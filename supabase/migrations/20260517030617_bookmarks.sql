CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  post_id    uuid        NOT NULL REFERENCES public.posts(id)     ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_user_post_unique UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx
  ON public.bookmarks (user_id, created_at DESC);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks"
  ON public.bookmarks
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
