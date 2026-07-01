-- Yahrzeits table
CREATE TABLE IF NOT EXISTS yahrzeits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  hebrew_name   TEXT,
  relationship  TEXT,
  -- Store as mm-dd (Gregorian anniversary) for easy annual reminders
  anniversary_month  INTEGER,
  anniversary_day    INTEGER,
  -- Hebrew date stored as text e.g. "15 Tishrei"
  hebrew_date_text   TEXT,
  hebrew_month       INTEGER,
  hebrew_day         INTEGER,
  notes              TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yahrzeits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own yahrzeits" ON yahrzeits
  FOR ALL USING (auth.uid() = user_id);

-- Refuah / Tehillim requests table
CREATE TABLE IF NOT EXISTS refuah_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  hebrew_name   TEXT,
  condition     TEXT,
  community_id  UUID REFERENCES communities(id) ON DELETE SET NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE refuah_requests ENABLE ROW LEVEL SECURITY;
-- Anyone can read active refuah entries; only submitter can edit/delete
CREATE POLICY "Anyone reads refuah" ON refuah_requests FOR SELECT USING (TRUE);
CREATE POLICY "Users manage own refuah" ON refuah_requests
  FOR ALL USING (auth.uid() = submitted_by);
