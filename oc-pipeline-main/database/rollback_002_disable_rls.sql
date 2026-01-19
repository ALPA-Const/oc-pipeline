-- Rollback 002: Disable Row-Level Security (RLS)
-- Purpose: Revert RLS changes from migration_002_enable_rls.sql
-- Author: ALPA Construction DevOps Team
-- Date: 2025-01-XX
-- WARNING: This will remove all security policies. Use only in emergencies.

BEGIN;

-- ============================================================================
-- STEP 1: Drop all RLS policies
-- ============================================================================

-- Drop policies for pipeline_projects
DROP POLICY IF EXISTS "allow_authenticated_read_projects" ON pipeline_projects;
DROP POLICY IF EXISTS "allow_service_role_all_projects" ON pipeline_projects;
DROP POLICY IF EXISTS "allow_anon_read_projects" ON pipeline_projects;

-- Drop policies for pipeline_stages
DROP POLICY IF EXISTS "allow_all_read_stages" ON pipeline_stages;
DROP POLICY IF EXISTS "allow_service_role_modify_stages" ON pipeline_stages;

-- Drop policies for pipeline_set_aside_types
DROP POLICY IF EXISTS "allow_all_read_set_aside_types" ON pipeline_set_aside_types;
DROP POLICY IF EXISTS "allow_service_role_modify_set_aside_types" ON pipeline_set_aside_types;

-- ============================================================================
-- STEP 2: Disable RLS on all tables
-- ============================================================================

ALTER TABLE pipeline_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_set_aside_types DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Restore public schema write access (original state)
-- ============================================================================

-- Grant full access back to public role (original insecure state)
GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_projects TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_stages TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_set_aside_types TO public;

-- ============================================================================
-- STEP 4: Drop helper function
-- ============================================================================

DROP FUNCTION IF EXISTS check_rls_enabled();

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

-- Verify RLS is disabled
SELECT 
  c.relname::text AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('pipeline_projects', 'pipeline_stages', 'pipeline_set_aside_types')
ORDER BY c.relname;

-- Verify no policies exist
SELECT COUNT(*) AS remaining_policies
FROM pg_policies
WHERE tablename IN ('pipeline_projects', 'pipeline_stages', 'pipeline_set_aside_types');

COMMIT;

-- ============================================================================
-- Post-Rollback Notes
-- ============================================================================
-- 1. RLS has been disabled on all tables
-- 2. All security policies have been removed
-- 3. Public write access has been restored (INSECURE)
-- 4. Database is now in original insecure state
-- 5. ACTION REQUIRED: Re-apply migration_002_enable_rls.sql as soon as possible
-- 6. SECURITY WARNING: All users can now read/write all data without restrictions