-- RLS Policies for ALPA Construction CRM
-- Enforces company isolation and role-based visibility
-- All Tier-1 tables must have RLS enabled

-- Enable RLS on all Tier-1 tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_defects ENABLE ROW LEVEL SECURITY;

-- Force RLS (even for table owners)
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE action_items FORCE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE schedules FORCE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents FORCE ROW LEVEL SECURITY;
ALTER TABLE quality_defects FORCE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION auth.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is assigned to project
CREATE OR REPLACE FUNCTION auth.is_user_assigned_to_project(project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      p.project_manager_id = auth.uid()
      OR p.superintendent_id = auth.uid()
      OR p.estimator_id = auth.uid()
      OR auth.uid() = ANY(p.assigned_users)
    )
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- PROJECTS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation (all roles see only their org's projects)
CREATE POLICY projects_company_isolation ON projects
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: Subcontractors see only assigned projects
CREATE POLICY projects_sub_visibility ON projects
  FOR SELECT
  USING (
    auth.get_user_role() = 'sub'
    AND auth.is_user_assigned_to_project(id)
  );

-- Policy: Clients see only assigned projects
CREATE POLICY projects_client_visibility ON projects
  FOR SELECT
  USING (
    auth.get_user_role() = 'client'
    AND auth.is_user_assigned_to_project(id)
  );

-- Policy: Admin can do everything within their org
CREATE POLICY projects_admin_all ON projects
  FOR ALL
  USING (
    auth.get_user_role() = 'admin'
    AND org_id = auth.get_user_org_id()
  );

-- Policy: PM can create/edit/delete projects
CREATE POLICY projects_pm_write ON projects
  FOR INSERT
  WITH CHECK (
    auth.get_user_role() IN ('pm', 'admin')
    AND org_id = auth.get_user_org_id()
  );

CREATE POLICY projects_pm_update ON projects
  FOR UPDATE
  USING (
    auth.get_user_role() IN ('pm', 'admin')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- ACTION_ITEMS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY action_items_company_isolation ON action_items
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: Users see action items for assigned projects
CREATE POLICY action_items_assigned_visibility ON action_items
  FOR SELECT
  USING (
    auth.get_user_role() IN ('sub', 'client')
    AND auth.is_user_assigned_to_project(project_id)
  );

-- Policy: PM/PE/Super can create/edit action items
CREATE POLICY action_items_write ON action_items
  FOR ALL
  USING (
    auth.get_user_role() IN ('admin', 'pm', 'pe', 'super')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- EVENTS TABLE RLS POLICIES (Audit Trail)
-- ============================================================================

-- Policy: Company isolation (read-only for audit)
CREATE POLICY events_company_isolation ON events
  FOR SELECT
  USING (org_id = auth.get_user_org_id());

-- Policy: Only system can insert events
CREATE POLICY events_system_insert ON events
  FOR INSERT
  WITH CHECK (auth.get_user_role() = 'admin');

-- Policy: No updates or deletes (immutable)
CREATE POLICY events_no_update ON events
  FOR UPDATE
  USING (false);

CREATE POLICY events_no_delete ON events
  FOR DELETE
  USING (false);

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users see only users in their org
CREATE POLICY users_company_isolation ON users
  FOR SELECT
  USING (org_id = auth.get_user_org_id());

-- Policy: Admin can manage users
CREATE POLICY users_admin_manage ON users
  FOR ALL
  USING (
    auth.get_user_role() = 'admin'
    AND org_id = auth.get_user_org_id()
  );

-- Policy: Users can update their own profile
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================================================
-- DOCUMENTS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY documents_company_isolation ON documents
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: Users see documents for assigned projects
CREATE POLICY documents_assigned_visibility ON documents
  FOR SELECT
  USING (
    auth.get_user_role() IN ('sub', 'client')
    AND auth.is_user_assigned_to_project(project_id)
  );

-- ============================================================================
-- BUDGETS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY budgets_company_isolation ON budgets
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: Clients cannot see budgets
CREATE POLICY budgets_no_client_access ON budgets
  FOR SELECT
  USING (auth.get_user_role() != 'client');

-- Policy: Only PM/Admin can modify budgets
CREATE POLICY budgets_pm_admin_write ON budgets
  FOR ALL
  USING (
    auth.get_user_role() IN ('admin', 'pm')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- SCHEDULES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY schedules_company_isolation ON schedules
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: All roles can view schedules
CREATE POLICY schedules_all_view ON schedules
  FOR SELECT
  USING (org_id = auth.get_user_org_id());

-- Policy: Only PM/Super can modify schedules
CREATE POLICY schedules_pm_super_write ON schedules
  FOR ALL
  USING (
    auth.get_user_role() IN ('admin', 'pm', 'super')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- SAFETY_INCIDENTS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY safety_incidents_company_isolation ON safety_incidents
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: All roles can view safety incidents
CREATE POLICY safety_incidents_all_view ON safety_incidents
  FOR SELECT
  USING (org_id = auth.get_user_org_id());

-- Policy: PM/Super can create/edit safety incidents
CREATE POLICY safety_incidents_write ON safety_incidents
  FOR ALL
  USING (
    auth.get_user_role() IN ('admin', 'pm', 'super')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- QUALITY_DEFECTS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Company isolation
CREATE POLICY quality_defects_company_isolation ON quality_defects
  FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Policy: All roles can view quality defects
CREATE POLICY quality_defects_all_view ON quality_defects
  FOR SELECT
  USING (org_id = auth.get_user_org_id());

-- Policy: PM/PE/Super can create/edit quality defects
CREATE POLICY quality_defects_write ON quality_defects
  FOR ALL
  USING (
    auth.get_user_role() IN ('admin', 'pm', 'pe', 'super')
    AND org_id = auth.get_user_org_id()
  );

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Index org_id on all tables for fast RLS filtering
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_action_items_org_id ON action_items(org_id);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_budgets_org_id ON budgets(org_id);
CREATE INDEX IF NOT EXISTS idx_schedules_org_id ON schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_org_id ON safety_incidents(org_id);
CREATE INDEX IF NOT EXISTS idx_quality_defects_org_id ON quality_defects(org_id);

-- Index project_id for assigned project lookups
CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_project_id ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_project_id ON safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_defects_project_id ON quality_defects(project_id);

-- Composite index for events (high-volume table)
CREATE INDEX IF NOT EXISTS idx_events_org_timestamp ON events(org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_project_timestamp ON events(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor_timestamp ON events(actor_id, timestamp DESC);

COMMENT ON POLICY projects_company_isolation ON projects IS 'Enforce company isolation by org_id';
COMMENT ON POLICY projects_sub_visibility ON projects IS 'Subcontractors see only assigned projects';
COMMENT ON POLICY projects_client_visibility ON projects IS 'Clients see only assigned projects';
COMMENT ON POLICY events_no_update ON events IS 'Events are immutable (audit trail)';
COMMENT ON POLICY events_no_delete ON events IS 'Events cannot be deleted (audit trail)';