-- ============================================================
-- OC PIPELINE - DUAL-SCOPE RBAC SYSTEM
-- Migration 013: Complete RBAC with Org & Project Scopes
-- ============================================================
-- Tables: org_roles, org_user_roles, project_roles, project_members,
--         approval_thresholds, departments
-- ============================================================

-- ============================================================
-- 1. DEPARTMENTS (Referenced by users)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(org_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);

-- ============================================================
-- 2. ORG_ROLES (Organization-level roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    scope VARCHAR(20) DEFAULT 'org' CHECK (scope IN ('org', 'project')),
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    authority_level INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_org_roles_org ON org_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_scope ON org_roles(scope);
CREATE INDEX IF NOT EXISTS idx_org_roles_system ON org_roles(is_system_role);

-- ============================================================
-- 3. ORG_USER_ROLES (User-to-Org role assignments)
-- ============================================================
CREATE TABLE IF NOT EXISTS org_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES org_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(org_id, user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_org_user_roles_org ON org_user_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_org_user_roles_user ON org_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_org_user_roles_role ON org_user_roles(role_id);

-- ============================================================
-- 4. PROJECT_ROLES (Project-level roles - templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, project_id, code)
);

CREATE INDEX IF NOT EXISTS idx_project_roles_org ON project_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON project_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_template ON project_roles(is_template);

-- ============================================================
-- 5. PROJECT_MEMBER_ROLES (Enhanced project_members with role_id)
-- ============================================================
ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES project_roles(id);

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
CHECK (status IN ('invited', 'active', 'inactive', 'removed'));

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(100);

ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- ============================================================
-- 6. APPROVAL_THRESHOLDS (Financial approval rules)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    description TEXT,
    min_amount DECIMAL(15, 2) DEFAULT 0,
    max_amount DECIMAL(15, 2),
    required_role_id UUID REFERENCES org_roles(id),
    required_role_code VARCHAR(50),
    requires_multiple_approvers BOOLEAN DEFAULT false,
    approver_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, resource_type, min_amount)
);

CREATE INDEX IF NOT EXISTS idx_approval_thresholds_org ON approval_thresholds(org_id);
CREATE INDEX IF NOT EXISTS idx_approval_thresholds_resource ON approval_thresholds(resource_type);

-- ============================================================
-- 7. ROLE_AUDIT_LOG (Track role changes)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    target_user_id UUID REFERENCES users(id),
    target_role_id UUID,
    target_project_id UUID REFERENCES projects(id),
    performed_by UUID NOT NULL REFERENCES users(id),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_log_org ON role_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_target_user ON role_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_performed_by ON role_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created_at ON role_audit_log(created_at);

-- ============================================================
-- 8. ORG_INVITATIONS (For inviting users to org)
-- ============================================================
CREATE TABLE IF NOT EXISTS org_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES org_roles(id),
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(100) UNIQUE NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON org_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON org_invitations(status);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY departments_org_isolation ON departments
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY org_roles_org_isolation ON org_roles
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY org_user_roles_org_isolation ON org_user_roles
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY project_roles_org_isolation ON project_roles
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY approval_thresholds_org_isolation ON approval_thresholds
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY role_audit_log_org_isolation ON role_audit_log
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY org_invitations_org_isolation ON org_invitations
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_roles_updated_at
    BEFORE UPDATE ON org_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_roles_updated_at
    BEFORE UPDATE ON project_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_thresholds_updated_at
    BEFORE UPDATE ON approval_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_invitations_updated_at
    BEFORE UPDATE ON org_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DEFAULT SYSTEM ROLES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION seed_org_system_roles(p_org_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO org_roles (org_id, code, name, description, scope, permissions, is_system_role, authority_level)
    VALUES (
        p_org_id, 'OrgOwner', 'Organization Owner',
        'Full control of organization and all settings', 'org',
        '{"org": "*", "project": "*", "project_docs": "*", "project_rfis": "*", "project_submittals": "*", "project_change_orders": "*", "project_estimates": "*", "project_schedule": "*", "project_logs": "*", "project_financials": "*", "project_bids": "*", "project_tasks": "*", "project_closeout": "*", "project_safety": "*", "project_ai": "*", "org_audit": "*", "approval_thresholds": "*"}',
        true, 100
    ) ON CONFLICT (org_id, code) DO NOTHING;

    INSERT INTO org_roles (org_id, code, name, description, scope, permissions, is_system_role, authority_level)
    VALUES (
        p_org_id, 'OrgAdmin', 'Organization Admin',
        'Administer org, users, cost library, templates, projects', 'org',
        '{"org": ["read_org_profile", "update_org_profile", "manage_org_settings", "manage_org_users", "view_org_users", "manage_org_roles", "manage_org_departments", "view_org_departments", "manage_org_cost_codes", "view_org_cost_codes", "manage_org_templates", "view_org_templates", "manage_org_integrations", "view_org_integrations", "view_org_subscription", "view_org_billing", "view_org_analytics"], "project": ["create_project", "archive_project", "view_project", "manage_project_settings", "manage_project_team"], "org_audit": ["view_audit_logs", "export_audit_logs"], "approval_thresholds": ["configure_thresholds", "view_thresholds"]}',
        true, 90
    ) ON CONFLICT (org_id, code) DO NOTHING;

    INSERT INTO org_roles (org_id, code, name, description, scope, permissions, is_system_role, authority_level)
    VALUES (
        p_org_id, 'OrgPowerUser', 'Organization Power User',
        'Cross-project power user with read plus analytics', 'org',
        '{"org": ["read_org_profile", "view_org_users", "view_org_departments", "view_org_cost_codes", "view_org_templates", "view_org_integrations", "view_org_analytics"], "project": ["view_project"], "org_audit": ["view_audit_logs"]}',
        true, 70
    ) ON CONFLICT (org_id, code) DO NOTHING;

    INSERT INTO org_roles (org_id, code, name, description, scope, permissions, is_system_role, authority_level)
    VALUES (
        p_org_id, 'OrgUser', 'Organization User',
        'Basic company member', 'org',
        '{"org": ["read_org_profile"], "project": ["view_project"]}',
        true, 50
    ) ON CONFLICT (org_id, code) DO NOTHING;

    INSERT INTO org_roles (org_id, code, name, description, scope, permissions, is_system_role, authority_level)
    VALUES (
        p_org_id, 'OrgViewer', 'Organization Viewer',
        'Read-only org dashboards', 'org',
        '{"org": ["read_org_profile", "view_org_analytics"]}',
        true, 10
    ) ON CONFLICT (org_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED PROJECT ROLE TEMPLATES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION seed_project_role_templates(p_org_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO project_roles (org_id, project_id, code, name, description, permissions, is_system_role, is_template)
    VALUES (
        p_org_id, NULL, 'ProjectAdmin', 'Project Admin',
        'Full control over a single project',
        '{"project": ["view_project", "manage_project_settings", "manage_project_team"], "project_docs": "*", "project_rfis": "*", "project_submittals": "*", "project_change_orders": "*", "project_estimates": "*", "project_schedule": "*", "project_logs": "*", "project_financials": "*", "project_bids": "*", "project_tasks": "*", "project_closeout": "*", "project_safety": "*", "project_ai": "*"}',
        true, true
    ) ON CONFLICT (org_id, project_id, code) DO NOTHING;

    INSERT INTO project_roles (org_id, project_id, code, name, description, permissions, is_system_role, is_template)
    VALUES (
        p_org_id, NULL, 'ProjectMember', 'Project Member',
        'Internal team member (PM, PE, Superintendent, Estimator)',
        '{"project": ["view_project"], "project_docs": ["view", "upload", "update"], "project_rfis": ["view", "create", "respond", "update"], "project_submittals": ["view", "create", "review", "update"], "project_change_orders": ["view", "create", "price"], "project_estimates": ["view_summary", "create", "update"], "project_schedule": ["view", "create", "update", "comment"], "project_logs": ["view", "create", "update"], "project_bids": ["view", "invite_subs", "upload_sub_bid"], "project_tasks": ["view", "create", "update", "close"], "project_closeout": ["view", "create_punchlist", "update_punchlist", "close_item"], "project_safety": ["view", "create_incident", "create_inspection", "update"], "project_ai": ["run_ai_analysis", "view_ai_insights"]}',
        true, true
    ) ON CONFLICT (org_id, project_id, code) DO NOTHING;

    INSERT INTO project_roles (org_id, project_id, code, name, description, permissions, is_system_role, is_template)
    VALUES (
        p_org_id, NULL, 'Subcontractor', 'Subcontractor',
        'External trade partner restricted to their participation',
        '{"project": ["view_project"], "project_docs": ["view", "upload"], "project_bids": ["view", "upload_sub_bid"], "project_rfis": ["view", "respond"], "project_submittals": ["view", "create"], "project_tasks": ["view", "update"], "project_closeout": ["view", "update_punchlist"]}',
        true, true
    ) ON CONFLICT (org_id, project_id, code) DO NOTHING;

    INSERT INTO project_roles (org_id, project_id, code, name, description, permissions, is_system_role, is_template)
    VALUES (
        p_org_id, NULL, 'Client', 'Client',
        'Owner/COR/KO/Owner Rep with controlled visibility',
        '{"project": ["view_project"], "project_docs": ["view"], "project_rfis": ["view", "respond"], "project_submittals": ["view", "review"], "project_change_orders": ["view", "negotiate"], "project_schedule": ["view"], "project_logs": ["view"], "project_tasks": ["view"], "project_closeout": ["view", "approve_final"], "project_ai": ["view_ai_insights"]}',
        true, true
    ) ON CONFLICT (org_id, project_id, code) DO NOTHING;

    INSERT INTO project_roles (org_id, project_id, code, name, description, permissions, is_system_role, is_template)
    VALUES (
        p_org_id, NULL, 'Consultant', 'Consultant',
        'Third-party consultants (scheduler, commissioning, cost)',
        '{"project": ["view_project"], "project_docs": ["view", "upload"], "project_schedule": ["view", "create", "update", "comment"], "project_logs": ["view", "create", "update"], "project_tasks": ["view", "create", "update"], "project_ai": ["run_ai_analysis", "view_ai_insights"]}',
        true, true
    ) ON CONFLICT (org_id, project_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DEFAULT DEPARTMENTS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION seed_org_departments(p_org_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO departments (org_id, code, name, description) VALUES
        (p_org_id, 'PRECON', 'Preconstruction', 'Estimating, bidding, and proposal development'),
        (p_org_id, 'OPS', 'Operations', 'Project execution and field operations'),
        (p_org_id, 'DESIGN', 'Design', 'Design-build and engineering'),
        (p_org_id, 'SAFETY', 'Safety & Quality', 'Safety management and quality control'),
        (p_org_id, 'FIN', 'Finance & Accounting', 'Financial management and accounting'),
        (p_org_id, 'IT', 'IT & Systems', 'Information technology and systems'),
        (p_org_id, 'BD', 'Business Development', 'Business development and client relations')
    ON CONFLICT (org_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed for existing organizations
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        PERFORM seed_org_system_roles(org_record.id);
        PERFORM seed_project_role_templates(org_record.id);
        PERFORM seed_org_departments(org_record.id);
    END LOOP;
END;
$$;

-- Trigger for new organizations
CREATE OR REPLACE FUNCTION on_organization_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_org_system_roles(NEW.id);
    PERFORM seed_project_role_templates(NEW.id);
    PERFORM seed_org_departments(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organization_created ON organizations;
CREATE TRIGGER trigger_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION on_organization_created();

-- ============================================================
-- HELPER FUNCTIONS FOR PERMISSION CHECKING
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org_permissions(p_user_id UUID, p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    permissions JSONB := '{}'::JSONB;
    role_record RECORD;
BEGIN
    FOR role_record IN
        SELECT r.permissions
        FROM org_user_roles ur
        JOIN org_roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id AND ur.org_id = p_org_id
        AND r.deleted_at IS NULL
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LOOP
        permissions := permissions || role_record.permissions;
    END LOOP;
    RETURN permissions;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_project_permissions(p_user_id UUID, p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
    permissions JSONB := '{}'::JSONB;
    role_record RECORD;
BEGIN
    FOR role_record IN
        SELECT r.permissions
        FROM project_members pm
        JOIN project_roles r ON pm.role_id = r.id
        WHERE pm.user_id = p_user_id AND pm.project_id = p_project_id
        AND pm.status = 'active' AND r.deleted_at IS NULL
    LOOP
        permissions := permissions || role_record.permissions;
    END LOOP;
    RETURN permissions;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_has_org_permission(
    p_user_id UUID, p_org_id UUID, p_resource VARCHAR, p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    permissions JSONB;
    resource_perms JSONB;
BEGIN
    permissions := get_user_org_permissions(p_user_id, p_org_id);
    resource_perms := permissions->p_resource;
    IF resource_perms IS NULL THEN RETURN FALSE; END IF;
    IF resource_perms = '"*"'::JSONB OR resource_perms::TEXT = '"*"' THEN RETURN TRUE; END IF;
    IF resource_perms ? p_action THEN RETURN TRUE; END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_has_project_permission(
    p_user_id UUID, p_project_id UUID, p_resource VARCHAR, p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    permissions JSONB;
    resource_perms JSONB;
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id FROM projects WHERE id = p_project_id;
    IF user_has_org_permission(p_user_id, v_org_id, p_resource, p_action) THEN RETURN TRUE; END IF;
    permissions := get_user_project_permissions(p_user_id, p_project_id);
    resource_perms := permissions->p_resource;
    IF resource_perms IS NULL THEN RETURN FALSE; END IF;
    IF resource_perms = '"*"'::JSONB OR resource_perms::TEXT = '"*"' THEN RETURN TRUE; END IF;
    IF resource_perms ? p_action THEN RETURN TRUE; END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE departments IS 'Organization departments for user categorization';
COMMENT ON TABLE org_roles IS 'Organization-level roles with JSONB permissions';
COMMENT ON TABLE org_user_roles IS 'Assignment of org-level roles to users';
COMMENT ON TABLE project_roles IS 'Project-level roles with JSONB permissions (can be templates)';
COMMENT ON TABLE approval_thresholds IS 'Financial approval thresholds by amount and role';
COMMENT ON TABLE role_audit_log IS 'Audit trail for all role-related changes';
COMMENT ON TABLE org_invitations IS 'Pending invitations to join an organization';

