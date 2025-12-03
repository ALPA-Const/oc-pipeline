-- Migration 002: Enable Row-Level Security (RLS)
-- Purpose: Implement least-privilege access control for all tables
-- Author: ALPA Construction DevOps Team
-- Date: 2025-01-XX
-- Rollback: See rollback_002_disable_rls.sql

BEGIN;

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

ALTER TABLE pipeline_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_set_aside_types ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies for pipeline_projects
-- ============================================================================

-- Policy: Allow authenticated users to read all projects
-- Rationale: Dashboard requires visibility across all projects for analytics
CREATE POLICY "allow_authenticated_read_projects"
ON pipeline_projects
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow service role full access for admin operations
CREATE POLICY "allow_service_role_all_projects"
ON pipeline_projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow anon users to read projects (for public dashboards)
-- Note: Remove this policy if public access is not required
CREATE POLICY "allow_anon_read_projects"
ON pipeline_projects
FOR SELECT
TO anon
USING (true);

-- Future: Add user-specific policies when multi-tenancy is implemented
-- Example for tenant isolation (commented out for now):
-- CREATE POLICY "users_read_own_tenant_projects"
-- ON pipeline_projects
-- FOR SELECT
-- TO authenticated
-- USING (tenant_id = auth.uid()::text OR tenant_id IN (
--   SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
-- ));

-- ============================================================================
-- STEP 3: Create RLS Policies for pipeline_stages (Reference Data)
-- ============================================================================

-- Policy: Allow all users to read stages (reference data)
CREATE POLICY "allow_all_read_stages"
ON pipeline_stages
FOR SELECT
TO public
USING (true);

-- Policy: Only service role can modify stages
CREATE POLICY "allow_service_role_modify_stages"
ON pipeline_stages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: Create RLS Policies for pipeline_set_aside_types (Reference Data)
-- ============================================================================

-- Policy: Allow all users to read set-aside types (reference data)
CREATE POLICY "allow_all_read_set_aside_types"
ON pipeline_set_aside_types
FOR SELECT
TO public
USING (true);

-- Policy: Only service role can modify set-aside types
CREATE POLICY "allow_service_role_modify_set_aside_types"
ON pipeline_set_aside_types
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 5: Remove public schema write access
-- ============================================================================

-- Revoke INSERT, UPDATE, DELETE from public role on all tables
REVOKE INSERT, UPDATE, DELETE ON pipeline_projects FROM public;
REVOKE INSERT, UPDATE, DELETE ON pipeline_stages FROM public;
REVOKE INSERT, UPDATE, DELETE ON pipeline_set_aside_types FROM public;

-- Grant SELECT only to public for reference tables
GRANT SELECT ON pipeline_stages TO public;
GRANT SELECT ON pipeline_set_aside_types TO public;

-- ============================================================================
-- STEP 6: Create function to check RLS is enabled
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rls_enabled()
RETURNS TABLE(table_name text, rls_enabled boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::text,
    c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN ('pipeline_projects', 'pipeline_stages', 'pipeline_set_aside_types')
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Verification queries
-- ============================================================================

-- Verify RLS is enabled
SELECT * FROM check_rls_enabled();

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('pipeline_projects', 'pipeline_stages', 'pipeline_set_aside_types')
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- Post-Migration Notes
-- ============================================================================
-- 1. RLS is now enabled on all tables
-- 2. Authenticated users can read all projects (current requirement)
-- 3. Service role has full access for admin operations
-- 4. Reference tables (stages, set-aside types) are read-only for regular users
-- 5. Public write access has been revoked
-- 6. Future: Implement tenant-specific policies when multi-tenancy is added
-- 7. Test with: SELECT * FROM pipeline_projects; (should work for authenticated users)
-- 8. Test with: INSERT INTO pipeline_projects (...) VALUES (...); (should fail for non-service-role)