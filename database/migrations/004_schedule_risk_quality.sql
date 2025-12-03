-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 004: Schedule (10), Risk (8), Quality (8) Tables
-- ============================================================

-- ============================================================
-- SCHEDULE MODULE (10 tables)
-- ============================================================

-- 1. SCHEDULES
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,

    -- Dates
    data_date DATE,
    start_date DATE,
    finish_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    is_baseline BOOLEAN DEFAULT false,

    -- Source
    source_file_id UUID REFERENCES files(id),
    source_format VARCHAR(50), -- p6, msp, csv

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCHEDULE_ACTIVITIES
CREATE TABLE IF NOT EXISTS schedule_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES schedule_activities(id),

    -- Identity
    activity_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    activity_type VARCHAR(50) DEFAULT 'task', -- task, milestone, summary, loe

    -- Dates - Early
    early_start DATE,
    early_finish DATE,

    -- Dates - Late
    late_start DATE,
    late_finish DATE,

    -- Dates - Actual
    actual_start DATE,
    actual_finish DATE,

    -- Dates - Baseline
    baseline_start DATE,
    baseline_finish DATE,

    -- Duration
    original_duration INTEGER DEFAULT 0,
    remaining_duration INTEGER DEFAULT 0,
    actual_duration INTEGER DEFAULT 0,

    -- Progress
    percent_complete DECIMAL(5, 2) DEFAULT 0,

    -- Float
    total_float INTEGER DEFAULT 0,
    free_float INTEGER DEFAULT 0,

    -- Resources
    resource_ids JSONB DEFAULT '[]',

    -- Calendar
    calendar_id VARCHAR(50),

    -- WBS
    wbs_code VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'not_started',
    is_critical BOOLEAN DEFAULT false,
    is_milestone BOOLEAN DEFAULT false,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVITY_DEPENDENCIES
CREATE TABLE IF NOT EXISTS activity_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    predecessor_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,
    successor_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,

    -- Type: FS, FF, SS, SF
    dependency_type VARCHAR(10) DEFAULT 'FS',

    -- Lag (positive) or Lead (negative)
    lag_days INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(predecessor_id, successor_id)
);

-- 4. MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schedule_activity_id UUID REFERENCES schedule_activities(id),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Dates
    baseline_date DATE,
    planned_date DATE,
    forecast_date DATE,
    actual_date DATE,

    -- Type
    milestone_type VARCHAR(50), -- contract, internal, owner

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Importance
    is_key_milestone BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCHEDULE_BASELINES
CREATE TABLE IF NOT EXISTS schedule_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    baseline_date DATE NOT NULL,

    -- Snapshot
    data JSONB NOT NULL,

    -- Summary
    total_activities INTEGER,
    start_date DATE,
    finish_date DATE,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SCHEDULE_UPDATES
CREATE TABLE IF NOT EXISTS schedule_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,

    -- Update type
    update_type VARCHAR(50) NOT NULL, -- progress, date_change, status_change

    -- Progress
    previous_percent DECIMAL(5, 2),
    new_percent DECIMAL(5, 2),

    -- Dates
    actual_start DATE,
    actual_finish DATE,
    remaining_duration INTEGER,

    notes TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CRITICAL_PATH
CREATE TABLE IF NOT EXISTS critical_path (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,

    sequence_order INTEGER NOT NULL,
    total_float INTEGER DEFAULT 0,

    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SCHEDULE_IMPACTS
CREATE TABLE IF NOT EXISTS schedule_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Source
    source_type VARCHAR(50), -- change_order, rfi, weather, etc
    source_id UUID,

    cause VARCHAR(255) NOT NULL,
    description TEXT,

    -- Impact
    days_impact INTEGER DEFAULT 0,
    cost_impact DECIMAL(15, 2) DEFAULT 0,

    -- Affected activities
    affected_activities JSONB DEFAULT '[]',

    -- Mitigation
    mitigation_plan TEXT,
    mitigated_days INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LOOKAHEAD_SCHEDULES
CREATE TABLE IF NOT EXISTS lookahead_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    weeks INTEGER DEFAULT 3,

    -- Activities snapshot
    activities JSONB NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SCHEDULE_NARRATIVES
CREATE TABLE IF NOT EXISTS schedule_narratives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period DATE NOT NULL,

    -- Content
    executive_summary TEXT,
    accomplishments TEXT,
    upcoming_work TEXT,
    concerns TEXT,
    recovery_plan TEXT,

    -- Metrics
    percent_complete DECIMAL(5, 2),
    days_ahead_behind INTEGER,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RISK MODULE (8 tables)
-- ============================================================

-- 1. RISK_CATEGORIES
CREATE TABLE IF NOT EXISTS risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6366f1',
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- 2. RISKS
CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES risk_categories(id),

    -- Identity
    risk_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Assessment
    probability INTEGER CHECK (probability BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,

    -- Impact details
    cost_impact_low DECIMAL(15, 2),
    cost_impact_high DECIMAL(15, 2),
    schedule_impact_days INTEGER,

    -- Response
    response_strategy VARCHAR(50), -- avoid, mitigate, transfer, accept
    response_plan TEXT,

    -- Owner
    owner_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Dates
    identified_date DATE DEFAULT CURRENT_DATE,
    target_resolution_date DATE,
    closed_date DATE,

    -- Triggers
    trigger_conditions TEXT,

    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RISK_RESPONSES
CREATE TABLE IF NOT EXISTS risk_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,

    strategy VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,

    -- Cost
    estimated_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),

    -- Owner
    owner_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'planned',

    -- Dates
    planned_date DATE,
    completed_date DATE,

    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RISK_TRIGGERS
CREATE TABLE IF NOT EXISTS risk_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,

    condition TEXT NOT NULL,
    threshold VARCHAR(255),

    -- Monitoring
    check_frequency VARCHAR(50),
    last_checked_at TIMESTAMPTZ,

    -- Status
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RISK_ASSESSMENTS
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,

    assessment_date DATE NOT NULL,

    -- Scores
    probability INTEGER CHECK (probability BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER,

    -- Trend
    trend VARCHAR(20), -- increasing, stable, decreasing

    notes TEXT,
    assessed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RISK_IMPACTS
CREATE TABLE IF NOT EXISTS risk_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,

    impact_type VARCHAR(50) NOT NULL, -- cost, schedule, quality, safety, reputation

    description TEXT,

    -- Quantification
    low_estimate DECIMAL(15, 2),
    likely_estimate DECIMAL(15, 2),
    high_estimate DECIMAL(15, 2),

    -- Schedule
    schedule_days_low INTEGER,
    schedule_days_likely INTEGER,
    schedule_days_high INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RISK_REPORTS
CREATE TABLE IF NOT EXISTS risk_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period DATE NOT NULL,

    -- Summary
    summary JSONB NOT NULL,

    -- Counts
    total_risks INTEGER,
    high_risks INTEGER,
    medium_risks INTEGER,
    low_risks INTEGER,
    closed_risks INTEGER,

    -- Exposure
    total_cost_exposure DECIMAL(15, 2),
    total_schedule_exposure INTEGER,

    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LESSONS_LEARNED
CREATE TABLE IF NOT EXISTS lessons_learned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    risk_id UUID REFERENCES risks(id) ON DELETE SET NULL,

    category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- What happened
    situation TEXT,

    -- Analysis
    root_cause TEXT,

    -- Recommendation
    recommendation TEXT,

    -- Impact
    impact_type VARCHAR(50),
    impact_value DECIMAL(15, 2),

    -- Tags
    tags JSONB DEFAULT '[]',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUALITY MODULE (8 tables)
-- ============================================================

-- 1. QUALITY_PLANS
CREATE TABLE IF NOT EXISTS quality_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,

    -- Content
    scope TEXT,
    standards JSONB DEFAULT '[]',
    procedures JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEFICIENCIES
CREATE TABLE IF NOT EXISTS deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Location
    location VARCHAR(255),
    area VARCHAR(100),
    drawing_reference VARCHAR(100),

    -- Classification
    type VARCHAR(50), -- workmanship, material, design, safety
    severity VARCHAR(20), -- critical, major, minor
    trade VARCHAR(100),

    -- Responsibility
    responsible_party VARCHAR(255),
    responsible_user_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Dates
    identified_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    closed_date DATE,

    -- Cost
    estimated_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),

    -- Photos
    photos JSONB DEFAULT '[]',

    identified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSPECTIONS
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    inspection_type VARCHAR(100),

    -- Location
    location VARCHAR(255),
    area VARCHAR(100),

    -- Scheduling
    scheduled_date DATE,
    actual_date DATE,

    -- Inspector
    inspector_name VARCHAR(200),
    inspector_company VARCHAR(200),
    inspector_user_id UUID REFERENCES users(id),

    -- Result
    result VARCHAR(50), -- pass, fail, conditional

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSPECTION_ITEMS
CREATE TABLE IF NOT EXISTS inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

    item_number INTEGER,
    description TEXT NOT NULL,
    specification_reference VARCHAR(255),

    -- Result
    pass_fail VARCHAR(20), -- pass, fail, na

    notes TEXT,
    photos JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PUNCH_LISTS
CREATE TABLE IF NOT EXISTS punch_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Area
    area VARCHAR(255),
    floor VARCHAR(50),
    room VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Counts
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PUNCH_ITEMS
CREATE TABLE IF NOT EXISTS punch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punch_list_id UUID NOT NULL REFERENCES punch_lists(id) ON DELETE CASCADE,

    -- Item
    item_number INTEGER,
    description TEXT NOT NULL,

    -- Location
    location VARCHAR(255),

    -- Classification
    trade VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',

    -- Responsibility
    responsible_party VARCHAR(255),
    responsible_user_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Dates
    due_date DATE,
    completed_date DATE,

    -- Verification
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,

    photos JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NCRS (Non-Conformance Reports)
CREATE TABLE IF NOT EXISTS ncrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    deficiency_id UUID REFERENCES deficiencies(id),

    -- Identity
    number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Details
    specification_reference VARCHAR(255),
    drawing_reference VARCHAR(255),

    -- Disposition
    disposition VARCHAR(50), -- use_as_is, rework, repair, scrap
    disposition_reason TEXT,

    -- Cost
    rework_cost DECIMAL(15, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TEST_REPORTS
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50),
    name VARCHAR(255) NOT NULL,

    -- Type
    test_type VARCHAR(100),
    material VARCHAR(255),

    -- Location
    location VARCHAR(255),
    sample_location VARCHAR(255),

    -- Testing
    test_date DATE,
    lab_name VARCHAR(255),

    -- Results
    result VARCHAR(50), -- pass, fail
    result_value VARCHAR(100),
    specification_value VARCHAR(100),

    -- Report
    file_id UUID REFERENCES files(id),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_schedules_project ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_activities_schedule ON schedule_activities(schedule_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_project ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_deficiencies_project ON deficiencies(project_id);
CREATE INDEX IF NOT EXISTS idx_deficiencies_status ON deficiencies(status);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_items_list ON punch_items(punch_list_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_activities_updated_at BEFORE UPDATE ON schedule_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deficiencies_updated_at BEFORE UPDATE ON deficiencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punch_lists_updated_at BEFORE UPDATE ON punch_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punch_items_updated_at BEFORE UPDATE ON punch_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ncrs_updated_at BEFORE UPDATE ON ncrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_plans_updated_at BEFORE UPDATE ON quality_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

