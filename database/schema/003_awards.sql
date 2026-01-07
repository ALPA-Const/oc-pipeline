-- ============================================================
-- SECTION 3: AWARDS & RELATIONSHIP TABLES
-- ============================================================

-- Contract Awards
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    piid VARCHAR(100),                       -- Procurement Instrument ID
    award_id VARCHAR(100) UNIQUE,
    referenced_idv_piid VARCHAR(100),        -- Parent vehicle if task order
    
    -- Linkages
    opportunity_id UUID REFERENCES opportunities(id),
    vehicle_id UUID REFERENCES contract_vehicles(id),
    vendor_id UUID REFERENCES vendors(id),   -- Awardee
    agency_id UUID REFERENCES agencies(id),
    
    -- Details
    title TEXT,
    description TEXT,
    
    -- Value
    base_value DECIMAL(15,2),
    total_value DECIMAL(15,2),
    obligated_amount DECIMAL(15,2),
    
    -- Dates
    award_date DATE,
    start_date DATE,
    end_date DATE,
    current_end_date DATE,                   -- With options
    
    -- Classification
    award_type VARCHAR(50),                  -- Definitive Contract, Task Order, Delivery Order
    set_aside_type VARCHAR(100),
    competition_type VARCHAR(50),
    
    -- Location
    place_city VARCHAR(100),
    place_state VARCHAR(50),
    place_country VARCHAR(100) DEFAULT 'USA',
    
    -- Source
    source VARCHAR(50) DEFAULT 'fpds',
    source_url TEXT,
    raw_data JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award Modifications
CREATE TABLE award_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    
    modification_number VARCHAR(50),
    modification_date DATE,
    action_type VARCHAR(100),
    description TEXT,
    
    amount_change DECIMAL(15,2),
    new_total DECIMAL(15,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incumbents (who currently holds similar contracts)
CREATE TABLE incumbents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What they're incumbent on
    opportunity_id UUID REFERENCES opportunities(id),
    agency_id UUID REFERENCES agencies(id),
    naics_code VARCHAR(10),
    
    -- Who is incumbent
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    
    -- Supporting award
    award_id UUID REFERENCES awards(id),
    
    -- Confidence
    confidence_level VARCHAR(20) DEFAULT 'high',  -- high, medium, low, inferred
    source VARCHAR(50),
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_awards_opportunity ON awards(opportunity_id);
CREATE INDEX idx_awards_vendor ON awards(vendor_id);
CREATE INDEX idx_awards_agency ON awards(agency_id);
CREATE INDEX idx_awards_date ON awards(award_date);
CREATE INDEX idx_incumbents_opportunity ON incumbents(opportunity_id);
CREATE INDEX idx_incumbents_vendor ON incumbents(vendor_id);
