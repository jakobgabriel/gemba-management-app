-- ============================================================
-- Gemba Management System - Database Initialization
-- 03-data-tables.sql: Operational/transactional tables
-- ============================================================

-- -----------------------------------------------------------
-- Sequence for human-readable issue numbers
-- -----------------------------------------------------------
CREATE SEQUENCE gemba.issue_number_seq START WITH 1;

-- -----------------------------------------------------------
-- Gemba walks (created before issues so FK can reference it)
-- -----------------------------------------------------------
CREATE TABLE gemba.gemba_walks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    leader_id       UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    target_areas    TEXT,
    focus           TEXT,
    participants    TEXT,
    team_feedback   TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    current_step    INT          NOT NULL DEFAULT 1
                        CHECK (current_step BETWEEN 1 AND 5),
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration_min    INT
);

-- -----------------------------------------------------------
-- Issues
-- -----------------------------------------------------------
CREATE TABLE gemba.issues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    issue_number    INT          NOT NULL DEFAULT nextval('gemba.issue_number_seq'),
    level           INT          NOT NULL DEFAULT 1,
    title           VARCHAR(500) NOT NULL,
    area_id         UUID         REFERENCES gemba_config.areas(id) ON DELETE SET NULL,
    area_text       VARCHAR(255),
    category_id     UUID         REFERENCES gemba_config.issue_categories(id) ON DELETE SET NULL,
    subcategory     VARCHAR(255),
    priority        VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM'
                        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN', 'ESCALATED', 'RESOLVED')),
    description     TEXT,
    contact_person  VARCHAR(255),
    source          VARCHAR(20)  NOT NULL DEFAULT 'production'
                        CHECK (source IN ('production', 'gemba')),
    shift_id        UUID         REFERENCES gemba_config.shift_definitions(id) ON DELETE SET NULL,
    reported_time   TIME,
    workstation_id  UUID         REFERENCES gemba_config.workstations(id) ON DELETE SET NULL,
    gemba_walk_id   UUID         REFERENCES gemba.gemba_walks(id) ON DELETE SET NULL,
    created_by      UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Issue escalations
-- -----------------------------------------------------------
CREATE TABLE gemba.issue_escalations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id        UUID         NOT NULL REFERENCES gemba.issues(id) ON DELETE CASCADE,
    from_level      INT          NOT NULL,
    to_level        INT          NOT NULL,
    reason          TEXT,
    actions_taken   TEXT,
    support_needed  TEXT,
    escalated_by    UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    escalated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Issue resolutions
-- -----------------------------------------------------------
CREATE TABLE gemba.issue_resolutions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id            UUID           NOT NULL UNIQUE REFERENCES gemba.issues(id) ON DELETE CASCADE,
    resolution          TEXT,
    resolved_by         UUID           NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    resolved_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    downtime_prevented  INT            NOT NULL DEFAULT 0,
    defects_reduced     INT            NOT NULL DEFAULT 0,
    cost_savings        DECIMAL(12,2)  NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------
-- AI suggestions for issue escalation level
-- -----------------------------------------------------------
CREATE TABLE gemba.ai_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id        UUID         NOT NULL REFERENCES gemba.issues(id) ON DELETE CASCADE,
    suggested_level INT          NOT NULL,
    reason          TEXT,
    confidence      INT          NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    accepted        BOOLEAN,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Production entries (hourly production tracking)
-- -----------------------------------------------------------
CREATE TABLE gemba.production_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    workstation_id  UUID         NOT NULL REFERENCES gemba_config.workstations(id) ON DELETE CASCADE,
    shift_id        UUID         NOT NULL REFERENCES gemba_config.shift_definitions(id) ON DELETE RESTRICT,
    entry_date      DATE         NOT NULL,
    hour            INT          NOT NULL CHECK (hour BETWEEN 0 AND 23),
    target          INT          NOT NULL DEFAULT 0,
    actual          INT          NOT NULL DEFAULT 0,
    part_number     VARCHAR(100),
    notes           TEXT,
    created_by      UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(workstation_id, entry_date, hour)
);

-- -----------------------------------------------------------
-- Safety entries (daily safety status per shift/team)
-- -----------------------------------------------------------
CREATE TABLE gemba.safety_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    entry_date      DATE         NOT NULL,
    shift_id        UUID         NOT NULL REFERENCES gemba_config.shift_definitions(id) ON DELETE RESTRICT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'safe'
                        CHECK (status IN ('safe', 'near-miss', 'incident', 'not-reported')),
    team_id         UUID         REFERENCES gemba_config.teams(id) ON DELETE SET NULL,
    area_id         UUID         REFERENCES gemba_config.areas(id) ON DELETE SET NULL,
    notes           TEXT,
    created_by      UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, entry_date, shift_id, team_id)
);

-- -----------------------------------------------------------
-- Gemba walk findings
-- -----------------------------------------------------------
CREATE TABLE gemba.gemba_walk_findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    walk_id         UUID         NOT NULL REFERENCES gemba.gemba_walks(id) ON DELETE CASCADE,
    observation     TEXT         NOT NULL,
    area_id         UUID         REFERENCES gemba_config.areas(id) ON DELETE SET NULL,
    finding_type    VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Shift handover notes
-- -----------------------------------------------------------
CREATE TABLE gemba.shift_handover_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    shift_id        UUID         NOT NULL REFERENCES gemba_config.shift_definitions(id) ON DELETE RESTRICT,
    note_date       DATE         NOT NULL,
    content         TEXT         NOT NULL,
    created_by      UUID         NOT NULL REFERENCES gemba_config.users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Audit log (append-only)
-- -----------------------------------------------------------
CREATE TABLE gemba.audit_log (
    id              BIGSERIAL PRIMARY KEY,
    plant_id        UUID,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    action          VARCHAR(50)  NOT NULL,
    old_data        JSONB,
    new_data        JSONB,
    user_id         UUID,
    ip_address      INET,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
