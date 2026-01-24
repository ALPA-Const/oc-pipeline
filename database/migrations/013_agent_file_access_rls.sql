-- ============================================================
-- OC PIPELINE - Agent File Access RLS Policies
-- Migration 013: Row Level Security for Agent File Access
-- ============================================================

-- ============================================================
-- AGENT_FILE_ACCESS RLS POLICIES
-- ============================================================

-- Enable RLS on agent_file_access
ALTER TABLE agent_file_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view file access within their organization
CREATE POLICY agent_file_access_select_policy ON agent_file_access
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
        OR
        org_id IS NULL
    );

-- Policy: Only system and authorized users can insert file access records
CREATE POLICY agent_file_access_insert_policy ON agent_file_access
    FOR INSERT
    WITH CHECK (
        -- Allow if user is in the same org
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
        OR
        -- Allow service role (for agent operations)
        auth.jwt()->>'role' = 'service_role'
    );

-- ============================================================
-- AGENT_FILE_PERMISSIONS RLS POLICIES
-- ============================================================

-- Enable RLS on agent_file_permissions
ALTER TABLE agent_file_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view permissions within their organization
CREATE POLICY agent_file_permissions_select_policy ON agent_file_permissions
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
        OR
        org_id IS NULL
    );

-- Policy: Only org managers can grant permissions
CREATE POLICY agent_file_permissions_insert_policy ON agent_file_permissions
    FOR INSERT
    WITH CHECK (
        -- User must have manage_org permission
        EXISTS (
            SELECT 1
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = auth.uid()
            AND p.name = 'manage_org'
            AND (
                org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
                OR org_id IS NULL
            )
        )
    );

-- Policy: Only org managers can update permissions
CREATE POLICY agent_file_permissions_update_policy ON agent_file_permissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = auth.uid()
            AND p.name = 'manage_org'
            AND (
                org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
                OR org_id IS NULL
            )
        )
    );

-- Policy: Only org managers can delete permissions
CREATE POLICY agent_file_permissions_delete_policy ON agent_file_permissions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = auth.uid()
            AND p.name = 'manage_org'
            AND (
                org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
                OR org_id IS NULL
            )
        )
    );

-- ============================================================
-- AGENT_FILE_OPERATIONS RLS POLICIES
-- ============================================================

-- Enable RLS on agent_file_operations
ALTER TABLE agent_file_operations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view operations within their organization
CREATE POLICY agent_file_operations_select_policy ON agent_file_operations
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
        OR
        org_id IS NULL
    );

-- Policy: Only system and authorized users can insert operations
CREATE POLICY agent_file_operations_insert_policy ON agent_file_operations
    FOR INSERT
    WITH CHECK (
        -- Allow if user is in the same org
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
        OR
        -- Allow service role (for agent operations)
        auth.jwt()->>'role' = 'service_role'
    );

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant permissions for authenticated users to read
GRANT SELECT ON agent_file_access TO authenticated;
GRANT SELECT ON agent_file_permissions TO authenticated;
GRANT SELECT ON agent_file_operations TO authenticated;

-- Grant permissions for service role (agents) to write
GRANT INSERT ON agent_file_access TO service_role;
GRANT INSERT ON agent_file_operations TO service_role;

-- Grant permissions for authenticated users with manage_org to manage permissions
GRANT INSERT, UPDATE, DELETE ON agent_file_permissions TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON POLICY agent_file_access_select_policy ON agent_file_access 
    IS 'Users can view file access records within their organization';

COMMENT ON POLICY agent_file_permissions_select_policy ON agent_file_permissions 
    IS 'Users can view file permissions within their organization';

COMMENT ON POLICY agent_file_permissions_insert_policy ON agent_file_permissions 
    IS 'Only users with manage_org permission can grant file access to agents';

COMMENT ON POLICY agent_file_operations_select_policy ON agent_file_operations 
    IS 'Users can view file operations within their organization';
