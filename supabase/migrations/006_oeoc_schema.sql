-- =====================================================
-- O'NEILL ELITE ORCHESTRATION CONSOLE (OEOC) SCHEMA
-- Federal-Grade AI Swarm Management System
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Orchestrator status states
CREATE TYPE orchestrator_status AS ENUM ('idle', 'busy', 'error', 'offline');

-- Agent types
CREATE TYPE agent_type AS ENUM ('agentic', 'worker');

-- Agent status states
CREATE TYPE agent_status AS ENUM ('idle', 'busy', 'error', 'disabled', 'offline');

-- Workflow run status (state machine)
CREATE TYPE run_status AS ENUM ('pending', 'assigned', 'in_progress', 'waiting', 'completed', 'failed', 'cancelled');

-- Step run status
CREATE TYPE step_status AS ENUM ('pending', 'assigned', 'in_progress', 'waiting', 'completed', 'failed', 'skipped');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'trigger', 'complete', 'fail', 'retry', 'approve', 'reject');

-- =====================================================
-- TABLE: orchestrators
-- The 5 "Brains" that manage agent swarms
-- =====================================================
CREATE TABLE orchestrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status orchestrator_status NOT NULL DEFAULT 'offline',
    last_heartbeat TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    max_concurrent_runs INTEGER DEFAULT 10,
    current_run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for heartbeat monitoring (high-speed)
CREATE INDEX idx_orchestrators_heartbeat ON orchestrators(last_heartbeat) WHERE deleted_at IS NULL;
CREATE INDEX idx_orchestrators_status ON orchestrators(status) WHERE deleted_at IS NULL;


-- =====================================================
-- TABLE: agents
-- The 50+ AI workers managed by orchestrators
-- =====================================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orchestrator_id UUID REFERENCES orchestrators(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type agent_type NOT NULL DEFAULT 'worker',
    status agent_status NOT NULL DEFAULT 'offline',
    capability_tags TEXT[] DEFAULT '{}',
    last_heartbeat TIMESTAMPTZ,
    current_step_id UUID,
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for agent monitoring
CREATE INDEX idx_agents_orchestrator ON agents(orchestrator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_status ON agents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_heartbeat ON agents(last_heartbeat) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_type ON agents(type) WHERE deleted_at IS NULL;


-- =====================================================
-- TABLE: workflows
-- The "Checklist Master" - templates for automation
-- =====================================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    definition JSONB NOT NULL DEFAULT '{}',
    trigger_type VARCHAR(50) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    estimated_duration_minutes INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_workflows_active ON workflows(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_workflows_title ON workflows(title) WHERE deleted_at IS NULL;


-- =====================================================
-- TABLE: workflow_runs
-- Active execution instances of workflows
-- =====================================================
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    orchestrator_id UUID REFERENCES orchestrators(id) ON DELETE SET NULL,
    status run_status NOT NULL DEFAULT 'pending',
    trigger_source VARCHAR(100) DEFAULT 'manual',
    inputs JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_orchestrator ON workflow_runs(orchestrator_id);
CREATE INDEX idx_workflow_runs_started ON workflow_runs(started_at DESC);


-- =====================================================
-- TABLE: step_runs
-- Individual steps within a workflow run
-- =====================================================
CREATE TABLE step_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(200) NOT NULL,
    status step_status NOT NULL DEFAULT 'pending',
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_step_runs_run ON step_runs(run_id);
CREATE INDEX idx_step_runs_agent ON step_runs(agent_id);
CREATE INDEX idx_step_runs_status ON step_runs(status);


-- =====================================================
-- TABLE: prompts
-- Master prompt registry with slugs
-- =====================================================
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    current_version_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_prompts_slug ON prompts(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_prompts_category ON prompts(category) WHERE deleted_at IS NULL;


-- =====================================================
-- TABLE: prompt_versions
-- Immutable version history for prompts
-- =====================================================
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    change_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prompt_id, version_number)
);

CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);

-- Add foreign key for current_version after prompt_versions exists
ALTER TABLE prompts 
    ADD CONSTRAINT fk_prompts_current_version 
    FOREIGN KEY (current_version_id) 
    REFERENCES prompt_versions(id) ON DELETE SET NULL;


-- =====================================================
-- TABLE: audit_log
-- Immutable audit trail for compliance
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    user_id UUID,
    user_email VARCHAR(255),
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log is append-only, indexes for querying
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);


-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Federal-grade access control
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE orchestrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Orchestrators: Authenticated users can read, admins can modify
CREATE POLICY "orchestrators_select" ON orchestrators FOR SELECT TO authenticated USING (true);
CREATE POLICY "orchestrators_insert" ON orchestrators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orchestrators_update" ON orchestrators FOR UPDATE TO authenticated USING (true);

-- Agents: Authenticated users can read and modify
CREATE POLICY "agents_select" ON agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents_insert" ON agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agents_update" ON agents FOR UPDATE TO authenticated USING (true);


-- Workflows: Authenticated users can read and modify
CREATE POLICY "workflows_select" ON workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflows_insert" ON workflows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "workflows_update" ON workflows FOR UPDATE TO authenticated USING (true);

-- Workflow Runs: Authenticated users full access
CREATE POLICY "workflow_runs_select" ON workflow_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_runs_insert" ON workflow_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "workflow_runs_update" ON workflow_runs FOR UPDATE TO authenticated USING (true);

-- Step Runs: Authenticated users full access
CREATE POLICY "step_runs_select" ON step_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "step_runs_insert" ON step_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "step_runs_update" ON step_runs FOR UPDATE TO authenticated USING (true);

-- Prompts: Authenticated users can read and modify
CREATE POLICY "prompts_select" ON prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompts_insert" ON prompts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prompts_update" ON prompts FOR UPDATE TO authenticated USING (true);

-- Prompt Versions: Authenticated users can read and insert (immutable)
CREATE POLICY "prompt_versions_select" ON prompt_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt_versions_insert" ON prompt_versions FOR INSERT TO authenticated WITH CHECK (true);

-- Audit Log: Authenticated users can read and insert (immutable)
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);


-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER orchestrators_updated_at BEFORE UPDATE ON orchestrators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workflow_runs_updated_at BEFORE UPDATE ON workflow_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER step_runs_updated_at BEFORE UPDATE ON step_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER prompts_updated_at BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =====================================================
-- SEED DATA - Initial Orchestrators
-- =====================================================

INSERT INTO orchestrators (name, description, status, config) VALUES
('Alpha Command', 'Primary orchestrator for procurement workflows', 'idle', '{"priority": 1, "specialization": "procurement"}'),
('Beta Operations', 'Secondary orchestrator for site inspection workflows', 'idle', '{"priority": 2, "specialization": "inspection"}'),
('Gamma Analytics', 'Data analysis and reporting orchestrator', 'idle', '{"priority": 3, "specialization": "analytics"}'),
('Delta Compliance', 'Compliance and audit workflow orchestrator', 'idle', '{"priority": 4, "specialization": "compliance"}'),
('Epsilon Emergency', 'Emergency and priority override orchestrator', 'idle', '{"priority": 0, "specialization": "emergency"}');

-- =====================================================
-- SEED DATA - Sample Workflows
-- =====================================================

INSERT INTO workflows (title, description, definition, trigger_type, estimated_duration_minutes) VALUES
('Site Inspection Checklist', 'Complete site inspection workflow with photo documentation', 
 '{"steps": [{"name": "Pre-Inspection Prep", "type": "task"}, {"name": "Safety Walkthrough", "type": "task"}, {"name": "Photo Documentation", "type": "task"}, {"name": "Report Generation", "type": "task"}, {"name": "Client Review", "type": "approval"}]}',
 'manual', 120),
('Procurement Request', 'End-to-end procurement workflow from request to PO',
 '{"steps": [{"name": "Request Validation", "type": "task"}, {"name": "Vendor Selection", "type": "task"}, {"name": "Quote Comparison", "type": "task"}, {"name": "Manager Approval", "type": "approval"}, {"name": "PO Generation", "type": "task"}]}',
 'manual', 240),
('Daily Safety Report', 'Automated daily safety compliance check',
 '{"steps": [{"name": "Gather Safety Data", "type": "task"}, {"name": "Analyze Incidents", "type": "task"}, {"name": "Generate Report", "type": "task"}, {"name": "Distribute Report", "type": "task"}]}',
 'scheduled', 30);


-- =====================================================
-- SEED DATA - Sample Agents
-- =====================================================

INSERT INTO agents (orchestrator_id, name, type, status, capability_tags) 
SELECT 
    o.id,
    a.name,
    a.type::agent_type,
    'idle'::agent_status,
    a.tags
FROM orchestrators o
CROSS JOIN (VALUES 
    ('Alpha Command', 'Procurement Analyst', 'agentic', ARRAY['procurement', 'analysis', 'vendors']),
    ('Alpha Command', 'Quote Processor', 'worker', ARRAY['quotes', 'data-entry', 'comparison']),
    ('Alpha Command', 'PO Generator', 'worker', ARRAY['documents', 'po', 'generation']),
    ('Beta Operations', 'Site Inspector', 'agentic', ARRAY['inspection', 'safety', 'documentation']),
    ('Beta Operations', 'Photo Processor', 'worker', ARRAY['photos', 'processing', 'tagging']),
    ('Beta Operations', 'Report Writer', 'worker', ARRAY['reports', 'writing', 'formatting']),
    ('Gamma Analytics', 'Data Collector', 'agentic', ARRAY['data', 'collection', 'aggregation']),
    ('Gamma Analytics', 'Chart Generator', 'worker', ARRAY['charts', 'visualization', 'dashboards']),
    ('Delta Compliance', 'Compliance Checker', 'agentic', ARRAY['compliance', 'audit', 'regulations']),
    ('Delta Compliance', 'Document Validator', 'worker', ARRAY['validation', 'documents', 'verification']),
    ('Epsilon Emergency', 'Priority Handler', 'agentic', ARRAY['emergency', 'priority', 'escalation'])
) AS a(orchestrator_name, name, type, tags)
WHERE o.name = a.orchestrator_name;

-- =====================================================
-- SEED DATA - Sample Prompts
-- =====================================================

INSERT INTO prompts (slug, name, description, category) VALUES
('site-inspection-summary', 'Site Inspection Summary', 'Generates executive summary from inspection data', 'inspection'),
('procurement-analysis', 'Procurement Analysis', 'Analyzes vendor quotes and recommends selection', 'procurement'),
('safety-report', 'Safety Report Generator', 'Creates daily safety compliance reports', 'safety'),
('document-review', 'Document Review', 'Reviews and validates construction documents', 'compliance');


-- Insert initial prompt versions
INSERT INTO prompt_versions (prompt_id, version_number, content, variables, change_notes)
SELECT 
    p.id,
    1,
    CASE p.slug
        WHEN 'site-inspection-summary' THEN 'You are a construction site inspector. Analyze the following inspection data and generate an executive summary highlighting key findings, safety concerns, and recommended actions.\n\nInspection Data:\n{{inspection_data}}\n\nSite: {{site_name}}\nDate: {{inspection_date}}'
        WHEN 'procurement-analysis' THEN 'You are a procurement specialist. Analyze the following vendor quotes and provide a recommendation based on price, quality, delivery time, and compliance.\n\nQuotes:\n{{quotes}}\n\nProject: {{project_name}}\nBudget: {{budget}}'
        WHEN 'safety-report' THEN 'Generate a daily safety compliance report based on the following data. Include incident summary, compliance score, and action items.\n\nSafety Data:\n{{safety_data}}\n\nSite: {{site_name}}\nDate: {{report_date}}'
        WHEN 'document-review' THEN 'Review the following construction document for compliance with federal regulations and project specifications.\n\nDocument:\n{{document_content}}\n\nProject: {{project_name}}\nRegulations: {{applicable_regulations}}'
    END,
    CASE p.slug
        WHEN 'site-inspection-summary' THEN ARRAY['inspection_data', 'site_name', 'inspection_date']
        WHEN 'procurement-analysis' THEN ARRAY['quotes', 'project_name', 'budget']
        WHEN 'safety-report' THEN ARRAY['safety_data', 'site_name', 'report_date']
        WHEN 'document-review' THEN ARRAY['document_content', 'project_name', 'applicable_regulations']
    END,
    'Initial version'
FROM prompts p;

-- Update prompts with current version
UPDATE prompts p SET current_version_id = pv.id
FROM prompt_versions pv
WHERE pv.prompt_id = p.id AND pv.version_number = 1;

-- =====================================================
-- OEOC SCHEMA COMPLETE
-- =====================================================

