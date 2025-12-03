-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 008: Row Level Security (RLS) Policies
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's org_id from JWT
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() ->> 'org_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.role_code = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission
CREATE OR REPLACE FUNCTION auth.has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND p.permission_code = permission_code
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is project member
CREATE OR REPLACE FUNCTION auth.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = p_project_id
        AND user_id = auth.uid()
        AND removed_at IS NULL
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

-- Foundation
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Preconstruction
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuit_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuit_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_loss_analysis ENABLE ROW LEVEL SECURITY;

-- Cost
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contingency_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_value ENABLE ROW LEVEL SECURITY;

-- Schedule
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookahead_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_narratives ENABLE ROW LEVEL SECURITY;

-- Risk
ALTER TABLE risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;

-- Quality
ALTER TABLE quality_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

-- Safety
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolbox_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE osha_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Procurement
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lien_waivers ENABLE ROW LEVEL SECURITY;

-- Communications
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_logs ENABLE ROW LEVEL SECURITY;

-- Staffing
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_forecasts ENABLE ROW LEVEL SECURITY;

-- Closeout
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_builts ENABLE ROW LEVEL SECURITY;
ALTER TABLE om_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_inspections ENABLE ROW LEVEL SECURITY;

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- ATLAS (Service role only for most)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Audit logs (read-only for admins)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - ORGANIZATION LEVEL
-- ============================================================

-- Organizations: Users can only see their own org
CREATE POLICY "org_select" ON organizations
    FOR SELECT USING (id = auth.org_id() OR auth.is_admin());

CREATE POLICY "org_update" ON organizations
    FOR UPDATE USING (id = auth.org_id() AND auth.has_permission('manage_org'));

-- Users: Can see users in same org
CREATE POLICY "users_select" ON users
    FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('manage_users'));

CREATE POLICY "users_update" ON users
    FOR UPDATE USING (
        (id = auth.uid()) OR
        (org_id = auth.org_id() AND auth.has_permission('manage_users'))
    );

-- ============================================================
-- RLS POLICIES - PROJECT LEVEL (Common pattern)
-- ============================================================

-- Projects
CREATE POLICY "projects_select" ON projects
    FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "projects_insert" ON projects
    FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('create'));

CREATE POLICY "projects_update" ON projects
    FOR UPDATE USING (org_id = auth.org_id() AND auth.has_permission('edit'));

CREATE POLICY "projects_delete" ON projects
    FOR DELETE USING (org_id = auth.org_id() AND auth.has_permission('delete'));

-- Project Members
CREATE POLICY "project_members_select" ON project_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE id = project_id AND org_id = auth.org_id())
    );

CREATE POLICY "project_members_insert" ON project_members
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE id = project_id AND org_id = auth.org_id())
        AND auth.has_permission('assign')
    );

-- ============================================================
-- RLS POLICIES - ORG-LEVEL TABLES (Generic pattern)
-- ============================================================

-- Macro for org-level tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'pipeline_stages', 'pursuits', 'estimates', 'bid_packages', 'takeoffs',
        'cost_codes', 'budgets', 'change_orders', 'commitments', 'invoices',
        'schedules', 'milestones', 'risk_categories', 'risks', 'quality_plans',
        'deficiencies', 'inspections', 'punch_lists', 'ncrs',
        'safety_plans', 'incidents', 'safety_observations', 'toolbox_talks', 'jhas',
        'vendors', 'contracts', 'subcontracts', 'purchase_orders',
        'rfis', 'submittals', 'meeting_minutes', 'action_items', 'daily_reports',
        'resources', 'timesheets', 'equipment', 'warranties', 'tasks', 'workflows'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Select policy
        EXECUTE format('
            CREATE POLICY "%s_org_select" ON %I
            FOR SELECT USING (org_id = auth.org_id())',
            tbl, tbl);

        -- Insert policy
        EXECUTE format('
            CREATE POLICY "%s_org_insert" ON %I
            FOR INSERT WITH CHECK (org_id = auth.org_id())',
            tbl, tbl);

        -- Update policy
        EXECUTE format('
            CREATE POLICY "%s_org_update" ON %I
            FOR UPDATE USING (org_id = auth.org_id())',
            tbl, tbl);

        -- Delete policy
        EXECUTE format('
            CREATE POLICY "%s_org_delete" ON %I
            FOR DELETE USING (org_id = auth.org_id() AND auth.has_permission(''delete''))',
            tbl, tbl);
    END LOOP;
END $$;

-- ============================================================
-- RLS POLICIES - CHILD TABLES (via parent)
-- ============================================================

-- Estimate Items (via estimate)
CREATE POLICY "estimate_items_select" ON estimate_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND e.org_id = auth.org_id())
    );

CREATE POLICY "estimate_items_insert" ON estimate_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND e.org_id = auth.org_id())
    );

CREATE POLICY "estimate_items_update" ON estimate_items
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND e.org_id = auth.org_id())
    );

CREATE POLICY "estimate_items_delete" ON estimate_items
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM estimates e WHERE e.id = estimate_id AND e.org_id = auth.org_id())
    );

-- Budget Items (via budget)
CREATE POLICY "budget_items_select" ON budget_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_id AND b.org_id = auth.org_id())
    );

CREATE POLICY "budget_items_modify" ON budget_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_id AND b.org_id = auth.org_id())
    );

-- Schedule Activities (via schedule)
CREATE POLICY "schedule_activities_access" ON schedule_activities
    FOR ALL USING (
        EXISTS (SELECT 1 FROM schedules s WHERE s.id = schedule_id AND s.org_id = auth.org_id())
    );

-- Risk Responses (via risk)
CREATE POLICY "risk_responses_access" ON risk_responses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM risks r WHERE r.id = risk_id AND r.org_id = auth.org_id())
    );

-- Punch Items (via punch list)
CREATE POLICY "punch_items_access" ON punch_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM punch_lists pl WHERE pl.id = punch_list_id AND pl.org_id = auth.org_id())
    );

-- RFI Responses (via RFI)
CREATE POLICY "rfi_responses_access" ON rfi_responses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM rfis r WHERE r.id = rfi_id AND r.org_id = auth.org_id())
    );

-- Submittal Reviews (via submittal)
CREATE POLICY "submittal_reviews_access" ON submittal_reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM submittals s WHERE s.id = submittal_id AND s.org_id = auth.org_id())
    );

-- ============================================================
-- RLS POLICIES - ATLAS SYSTEM (Service role access)
-- ============================================================

-- Agents: Readable by all authenticated users
CREATE POLICY "agents_select" ON agents
    FOR SELECT USING (true);

-- Agent Tasks: Users can see tasks in their org
CREATE POLICY "agent_tasks_select" ON agent_tasks
    FOR SELECT USING (org_id = auth.org_id() OR org_id IS NULL);

-- System Events: Org-scoped
CREATE POLICY "system_events_select" ON system_events
    FOR SELECT USING (org_id = auth.org_id() OR org_id IS NULL);

-- Knowledge Graph: Org-scoped
CREATE POLICY "kg_nodes_select" ON knowledge_graph_nodes
    FOR SELECT USING (org_id = auth.org_id() OR org_id IS NULL);

CREATE POLICY "kg_edges_select" ON knowledge_graph_edges
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM knowledge_graph_nodes n
                WHERE n.id = from_node_id
                AND (n.org_id = auth.org_id() OR n.org_id IS NULL))
    );

-- ============================================================
-- RLS POLICIES - AUDIT LOGS (Read-only for admins)
-- ============================================================

CREATE POLICY "audit_logs_select" ON audit_logs
    FOR SELECT USING (
        (org_id = auth.org_id() AND auth.has_permission('view_audit'))
        OR auth.is_admin()
    );

-- No insert/update/delete policies - handled by triggers

-- ============================================================
-- NOTIFICATIONS (User-specific)
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- SESSIONS (User-specific)
-- ============================================================

CREATE POLICY "sessions_select" ON sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sessions_delete" ON sessions
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TIMESHEETS (User's own or manager)
-- ============================================================

CREATE POLICY "timesheets_select" ON timesheets
    FOR SELECT USING (
        user_id = auth.uid()
        OR (org_id = auth.org_id() AND auth.has_permission('view'))
    );

CREATE POLICY "timesheets_insert" ON timesheets
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND org_id = auth.org_id()
    );

CREATE POLICY "timesheets_update" ON timesheets
    FOR UPDATE USING (
        (user_id = auth.uid() AND status = 'draft')
        OR (org_id = auth.org_id() AND auth.has_permission('approve'))
    );

