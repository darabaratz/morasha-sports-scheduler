-- ── Seed data for Summer 2026 ─────────────────────────────────────────────────
-- Run this AFTER 001_schema.sql

DO $$
DECLARE
  season_id uuid;
  s_basketball uuid; s_softball uuid; s_volleyball uuid;
  s_beach uuid; s_hockey uuid; s_handball uuid;
  s_kickball uuid; s_bbk uuid; s_soccer uuid;
  l_main uuid; l_lower uuid; l_bball_court uuid;
  l_vball_court uuid; l_beach_court uuid; l_hockey_rink uuid;
  p_p1 uuid; p_p2 uuid; p_p3 uuid; p_p4 uuid; p_p5 uuid;
  p_p6 uuid; p_p7 uuid; p_p8 uuid; p_p9 uuid;
  p_fp1 uuid; p_fp2 uuid; p_fp3 uuid; p_fp4 uuid; p_fp5 uuid; p_fp6 uuid;
  staff_maya uuid; staff_jake uuid; staff_priya uuid; staff_eli uuid;
  staff_dani uuid; staff_oren uuid; staff_sam uuid; staff_tara uuid;
BEGIN

-- Season
INSERT INTO seasons (camp_name, season_name, is_active)
VALUES ('Camp Sports', 'Summer 2026', true)
RETURNING id INTO season_id;

-- Sports
INSERT INTO sports (season_id, name) VALUES (season_id, 'Basketball') RETURNING id INTO s_basketball;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Softball')   RETURNING id INTO s_softball;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Volleyball') RETURNING id INTO s_volleyball;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Beach Volleyball') RETURNING id INTO s_beach;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Hockey')     RETURNING id INTO s_hockey;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Handball')   RETURNING id INTO s_handball;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Kickball')   RETURNING id INTO s_kickball;
INSERT INTO sports (season_id, name) VALUES (season_id, 'BBK')        RETURNING id INTO s_bbk;
INSERT INTO sports (season_id, name) VALUES (season_id, 'Soccer')     RETURNING id INTO s_soccer;

-- Locations
INSERT INTO locations (season_id, name) VALUES (season_id, 'Main Field')             RETURNING id INTO l_main;
INSERT INTO locations (season_id, name) VALUES (season_id, 'Lower Field')            RETURNING id INTO l_lower;
INSERT INTO locations (season_id, name) VALUES (season_id, 'Basketball Court')       RETURNING id INTO l_bball_court;
INSERT INTO locations (season_id, name) VALUES (season_id, 'Volleyball Court')       RETURNING id INTO l_vball_court;
INSERT INTO locations (season_id, name) VALUES (season_id, 'Beach Volleyball Court') RETURNING id INTO l_beach_court;
INSERT INTO locations (season_id, name) VALUES (season_id, 'Hockey Rink')            RETURNING id INTO l_hockey_rink;

-- Venue rules
INSERT INTO venue_rules VALUES (s_basketball, l_bball_court);
INSERT INTO venue_rules VALUES (s_volleyball, l_vball_court);
INSERT INTO venue_rules VALUES (s_beach,      l_beach_court);
INSERT INTO venue_rules VALUES (s_hockey,     l_hockey_rink);

-- Period slots: Sun–Thu (9 periods)
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 1', '09:00', '10:00', ARRAY['Nitzanim'], 0) RETURNING id INTO p_p1;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 2', '10:00', '11:00', ARRAY['Y. Shtilim'], 1) RETURNING id INTO p_p2;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 3', '11:00', '12:00', ARRAY['O. Shtilim'], 2) RETURNING id INTO p_p3;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 4', '13:00', '14:00', ARRAY['Illanot'], 3) RETURNING id INTO p_p4;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 5', '14:00', '15:00', ARRAY['Manhigot'], 4) RETURNING id INTO p_p5;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 6', '15:00', '16:00', ARRAY['Alufot'], 5) RETURNING id INTO p_p6;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 7', '16:00', '17:00', ARRAY['Nitzanim', 'Y. Shtilim'], 6) RETURNING id INTO p_p7;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 8', '17:00', '18:00', ARRAY['O. Shtilim', 'Illanot'], 7) RETURNING id INTO p_p8;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'sun_thu', 'Period 9', '19:00', '20:00', ARRAY['Manhigot', 'Alufot'], 8) RETURNING id INTO p_p9;

-- Period slots: Friday (6 periods)
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 1', '09:00', '10:00', ARRAY['Nitzanim'], 0) RETURNING id INTO p_fp1;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 2', '10:00', '11:00', ARRAY['Y. Shtilim'], 1) RETURNING id INTO p_fp2;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 3', '11:00', '12:00', ARRAY['O. Shtilim'], 2) RETURNING id INTO p_fp3;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 4', '13:00', '14:00', ARRAY['Illanot'], 3) RETURNING id INTO p_fp4;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 5', '14:00', '15:00', ARRAY['Manhigot'], 4) RETURNING id INTO p_fp5;
INSERT INTO period_slots (season_id, day_type, label, start_time, end_time, age_groups, sort_order)
VALUES (season_id, 'fri', 'Period 6', '15:00', '16:00', ARRAY['Alufot'], 5) RETURNING id INTO p_fp6;

-- Staff
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Maya Cohen',  'MC', '#1B4332') RETURNING id INTO staff_maya;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Jake Torres', 'JT', '#92400E') RETURNING id INTO staff_jake;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Priya Nair',  'PN', '#1E40AF') RETURNING id INTO staff_priya;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Eli Shapiro', 'ES', '#1E3A5F') RETURNING id INTO staff_eli;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Dani Reeves', 'DR', '#374151') RETURNING id INTO staff_dani;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Oren Levi',   'OL', '#B45309') RETURNING id INTO staff_oren;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Sam Winters', 'SW', '#0E7490') RETURNING id INTO staff_sam;
INSERT INTO staff (season_id, name, initials, color) VALUES (season_id, 'Tara Mehta',  'TM', '#166534') RETURNING id INTO staff_tara;

-- Staff restrictions
INSERT INTO staff_restrictions (staff_id, type, value) VALUES
  (staff_jake,  'age_group', '["Manhigot","Alufot","Illanot"]'),
  (staff_jake,  'note',      'Older groups only'),
  (staff_priya, 'sport',     '["Basketball","Volleyball","Soccer","Kickball","BBK","Handball"]'),
  (staff_priya, 'unavailable_date', '2026-06-18'),
  (staff_priya, 'note',      'Cannot supervise Hockey unsupervised'),
  (staff_dani,  'sport',     '["Basketball","Soccer","Volleyball","Kickball","Softball"]'),
  (staff_oren,  'age_group', '["Nitzanim","Y. Shtilim","O. Shtilim"]'),
  (staff_oren,  'unavailable_date', '2026-06-20'),
  (staff_oren,  'unavailable_date', '2026-06-21'),
  (staff_tara,  'sport',     '["Hockey","Kickball","Handball","BBK","Softball"]');

END $$;
