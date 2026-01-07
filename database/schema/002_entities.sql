-- ============================================================
-- SECTION 2: ENTITY TABLES (Agencies, Vendors, Vehicles, Awards)
-- ============================================================

-- Government Agencies
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    agency_code VARCHAR(50) UNIQUE,
    cgac_code VARCHAR(10),
    
    -- Details
    name VARCHAR(300) NOT NULL,
    abbreviation VARCHAR(50),
    type VARCHAR(50),                        -- Cabinet, Independent, Sub-agency
    parent_agency_id UUID REFERENCES agencies(id),
    
    -- Contact
    website TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency Offices
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    
    office_code VARCHAR(50),
    name VARCHAR(300) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors / Contractors (Competitors & Partners)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    uei VARCHAR(20) UNIQUE,                  -- Unique Entity Identifier
    cage_code VARCHAR(10),
    duns VARCHAR(20),                        -- Legacy
    
    -- Details
    name VARCHAR(300) NOT NULL,
    dba_name VARCHAR(300),
    
    -- Classification
    business_types TEXT[],                   -- Array: 8(a), SDVOSB, WOSB, etc.
    naics_codes TEXT[],                      -- Array of NAICS codes
    size_standard VARCHAR(50),               -- Small, Large, etc.
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Contact
    website TEXT,
    phone VARCHAR(50),
    
    -- Internal flags
    is_competitor BOOLEAN DEFAULT FALSE,
    is_partner BOOLEAN DEFAULT FALSE,
    is_teaming_target BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Vehicles (IDIQs, GWACs, BPAs)
CREATE TABLE contract_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    vehicle_number VARCHAR(100) UNIQUE,
    piid VARCHAR(100),                       -- Procurement Instrument ID
    
    -- Details
    name VARCHAR(300) NOT NULL,
    description TEXT,
    type VARCHAR(50),                        -- IDIQ, GWAC, BPA, FSS
    
    -- Agency
    awarding_agency_id UUID REFERENCES agencies(id),
    
    -- Dates
    award_date DATE,
    start_date DATE,
    end_date DATE,
    ordering_period_end DATE,
    
    -- Value
    ceiling_value DECIMAL(15,2),
    obligated_value DECIMAL(15,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Holders (which vendors hold which vehicles)
CREATE TABLE vehicle_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES contract_vehicles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    holder_type VARCHAR(50),                 -- Prime, Pool holder
    award_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vehicle_id, vendor_id)
);
