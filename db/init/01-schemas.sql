-- ============================================================
-- Gemba Management System - Database Initialization
-- 01-schemas.sql: Create schemas and enable extensions
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema for configuration/reference data
CREATE SCHEMA IF NOT EXISTS gemba_config;

-- Schema for operational/transactional data
CREATE SCHEMA IF NOT EXISTS gemba;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA gemba_config TO PUBLIC;
GRANT USAGE ON SCHEMA gemba TO PUBLIC;
