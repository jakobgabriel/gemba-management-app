-- ============================================================
-- Gemba Management System - Database Initialization
-- 05-seed.sql: Seed / demo data
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO gemba_config.roles (id, name, level, description) VALUES
    (gen_random_uuid(), 'team_member',    1,  'Shop-floor team member'),
    (gen_random_uuid(), 'area_leader',    2,  'Area or shift leader'),
    (gen_random_uuid(), 'plant_manager',  3,  'Plant manager'),
    (gen_random_uuid(), 'admin',          99, 'System administrator');

-- ============================================================
-- 2. PLANT
-- ============================================================
INSERT INTO gemba_config.plants (id, name, code, timezone) VALUES
    (gen_random_uuid(), 'Demo Plant', 'DEMO', 'Europe/Berlin');

-- ============================================================
-- 3. AREAS
-- ============================================================
INSERT INTO gemba_config.areas (id, plant_id, name, code) VALUES
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Production Area A', 'PROD-A'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Production Area B', 'PROD-B'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Packaging',         'PKG'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Warehouse',         'WH'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Maintenance',       'MAINT');

-- ============================================================
-- 4. TEAMS
-- ============================================================
INSERT INTO gemba_config.teams (id, plant_id, name) VALUES
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Team A'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Team B'),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Team C');

-- ============================================================
-- 5. WORKSTATIONS
-- ============================================================
-- Area A, Team A
INSERT INTO gemba_config.workstations (id, plant_id, machine_code, name, area_id, team_id, default_part, is_active) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-401', 'Machine M-401',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-A1', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-402', 'Machine M-402',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-A2', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-403', 'Machine M-403',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-A3', TRUE);

-- Area A, Team B
INSERT INTO gemba_config.workstations (id, plant_id, machine_code, name, area_id, team_id, default_part, is_active) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-301', 'Machine M-301',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-B1', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-302', 'Machine M-302',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-B2', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'M-303', 'Machine M-303',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'PART-B3', TRUE);

-- ============================================================
-- 6. ISSUE CATEGORIES
-- ============================================================
INSERT INTO gemba_config.issue_categories (id, plant_id, name, sort_order) VALUES
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Mechanical',  1),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Electrical',  2),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Quality',     3),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Material',    4),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Safety',      5),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Other',       6);

-- ============================================================
-- 7. SHIFT DEFINITIONS
-- ============================================================
INSERT INTO gemba_config.shift_definitions (id, plant_id, name, start_time, end_time, sort_order) VALUES
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Early', '06:00', '14:00', 1),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Late',  '14:00', '22:00', 2),
    (gen_random_uuid(), (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'), 'Night', '22:00', '06:00', 3);

-- ============================================================
-- 8. USERS (password: demo123)
-- ============================================================
INSERT INTO gemba_config.users (id, plant_id, username, email, password_hash, display_name, role_id, team_id, preferred_lang, is_active) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'admin', 'admin@demo.com',
     '$2a$10$rQEY0tXnQ8pKJ4Lm8bOvJOz5sJvGwVZQvFj3/Y4nQjEAhPqXxXxXy',
     'Admin User',
     (SELECT id FROM gemba_config.roles WHERE name = 'admin'),
     NULL, 'en', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'team1', 'team1@demo.com',
     '$2a$10$rQEY0tXnQ8pKJ4Lm8bOvJOz5sJvGwVZQvFj3/Y4nQjEAhPqXxXxXy',
     'Team Member 1',
     (SELECT id FROM gemba_config.roles WHERE name = 'team_member'),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'en', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'leader1', 'leader1@demo.com',
     '$2a$10$rQEY0tXnQ8pKJ4Lm8bOvJOz5sJvGwVZQvFj3/Y4nQjEAhPqXxXxXy',
     'Area Leader 1',
     (SELECT id FROM gemba_config.roles WHERE name = 'area_leader'),
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'en', TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'manager1', 'manager1@demo.com',
     '$2a$10$rQEY0tXnQ8pKJ4Lm8bOvJOz5sJvGwVZQvFj3/Y4nQjEAhPqXxXxXy',
     'Plant Manager 1',
     (SELECT id FROM gemba_config.roles WHERE name = 'plant_manager'),
     NULL, 'en', TRUE);

-- ============================================================
-- 9. OPERATORS
-- ============================================================
INSERT INTO gemba_config.operators (id, plant_id, name, team_id, is_active) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'Team Member A',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'Team Member B',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'Team Member C',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team C' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'John Smith',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'Lisa Chen',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     'Mike Brown',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     TRUE);

-- ============================================================
-- 10. SAMPLE ISSUES (7 prototype issues)
-- ============================================================

-- Helper aliases used throughout:
--   _plant  = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')
--   _early  = early shift id
--   _late   = late shift id
--   _team1  = team1 user id
--   _leader = leader1 user id
--   _admin  = admin user id

-- Issue 1: Mechanical - Open, High priority, Level 1
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    'Conveyor belt misalignment on Line A',
    (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Production Area A',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Mechanical' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Belt Drive',
    'HIGH',
    'OPEN',
    'The conveyor belt on Line A has been misaligned since the start of the shift. Products are falling off the belt at the transition point. Temporary fix applied but needs permanent correction.',
    'John Smith',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '07:30',
    (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    (SELECT id FROM gemba_config.users WHERE username = 'team1'),
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
);

-- Issue 2: Electrical - Open, Medium priority, Level 1
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    'Intermittent sensor failure on M-402',
    (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Production Area A',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Electrical' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Proximity Sensor',
    'MEDIUM',
    'OPEN',
    'The proximity sensor on M-402 is intermittently failing, causing the machine to stop unexpectedly. Sensor was replaced last month but the issue has returned.',
    'Lisa Chen',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '08:15',
    (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    (SELECT id FROM gemba_config.users WHERE username = 'team1'),
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
);

-- Issue 3: Quality - Escalated, High priority, Level 2
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    2,
    'Surface finish defects on Part A2 batch',
    (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Production Area A',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Quality' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Surface Finish',
    'HIGH',
    'ESCALATED',
    'Multiple parts from the latest batch of Part A2 are showing surface finish defects. Roughness exceeds tolerance. Root cause suspected to be worn tooling but needs investigation by quality team.',
    'Mike Brown',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Late' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '15:00',
    (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    (SELECT id FROM gemba_config.users WHERE username = 'leader1'),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '6 hours'
);

-- Issue 4: Material - Open, Medium priority, Level 1
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    'Raw material shortage for Part B1',
    (SELECT id FROM gemba_config.areas WHERE name = 'Warehouse' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Warehouse',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Material' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Raw Material Supply',
    'MEDIUM',
    'OPEN',
    'Current stock of raw material for Part B1 is critically low. Estimated to run out by end of next shift. Supplier delivery was expected yesterday but has not arrived.',
    'Team Member B',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '09:00',
    (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-301' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    (SELECT id FROM gemba_config.users WHERE username = 'team1'),
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
);

-- Issue 5: Safety - Open, High priority, Level 1
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    'Wet floor near packaging area - slip hazard',
    (SELECT id FROM gemba_config.areas WHERE name = 'Packaging' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Packaging',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Safety' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Floor Condition',
    'HIGH',
    'OPEN',
    'Water leak from the cooling system is creating a persistent wet floor near the packaging area. Warning signs have been placed but the root cause needs to be fixed. Near-miss incident reported this morning.',
    'Team Member C',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '06:45',
    NULL,
    (SELECT id FROM gemba_config.users WHERE username = 'team1'),
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
);

-- Issue 6: Mechanical - Resolved, Medium priority, Level 1
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time, workstation_id,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    'Pneumatic cylinder leak on M-303',
    (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Production Area A',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Mechanical' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Pneumatics',
    'MEDIUM',
    'RESOLVED',
    'Air leak detected on the pneumatic cylinder of M-303. Causing slow cycle times and inconsistent clamping pressure.',
    'John Smith',
    'production',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Late' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '16:30',
    (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-303' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    (SELECT id FROM gemba_config.users WHERE username = 'leader1'),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
);

-- Issue 7: Other - Open, Low priority, Level 1 (from gemba walk)
INSERT INTO gemba.issues (
    id, plant_id, issue_number, level, title, area_id, area_text,
    category_id, subcategory, priority, status, description,
    contact_person, source, shift_id, reported_time,
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    nextval('gemba.issue_number_seq'),
    1,
    '5S standards not maintained in Maintenance area',
    (SELECT id FROM gemba_config.areas WHERE name = 'Maintenance' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Maintenance',
    (SELECT id FROM gemba_config.issue_categories WHERE name = 'Other' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    'Housekeeping',
    'LOW',
    'OPEN',
    'During the Gemba walk, it was observed that the maintenance area does not meet 5S standards. Tools are not in their designated locations, and the shadow board is incomplete.',
    'Plant Manager 1',
    'gemba',
    (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
    '10:00',
    (SELECT id FROM gemba_config.users WHERE username = 'manager1'),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- -----------------------------------------------------------
-- Resolution for Issue 6 (Pneumatic cylinder leak)
-- -----------------------------------------------------------
INSERT INTO gemba.issue_resolutions (
    id, issue_id, resolution, resolved_by, resolved_at,
    downtime_prevented, defects_reduced, cost_savings
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba.issues WHERE title = 'Pneumatic cylinder leak on M-303'),
    'Replaced the worn seal on the pneumatic cylinder. Tested clamping pressure and cycle time - both back to specification. Ordered spare seals to prevent future delays.',
    (SELECT id FROM gemba_config.users WHERE username = 'leader1'),
    NOW() - INTERVAL '1 day',
    45, 0, 1200.00
);

-- -----------------------------------------------------------
-- Escalation for Issue 3 (Surface finish defects)
-- -----------------------------------------------------------
INSERT INTO gemba.issue_escalations (
    id, issue_id, from_level, to_level, reason, actions_taken,
    support_needed, escalated_by, escalated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba.issues WHERE title = 'Surface finish defects on Part A2 batch'),
    1, 2,
    'Defect rate exceeds 5% threshold and is affecting customer delivery schedule.',
    'Stopped production on affected workstation. Isolated defective parts for inspection. Initial tooling check performed.',
    'Quality engineering team needs to perform detailed root cause analysis. May need to source replacement tooling urgently.',
    (SELECT id FROM gemba_config.users WHERE username = 'leader1'),
    NOW() - INTERVAL '6 hours'
);

-- ============================================================
-- 11. SAMPLE PRODUCTION DATA (today, early shift, M-401)
-- ============================================================
INSERT INTO gemba.production_entries (id, plant_id, workstation_id, shift_id, entry_date, hour, target, actual, part_number, notes, created_by) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 6, 50, 48, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 7, 50, 52, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 8, 50, 45, 'PART-A1', 'Machine slowdown due to conveyor issue',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 9, 50, 50, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 10, 50, 51, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 11, 50, 47, 'PART-A1', 'Brief stoppage for adjustment',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 12, 50, 53, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-401' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 13, 50, 49, 'PART-A1', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1'));

-- Production data for M-402 (today, early shift)
INSERT INTO gemba.production_entries (id, plant_id, workstation_id, shift_id, entry_date, hour, target, actual, part_number, notes, created_by) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 6, 40, 38, 'PART-A2', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 7, 40, 40, 'PART-A2', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 8, 40, 35, 'PART-A2', 'Sensor issue caused stoppage',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 9, 40, 30, 'PART-A2', 'Continued sensor intermittency',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     (SELECT id FROM gemba_config.workstations WHERE machine_code = 'M-402' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     CURRENT_DATE, 10, 40, 42, 'PART-A2', NULL,
     (SELECT id FROM gemba_config.users WHERE username = 'team1'));

-- ============================================================
-- 12. SAMPLE SAFETY ENTRIES
-- ============================================================
INSERT INTO gemba.safety_entries (id, plant_id, entry_date, shift_id, status, team_id, area_id, notes, created_by) VALUES
    -- Today - Early shift
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     CURRENT_DATE,
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'near-miss',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.areas WHERE name = 'Packaging' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'Near-miss: Worker slipped on wet floor near packaging area. No injury. Warning signs placed.',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     CURRENT_DATE,
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'safe',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'All clear. PPE compliance 100%.',
     (SELECT id FROM gemba_config.users WHERE username = 'team1')),
    -- Yesterday - Early shift
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     CURRENT_DATE - INTERVAL '1 day',
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Early' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'safe',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'No safety incidents. All areas inspected.',
     (SELECT id FROM gemba_config.users WHERE username = 'leader1')),
    -- Yesterday - Late shift
    (gen_random_uuid(),
     (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
     CURRENT_DATE - INTERVAL '1 day',
     (SELECT id FROM gemba_config.shift_definitions WHERE name = 'Late' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'safe',
     (SELECT id FROM gemba_config.teams WHERE name = 'Team B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'All clear for late shift.',
     (SELECT id FROM gemba_config.users WHERE username = 'leader1'));

-- ============================================================
-- 13. SAMPLE GEMBA WALKS (completed)
-- ============================================================

-- Walk 1: Completed walk from 3 days ago
INSERT INTO gemba.gemba_walks (
    id, plant_id, leader_id, target_areas, focus, participants,
    team_feedback, status, current_step, started_at, completed_at, duration_min
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    (SELECT id FROM gemba_config.users WHERE username = 'manager1'),
    'Production Area A, Maintenance, Packaging',
    '5S compliance and safety standards',
    'Plant Manager 1, Area Leader 1, Team Member 1',
    'Team reported concerns about maintenance area organization. Positive feedback on new safety signage in packaging area.',
    'completed',
    5,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
    45
);

-- Walk 2: Completed walk from 1 day ago
INSERT INTO gemba.gemba_walks (
    id, plant_id, leader_id, target_areas, focus, participants,
    team_feedback, status, current_step, started_at, completed_at, duration_min
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM gemba_config.plants WHERE code = 'DEMO'),
    (SELECT id FROM gemba_config.users WHERE username = 'leader1'),
    'Production Area A, Production Area B',
    'Production efficiency and quality review',
    'Area Leader 1, Team Member 1',
    'Team highlighted recurring sensor issues on M-402. Suggested preventive maintenance schedule review.',
    'completed',
    5,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '30 minutes',
    30
);

-- -----------------------------------------------------------
-- Gemba walk findings
-- -----------------------------------------------------------
-- Findings for Walk 1
INSERT INTO gemba.gemba_walk_findings (id, walk_id, observation, area_id, finding_type, created_at) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba.gemba_walks WHERE focus = '5S compliance and safety standards'),
     'Maintenance area shadow board incomplete - 3 tools missing from designated spots.',
     (SELECT id FROM gemba_config.areas WHERE name = 'Maintenance' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'housekeeping',
     NOW() - INTERVAL '3 days' + INTERVAL '15 minutes'),
    (gen_random_uuid(),
     (SELECT id FROM gemba.gemba_walks WHERE focus = '5S compliance and safety standards'),
     'New safety signage in packaging area is well-positioned and clearly visible.',
     (SELECT id FROM gemba_config.areas WHERE name = 'Packaging' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'positive',
     NOW() - INTERVAL '3 days' + INTERVAL '25 minutes'),
    (gen_random_uuid(),
     (SELECT id FROM gemba.gemba_walks WHERE focus = '5S compliance and safety standards'),
     'Wet floor condition detected near packaging area cooling system.',
     (SELECT id FROM gemba_config.areas WHERE name = 'Packaging' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'safety',
     NOW() - INTERVAL '3 days' + INTERVAL '30 minutes');

-- Findings for Walk 2
INSERT INTO gemba.gemba_walk_findings (id, walk_id, observation, area_id, finding_type, created_at) VALUES
    (gen_random_uuid(),
     (SELECT id FROM gemba.gemba_walks WHERE focus = 'Production efficiency and quality review'),
     'M-402 sensor wiring shows signs of wear at connection point. Recommend full wiring harness replacement.',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area A' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'maintenance',
     NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
    (gen_random_uuid(),
     (SELECT id FROM gemba.gemba_walks WHERE focus = 'Production efficiency and quality review'),
     'Production Area B running smoothly. Good operator engagement observed.',
     (SELECT id FROM gemba_config.areas WHERE name = 'Production Area B' AND plant_id = (SELECT id FROM gemba_config.plants WHERE code = 'DEMO')),
     'positive',
     NOW() - INTERVAL '1 day' + INTERVAL '20 minutes');
