-- ── Schema ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seasons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_name   text NOT NULL,
  season_name text NOT NULL,
  is_active         boolean DEFAULT true,
  age_group_sports  jsonb   NOT NULL DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS period_slots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id  uuid REFERENCES seasons(id) ON DELETE CASCADE,
  day_type   text CHECK (day_type IN ('sun_thu', 'fri')),
  label      text NOT NULL,
  start_time text NOT NULL,
  end_time   text NOT NULL,
  age_groups   text[] NOT NULL DEFAULT '{}',
  age_sessions jsonb  NOT NULL DEFAULT '{}',
  sort_order   int    NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS age_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id  uuid REFERENCES seasons(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sports (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  name      text NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  name      text NOT NULL
);

CREATE TABLE IF NOT EXISTS venue_rules (
  sport_id    uuid REFERENCES sports(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  PRIMARY KEY (sport_id, location_id)
);

CREATE TABLE IF NOT EXISTS staff (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  name      text NOT NULL,
  initials  text NOT NULL,
  color     text NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_restrictions (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  type     text CHECK (type IN ('age_group', 'sport', 'unavailable_date', 'note')),
  value    text NOT NULL
);

CREATE TABLE IF NOT EXISTS sport_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id      uuid REFERENCES seasons(id) ON DELETE CASCADE,
  date           text NOT NULL,
  period_slot_id uuid REFERENCES period_slots(id),
  staff_id       uuid REFERENCES staff(id),
  sport          text NOT NULL,
  location       text NOT NULL,
  age_group      text NOT NULL
);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- v1: allow all (no auth)

ALTER TABLE seasons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_sessions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_seasons"           ON seasons           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_period_slots"      ON period_slots      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_age_groups"        ON age_groups        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sports"            ON sports            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_locations"         ON locations         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_venue_rules"       ON venue_rules       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_staff"             ON staff             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_staff_restrictions" ON staff_restrictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sport_sessions"   ON sport_sessions    FOR ALL USING (true) WITH CHECK (true);
