-- ============================================================
-- Gemba Management System - Database Initialization
-- 02-config-tables.sql: Configuration/reference tables
-- ============================================================

-- -----------------------------------------------------------
-- Plants
-- -----------------------------------------------------------
CREATE TABLE gemba_config.plants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    timezone    VARCHAR(100) NOT NULL DEFAULT 'UTC',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Areas within a plant
-- -----------------------------------------------------------
CREATE TABLE gemba_config.areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, name)
);

-- -----------------------------------------------------------
-- Teams
-- -----------------------------------------------------------
CREATE TABLE gemba_config.teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, name)
);

-- -----------------------------------------------------------
-- Workstations (machines)
-- -----------------------------------------------------------
CREATE TABLE gemba_config.workstations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    machine_code    VARCHAR(50)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    area_id         UUID         NOT NULL REFERENCES gemba_config.areas(id) ON DELETE RESTRICT,
    team_id         UUID         REFERENCES gemba_config.teams(id) ON DELETE SET NULL,
    default_part    VARCHAR(100),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, machine_code)
);

-- -----------------------------------------------------------
-- Issue categories
-- -----------------------------------------------------------
CREATE TABLE gemba_config.issue_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, name)
);

-- -----------------------------------------------------------
-- Shift definitions
-- -----------------------------------------------------------
CREATE TABLE gemba_config.shift_definitions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    start_time  TIME         NOT NULL,
    end_time    TIME         NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, name)
);

-- -----------------------------------------------------------
-- Roles (application-wide)
-- -----------------------------------------------------------
CREATE TABLE gemba_config.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    level       INT          NOT NULL DEFAULT 0,
    description TEXT
);

-- -----------------------------------------------------------
-- Users
-- -----------------------------------------------------------
CREATE TABLE gemba_config.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    role_id         UUID         NOT NULL REFERENCES gemba_config.roles(id) ON DELETE RESTRICT,
    team_id         UUID         REFERENCES gemba_config.teams(id) ON DELETE SET NULL,
    preferred_lang  VARCHAR(10)  NOT NULL DEFAULT 'en',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Operators (shop-floor workers, may or may not have a user account)
-- -----------------------------------------------------------
CREATE TABLE gemba_config.operators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID         NOT NULL REFERENCES gemba_config.plants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    team_id     UUID         REFERENCES gemba_config.teams(id) ON DELETE SET NULL,
    user_id     UUID         REFERENCES gemba_config.users(id) ON DELETE SET NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(plant_id, name)
);
