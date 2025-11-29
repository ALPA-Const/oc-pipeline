-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 003: Cost Management Module Tables (14 tables)
-- ============================================================

-- ============================================================
-- 1. COST_CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    parent_id UUID REFERENCES cost_codes(id),

    -- CSI mapping
    csi_division VARCHAR(10),
    csi_section VARCHAR(20),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- ============================================================
-- 2. BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,

    -- Amounts
    original_budget DECIMAL(15, 2) DEFAULT 0,
    approved_changes DECIMAL(15, 2) DEFAULT 0,
    revised_budget DECIMAL(15, 2) DEFAULT 0,
    committed DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    forecast DECIMAL(15, 2) DEFAULT 0,
    variance DECIMAL(15, 2) DEFAULT 0,

    -- Contingency
    contingency_original DECIMAL(15, 2) DEFAULT 0,
    contingency_used DECIMAL(15, 2) DEFAULT 0,
    contingency_remaining DECIMAL(15, 2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    is_baseline BOOLEAN DEFAULT false,

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. BUDGET_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id),

    description TEXT NOT NULL,

    -- Amounts
    original_amount DECIMAL(15, 2) DEFAULT 0,
    approved_changes DECIMAL(15, 2) DEFAULT 0,
    revised_amount DECIMAL(15, 2) DEFAULT 0,
    committed DECIMAL(15, 2) DEFAULT 0,
    actual DECIMAL(15, 2) DEFAULT 0,
    forecast DECIMAL(15, 2) DEFAULT 0,
    variance DECIMAL(15, 2) DEFAULT 0,

    -- Breakdown
    labor_budget DECIMAL(15, 2) DEFAULT 0,
    material_budget DECIMAL(15, 2) DEFAULT 0,
    equipment_budget DECIMAL(15, 2) DEFAULT 0,
    subcontractor_budget DECIMAL(15, 2) DEFAULT 0,
    other_budget DECIMAL(15, 2) DEFAULT 0,

    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CHANGE_ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    type VARCHAR(50), -- owner, contractor, design
    reason VARCHAR(100),

    -- Amounts
    proposed_amount DECIMAL(15, 2) DEFAULT 0,
    approved_amount DECIMAL(15, 2),

    -- Schedule impact
    schedule_impact_days INTEGER DEFAULT 0,

    -- Dates
    submitted_date DATE,
    response_due_date DATE,
    approved_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Workflow
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),

    -- Attachments
    attachments JSONB DEFAULT '[]',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. CHANGE_ORDER_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS change_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id),

    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) DEFAULT 0,
    unit VARCHAR(50),
    unit_cost DECIMAL(15, 4) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,

    -- Breakdown
    labor_cost DECIMAL(15, 2) DEFAULT 0,
    material_cost DECIMAL(15, 2) DEFAULT 0,
    equipment_cost DECIMAL(15, 2) DEFAULT 0,
    subcontractor_cost DECIMAL(15, 2) DEFAULT 0,
    markup_percent DECIMAL(5, 2) DEFAULT 0,
    markup_amount DECIMAL(15, 2) DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. COMMITMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID,

    -- Type
    type VARCHAR(50) NOT NULL, -- contract, subcontract, po

    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scope_of_work TEXT,

    -- Amounts
    original_amount DECIMAL(15, 2) DEFAULT 0,
    approved_changes DECIMAL(15, 2) DEFAULT 0,
    revised_amount DECIMAL(15, 2) DEFAULT 0,
    invoiced DECIMAL(15, 2) DEFAULT 0,
    paid DECIMAL(15, 2) DEFAULT 0,
    retainage_held DECIMAL(15, 2) DEFAULT 0,

    -- Retainage
    retainage_percent DECIMAL(5, 2) DEFAULT 10,

    -- Dates
    start_date DATE,
    end_date DATE,
    executed_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Terms
    payment_terms VARCHAR(100),
    insurance_required BOOLEAN DEFAULT true,
    bonding_required BOOLEAN DEFAULT false,

    -- Attachments
    contract_file_id UUID REFERENCES files(id),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. COMMITMENT_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS commitment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id),

    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) DEFAULT 0,
    unit VARCHAR(50),
    unit_cost DECIMAL(15, 4) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,

    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
    vendor_id UUID,

    number VARCHAR(50) NOT NULL,
    description TEXT,

    -- Amounts
    gross_amount DECIMAL(15, 2) DEFAULT 0,
    retainage_amount DECIMAL(15, 2) DEFAULT 0,
    net_amount DECIMAL(15, 2) DEFAULT 0,

    -- Dates
    invoice_date DATE,
    received_date DATE,
    due_date DATE,
    paid_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    -- Payment
    payment_reference VARCHAR(100),

    -- Attachments
    invoice_file_id UUID REFERENCES files(id),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. INVOICE_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    commitment_item_id UUID REFERENCES commitment_items(id),
    cost_code_id UUID REFERENCES cost_codes(id),

    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) DEFAULT 0,
    unit VARCHAR(50),
    unit_cost DECIMAL(15, 4) DEFAULT 0,
    amount DECIMAL(15, 2) DEFAULT 0,

    -- Progress
    previous_quantity DECIMAL(15, 4) DEFAULT 0,
    this_period_quantity DECIMAL(15, 4) DEFAULT 0,
    total_quantity DECIMAL(15, 4) DEFAULT 0,
    percent_complete DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. COST_FORECASTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period DATE NOT NULL,

    -- Forecast values
    forecast_amount DECIMAL(15, 2) DEFAULT 0,
    variance_from_budget DECIMAL(15, 2) DEFAULT 0,
    variance_percent DECIMAL(5, 2) DEFAULT 0,

    -- EAC components
    actual_to_date DECIMAL(15, 2) DEFAULT 0,
    estimate_to_complete DECIMAL(15, 2) DEFAULT 0,
    estimate_at_completion DECIMAL(15, 2) DEFAULT 0,

    -- Confidence
    confidence_level VARCHAR(20),
    assumptions TEXT,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ACTUAL_COSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS actual_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id),

    -- Source
    source_type VARCHAR(50), -- invoice, timesheet, expense
    source_id UUID,

    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,

    -- Category
    cost_type VARCHAR(50), -- labor, material, equipment, sub, other

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. CONTINGENCY_DRAWS
-- ============================================================
CREATE TABLE IF NOT EXISTS contingency_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    change_order_id UUID REFERENCES change_orders(id),

    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT NOT NULL,

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. COST_REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period DATE NOT NULL,
    report_type VARCHAR(50) DEFAULT 'monthly',

    -- Snapshot data
    data JSONB NOT NULL,

    -- Summary
    total_budget DECIMAL(15, 2),
    total_committed DECIMAL(15, 2),
    total_actual DECIMAL(15, 2),
    total_forecast DECIMAL(15, 2),

    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. EARNED_VALUE
-- ============================================================
CREATE TABLE IF NOT EXISTS earned_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    period DATE NOT NULL,

    -- Core EV metrics
    bcws DECIMAL(15, 2) DEFAULT 0, -- Budgeted Cost of Work Scheduled (PV)
    bcwp DECIMAL(15, 2) DEFAULT 0, -- Budgeted Cost of Work Performed (EV)
    acwp DECIMAL(15, 2) DEFAULT 0, -- Actual Cost of Work Performed (AC)

    -- Variances
    cv DECIMAL(15, 2) DEFAULT 0, -- Cost Variance (EV - AC)
    sv DECIMAL(15, 2) DEFAULT 0, -- Schedule Variance (EV - PV)

    -- Indices
    cpi DECIMAL(5, 3) DEFAULT 0, -- Cost Performance Index (EV / AC)
    spi DECIMAL(5, 3) DEFAULT 0, -- Schedule Performance Index (EV / PV)

    -- Forecasts
    bac DECIMAL(15, 2) DEFAULT 0, -- Budget at Completion
    eac DECIMAL(15, 2) DEFAULT 0, -- Estimate at Completion
    etc DECIMAL(15, 2) DEFAULT 0, -- Estimate to Complete
    vac DECIMAL(15, 2) DEFAULT 0, -- Variance at Completion
    tcpi DECIMAL(5, 3) DEFAULT 0, -- To-Complete Performance Index

    -- Percent complete
    percent_complete DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_commitment ON invoices(commitment_id);
CREATE INDEX IF NOT EXISTS idx_actual_costs_project ON actual_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_earned_value_project ON earned_value(project_id, period);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_cost_codes_updated_at BEFORE UPDATE ON cost_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

