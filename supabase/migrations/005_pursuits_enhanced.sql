-- ============================================================================
-- OC Pipeline - Pursuits Module Database Migration
-- File: 005_pursuits_enhanced.sql
-- Description: Enhanced pursuits table with all fields for federal contracting
-- ============================================================================

-- First, check if pursuits table exists and add missing columns
-- If creating fresh, use the full CREATE TABLE below

-- ============================================================================
-- OPTION A: If pursuits table already exists, run these ALTER statements
-- ============================================================================

DO $$ 
BEGIN
    -- Core identification fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'solicitation_number') THEN
        ALTER TABLE pursuits ADD COLUMN solicitation_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'sam_gov_url') THEN
        ALTER TABLE pursuits ADD COLUMN sam_gov_url TEXT;
    END IF;

    -- Agency and location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'contracting_office') THEN
        ALTER TABLE pursuits ADD COLUMN contracting_office VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'city') THEN
        ALTER TABLE pursuits ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'state') THEN
        ALTER TABLE pursuits ADD COLUMN state VARCHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'address') THEN
        ALTER TABLE pursuits ADD COLUMN address TEXT;
    END IF;

    -- Federal contracting specific
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'set_aside') THEN
        ALTER TABLE pursuits ADD COLUMN set_aside VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'naics_code') THEN
        ALTER TABLE pursuits ADD COLUMN naics_code VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'naics_description') THEN
        ALTER TABLE pursuits ADD COLUMN naics_description VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'psc_code') THEN
        ALTER TABLE pursuits ADD COLUMN psc_code VARCHAR(10);
    END IF;

    -- Win probability and stage tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'win_probability') THEN
        ALTER TABLE pursuits ADD COLUMN win_probability INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'stage') THEN
        ALTER TABLE pursuits ADD COLUMN stage VARCHAR(50) DEFAULT 'lead';
    END IF;

    -- Dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'posted_date') THEN
        ALTER TABLE pursuits ADD COLUMN posted_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'site_visit_date') THEN
        ALTER TABLE pursuits ADD COLUMN site_visit_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'questions_due_date') THEN
        ALTER TABLE pursuits ADD COLUMN questions_due_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'estimated_start_date') THEN
        ALTER TABLE pursuits ADD COLUMN estimated_start_date DATE;
    END IF;

    -- Contract details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'contract_type') THEN
        ALTER TABLE pursuits ADD COLUMN contract_type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'period_of_performance') THEN
        ALTER TABLE pursuits ADD COLUMN period_of_performance VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'place_of_performance') THEN
        ALTER TABLE pursuits ADD COLUMN place_of_performance TEXT;
    END IF;

    -- Point of contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'poc_name') THEN
        ALTER TABLE pursuits ADD COLUMN poc_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'poc_email') THEN
        ALTER TABLE pursuits ADD COLUMN poc_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'poc_phone') THEN
        ALTER TABLE pursuits ADD COLUMN poc_phone VARCHAR(50);
    END IF;

    -- Competition info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'incumbent') THEN
        ALTER TABLE pursuits ADD COLUMN incumbent VARCHAR(255);
    END IF;

    -- Requirements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'bonding_required') THEN
        ALTER TABLE pursuits ADD COLUMN bonding_required BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'security_clearance') THEN
        ALTER TABLE pursuits ADD COLUMN security_clearance VARCHAR(100);
    END IF;

    -- Project classification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'project_type') THEN
        ALTER TABLE pursuits ADD COLUMN project_type VARCHAR(100);
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'notes') THEN
        ALTER TABLE pursuits ADD COLUMN notes TEXT;
    END IF;

    -- Audit fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'created_by') THEN
        ALTER TABLE pursuits ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pursuits' AND column_name = 'updated_by') THEN
        ALTER TABLE pursuits ADD COLUMN updated_by UUID;
    END IF;

END $$;


-- ============================================================================
-- INDEXES for pursuits table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pursuits_status ON pursuits(status);
CREATE INDEX IF NOT EXISTS idx_pursuits_stage ON pursuits(stage);
CREATE INDEX IF NOT EXISTS idx_pursuits_response_date ON pursuits(response_date);
CREATE INDEX IF NOT EXISTS idx_pursuits_agency ON pursuits(agency);
CREATE INDEX IF NOT EXISTS idx_pursuits_set_aside ON pursuits(set_aside);
CREATE INDEX IF NOT EXISTS idx_pursuits_solicitation ON pursuits(solicitation_number);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on pursuits table
ALTER TABLE pursuits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view pursuits in their organization
DROP POLICY IF EXISTS "Users can view own org pursuits" ON pursuits;
CREATE POLICY "Users can view own org pursuits" ON pursuits
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert pursuits in their organization
DROP POLICY IF EXISTS "Users can create pursuits in own org" ON pursuits;
CREATE POLICY "Users can create pursuits in own org" ON pursuits
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update pursuits in their organization
DROP POLICY IF EXISTS "Users can update own org pursuits" ON pursuits;
CREATE POLICY "Users can update own org pursuits" ON pursuits
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only admins/owners can delete pursuits
DROP POLICY IF EXISTS "Admins can delete pursuits" ON pursuits;
CREATE POLICY "Admins can delete pursuits" ON pursuits
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );


-- ============================================================================
-- PURSUIT ACTIVITIES TABLE (for timeline/history tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pursuit_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID,
    user_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pursuit_activities_pursuit ON pursuit_activities(pursuit_id);
CREATE INDEX IF NOT EXISTS idx_pursuit_activities_created ON pursuit_activities(created_at DESC);

-- RLS for pursuit_activities
ALTER TABLE pursuit_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pursuit activities" ON pursuit_activities;
CREATE POLICY "Users can view pursuit activities" ON pursuit_activities
    FOR SELECT
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create pursuit activities" ON pursuit_activities;
CREATE POLICY "Users can create pursuit activities" ON pursuit_activities
    FOR INSERT
    WITH CHECK (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );


-- ============================================================================
-- PURSUIT TEAM MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pursuit_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    user_id UUID,
    member_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_lead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pursuit_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pursuit_team_pursuit ON pursuit_team(pursuit_id);

-- RLS for pursuit_team
ALTER TABLE pursuit_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pursuit team" ON pursuit_team;
CREATE POLICY "Users can view pursuit team" ON pursuit_team
    FOR SELECT
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage pursuit team" ON pursuit_team;
CREATE POLICY "Users can manage pursuit team" ON pursuit_team
    FOR ALL
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );


-- ============================================================================
-- PURSUIT DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pursuit_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    category VARCHAR(100),
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pursuit_documents_pursuit ON pursuit_documents(pursuit_id);

-- RLS for pursuit_documents
ALTER TABLE pursuit_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pursuit documents" ON pursuit_documents;
CREATE POLICY "Users can view pursuit documents" ON pursuit_documents
    FOR SELECT
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage pursuit documents" ON pursuit_documents;
CREATE POLICY "Users can manage pursuit documents" ON pursuit_documents
    FOR ALL
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );


-- ============================================================================
-- GO/NO-GO DECISION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pursuit_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    decision VARCHAR(10) NOT NULL CHECK (decision IN ('go', 'no-go')),
    decision_date TIMESTAMPTZ DEFAULT NOW(),
    decided_by UUID,
    decided_by_name VARCHAR(255),
    notes TEXT,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pursuit_decisions_pursuit ON pursuit_decisions(pursuit_id);

-- RLS for pursuit_decisions
ALTER TABLE pursuit_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pursuit decisions" ON pursuit_decisions;
CREATE POLICY "Users can view pursuit decisions" ON pursuit_decisions
    FOR SELECT
    USING (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create pursuit decisions" ON pursuit_decisions;
CREATE POLICY "Users can create pursuit decisions" ON pursuit_decisions
    FOR INSERT
    WITH CHECK (
        pursuit_id IN (
            SELECT id FROM pursuits WHERE organization_id IN (
                SELECT organization_id FROM members WHERE user_id = auth.uid()
            )
        )
    );


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate days until due
CREATE OR REPLACE FUNCTION calculate_days_until_due(response_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(DAY FROM (response_date - NOW()))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate weighted value
CREATE OR REPLACE FUNCTION calculate_weighted_value(estimated_value DECIMAL, win_probability INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    RETURN estimated_value * (win_probability::DECIMAL / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pursuits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pursuits_updated_at ON pursuits;
CREATE TRIGGER pursuits_updated_at
    BEFORE UPDATE ON pursuits
    FOR EACH ROW
    EXECUTE FUNCTION update_pursuits_updated_at();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_pursuit_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pursuit_activities (pursuit_id, activity_type, description, user_id)
        VALUES (
            NEW.id,
            'status_change',
            'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pursuits_status_change ON pursuits;
CREATE TRIGGER pursuits_status_change
    AFTER UPDATE ON pursuits
    FOR EACH ROW
    EXECUTE FUNCTION log_pursuit_status_change();


-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active pursuits with calculated fields
CREATE OR REPLACE VIEW v_active_pursuits AS
SELECT 
    p.*,
    calculate_days_until_due(p.response_date) AS days_until_due,
    calculate_weighted_value(p.estimated_value, p.win_probability) AS weighted_value,
    CASE 
        WHEN calculate_days_until_due(p.response_date) < 0 THEN 'overdue'
        WHEN calculate_days_until_due(p.response_date) <= 7 THEN 'urgent'
        WHEN calculate_days_until_due(p.response_date) <= 14 THEN 'upcoming'
        ELSE 'on_track'
    END AS urgency_level
FROM pursuits p
WHERE p.status IN ('new', 'qualifying', 'go', 'submitted');

-- View: Pipeline metrics summary by organization
CREATE OR REPLACE VIEW v_pursuit_metrics AS
SELECT 
    organization_id,
    COUNT(*) FILTER (WHERE status IN ('new', 'qualifying', 'go', 'submitted')) AS active_pursuits,
    SUM(estimated_value) FILTER (WHERE status IN ('new', 'qualifying', 'go', 'submitted')) AS total_pipeline_value,
    SUM(calculate_weighted_value(estimated_value, win_probability)) FILTER (WHERE status IN ('new', 'qualifying', 'go', 'submitted')) AS weighted_pipeline_value,
    COUNT(*) FILTER (WHERE status = 'won') AS won_count,
    COUNT(*) FILTER (WHERE status = 'lost') AS lost_count,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
        THEN ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'won') / COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 1)
        ELSE 0 
    END AS win_rate,
    COUNT(*) FILTER (WHERE status IN ('new', 'qualifying', 'go') AND calculate_days_until_due(response_date) BETWEEN 0 AND 7) AS due_this_week,
    COUNT(*) FILTER (WHERE status IN ('new', 'qualifying', 'go') AND calculate_days_until_due(response_date) BETWEEN 0 AND 30) AS due_this_month
FROM pursuits
GROUP BY organization_id;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this migration with: psql -d your_database -f 005_pursuits_enhanced.sql
-- Or through Supabase Dashboard > SQL Editor
