-- ============================================================
-- OC Pipeline - Cost Codes Module Migration
-- Supports CSI MasterFormat, Uniformat II, RS Means standards
-- ============================================================

-- Cost codes table
CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    standard_type VARCHAR(20) DEFAULT 'custom' CHECK (standard_type IN ('csi', 'uniformat', 'rsmeans', 'custom')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, organization_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cost_codes_code ON cost_codes(code);
CREATE INDEX IF NOT EXISTS idx_cost_codes_parent ON cost_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_codes_standard ON cost_codes(standard_type);
CREATE INDEX IF NOT EXISTS idx_cost_codes_org ON cost_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_cost_codes_active ON cost_codes(is_active);

-- Standard database imports table (CSI MasterFormat, etc.)
CREATE TABLE IF NOT EXISTS cost_code_standard_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    standard_type VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import history for tracking
CREATE TABLE IF NOT EXISTS cost_code_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    source_type VARCHAR(50) NOT NULL, -- 'csv', 'csi', 'uniformat', 'rsmeans'
    source_name VARCHAR(255),
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    error_log TEXT,
    imported_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_standard_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_codes
CREATE POLICY "cost_codes_select" ON cost_codes
    FOR SELECT USING (
        organization_id IS NULL OR 
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
    );

CREATE POLICY "cost_codes_insert" ON cost_codes
    FOR INSERT WITH CHECK (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
    );

CREATE POLICY "cost_codes_update" ON cost_codes
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cost_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cost_codes_updated_at
    BEFORE UPDATE ON cost_codes
    FOR EACH ROW EXECUTE FUNCTION update_cost_codes_updated_at();

-- ============================================================
-- CSI MasterFormat 2016 Level 1 Seed Data
-- ============================================================
INSERT INTO cost_codes (code, name, level, standard_type) VALUES
('00', 'Procurement and Contracting Requirements', 1, 'csi'),
('01', 'General Requirements', 1, 'csi'),
('02', 'Existing Conditions', 1, 'csi'),
('03', 'Concrete', 1, 'csi'),
('04', 'Masonry', 1, 'csi'),
('05', 'Metals', 1, 'csi'),
('06', 'Wood, Plastics, and Composites', 1, 'csi'),
('07', 'Thermal and Moisture Protection', 1, 'csi'),
('08', 'Openings', 1, 'csi'),
('09', 'Finishes', 1, 'csi'),
('10', 'Specialties', 1, 'csi'),
('11', 'Equipment', 1, 'csi'),
('12', 'Furnishings', 1, 'csi'),
('13', 'Special Construction', 1, 'csi'),
('14', 'Conveying Equipment', 1, 'csi'),
('21', 'Fire Suppression', 1, 'csi'),
('22', 'Plumbing', 1, 'csi'),
('23', 'Heating, Ventilating, and Air Conditioning (HVAC)', 1, 'csi'),
('25', 'Integrated Automation', 1, 'csi'),
('26', 'Electrical', 1, 'csi'),
('27', 'Communications', 1, 'csi'),
('28', 'Electronic Safety and Security', 1, 'csi'),
('31', 'Earthwork', 1, 'csi'),
('32', 'Exterior Improvements', 1, 'csi'),
('33', 'Utilities', 1, 'csi'),
('34', 'Transportation', 1, 'csi'),
('35', 'Waterway and Marine Construction', 1, 'csi'),
('40', 'Process Integration', 1, 'csi'),
('41', 'Material Processing and Handling Equipment', 1, 'csi'),
('42', 'Process Heating, Cooling, and Drying Equipment', 1, 'csi'),
('43', 'Process Gas and Liquid Handling, Purification, and Storage Equipment', 1, 'csi'),
('44', 'Pollution and Waste Control Equipment', 1, 'csi'),
('45', 'Industry-Specific Manufacturing Equipment', 1, 'csi'),
('46', 'Water and Wastewater Equipment', 1, 'csi'),
('48', 'Electrical Power Generation', 1, 'csi')
ON CONFLICT DO NOTHING;
