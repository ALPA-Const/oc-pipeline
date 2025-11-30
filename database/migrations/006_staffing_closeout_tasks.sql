-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 006: Staffing (8), Closeout (8), Tasks (6)
-- ============================================================

-- ============================================================
-- STAFFING MODULE (8 tables)
-- ============================================================

-- 1. RESOURCES
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    -- Type
    resource_type VARCHAR(50) NOT NULL, -- labor, equipment

    -- Info
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,

    -- For labor
    title VARCHAR(100),
    trade VARCHAR(100),
    skill_level VARCHAR(50),

    -- For equipment
    equipment_type VARCHAR(100),
    make VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),

    -- Rates
    standard_rate DECIMAL(10, 2),
    overtime_rate DECIMAL(10, 2),

    -- Availability
    availability_percent DECIMAL(5, 2) DEFAULT 100,

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RESOURCE_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS resource_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Role on project
    role VARCHAR(100),

    -- Allocation
    allocation_percent DECIMAL(5, 2) DEFAULT 100,

    -- Dates
    start_date DATE,
    end_date DATE,

    -- Hours
    planned_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    notes TEXT,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TIMESHEETS
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Totals
    total_regular_hours DECIMAL(10, 2) DEFAULT 0,
    total_overtime_hours DECIMAL(10, 2) DEFAULT 0,
    total_hours DECIMAL(10, 2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Approval
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TIMESHEET_ENTRIES
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    cost_code_id UUID REFERENCES cost_codes(id),

    -- Date
    work_date DATE NOT NULL,

    -- Hours
    regular_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,

    -- Description
    description TEXT,

    -- Location
    location VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LABOR_RATES
CREATE TABLE IF NOT EXISTS labor_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Classification
    role VARCHAR(100) NOT NULL,
    trade VARCHAR(100),
    skill_level VARCHAR(50),

    -- Rates
    standard_rate DECIMAL(10, 2) NOT NULL,
    overtime_rate DECIMAL(10, 2),
    burden_percent DECIMAL(5, 2) DEFAULT 0,

    -- Effective dates
    effective_date DATE NOT NULL,
    end_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EQUIPMENT
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id),

    -- Info
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,

    -- Details
    equipment_type VARCHAR(100),
    category VARCHAR(100),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(100),

    -- Ownership
    ownership_type VARCHAR(50), -- owned, rented, leased

    -- Rates
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    weekly_rate DECIMAL(10, 2),
    monthly_rate DECIMAL(10, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'available',
    current_project_id UUID REFERENCES projects(id),

    -- Maintenance
    last_service_date DATE,
    next_service_date DATE,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EQUIPMENT_USAGE
CREATE TABLE IF NOT EXISTS equipment_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Date
    usage_date DATE NOT NULL,

    -- Hours
    hours DECIMAL(5, 2) DEFAULT 0,

    -- Operator
    operator_id UUID REFERENCES users(id),

    -- Cost
    rate DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RESOURCE_FORECASTS
CREATE TABLE IF NOT EXISTS resource_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Resources needed
    resources JSONB NOT NULL,

    -- Summary
    total_labor_hours DECIMAL(10, 2),
    total_equipment_hours DECIMAL(10, 2),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLOSEOUT MODULE (8 tables)
-- ============================================================

-- 1. WARRANTIES
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),

    -- Item
    item VARCHAR(255) NOT NULL,
    description TEXT,

    -- Warranty details
    warranty_type VARCHAR(100),
    duration_months INTEGER,

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Coverage
    coverage_details TEXT,
    exclusions TEXT,

    -- Contact
    contact_name VARCHAR(200),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),

    -- Document
    file_id UUID REFERENCES files(id),

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Notifications
    notify_before_days INTEGER DEFAULT 30,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WARRANTY_CLAIMS
CREATE TABLE IF NOT EXISTS warranty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_id UUID NOT NULL REFERENCES warranties(id) ON DELETE CASCADE,

    -- Claim
    claim_number VARCHAR(50),
    description TEXT NOT NULL,

    -- Date
    claim_date DATE DEFAULT CURRENT_DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'submitted',

    -- Resolution
    resolution TEXT,
    resolved_date DATE,

    -- Cost
    claim_amount DECIMAL(15, 2),
    approved_amount DECIMAL(15, 2),

    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AS_BUILTS
CREATE TABLE IF NOT EXISTS as_builts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Drawing info
    discipline VARCHAR(100),
    drawing_number VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Revision
    revision VARCHAR(20),

    -- File
    file_id UUID REFERENCES files(id),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OM_MANUALS
CREATE TABLE IF NOT EXISTS om_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- System
    system VARCHAR(255) NOT NULL,
    subsystem VARCHAR(255),
    description TEXT,

    -- File
    file_id UUID REFERENCES files(id),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRAINING_RECORDS
CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Training
    topic VARCHAR(255) NOT NULL,
    description TEXT,

    -- Date/Time
    training_date DATE NOT NULL,
    duration_hours DECIMAL(5, 2),

    -- Trainer
    trainer_name VARCHAR(200),
    trainer_company VARCHAR(200),

    -- Attendees
    attendees JSONB DEFAULT '[]',

    -- Materials
    materials_file_id UUID REFERENCES files(id),

    -- Sign-in sheet
    signin_file_id UUID REFERENCES files(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SPARE_PARTS
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Item
    item VARCHAR(255) NOT NULL,
    description TEXT,

    -- Quantity
    quantity INTEGER NOT NULL,
    unit VARCHAR(50),

    -- Location
    storage_location VARCHAR(255),

    -- Manufacturer
    manufacturer VARCHAR(255),
    part_number VARCHAR(100),

    -- Value
    unit_cost DECIMAL(10, 2),
    total_value DECIMAL(15, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'stored',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CLOSEOUT_CHECKLISTS
CREATE TABLE IF NOT EXISTS closeout_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Item
    item VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Responsibility
    responsible_party VARCHAR(255),
    responsible_user_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Dates
    due_date DATE,
    completed_date DATE,

    -- Notes
    notes TEXT,

    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FINAL_INSPECTIONS
CREATE TABLE IF NOT EXISTS final_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Type
    inspection_type VARCHAR(100) NOT NULL,

    -- Date
    inspection_date DATE NOT NULL,

    -- Inspector
    inspector_name VARCHAR(200),
    inspector_company VARCHAR(200),
    inspector_agency VARCHAR(200),

    -- Result
    result VARCHAR(50), -- pass, conditional, fail

    -- Items
    items JSONB DEFAULT '[]',

    -- Certificate
    certificate_number VARCHAR(100),
    certificate_file_id UUID REFERENCES files(id),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS MODULE (6 tables)
-- ============================================================

-- 1. TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Source
    source_type VARCHAR(50), -- rfi, submittal, deficiency, action_item, manual
    source_id UUID,

    -- Task
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    task_type VARCHAR(100),
    category VARCHAR(100),

    -- Priority
    priority VARCHAR(20) DEFAULT 'medium',

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),

    -- Dates
    due_date DATE,
    start_date DATE,
    completed_date DATE,

    -- Estimated effort
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Progress
    percent_complete DECIMAL(5, 2) DEFAULT 0,

    -- Tags
    tags JSONB DEFAULT '[]',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASK_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(50) DEFAULT 'assignee', -- assignee, reviewer, watcher

    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),

    UNIQUE(task_id, user_id, role)
);

-- 3. TASK_DEPENDENCIES
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    dependency_type VARCHAR(20) DEFAULT 'finish_to_start',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- 4. TASK_COMMENTS
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    content TEXT NOT NULL,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORKFLOWS
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger
    trigger_type VARCHAR(50), -- manual, entity_created, status_change
    trigger_entity VARCHAR(100),
    trigger_conditions JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WORKFLOW_STEPS
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

    -- Step
    step_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Action
    action_type VARCHAR(50), -- create_task, send_notification, update_status, assign_user
    action_config JSONB NOT NULL,

    -- Conditions
    conditions JSONB DEFAULT '{}',

    -- Timing
    delay_hours INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resources_org ON resources(org_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource ON resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_project ON resource_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_equipment_org ON equipment(org_id);
CREATE INDEX IF NOT EXISTS idx_warranties_project ON warranties(project_id);
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON warranties(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_assignments_updated_at BEFORE UPDATE ON resource_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warranties_updated_at BEFORE UPDATE ON warranties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warranty_claims_updated_at BEFORE UPDATE ON warranty_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_as_builts_updated_at BEFORE UPDATE ON as_builts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_closeout_checklists_updated_at BEFORE UPDATE ON closeout_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

