-- ── Eruv Status ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eruv_statuses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area        text NOT NULL,          -- 'Lawrence-Cedarhurst', 'Far Rockaway/Bayswater'
  status      text NOT NULL CHECK (status IN ('up','down','uncertain')),
  message     text,                   -- optional free-text note from checker
  checked_by  text,                   -- name of checker (not user_id — often a rav or gabbai)
  week_of     date NOT NULL DEFAULT CURRENT_DATE,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE eruv_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read eruv status"
  ON eruv_statuses FOR SELECT USING (true);

CREATE POLICY "Admins manage eruv status"
  ON eruv_statuses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed initial rows for the two main Five Towns eruvin
INSERT INTO eruv_statuses (area, status, checked_by, message) VALUES
  ('Lawrence-Cedarhurst', 'up', 'Eruv Committee', 'Check eruv.org or call 516-ERUV-NOW for real-time updates.'),
  ('Far Rockaway / Bayswater', 'up', 'Eruv Committee', NULL)
ON CONFLICT DO NOTHING;

-- ── Gemach Directory ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gemachs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL,     -- see categories in frontend
  description   text,
  contact_name  text,
  phone         text,
  email         text,
  area          text,              -- Cedarhurst, Lawrence, Woodmere, Hewlett, North Woodmere, Other
  address       text,
  hours         text,
  is_active     boolean NOT NULL DEFAULT true,
  is_approved   boolean NOT NULL DEFAULT false,
  submitted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gemachs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved gemachs"
  ON gemachs FOR SELECT USING (is_approved = true);

CREATE POLICY "Logged-in users can submit gemachs"
  ON gemachs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Submitters can edit their own"
  ON gemachs FOR UPDATE
  USING (auth.uid() = submitted_by);

CREATE POLICY "Admins manage all gemachs"
  ON gemachs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed well-known Five Towns gemachs
INSERT INTO gemachs (name, category, description, phone, area, is_approved) VALUES
  ('Five Towns Gemach Clearing House', 'Medical Equipment', 'Coordinates medical equipment loans (crutches, wheelchairs, hospital beds). Call to check availability.', '516-239-3110', 'Lawrence', true),
  ('Achiezer Medical Equipment', 'Medical Equipment', 'Full range of medical equipment loans through Achiezer community services.', '516-791-4444', 'Lawrence', true),
  ('Five Towns Baby Gemach', 'Baby Items', 'Baby gear, car seats, cribs, strollers — call to check what is available.', null, 'Woodmere', true),
  ('Kesser Torah Sefarim Gemach', 'Books & Sefarim', 'Borrows and lends sefarim, siddurim, and Jewish books.', null, 'Cedarhurst', true),
  ('HASC Clothing Gemach', 'Clothing & Linens', 'Gently used children''s and adult clothing, all sizes.', '516-569-4000', 'Cedarhurst', true),
  ('Five Towns Bikur Cholim', 'Hospitality & Meals', 'Meals, hospital visits, ride coordination for patients and families.', '516-295-3232', 'Lawrence', true),
  ('Darchei Torah Shabbos Gemach', 'Food & Shabbos', 'Shabbos food assistance. Contact quietly for sensitive situations.', '516-295-2244', 'Far Rockaway', true),
  ('Wedding Gemach of the Five Towns', 'Wedding Items', 'Wedding supplies including flowers, tables, linens, and decorations.', null, 'Cedarhurst', true),
  ('Five Towns Free Loan Society', 'Interest-Free Loans', 'Gemilut chasadim — interest-free loans for community members in need.', null, 'Lawrence', true),
  ('Woodmere Tools Gemach', 'Tools & Equipment', 'Power tools, ladders, and home improvement equipment for short-term loans.', null, 'Woodmere', true)
ON CONFLICT DO NOTHING;

-- ── Simcha Board ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simcha_announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('birth','engagement','wedding','bar_mitzvah','bat_mitzvah','aufruf','sheva_brachos','graduation','anniversary','other')),
  title         text NOT NULL,     -- e.g. "Baby boy born to the Cohen family!"
  message       text,
  family_name   text,
  date_of_event date,
  location      text,
  is_public     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE simcha_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public simchas"
  ON simcha_announcements FOR SELECT USING (is_public = true);

CREATE POLICY "Users manage own simchas"
  ON simcha_announcements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
