-- ============================================================
-- OC PIPELINE - ELITE MVP DATABASE SCHEMA
-- Pipeline Intelligence & Pursuit Execution Platform
-- ============================================================

-- ============================================================
-- SECTION 1: CORE OPPORTUNITY TABLES
-- ============================================================

-- Primary opportunities table (federal solicitations)
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External identifiers
    notice_id VARCHAR(100) UNIQUE,
    solicitation_number VARCHAR(100),
    
    -- Core metadata
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    type VARCHAR(50),
    set_aside_type VARCHAR(100),
    competition_type VARCHAR(50),
    contract_type VARCHAR(50),
    
    -- Codes
    naics_code VARCHAR(10),
    naics_description TEXT,
    psc_code VARCHAR(20),
    psc_description TEXT,
    
    -- Value
    estimated_value_low DECIMAL(15,2),
    estimated_value_high DECIMAL(15,2),
    award_value DECIMAL(15,2),
    
    -- Dates
    posted_date TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ,
    archive_date TIMESTAMPTZ,
    award_date TIMESTAMPTZ,
    
    -- Location
    place_city VARCHAR(100),
    place_state VARCHAR(50),
    place_zip VARCHAR(20),
    place_country VARCHAR(100) DEFAULT 'USA',
    
    -- Agency linkage
    agency_id UUID,
    sub_agency_id UUID,
    office_id UUID,
    vehicle_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(50) DEFAULT 'sam_gov',
    source_url TEXT,
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    
    -- Full-text search
    search_vector TSVECTOR
);

-- Points of Contact
CREATE TABLE opportunity_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_type VARCHAR(50),
    name VARCHAR(200),
    title VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amendments
CREATE TABLE opportunity_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    amendment_number VARCHAR(50),
    amendment_date TIMESTAMPTZ,
    description TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_opportunities_notice_id ON opportunities(notice_id);
CREATE INDEX idx_opportunities_naics ON opportunities(naics_code);
CREATE INDEX idx_opportunities_set_aside ON opportunities(set_aside_type);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_posted ON opportunities(posted_date);
CREATE INDEX idx_opportunities_deadline ON opportunities(response_deadline);
CREATE INDEX idx_opportunities_search ON opportunities USING GIN(search_vector);
