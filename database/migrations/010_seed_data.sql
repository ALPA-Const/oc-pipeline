-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 010: Seed Data (Roles, Permissions, Agents)
-- ============================================================

-- ============================================================
-- ROLES (8 roles as per RBAC matrix)
-- ============================================================

INSERT INTO roles (role_code, role_name, description, authority_level, is_system_role) VALUES
('admin', 'Administrator', 'Full system access, manages users and organization settings', 100, true),
('executive', 'Executive', 'C-level access to all projects and financial data', 90, true),
('pm', 'Project Manager', 'Manages assigned projects, full project-level access', 70, true),
('pe', 'Project Engineer', 'Technical project access, limited financial visibility', 60, true),
('super', 'Superintendent', 'Field operations, safety, quality, daily reports', 50, true),
('precon', 'Preconstruction Manager', 'Estimating, bidding, pursuit management', 60, true),
('sub', 'Subcontractor', 'Limited access to assigned scope and documents', 20, false),
('client', 'Client/Owner', 'Read-only access to project status and reports', 10, false)
ON CONFLICT (role_code) DO NOTHING;

-- ============================================================
-- PERMISSIONS (23 permissions)
-- ============================================================

INSERT INTO permissions (permission_code, permission_name, description, category) VALUES
-- Core CRUD
('view', 'View', 'View records', 'core'),
('create', 'Create', 'Create new records', 'core'),
('edit', 'Edit', 'Edit existing records', 'core'),
('delete', 'Delete', 'Delete records', 'core'),

-- Workflow
('approve', 'Approve', 'Approve items requiring approval', 'workflow'),
('assign', 'Assign', 'Assign users to items', 'workflow'),
('close', 'Close', 'Close items', 'workflow'),
('reopen', 'Reopen', 'Reopen closed items', 'workflow'),
('change_status', 'Change Status', 'Change item status', 'workflow'),

-- Archive
('archive', 'Archive', 'Archive items', 'archive'),
('unarchive', 'Unarchive', 'Restore archived items', 'archive'),

-- Financial
('view_budget', 'View Budget', 'View budget information', 'financial'),
('change_budget', 'Change Budget', 'Modify budget', 'financial'),

-- Schedule
('view_schedule', 'View Schedule', 'View schedule information', 'schedule'),
('change_schedule', 'Change Schedule', 'Modify schedule', 'schedule'),

-- Safety/Quality
('view_safety', 'View Safety', 'View safety records', 'safety'),
('view_quality', 'View Quality', 'View quality records', 'quality'),

-- Communication
('comment', 'Comment', 'Add comments', 'communication'),
('export', 'Export', 'Export data and reports', 'communication'),

-- Administration
('manage_users', 'Manage Users', 'Create and manage users', 'admin'),
('manage_roles', 'Manage Roles', 'Assign and manage roles', 'admin'),
('manage_org', 'Manage Organization', 'Manage organization settings', 'admin'),
('view_audit', 'View Audit', 'View audit logs', 'admin')
ON CONFLICT (permission_code) DO NOTHING;

-- ============================================================
-- ROLE-PERMISSION MAPPINGS
-- ============================================================

-- Helper function to create role-permission mapping
DO $$
DECLARE
    admin_role_id UUID;
    exec_role_id UUID;
    pm_role_id UUID;
    pe_role_id UUID;
    super_role_id UUID;
    precon_role_id UUID;
    sub_role_id UUID;
    client_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE role_code = 'admin';
    SELECT id INTO exec_role_id FROM roles WHERE role_code = 'executive';
    SELECT id INTO pm_role_id FROM roles WHERE role_code = 'pm';
    SELECT id INTO pe_role_id FROM roles WHERE role_code = 'pe';
    SELECT id INTO super_role_id FROM roles WHERE role_code = 'super';
    SELECT id INTO precon_role_id FROM roles WHERE role_code = 'precon';
    SELECT id INTO sub_role_id FROM roles WHERE role_code = 'sub';
    SELECT id INTO client_role_id FROM roles WHERE role_code = 'client';

    -- Admin: All permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;

    -- Executive: All except manage_users, manage_roles, manage_org
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT exec_role_id, id FROM permissions
    WHERE permission_code NOT IN ('manage_users', 'manage_roles', 'manage_org')
    ON CONFLICT DO NOTHING;

    -- Project Manager: Project-level access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT pm_role_id, id FROM permissions
    WHERE permission_code IN (
        'view', 'create', 'edit', 'approve', 'assign', 'close', 'reopen',
        'change_status', 'view_budget', 'change_budget', 'view_schedule',
        'change_schedule', 'view_safety', 'view_quality', 'comment', 'export'
    )
    ON CONFLICT DO NOTHING;

    -- Project Engineer: Technical access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT pe_role_id, id FROM permissions
    WHERE permission_code IN (
        'view', 'create', 'edit', 'change_status', 'view_schedule',
        'change_schedule', 'view_quality', 'comment'
    )
    ON CONFLICT DO NOTHING;

    -- Superintendent: Field access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_role_id, id FROM permissions
    WHERE permission_code IN (
        'view', 'create', 'edit', 'change_status', 'view_schedule',
        'view_safety', 'view_quality', 'comment'
    )
    ON CONFLICT DO NOTHING;

    -- Preconstruction Manager: Bidding access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT precon_role_id, id FROM permissions
    WHERE permission_code IN (
        'view', 'create', 'edit', 'approve', 'assign', 'change_status',
        'view_budget', 'change_budget', 'comment', 'export'
    )
    ON CONFLICT DO NOTHING;

    -- Subcontractor: Limited access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT sub_role_id, id FROM permissions
    WHERE permission_code IN ('view', 'create', 'comment')
    ON CONFLICT DO NOTHING;

    -- Client: Read-only
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT client_role_id, id FROM permissions
    WHERE permission_code IN ('view', 'comment')
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- ATLAS AGENTS (17 agents)
-- ============================================================

INSERT INTO agents (agent_code, name, description, module, agent_type, status, version, capabilities) VALUES
-- Master Orchestrator
('atlas-001', 'ATLAS Master', 'Master orchestrator agent - routes requests, coordinates specialists', NULL, 'master', 'dormant', '1.0.0',
 '["orchestrate", "route", "coordinate", "monitor", "escalate"]'::jsonb),

-- Module Specialists (16)
('precon-001', 'Preconstruction Specialist', 'Handles bidding, estimates, pursuits, pipeline analytics', 'preconstruction', 'specialist', 'dormant', '1.0.0',
 '["analyze_bids", "generate_estimates", "track_pursuits", "calculate_win_rates", "forecast_pipeline"]'::jsonb),

('cost-001', 'Cost Specialist', 'Manages budgets, change orders, forecasts, earned value', 'cost', 'specialist', 'dormant', '1.0.0',
 '["analyze_budget", "forecast_costs", "calculate_ev", "detect_variances", "recommend_actions"]'::jsonb),

('schedule-001', 'Schedule Specialist', 'Handles schedules, critical path, lookahead, delays', 'schedule', 'specialist', 'dormant', '1.0.0',
 '["analyze_schedule", "calculate_critical_path", "detect_delays", "forecast_completion", "generate_lookahead"]'::jsonb),

('risk-001', 'Risk Specialist', 'Manages risk register, assessments, mitigation tracking', 'risk', 'specialist', 'dormant', '1.0.0',
 '["identify_risks", "assess_probability", "recommend_mitigation", "track_responses", "generate_matrix"]'::jsonb),

('quality-001', 'Quality Specialist', 'Handles deficiencies, inspections, NCRs, punch lists', 'quality', 'specialist', 'dormant', '1.0.0',
 '["track_deficiencies", "analyze_trends", "prioritize_punch", "generate_reports", "predict_issues"]'::jsonb),

('safety-001', 'Safety Specialist', 'Manages incidents, observations, metrics, compliance', 'safety', 'specialist', 'dormant', '1.0.0',
 '["track_incidents", "calculate_trir", "analyze_trends", "recommend_actions", "monitor_compliance"]'::jsonb),

('procurement-001', 'Procurement Specialist', 'Handles vendors, contracts, POs, compliance', 'procurement', 'specialist', 'dormant', '1.0.0',
 '["manage_vendors", "track_contracts", "analyze_spend", "monitor_compliance", "recommend_vendors"]'::jsonb),

('comms-001', 'Communications Specialist', 'Manages RFIs, submittals, daily reports, meetings', 'communications', 'specialist', 'dormant', '1.0.0',
 '["track_rfis", "manage_submittals", "analyze_response_times", "generate_reports", "identify_bottlenecks"]'::jsonb),

('staffing-001', 'Staffing Specialist', 'Handles resources, assignments, timesheets, utilization', 'staffing', 'specialist', 'dormant', '1.0.0',
 '["forecast_needs", "optimize_assignments", "track_utilization", "analyze_productivity", "recommend_staffing"]'::jsonb),

('closeout-001', 'Closeout Specialist', 'Manages warranties, as-builts, training, handover', 'closeout', 'specialist', 'dormant', '1.0.0',
 '["track_closeout", "monitor_warranties", "generate_checklists", "coordinate_training", "manage_handover"]'::jsonb),

('admin-001', 'Admin Specialist', 'Handles users, roles, permissions, audit logs', 'administration', 'specialist', 'dormant', '1.0.0',
 '["manage_users", "analyze_access", "monitor_audit", "recommend_permissions", "detect_anomalies"]'::jsonb),

('portfolio-001', 'Portfolio Specialist', 'Cross-project analytics, KPIs, executive dashboards', 'portfolio', 'specialist', 'dormant', '1.0.0',
 '["aggregate_metrics", "generate_dashboards", "identify_trends", "benchmark_performance", "forecast_portfolio"]'::jsonb),

('docs-001', 'Documents Specialist', 'Manages files, folders, versions, search', 'documents', 'specialist', 'dormant', '1.0.0',
 '["organize_documents", "extract_content", "search_semantic", "version_control", "recommend_tags"]'::jsonb),

('estimator-001', 'AI Estimator', 'PDF extraction, quantity takeoffs, cost modeling', 'estimator', 'specialist', 'dormant', '1.0.0',
 '["extract_pdf", "calculate_quantities", "model_costs", "compare_estimates", "identify_gaps"]'::jsonb),

('finance-001', 'Finance Specialist', 'Detailed financials, cash flow, forecasting', 'finance', 'specialist', 'dormant', '1.0.0',
 '["analyze_cashflow", "forecast_financials", "track_billing", "monitor_receivables", "generate_reports"]'::jsonb),

('tasks-001', 'Tasks Specialist', 'Cross-module task management, workflows, automation', 'tasks', 'specialist', 'dormant', '1.0.0',
 '["manage_tasks", "automate_workflows", "track_dependencies", "optimize_assignments", "predict_delays"]'::jsonb)

ON CONFLICT (agent_code) DO NOTHING;

-- ============================================================
-- MODULE OWNERSHIP
-- ============================================================

INSERT INTO module_ownership (module, agent_id, capabilities, priority)
SELECT
    m.module,
    a.id,
    a.capabilities,
    0
FROM (VALUES
    ('preconstruction', 'precon-001'),
    ('cost', 'cost-001'),
    ('schedule', 'schedule-001'),
    ('risk', 'risk-001'),
    ('quality', 'quality-001'),
    ('safety', 'safety-001'),
    ('procurement', 'procurement-001'),
    ('communications', 'comms-001'),
    ('staffing', 'staffing-001'),
    ('closeout', 'closeout-001'),
    ('administration', 'admin-001'),
    ('portfolio', 'portfolio-001'),
    ('documents', 'docs-001'),
    ('estimator', 'estimator-001'),
    ('finance', 'finance-001'),
    ('tasks', 'tasks-001')
) AS m(module, agent_code)
JOIN agents a ON a.agent_code = m.agent_code
ON CONFLICT (module) DO NOTHING;

-- ============================================================
-- SAFETY BOUNDARIES (Global limits)
-- ============================================================

INSERT INTO safety_boundaries (boundary_type, config, scope, is_active) VALUES
-- Rate limits
('rate_limit', '{"requests_per_minute": 60, "requests_per_hour": 1000}'::jsonb, 'global', true),

-- Cost thresholds
('cost_threshold', '{"daily_limit_usd": 100, "monthly_limit_usd": 2000}'::jsonb, 'global', true),

-- Approval required for sensitive operations
('approval_required', '{"operations": ["delete_project", "modify_budget", "change_contract"]}'::jsonb, 'global', true),

-- Restricted tables (agents cannot modify directly)
('restricted_tables', '{"tables": ["audit_logs", "users", "roles", "permissions"]}'::jsonb, 'global', true),

-- Restricted operations
('restricted_operations', '{"operations": ["DROP", "TRUNCATE", "ALTER"]}'::jsonb, 'global', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PIPELINE STAGES (Default stages)
-- ============================================================

-- Note: org_id will be set when organization is created
-- This is a template that can be copied for new organizations

CREATE TABLE IF NOT EXISTS pipeline_stage_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    win_probability DECIMAL(5, 2) DEFAULT 0,
    color VARCHAR(20),
    is_terminal BOOLEAN DEFAULT false
);

INSERT INTO pipeline_stage_templates (name, code, order_index, win_probability, color, is_terminal) VALUES
-- Opportunity Phase
('Lead', 'lead', 1, 5.00, '#94a3b8', false),
('Qualified', 'qualified', 2, 15.00, '#60a5fa', false),
('Proposal', 'proposal', 3, 30.00, '#a78bfa', false),
('Negotiation', 'negotiation', 4, 60.00, '#fbbf24', false),
('Award Decision', 'award_decision', 5, 80.00, '#fb923c', false),
('Won', 'won', 6, 100.00, '#22c55e', true),
('Lost', 'lost', 7, 0.00, '#ef4444', true),
('No Bid', 'no_bid', 8, 0.00, '#6b7280', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- EVENT SUBSCRIPTIONS (Agent event handlers)
-- ============================================================

INSERT INTO event_subscriptions (agent_id, event_type, event_source, filter_conditions, handler_type, handler_config, is_active, priority)
SELECT
    a.id,
    e.event_type,
    e.event_source,
    '{}'::jsonb,
    'task',
    jsonb_build_object('task_type', e.task_type),
    true,
    0
FROM agents a
CROSS JOIN (VALUES
    ('precon-001', 'pursuits.insert', 'database', 'analyze'),
    ('precon-001', 'pursuits.update', 'database', 'analyze'),
    ('cost-001', 'budgets.update', 'database', 'analyze'),
    ('cost-001', 'change_orders.insert', 'database', 'analyze'),
    ('schedule-001', 'schedule_activities.update', 'database', 'analyze'),
    ('risk-001', 'risks.insert', 'database', 'analyze'),
    ('risk-001', 'risks.update', 'database', 'analyze'),
    ('quality-001', 'deficiencies.insert', 'database', 'analyze'),
    ('safety-001', 'incidents.insert', 'database', 'analyze'),
    ('comms-001', 'rfis.insert', 'database', 'analyze'),
    ('comms-001', 'submittals.insert', 'database', 'analyze'),
    ('tasks-001', 'tasks.insert', 'database', 'analyze')
) AS e(agent_code, event_type, event_source, task_type)
WHERE a.agent_code = e.agent_code
ON CONFLICT DO NOTHING;

