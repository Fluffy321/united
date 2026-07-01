-- Weekly community chesed challenge completions
CREATE TABLE IF NOT EXISTS chesed_challenge_completions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key    text NOT NULL,  -- ISO week e.g. "2026-W27"
  challenge   text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, week_key)
);

ALTER TABLE chesed_challenge_completions ENABLE ROW LEVEL SECURITY;

-- Users can read all completions (for the count), write only their own
CREATE POLICY "Anyone can read challenge completions"
  ON chesed_challenge_completions FOR SELECT USING (true);

CREATE POLICY "Users insert own completion"
  ON chesed_challenge_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own completion"
  ON chesed_challenge_completions FOR DELETE
  USING (auth.uid() = user_id);
