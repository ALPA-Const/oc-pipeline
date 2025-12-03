-- ============================================
-- MIGRATION 005: INTELLIGENT SUBMITTAL & CONSTRUCTION DOCUMENTATION MODULE
-- ============================================
-- Module: ISDC (Intelligent Submittal & Document Control)
-- Purpose: Federal-grade construction submittal tracking and closeout management
-- Compliance: NIST 800-171, FAR/DFAR, SOC 2
-- Created: 2024-01-20
-- FIXED: 2024-12-01 - Updated for OC Pipeline database structure
-- Changes: companies→vendors, project_members→project_memberships, submittals→submittals_isdc
-- ============================================

BEGIN;

-- ============================================
-- TABLE: specifications
-- Purpose: Store specification documents (CSI MasterFormat)
-- ============================================
CREATE TABLE IF NOT EXISTS specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('specification', 'addendum', 'amendment')),
    division TEXT, -- CSI Division (00-49)
    section_number TEXT, -- e.g., "03 30 00"
    section_title TEXT,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_processed_at TIMESTAMPTZ,
    ai_confidence_score DECIMAL(5,2),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: drawings
-- Purpose: Store construction drawings
-- ============================================
CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    drawing_number TEXT NOT NULL,
    drawing_title TEXT,
    discipline TEXT CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'landscape', 'fire_protection')),
    revision TEXT,
    revision_date DATE,
    file_path TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'dwg', 'dxf', 'rvt')),
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_processed_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: submittals_isdc
-- Purpose: Master submittal register (ISDC version - parallel to existing submittals)
-- Note: Named submittals_isdc to avoid conflict with existing submittals table
-- ============================================
CREATE TABLE IF NOT EXISTS submittals_isdc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submittal_number TEXT NOT NULL,
    revision TEXT DEFAULT 'A',
    spec_section TEXT NOT NULL, -- e.g., "03 30 00"
    submittal_title TEXT NOT NULL,
    submittal_type TEXT NOT NULL CHECK (submittal_type IN (
        'action', 'informational', 'closeout', 'product_data', 
        'shop_drawing', 'sample', 'test_report', 'certificate',
        'warranty', 'om_manual', 'as_built', 'leed'
    )),
    description TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    
    -- Source Tracking
    source_type TEXT CHECK (source_type IN ('spec_ai', 'drawing_ai', 'manual', 'import')),
    source_document_id UUID,
    ai_extracted BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5,2),
    
    -- Assignments (FIXED: references vendors instead of companies)
    responsible_contractor UUID REFERENCES vendors(id),
    assigned_to UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    
    -- Dates
    required_date DATE,
    submitted_date DATE,
    reviewed_date DATE,
    approved_date DATE,
    
    -- Status Workflow
    status TEXT DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'submitted', 'under_review',
        'approved', 'approved_as_noted', 'revise_resubmit', 'rejected',
        'for_record_only', 'void'
    )),
    
    -- Compliance Flags
    is_long_lead BOOLEAN DEFAULT FALSE,
    is_critical_path BOOLEAN DEFAULT FALSE,
    buy_american_required BOOLEAN DEFAULT FALSE,
    davis_bacon_applicable BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, submittal_number, revision)
);

-- ============================================
-- TABLE: submittal_items_isdc
-- Purpose: Line items within a submittal
-- ============================================
CREATE TABLE IF NOT EXISTS submittal_items_isdc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals_isdc(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    manufacturer TEXT,
    model_number TEXT,
    quantity DECIMAL(12,2),
    unit TEXT,
    location TEXT, -- Where in the building
    specification_reference TEXT, -- Spec section/paragraph
    drawing_reference TEXT, -- Drawing number/detail
    substitution_allowed BOOLEAN DEFAULT TRUE,
    approved_manufacturer TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(submittal_id, item_number)
);

-- ============================================
-- TABLE: submittal_reviews_isdc
-- Purpose: Approval workflow tracking
-- ============================================
CREATE TABLE IF NOT EXISTS submittal_reviews_isdc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals_isdc(id) ON DELETE CASCADE,
    review_round INTEGER DEFAULT 1,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewer_role TEXT CHECK (reviewer_role IN ('contractor', 'architect', 'engineer', 'owner', 'agency')),
    review_action TEXT CHECK (review_action IN (
        'approved', 'approved_as_noted', 'revise_resubmit', 
        'rejected', 'for_record_only', 'no_action_required'
    )),
    comments TEXT,
    markup_file_path TEXT, -- Path to marked-up document
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: closeout_documents
-- Purpose: Track closeout documentation requirements
-- ============================================
CREATE TABLE IF NOT EXISTS closeout_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submittal_id UUID REFERENCES submittals_isdc(id),
    document_type TEXT NOT NULL CHECK (document_type IN (
        'warranty', 'om_manual', 'as_built', 'test_report',
        'certificate', 'attic_stock', 'spare_parts', 'training_record',
        'commissioning', 'leed_documentation', 'final_inspection'
    )),
    document_title TEXT NOT NULL,
    spec_section TEXT,
    
    -- Responsibility (FIXED: references vendors instead of companies)
    subcontractor_id UUID REFERENCES vendors(id),
    responsible_contact TEXT,
    
    -- Requirements
    required BOOLEAN DEFAULT TRUE,
    required_copies INTEGER DEFAULT 1,
    format_required TEXT CHECK (format_required IN ('digital', 'hard_copy', 'both')),
    
    -- Collection Status
    status TEXT DEFAULT 'not_received' CHECK (status IN (
        'not_received', 'requested', 'received', 'under_review',
        'accepted', 'rejected', 'resubmit_required'
    )),
    received_date DATE,
    accepted_date DATE,
    
    -- Files
    file_path TEXT,
    file_name TEXT,
    
    -- Warranty Specific
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_duration_months INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: closeout_outreach
-- Purpose: Automated subcontractor communications
-- ============================================
CREATE TABLE IF NOT EXISTS closeout_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES vendors(id), -- FIXED: references vendors
    outreach_type TEXT CHECK (outreach_type IN ('initial_request', 'reminder_1', 'reminder_2', 'escalation', 'final_notice')),
    subject TEXT,
    message_body TEXT,
    documents_requested JSONB, -- Array of closeout_document_ids
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(id),
    opened_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_notes TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'sent', 'opened', 'responded', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: ai_extractions
-- Purpose: Audit trail for AI processing
-- ============================================
CREATE TABLE IF NOT EXISTS ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_document_id UUID NOT NULL,
    source_table TEXT NOT NULL CHECK (source_table IN ('specifications', 'drawings')),
    extraction_type TEXT NOT NULL CHECK (extraction_type IN ('submittal_requirement', 'product_reference', 'drawing_callout', 'spec_section')),
    
    -- Extracted Data
    extracted_data JSONB NOT NULL,
    raw_text TEXT,
    page_number INTEGER,
    location_in_document TEXT,
    
    -- AI Processing Info
    ai_model TEXT,
    ai_prompt_version TEXT,
    confidence_score DECIMAL(5,2),
    processing_time_ms INTEGER,
    
    -- Status
    status TEXT DEFAULT 'extracted' CHECK (status IN ('extracted', 'reviewed', 'accepted', 'rejected', 'converted')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    converted_to_submittal_id UUID REFERENCES submittals_isdc(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Specifications indexes
CREATE INDEX IF NOT EXISTS idx_specifications_project ON specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_specifications_section ON specifications(section_number);
CREATE INDEX IF NOT EXISTS idx_specifications_status ON specifications(processing_status);

-- Drawings indexes
CREATE INDEX IF NOT EXISTS idx_drawings_project ON drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_drawings_number ON drawings(drawing_number);
CREATE INDEX IF NOT EXISTS idx_drawings_discipline ON drawings(discipline);

-- Submittals ISDC indexes
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_project ON submittals_isdc(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_spec ON submittals_isdc(spec_section);
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_status ON submittals_isdc(status);
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_contractor ON submittals_isdc(responsible_contractor);
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_assigned ON submittals_isdc(assigned_to);
CREATE INDEX IF NOT EXISTS idx_submittals_isdc_required_date ON submittals_isdc(required_date);

-- Submittal items ISDC indexes
CREATE INDEX IF NOT EXISTS idx_submittal_items_isdc_submittal ON submittal_items_isdc(submittal_id);

-- Submittal reviews ISDC indexes
CREATE INDEX IF NOT EXISTS idx_submittal_reviews_isdc_submittal ON submittal_reviews_isdc(submittal_id);
CREATE INDEX IF NOT EXISTS idx_submittal_reviews_isdc_reviewer ON submittal_reviews_isdc(reviewer_id);

-- Closeout documents indexes
CREATE INDEX IF NOT EXISTS idx_closeout_documents_project ON closeout_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_closeout_documents_status ON closeout_documents(status);
CREATE INDEX IF NOT EXISTS idx_closeout_documents_type ON closeout_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_closeout_documents_subcontractor ON closeout_documents(subcontractor_id);

-- Closeout outreach indexes
CREATE INDEX IF NOT EXISTS idx_closeout_outreach_project ON closeout_outreach(project_id);
CREATE INDEX IF NOT EXISTS idx_closeout_outreach_subcontractor ON closeout_outreach(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_closeout_outreach_status ON closeout_outreach(status);

-- AI extractions indexes
CREATE INDEX IF NOT EXISTS idx_ai_extractions_project ON ai_extractions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_extractions_source ON ai_extractions(source_document_id);
CREATE INDEX IF NOT EXISTS idx_ai_extractions_type ON ai_extractions(extraction_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- FIXED: Uses project_memberships instead of project_members
-- ============================================

-- Enable RLS on all tables
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals_isdc ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_items_isdc ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_reviews_isdc ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view specifications for projects they have access to
CREATE POLICY specifications_select_policy ON specifications
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY specifications_insert_policy ON specifications
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY specifications_update_policy ON specifications
    FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Drawings
CREATE POLICY drawings_select_policy ON drawings
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY drawings_insert_policy ON drawings
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Submittals ISDC
CREATE POLICY submittals_isdc_select_policy ON submittals_isdc
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY submittals_isdc_insert_policy ON submittals_isdc
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY submittals_isdc_update_policy ON submittals_isdc
    FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY submittals_isdc_delete_policy ON submittals_isdc
    FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Submittal Items ISDC (inherit from parent submittal)
CREATE POLICY submittal_items_isdc_select_policy ON submittal_items_isdc
    FOR SELECT
    USING (
        submittal_id IN (
            SELECT id FROM submittals_isdc WHERE project_id IN (
                SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY submittal_items_isdc_insert_policy ON submittal_items_isdc
    FOR INSERT
    WITH CHECK (
        submittal_id IN (
            SELECT id FROM submittals_isdc WHERE project_id IN (
                SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policy: Submittal Reviews ISDC
CREATE POLICY submittal_reviews_isdc_select_policy ON submittal_reviews_isdc
    FOR SELECT
    USING (
        submittal_id IN (
            SELECT id FROM submittals_isdc WHERE project_id IN (
                SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY submittal_reviews_isdc_insert_policy ON submittal_reviews_isdc
    FOR INSERT
    WITH CHECK (
        submittal_id IN (
            SELECT id FROM submittals_isdc WHERE project_id IN (
                SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policy: Closeout Documents
CREATE POLICY closeout_documents_select_policy ON closeout_documents
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY closeout_documents_insert_policy ON closeout_documents
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY closeout_documents_update_policy ON closeout_documents
    FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Closeout Outreach
CREATE POLICY closeout_outreach_select_policy ON closeout_outreach
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY closeout_outreach_insert_policy ON closeout_outreach
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: AI Extractions
CREATE POLICY ai_extractions_select_policy ON ai_extractions
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ai_extractions_insert_policy ON ai_extractions
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drawings_updated_at BEFORE UPDATE ON drawings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submittals_isdc_updated_at BEFORE UPDATE ON submittals_isdc
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submittal_items_isdc_updated_at BEFORE UPDATE ON submittal_items_isdc
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_closeout_documents_updated_at BEFORE UPDATE ON closeout_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables Created: 8
--   - specifications
--   - drawings
--   - submittals_isdc (renamed from submittals to avoid conflict)
--   - submittal_items_isdc
--   - submittal_reviews_isdc
--   - closeout_documents
--   - closeout_outreach
--   - ai_extractions
-- Indexes Created: 21
-- RLS Policies Created: 18
-- Triggers Created: 5
-- ============================================
-- FIXES APPLIED:
--   - companies → vendors (3 references)
--   - project_members → project_memberships (18 RLS policies)
--   - submittals → submittals_isdc (avoid existing table conflict)
--   - submittal_items → submittal_items_isdc
--   - submittal_reviews → submittal_reviews_isdc
-- ============================================