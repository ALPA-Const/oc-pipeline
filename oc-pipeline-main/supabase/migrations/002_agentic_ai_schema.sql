-- =====================================================
-- OC PIPELINE - AGENTIC AI ESTIMATING SCHEMA
-- Migration: 002_agentic_ai_schema.sql
-- Purpose: Pricing Intelligence, Risk Auditor, Confidence Scoring,
--          Drawing Viewer, Real-time Market Integration
-- Standards: BIGINT cents, basis points, federal compliance
-- =====================================================

-- =====================================================
-- SECTION 1: MARKET DATA & PRICING INTELLIGENCE
-- =====================================================

-- Material Price Indices (Real-time market tracking)
CREATE TABLE IF NOT EXISTS market_price_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_category VARCHAR(100) NOT NULL,
    commodity_code VARCHAR(50), -- Standard commodity codes (e.g., Steel, Copper, Lumber)
    index_name VARCHAR(200) NOT NULL,
    index_source VARCHAR(100) NOT NULL, -- BLS, RS Means, ENR, custom API
    base_value BIGINT NOT NULL, -- Base index value in cents
    current_value BIGINT NOT NULL, -- Current index value in cents
    change_percent INTEGER DEFAULT 0, -- Basis points (10000 = 100%)
    volatility_score INTEGER DEFAULT 0, -- 0-10000 basis points volatility rating
    trend_direction VARCHAR(20) DEFAULT 'stable', -- up, down, stable, volatile
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Price History (For trend analysis)
CREATE TABLE IF NOT EXISTS market_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_id UUID NOT NULL REFERENCES market_price_indices(id) ON DELETE CASCADE,
    recorded_value BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geographic Cost Adjustments (Zip code based)
CREATE TABLE IF NOT EXISTS geographic_cost_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    region VARCHAR(50), -- Northeast, Southeast, Midwest, etc.
    labor_factor INTEGER DEFAULT 10000, -- Basis points (10000 = 1.0x)
    material_factor INTEGER DEFAULT 10000,
    equipment_factor INTEGER DEFAULT 10000,
    general_conditions_factor INTEGER DEFAULT 10000,
    prevailing_wage_required BOOLEAN DEFAULT false,
    davis_bacon_rate_area VARCHAR(50),
    effective_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    data_source VARCHAR(100), -- RS Means, BLS, DOL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zip_code, effective_date)
);

-- Volatility Buffers (Material-specific risk adjustments)
CREATE TABLE IF NOT EXISTS volatility_buffers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_category VARCHAR(100) NOT NULL,
    commodity_code VARCHAR(50),
    buffer_percent INTEGER DEFAULT 0, -- Basis points
    min_buffer INTEGER DEFAULT 0,
    max_buffer INTEGER DEFAULT 5000, -- Max 50%
    calculation_method VARCHAR(50) DEFAULT 'historical_std', -- historical_std, market_trend, fixed
    lookback_days INTEGER DEFAULT 90,
    auto_adjust BOOLEAN DEFAULT true,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation Clauses (Contract escalation tracking)
CREATE TABLE IF NOT EXISTS escalation_clauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    clause_type VARCHAR(50) NOT NULL, -- material, labor, fuel, index_based
    trigger_threshold INTEGER DEFAULT 500, -- 5% in basis points
    max_escalation INTEGER DEFAULT 1500, -- 15% cap
    reference_index_id UUID REFERENCES market_price_indices(id),
    base_date DATE,
    calculation_formula TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECTION 2: RISK AUDITOR & RED-TEAM REVIEW
-- =====================================================

-- Risk Categories (Standard risk types)
CREATE TABLE IF NOT EXISTS risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_impact_score INTEGER DEFAULT 5000, -- 1-10000 scale
    default_probability_score INTEGER DEFAULT 5000,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Risk Matrix (Per-estimate risk analysis)
CREATE TABLE IF NOT EXISTS estimate_risk_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    risk_category_id UUID REFERENCES risk_categories(id),
    risk_name VARCHAR(200) NOT NULL,
    risk_description TEXT,
    risk_type VARCHAR(50) DEFAULT 'identified', -- identified, hidden_killer, scope_gap, market
    impact_score INTEGER DEFAULT 5000, -- 1-10000 (basis points style)
    probability_score INTEGER DEFAULT 5000,
    risk_score INTEGER GENERATED ALWAYS AS ((impact_score * probability_score) / 10000) STORED,
    cost_impact_low BIGINT DEFAULT 0, -- In cents
    cost_impact_mid BIGINT DEFAULT 0,
    cost_impact_high BIGINT DEFAULT 0,
    schedule_impact_days INTEGER DEFAULT 0,
    mitigation_strategy TEXT,
    mitigation_cost BIGINT DEFAULT 0,
    contingency_recommended INTEGER DEFAULT 0, -- Basis points
    owner_id UUID REFERENCES auth.users(id),
    status VARCHAR(30) DEFAULT 'open', -- open, mitigated, accepted, closed
    source VARCHAR(50) DEFAULT 'manual', -- manual, ai_detected, historical
    ai_confidence INTEGER DEFAULT 0, -- 0-10000
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical Benchmarks (For deviation detection)
CREATE TABLE IF NOT EXISTS historical_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    csi_code VARCHAR(20),
    material_description VARCHAR(500),
    project_type VARCHAR(100),
    region VARCHAR(50),
    unit_of_measure VARCHAR(20),
    avg_unit_cost BIGINT NOT NULL, -- In cents
    min_unit_cost BIGINT,
    max_unit_cost BIGINT,
    std_deviation BIGINT,
    sample_count INTEGER DEFAULT 0,
    won_bid_avg BIGINT,
    lost_bid_avg BIGINT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deviation Alerts (±15% flagging from document)
CREATE TABLE IF NOT EXISTS deviation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    line_item_id UUID REFERENCES line_items(id) ON DELETE CASCADE,
    benchmark_id UUID REFERENCES historical_benchmarks(id),
    alert_type VARCHAR(50) NOT NULL, -- price_high, price_low, quantity_anomaly, scope_gap
    deviation_percent INTEGER NOT NULL, -- Basis points (1500 = 15%)
    threshold_percent INTEGER DEFAULT 1500, -- Default 15% threshold
    current_value BIGINT NOT NULL,
    benchmark_value BIGINT NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning', -- info, warning, critical
    ai_explanation TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Red Team Review Sessions
CREATE TABLE IF NOT EXISTS red_team_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    review_type VARCHAR(50) DEFAULT 'standard', -- standard, comprehensive, quick
    initiated_by UUID REFERENCES auth.users(id),
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed
    overall_risk_score INTEGER DEFAULT 0, -- 0-10000
    total_risks_identified INTEGER DEFAULT 0,
    critical_risks_count INTEGER DEFAULT 0,
    hidden_killers_count INTEGER DEFAULT 0,
    scope_gaps_count INTEGER DEFAULT 0,
    price_anomalies_count INTEGER DEFAULT 0,
    recommended_contingency INTEGER DEFAULT 0, -- Basis points
    executive_summary TEXT,
    detailed_findings JSONB DEFAULT '[]'::jsonb,
    ai_model_version VARCHAR(50),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECTION 3: CONFIDENCE SCORING (1-100%)
-- =====================================================

-- Estimate Confidence Scores
CREATE TABLE IF NOT EXISTS estimate_confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    overall_confidence INTEGER DEFAULT 0, -- 0-10000 (display as 0-100%)
    data_completeness_score INTEGER DEFAULT 0,
    pricing_accuracy_score INTEGER DEFAULT 0,
    scope_coverage_score INTEGER DEFAULT 0,
    historical_alignment_score INTEGER DEFAULT 0,
    market_data_freshness_score INTEGER DEFAULT 0,
    risk_assessment_score INTEGER DEFAULT 0,
    factors_breakdown JSONB DEFAULT '{}'::jsonb,
    low_confidence_items JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    ai_model_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(estimate_id)
);

-- Line Item Confidence Scores
CREATE TABLE IF NOT EXISTS line_item_confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_item_id UUID NOT NULL REFERENCES line_items(id) ON DELETE CASCADE,
    confidence_score INTEGER DEFAULT 0, -- 0-10000
    quantity_confidence INTEGER DEFAULT 0,
    unit_cost_confidence INTEGER DEFAULT 0,
    source_reliability INTEGER DEFAULT 0,
    basis_of_estimate TEXT, -- BOE narrative
    data_sources JSONB DEFAULT '[]'::jsonb,
    flags JSONB DEFAULT '[]'::jsonb,
    ai_notes TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(line_item_id)
);

-- =====================================================
-- SECTION 4: DRAWING VIEWER & AI TAKEOFF
-- =====================================================

-- Project Documents (Plans, Specs, etc.)
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    project_id UUID,
    document_type VARCHAR(50) NOT NULL, -- drawing, specification, addendum, rfi, schedule
    document_category VARCHAR(50), -- architectural, structural, mep, civil, general
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50), -- pdf, dwg, rvt, ifc
    page_count INTEGER DEFAULT 1,
    upload_status VARCHAR(30) DEFAULT 'uploaded', -- uploaded, processing, processed, error
    ocr_status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, failed
    ai_processed BOOLEAN DEFAULT false,
    version_number INTEGER DEFAULT 1,
    revision_id VARCHAR(50),
    revision_date DATE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawing Sheets (Individual pages/sheets)
CREATE TABLE IF NOT EXISTS drawing_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
    sheet_number VARCHAR(50) NOT NULL,
    sheet_name VARCHAR(200),
    sheet_type VARCHAR(50), -- plan, elevation, section, detail, schedule
    discipline VARCHAR(50), -- A (Arch), S (Struct), M (Mech), E (Elec), P (Plumb)
    page_index INTEGER NOT NULL,
    scale VARCHAR(50),
    scale_factor DECIMAL(10,4),
    width_pixels INTEGER,
    height_pixels INTEGER,
    thumbnail_path TEXT,
    processed_image_path TEXT,
    ai_extraction_status VARCHAR(30) DEFAULT 'pending',
    extraction_confidence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Takeoff Elements (Extracted quantities)
CREATE TABLE IF NOT EXISTS ai_takeoff_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES drawing_sheets(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    element_type VARCHAR(100) NOT NULL, -- wall, door, window, fixture, area, linear
    element_subtype VARCHAR(100),
    csi_code VARCHAR(20),
    material_description TEXT,
    quantity DECIMAL(20,4) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    calculation_method VARCHAR(50), -- area, linear, count, volume
    raw_measurement JSONB, -- Original measurement data
    coordinates JSONB, -- Bounding box or polygon coordinates
    grid_reference VARCHAR(50), -- Grid line reference (e.g., "A-2/B-3")
    layer_name VARCHAR(100), -- CAD layer if applicable
    detection_confidence INTEGER DEFAULT 0, -- 0-10000
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    linked_line_item_id UUID REFERENCES line_items(id),
    ai_model_version VARCHAR(50),
    extraction_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Takeoff Annotations (User corrections/additions)
CREATE TABLE IF NOT EXISTS takeoff_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES drawing_sheets(id) ON DELETE CASCADE,
    takeoff_element_id UUID REFERENCES ai_takeoff_elements(id) ON DELETE SET NULL,
    annotation_type VARCHAR(50) NOT NULL, -- correction, addition, deletion, note, highlight
    coordinates JSONB NOT NULL,
    content TEXT,
    color VARCHAR(20) DEFAULT '#FF0000',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECTION 5: SCOPE INTELLIGENCE
-- =====================================================

-- Invisible Scope Items (Auto-detected dependencies)
CREATE TABLE IF NOT EXISTS invisible_scope_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    parent_line_item_id UUID REFERENCES line_items(id),
    scope_type VARCHAR(50) NOT NULL, -- fastener, coating, prep, tool, accessory, misc
    item_description VARCHAR(500) NOT NULL,
    csi_code VARCHAR(20),
    estimated_quantity DECIMAL(20,4),
    unit_of_measure VARCHAR(20),
    estimated_unit_cost BIGINT, -- Cents
    estimated_total_cost BIGINT,
    calculation_basis TEXT,
    detection_source VARCHAR(50) DEFAULT 'ai', -- ai, rule_based, manual
    confidence_score INTEGER DEFAULT 0,
    included_in_estimate BOOLEAN DEFAULT false,
    linked_line_item_id UUID REFERENCES line_items(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Discrepancies (Drawing vs Spec conflicts)
CREATE TABLE IF NOT EXISTS document_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    discrepancy_type VARCHAR(50) NOT NULL, -- quantity_mismatch, spec_conflict, missing_detail, ambiguous
    severity VARCHAR(20) DEFAULT 'warning', -- info, warning, critical
    drawing_reference VARCHAR(100),
    spec_reference VARCHAR(100),
    description TEXT NOT NULL,
    drawing_states TEXT,
    spec_states TEXT,
    recommended_action TEXT,
    resolution_status VARCHAR(30) DEFAULT 'open', -- open, rfi_generated, resolved, accepted
    rfi_number VARCHAR(50),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    ai_detected BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFI Generator (Request for Information)
CREATE TABLE IF NOT EXISTS generated_rfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    discrepancy_id UUID REFERENCES document_discrepancies(id),
    rfi_number VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    question TEXT NOT NULL,
    background_context TEXT,
    referenced_documents JSONB DEFAULT '[]'::jsonb,
    suggested_resolution TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    status VARCHAR(30) DEFAULT 'draft', -- draft, submitted, answered, closed
    submitted_date DATE,
    response_due_date DATE,
    response_received_date DATE,
    response_text TEXT,
    cost_impact BIGINT DEFAULT 0,
    schedule_impact_days INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECTION 6: INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_market_prices_category ON market_price_indices(material_category);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_price_indices(commodity_code);
CREATE INDEX IF NOT EXISTS idx_market_history_index ON market_price_history(index_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_factors_zip ON geographic_cost_factors(zip_code);
CREATE INDEX IF NOT EXISTS idx_geo_factors_state ON geographic_cost_factors(state);
CREATE INDEX IF NOT EXISTS idx_risk_matrix_estimate ON estimate_risk_matrix(estimate_id);
CREATE INDEX IF NOT EXISTS idx_risk_matrix_type ON estimate_risk_matrix(risk_type);
CREATE INDEX IF NOT EXISTS idx_benchmarks_csi ON historical_benchmarks(csi_code);
CREATE INDEX IF NOT EXISTS idx_deviation_alerts_estimate ON deviation_alerts(estimate_id);
CREATE INDEX IF NOT EXISTS idx_deviation_alerts_severity ON deviation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_confidence_estimate ON estimate_confidence_scores(estimate_id);
CREATE INDEX IF NOT EXISTS idx_documents_estimate ON project_documents(estimate_id);
CREATE INDEX IF NOT EXISTS idx_sheets_document ON drawing_sheets(document_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_sheet ON ai_takeoff_elements(sheet_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_estimate ON ai_takeoff_elements(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invisible_scope_estimate ON invisible_scope_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_estimate ON document_discrepancies(estimate_id);
CREATE INDEX IF NOT EXISTS idx_rfis_estimate ON generated_rfis(estimate_id);

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE market_price_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_cost_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE volatility_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_risk_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_team_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_confidence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_item_confidence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_takeoff_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invisible_scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_rfis ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Read access for authenticated users)
CREATE POLICY "Users can view market data" ON market_price_indices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view price history" ON market_price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view geo factors" ON geographic_cost_factors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view volatility buffers" ON volatility_buffers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view risk categories" ON risk_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view benchmarks" ON historical_benchmarks FOR SELECT TO authenticated USING (true);

-- Estimate-linked tables inherit estimate access
CREATE POLICY "Users can view estimate risks" ON estimate_risk_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view deviation alerts" ON deviation_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view red team reviews" ON red_team_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view confidence scores" ON estimate_confidence_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view line confidence" ON line_item_confidence_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view documents" ON project_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view sheets" ON drawing_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view takeoff elements" ON ai_takeoff_elements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view annotations" ON takeoff_annotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view invisible scope" ON invisible_scope_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view discrepancies" ON document_discrepancies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view RFIs" ON generated_rfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view escalation clauses" ON escalation_clauses FOR SELECT TO authenticated USING (true);

-- =====================================================
-- SECTION 8: SEED DATA - RISK CATEGORIES
-- =====================================================

INSERT INTO risk_categories (category_code, category_name, description, default_impact_score, default_probability_score, sort_order) VALUES
('SCOPE', 'Scope Risk', 'Risks related to incomplete or unclear scope definition', 7000, 5000, 1),
('MARKET', 'Market Risk', 'Material price volatility and supply chain risks', 6000, 6000, 2),
('LABOR', 'Labor Risk', 'Labor availability, productivity, and wage risks', 5000, 5000, 3),
('SCHEDULE', 'Schedule Risk', 'Timeline and milestone risks', 7000, 4000, 4),
('SITE', 'Site Conditions', 'Unknown or adverse site conditions', 8000, 3000, 5),
('REGULATORY', 'Regulatory Risk', 'Permit, compliance, and regulatory risks', 6000, 3000, 6),
('SUBCONTRACTOR', 'Subcontractor Risk', 'Subcontractor performance and availability', 5000, 4000, 7),
('DESIGN', 'Design Risk', 'Design changes, errors, and omissions', 6000, 5000, 8),
('FINANCIAL', 'Financial Risk', 'Bonding, insurance, and cash flow risks', 7000, 2000, 9),
('WEATHER', 'Weather Risk', 'Weather-related delays and impacts', 4000, 4000, 10),
('HIDDEN', 'Hidden Killers', 'Unidentified risks that could significantly impact the project', 9000, 3000, 11)
ON CONFLICT (category_code) DO NOTHING;

-- =====================================================
-- SECTION 9: SEED DATA - MARKET INDICES
-- =====================================================

INSERT INTO market_price_indices (material_category, commodity_code, index_name, index_source, base_value, current_value, change_percent, volatility_score, trend_direction) VALUES
('Steel', 'STL-001', 'Hot-Rolled Steel Index', 'RS Means', 100000, 112500, 1250, 3500, 'up'),
('Copper', 'COP-001', 'Copper Wire Index', 'BLS', 100000, 108000, 800, 4200, 'volatile'),
('Lumber', 'LBR-001', 'Softwood Lumber Index', 'ENR', 100000, 95000, -500, 5000, 'down'),
('Concrete', 'CON-001', 'Ready-Mix Concrete Index', 'RS Means', 100000, 104000, 400, 1500, 'stable'),
('Fuel', 'FUL-001', 'Diesel Fuel Index', 'EIA', 100000, 118000, 1800, 4500, 'up'),
('Asphalt', 'ASP-001', 'Asphalt Binder Index', 'ENR', 100000, 110000, 1000, 3000, 'up'),
('Gypsum', 'GYP-001', 'Gypsum Board Index', 'RS Means', 100000, 102000, 200, 1200, 'stable'),
('Electrical', 'ELE-001', 'Electrical Components Index', 'BLS', 100000, 106000, 600, 2500, 'up'),
('HVAC', 'HVC-001', 'HVAC Equipment Index', 'RS Means', 100000, 109000, 900, 2800, 'up'),
('Plumbing', 'PLB-001', 'Plumbing Fixtures Index', 'RS Means', 100000, 105000, 500, 2000, 'stable')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 10: FUNCTIONS FOR AI AGENTS
-- =====================================================

-- Function: Calculate estimate confidence score
CREATE OR REPLACE FUNCTION calculate_estimate_confidence(p_estimate_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_data_completeness INTEGER;
    v_pricing_accuracy INTEGER;
    v_scope_coverage INTEGER;
    v_historical_alignment INTEGER;
    v_market_freshness INTEGER;
    v_risk_assessment INTEGER;
    v_overall INTEGER;
BEGIN
    -- Data Completeness: Check if line items have required fields
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE quantity > 0 AND unit_cost > 0 AND description IS NOT NULL) * 10000 / NULLIF(COUNT(*), 0)),
        0
    ) INTO v_data_completeness
    FROM line_items WHERE estimate_id = p_estimate_id;
    
    -- Pricing Accuracy: Check against benchmarks (simplified)
    SELECT COALESCE(10000 - (COUNT(*) FILTER (WHERE severity = 'critical') * 1000), 10000)
    INTO v_pricing_accuracy
    FROM deviation_alerts WHERE estimate_id = p_estimate_id;
    
    -- Scope Coverage: Check for invisible scope items included
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE included_in_estimate = true) * 10000 / NULLIF(COUNT(*), 0)),
        8000
    ) INTO v_scope_coverage
    FROM invisible_scope_items WHERE estimate_id = p_estimate_id;
    
    -- Historical Alignment: Based on deviation alerts
    SELECT COALESCE(10000 - (COUNT(*) * 500), 10000)
    INTO v_historical_alignment
    FROM deviation_alerts WHERE estimate_id = p_estimate_id AND NOT is_acknowledged;
    
    -- Market Data Freshness: Default to 8000 (80%)
    v_market_freshness := 8000;
    
    -- Risk Assessment: Based on red team review
    SELECT COALESCE(10000 - overall_risk_score, 7000)
    INTO v_risk_assessment
    FROM red_team_reviews WHERE estimate_id = p_estimate_id AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1;
    
    -- Calculate weighted overall score
    v_overall := (
        v_data_completeness * 20 +
        v_pricing_accuracy * 25 +
        v_scope_coverage * 15 +
        v_historical_alignment * 15 +
        v_market_freshness * 10 +
        COALESCE(v_risk_assessment, 7000) * 15
    ) / 100;
    
    -- Upsert confidence score
    INSERT INTO estimate_confidence_scores (
        estimate_id, overall_confidence, data_completeness_score, pricing_accuracy_score,
        scope_coverage_score, historical_alignment_score, market_data_freshness_score,
        risk_assessment_score, calculated_at
    ) VALUES (
        p_estimate_id, v_overall, v_data_completeness, v_pricing_accuracy,
        v_scope_coverage, v_historical_alignment, v_market_freshness,
        COALESCE(v_risk_assessment, 7000), NOW()
    )
    ON CONFLICT (estimate_id) DO UPDATE SET
        overall_confidence = EXCLUDED.overall_confidence,
        data_completeness_score = EXCLUDED.data_completeness_score,
        pricing_accuracy_score = EXCLUDED.pricing_accuracy_score,
        scope_coverage_score = EXCLUDED.scope_coverage_score,
        historical_alignment_score = EXCLUDED.historical_alignment_score,
        market_data_freshness_score = EXCLUDED.market_data_freshness_score,
        risk_assessment_score = EXCLUDED.risk_assessment_score,
        calculated_at = NOW(),
        updated_at = NOW();
    
    RETURN v_overall;
END;
$$ LANGUAGE plpgsql;

-- Function: Check for price deviations (±15% threshold)
CREATE OR REPLACE FUNCTION check_price_deviations(p_estimate_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_alerts_created INTEGER := 0;
    v_line_item RECORD;
    v_benchmark RECORD;
    v_deviation INTEGER;
BEGIN
    FOR v_line_item IN 
        SELECT li.*, cs.code as csi_code
        FROM line_items li
        LEFT JOIN csi_codes cs ON li.csi_code_id = cs.id
        WHERE li.estimate_id = p_estimate_id
    LOOP
        -- Find matching benchmark
        SELECT * INTO v_benchmark
        FROM historical_benchmarks
        WHERE csi_code = v_line_item.csi_code
          AND unit_of_measure = v_line_item.unit_of_measure
          AND is_active = true
        LIMIT 1;
        
        IF v_benchmark.id IS NOT NULL AND v_benchmark.avg_unit_cost > 0 THEN
            -- Calculate deviation in basis points
            v_deviation := ((v_line_item.unit_cost - v_benchmark.avg_unit_cost) * 10000) / v_benchmark.avg_unit_cost;
            
            -- Check if exceeds ±15% (1500 basis points)
            IF ABS(v_deviation) > 1500 THEN
                INSERT INTO deviation_alerts (
                    estimate_id, line_item_id, benchmark_id, alert_type,
                    deviation_percent, threshold_percent, current_value, benchmark_value,
                    severity, ai_explanation
                ) VALUES (
                    p_estimate_id, v_line_item.id, v_benchmark.id,
                    CASE WHEN v_deviation > 0 THEN 'price_high' ELSE 'price_low' END,
                    v_deviation, 1500, v_line_item.unit_cost, v_benchmark.avg_unit_cost,
                    CASE WHEN ABS(v_deviation) > 3000 THEN 'critical' ELSE 'warning' END,
                    'Unit cost deviates ' || ROUND(ABS(v_deviation)::NUMERIC / 100, 1) || '% from historical average'
                );
                v_alerts_created := v_alerts_created + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_alerts_created;
END;
$$ LANGUAGE plpgsql;

-- Function: Apply geographic cost adjustment
CREATE OR REPLACE FUNCTION apply_geo_adjustment(
    p_base_cost BIGINT,
    p_zip_code VARCHAR(10),
    p_cost_type VARCHAR(20) DEFAULT 'material'
)
RETURNS BIGINT AS $$
DECLARE
    v_factor INTEGER;
    v_adjusted BIGINT;
BEGIN
    SELECT 
        CASE p_cost_type
            WHEN 'labor' THEN labor_factor
            WHEN 'material' THEN material_factor
            WHEN 'equipment' THEN equipment_factor
            ELSE general_conditions_factor
        END INTO v_factor
    FROM geographic_cost_factors
    WHERE zip_code = p_zip_code AND is_active = true
    ORDER BY effective_date DESC
    LIMIT 1;
    
    IF v_factor IS NULL THEN
        v_factor := 10000; -- Default 1.0x
    END IF;
    
    v_adjusted := (p_base_cost * v_factor) / 10000;
    RETURN v_adjusted;
END;
$$ LANGUAGE plpgsql;

-- Function: Get volatility buffer for material
CREATE OR REPLACE FUNCTION get_volatility_buffer(p_material_category VARCHAR(100))
RETURNS INTEGER AS $$
DECLARE
    v_buffer INTEGER;
BEGIN
    SELECT buffer_percent INTO v_buffer
    FROM volatility_buffers
    WHERE material_category = p_material_category AND is_active = true
    LIMIT 1;
    
    RETURN COALESCE(v_buffer, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE market_price_indices IS 'Real-time market price tracking for commodities and materials';
COMMENT ON TABLE estimate_risk_matrix IS 'Risk analysis matrix with Hidden Killers detection per estimate';
COMMENT ON TABLE estimate_confidence_scores IS 'AI-calculated confidence scores (1-100%) for estimates';
COMMENT ON TABLE ai_takeoff_elements IS 'AI-extracted quantities from drawings with coordinates for viewer linking';
COMMENT ON TABLE deviation_alerts IS 'Automated alerts for ±15% price deviations from benchmarks';
