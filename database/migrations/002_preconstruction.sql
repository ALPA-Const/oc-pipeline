-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 002: Preconstruction Module Tables (12 tables)
-- ============================================================

-- ============================================================
-- 1. PIPELINE_STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    win_probability DECIMAL(5, 2) DEFAULT 0,
    color VARCHAR(20) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    is_terminal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- ============================================================
-- 2. PURSUITS (Bid Opportunities)
-- ============================================================
CREATE TABLE IF NOT EXISTS pursuits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,

    -- Client
    client_name VARCHAR(255),
    client_agency VARCHAR(255),
    client_contact_name VARCHAR(200),
    client_contact_email VARCHAR(255),
    client_contact_phone VARCHAR(50),

    -- Location
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Value
    estimated_value DECIMAL(15, 2),
    low_value DECIMAL(15, 2),
    high_value DECIMAL(15, 2),

    -- Classification
    project_type VARCHAR(100),
    delivery_method VARCHAR(100),
    contract_type VARCHAR(100),
    set_aside_type VARCHAR(50),
    naics_code VARCHAR(20),
    magnitude VARCHAR(50),

    -- Pipeline
    stage_id UUID REFERENCES pipeline_stages(id),
    stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
    win_probability DECIMAL(5, 2),

    -- Dates
    solicitation_date DATE,
    due_date DATE,
    decision_date DATE,
    start_date DATE,

    -- Outcome
    outcome VARCHAR(50), -- won, lost, no_bid, cancelled
    outcome_date DATE,
    outcome_reason TEXT,
    awarded_to VARCHAR(255),
    awarded_amount DECIMAL(15, 2),

    -- JV
    is_jv BOOLEAN DEFAULT false,
    jv_partner VARCHAR(255),
    jv_percentage DECIMAL(5, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',

    -- Metadata
    source VARCHAR(100),
    source_url TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',

    -- Tracking
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- 3. PIPELINE_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES pipeline_stages(id),
    to_stage_id UUID REFERENCES pipeline_stages(id),
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ESTIMATES
-- ============================================================
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pursuit_id UUID REFERENCES pursuits(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,

    -- Totals
    subtotal DECIMAL(15, 2) DEFAULT 0,
    overhead_percent DECIMAL(5, 2) DEFAULT 0,
    overhead_amount DECIMAL(15, 2) DEFAULT 0,
    profit_percent DECIMAL(5, 2) DEFAULT 0,
    profit_amount DECIMAL(15, 2) DEFAULT 0,
    contingency_percent DECIMAL(5, 2) DEFAULT 0,
    contingency_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    is_baseline BOOLEAN DEFAULT false,

    -- Metadata
    assumptions TEXT,
    exclusions TEXT,
    notes TEXT,

    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ESTIMATE_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES estimate_items(id),

    -- Item details
    cost_code VARCHAR(50),
    description TEXT NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(15, 4) DEFAULT 0,
    unit_cost DECIMAL(15, 4) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,

    -- Labor
    labor_hours DECIMAL(10, 2) DEFAULT 0,
    labor_rate DECIMAL(10, 2) DEFAULT 0,
    labor_cost DECIMAL(15, 2) DEFAULT 0,

    -- Material
    material_cost DECIMAL(15, 2) DEFAULT 0,

    -- Equipment
    equipment_cost DECIMAL(15, 2) DEFAULT 0,

    -- Subcontractor
    subcontractor_cost DECIMAL(15, 2) DEFAULT 0,

    -- Other
    other_cost DECIMAL(15, 2) DEFAULT 0,

    -- Ordering
    order_index INTEGER DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. BID_PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS bid_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pursuit_id UUID REFERENCES pursuits(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    trade VARCHAR(100),
    csi_division VARCHAR(10),
    description TEXT,
    scope_of_work TEXT,

    -- Budget
    budget_amount DECIMAL(15, 2),

    -- Dates
    issue_date DATE,
    due_date DATE,
    pre_bid_date DATE,
    award_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Awarded
    awarded_vendor_id UUID,
    awarded_amount DECIMAL(15, 2),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. BID_INVITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS bid_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_package_id UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Dates
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,

    -- Response
    will_bid BOOLEAN,
    decline_reason TEXT,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. BID_RESPONSES
-- ============================================================
CREATE TABLE IF NOT EXISTS bid_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_invitation_id UUID NOT NULL REFERENCES bid_invitations(id) ON DELETE CASCADE,

    -- Bid details
    base_bid DECIMAL(15, 2),
    alternate_bids JSONB DEFAULT '[]',
    total_bid DECIMAL(15, 2),

    -- Qualifications
    exclusions TEXT,
    clarifications TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'submitted',
    is_selected BOOLEAN DEFAULT false,

    -- Evaluation
    score DECIMAL(5, 2),
    evaluation_notes TEXT,

    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_by UUID REFERENCES users(id),
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TAKEOFFS
-- ============================================================
CREATE TABLE IF NOT EXISTS takeoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Source
    source_file_id UUID REFERENCES files(id),
    source_page VARCHAR(50),

    -- Measurement
    item VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,

    -- Location
    location VARCHAR(255),
    area VARCHAR(100),

    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. PURSUIT_CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS pursuit_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    title VARCHAR(100),
    company VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. PURSUIT_MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS pursuit_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'pending',

    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. WIN_LOSS_ANALYSIS
-- ============================================================
CREATE TABLE IF NOT EXISTS win_loss_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,

    outcome VARCHAR(50) NOT NULL,

    -- Analysis
    primary_factors JSONB DEFAULT '[]',
    competitor_info JSONB DEFAULT '{}',
    lessons_learned TEXT,

    -- Scores
    price_competitiveness INTEGER,
    technical_score INTEGER,
    relationship_score INTEGER,
    overall_score INTEGER,

    analyzed_by UUID REFERENCES users(id),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pursuits_org ON pursuits(org_id);
CREATE INDEX IF NOT EXISTS idx_pursuits_stage ON pursuits(stage_id);
CREATE INDEX IF NOT EXISTS idx_pursuits_status ON pursuits(status);
CREATE INDEX IF NOT EXISTS idx_pursuits_outcome ON pursuits(outcome);
CREATE INDEX IF NOT EXISTS idx_estimates_pursuit ON estimates(pursuit_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_pursuit ON bid_packages(pursuit_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_pursuit ON pipeline_history(pursuit_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_pursuits_updated_at BEFORE UPDATE ON pursuits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_items_updated_at BEFORE UPDATE ON estimate_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_packages_updated_at BEFORE UPDATE ON bid_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_takeoffs_updated_at BEFORE UPDATE ON takeoffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

