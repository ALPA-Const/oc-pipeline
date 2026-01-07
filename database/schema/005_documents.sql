-- ============================================================
-- SECTION 5: DOCUMENT MANAGEMENT TABLES
-- ============================================================

-- Documents (all ingested files)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File info
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500),
    file_extension VARCHAR(20),
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Storage
    storage_path TEXT NOT NULL,              -- Supabase storage path
    storage_bucket VARCHAR(100) DEFAULT 'documents',
    
    -- Classification (AI-assisted)
    document_type VARCHAR(100),              -- RFP, Amendment, SOW, Drawings, etc.
    document_category VARCHAR(100),          -- Solicitation, Proposal, Contract, etc.
    classification_confidence DECIMAL(3,2),
    classified_at TIMESTAMPTZ,
    classified_by VARCHAR(20),               -- ai, manual
    
    -- Source
    source VARCHAR(50),                      -- sam_gov, upload, email, etc.
    source_url TEXT,
    
    -- Version control
    version INT DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    is_latest BOOLEAN DEFAULT TRUE,
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Extracted content
    extracted_text TEXT,
    page_count INT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID
);

-- Document Links (polymorphic associations)
CREATE TABLE document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Polymorphic link
    linked_entity_type VARCHAR(50) NOT NULL, -- opportunity, pursuit, agency, vendor, award, vehicle
    linked_entity_id UUID NOT NULL,
    
    -- Link metadata
    link_type VARCHAR(50),                   -- primary, attachment, reference
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(document_id, linked_entity_type, linked_entity_id)
);

-- Document Sections (AI-extracted)
CREATE TABLE document_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Section info
    section_type VARCHAR(100),               -- scope, requirements, evaluation_criteria, etc.
    section_title TEXT,
    section_number VARCHAR(50),
    
    -- Content
    content TEXT,
    page_start INT,
    page_end INT,
    
    -- Extraction metadata
    extraction_confidence DECIMAL(3,2),
    extracted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Extracted Data (key-value extraction)
CREATE TABLE document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Extraction
    field_name VARCHAR(100) NOT NULL,        -- response_deadline, contract_value, etc.
    field_value TEXT,
    field_type VARCHAR(50),                  -- date, currency, text, list
    
    -- Location in document
    page_number INT,
    location_context TEXT,
    
    -- Confidence
    confidence DECIMAL(3,2),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_document_links_entity ON document_links(linked_entity_type, linked_entity_id);
CREATE INDEX idx_document_sections_document ON document_sections(document_id);
CREATE INDEX idx_document_extractions_document ON document_extractions(document_id);
CREATE INDEX idx_documents_search ON documents USING GIN(to_tsvector('english', extracted_text));
