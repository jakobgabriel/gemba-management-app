-- ============================================================
-- Gemba Management System - Database Initialization
-- 04-indexes.sql: Performance indexes and full-text search
-- ============================================================

-- -----------------------------------------------------------
-- Issue indexes
-- -----------------------------------------------------------
CREATE INDEX idx_issues_plant_status
    ON gemba.issues (plant_id, status);

CREATE INDEX idx_issues_plant_category
    ON gemba.issues (plant_id, category_id);

CREATE INDEX idx_issues_created_at
    ON gemba.issues (created_at);

CREATE INDEX idx_issues_level
    ON gemba.issues (level);

-- -----------------------------------------------------------
-- Production entry indexes
-- -----------------------------------------------------------
CREATE INDEX idx_production_entries_ws_date
    ON gemba.production_entries (workstation_id, entry_date);

-- -----------------------------------------------------------
-- Safety entry indexes
-- -----------------------------------------------------------
CREATE INDEX idx_safety_entries_plant_date
    ON gemba.safety_entries (plant_id, entry_date);

-- -----------------------------------------------------------
-- Gemba walk indexes
-- -----------------------------------------------------------
CREATE INDEX idx_gemba_walks_plant
    ON gemba.gemba_walks (plant_id);

-- -----------------------------------------------------------
-- Audit log indexes
-- -----------------------------------------------------------
CREATE INDEX idx_audit_log_entity
    ON gemba.audit_log (entity_type, entity_id);

CREATE INDEX idx_audit_log_created
    ON gemba.audit_log (created_at);

-- -----------------------------------------------------------
-- Full-text search on issues
-- -----------------------------------------------------------
ALTER TABLE gemba.issues
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(subcategory, '')), 'C')
    ) STORED;

CREATE INDEX idx_issues_search_vector
    ON gemba.issues USING GIN (search_vector);
