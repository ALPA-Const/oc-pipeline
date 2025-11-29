-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 005: Safety (10), Procurement (10), Communications (10)
-- ============================================================

-- ============================================================
-- SAFETY MODULE (10 tables)
-- ============================================================

-- 1. SAFETY_PLANS
CREATE TABLE IF NOT EXISTS safety_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,

    -- Content
    content JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    incident_type VARCHAR(100), -- injury, near_miss, property_damage, environmental
    severity VARCHAR(50), -- first_aid, medical, lost_time, fatality

    -- Date/Time
    incident_date DATE NOT NULL,
    incident_time TIME,

    -- Location
    location VARCHAR(255),
    area VARCHAR(100),

    -- People involved
    injured_person_name VARCHAR(200),
    injured_person_company VARCHAR(200),
    injured_person_trade VARCHAR(100),

    -- Injury details
    body_part VARCHAR(100),
    injury_type VARCHAR(100),

    -- Days
    days_away INTEGER DEFAULT 0,
    days_restricted INTEGER DEFAULT 0,
    days_transfer INTEGER DEFAULT 0,

    -- OSHA recordable
    is_osha_recordable BOOLEAN DEFAULT false,
    osha_case_number VARCHAR(50),

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Witnesses
    witnesses JSONB DEFAULT '[]',

    -- Photos
    photos JSONB DEFAULT '[]',

    reported_by UUID REFERENCES users(id),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INCIDENT_INVESTIGATIONS
CREATE TABLE IF NOT EXISTS incident_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

    -- Investigation
    investigation_date DATE,
    investigator_name VARCHAR(200),
    investigator_user_id UUID REFERENCES users(id),

    -- Findings
    root_cause TEXT,
    contributing_factors JSONB DEFAULT '[]',
    findings TEXT,

    -- Corrective actions
    corrective_actions JSONB DEFAULT '[]',

    -- Preventive actions
    preventive_actions JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) DEFAULT 'in_progress',
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAFETY_OBSERVATIONS
CREATE TABLE IF NOT EXISTS safety_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Type
    observation_type VARCHAR(50), -- safe, at_risk
    category VARCHAR(100),

    -- Details
    observation TEXT NOT NULL,
    location VARCHAR(255),

    -- Action
    action_taken TEXT,

    -- Photos
    photos JSONB DEFAULT '[]',

    observed_by UUID REFERENCES users(id),
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOOLBOX_TALKS
CREATE TABLE IF NOT EXISTS toolbox_talks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Content
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,

    -- Meeting
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    duration_minutes INTEGER,

    -- Attendance
    attendees JSONB DEFAULT '[]',
    attendee_count INTEGER DEFAULT 0,

    -- Presenter
    presenter_name VARCHAR(200),
    presenter_user_id UUID REFERENCES users(id),

    -- Attachments
    attachment_ids JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JHAS (Job Hazard Analysis)
CREATE TABLE IF NOT EXISTS jhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Task
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    location VARCHAR(255),

    -- Analysis
    hazards JSONB DEFAULT '[]',
    controls JSONB DEFAULT '[]',

    -- PPE
    required_ppe JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SAFETY_INSPECTIONS
CREATE TABLE IF NOT EXISTS safety_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Type
    inspection_type VARCHAR(100),

    -- Date
    inspection_date DATE NOT NULL,

    -- Inspector
    inspector_name VARCHAR(200),
    inspector_user_id UUID REFERENCES users(id),

    -- Findings
    findings JSONB DEFAULT '[]',

    -- Score
    score DECIMAL(5, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'completed',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OSHA_LOGS
CREATE TABLE IF NOT EXISTS osha_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    year INTEGER NOT NULL,

    -- Log data (OSHA 300 format)
    log_data JSONB NOT NULL,

    -- Summary (OSHA 300A)
    summary_data JSONB DEFAULT '{}',

    -- Totals
    total_cases INTEGER DEFAULT 0,
    total_days_away INTEGER DEFAULT 0,
    total_days_restricted INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SAFETY_METRICS
CREATE TABLE IF NOT EXISTS safety_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    period DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'monthly',

    -- Hours
    hours_worked DECIMAL(15, 2) DEFAULT 0,

    -- Incidents
    recordable_incidents INTEGER DEFAULT 0,
    lost_time_incidents INTEGER DEFAULT 0,
    dart_cases INTEGER DEFAULT 0,
    first_aid_cases INTEGER DEFAULT 0,
    near_misses INTEGER DEFAULT 0,

    -- Rates
    trir DECIMAL(8, 4) DEFAULT 0, -- Total Recordable Incident Rate
    dart DECIMAL(8, 4) DEFAULT 0, -- Days Away, Restricted, Transfer Rate
    ltir DECIMAL(8, 4) DEFAULT 0, -- Lost Time Incident Rate

    -- EMR
    emr DECIMAL(5, 3),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CERTIFICATIONS
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Certification
    certification_type VARCHAR(100) NOT NULL,
    certification_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),

    -- Dates
    issue_date DATE,
    expiry_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Document
    certificate_file_id UUID REFERENCES files(id),
    certificate_number VARCHAR(100),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROCUREMENT MODULE (10 tables)
-- ============================================================

-- 1. VENDORS
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Basic info
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    dba_name VARCHAR(255),

    -- Type
    vendor_type VARCHAR(50), -- subcontractor, supplier, consultant

    -- Contact
    primary_contact_name VARCHAR(200),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),

    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),

    -- Business info
    tax_id VARCHAR(50),
    duns_number VARCHAR(20),

    -- Classifications
    trades JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    set_aside_types JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    prequalified BOOLEAN DEFAULT false,
    prequalified_until DATE,

    -- Rating
    overall_rating DECIMAL(3, 2),

    website VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VENDOR_CONTACTS
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),

    is_primary BOOLEAN DEFAULT false,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VENDOR_CERTIFICATIONS
CREATE TABLE IF NOT EXISTS vendor_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    certification_type VARCHAR(100) NOT NULL,
    certification_name VARCHAR(255),
    issuing_agency VARCHAR(255),

    certificate_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,

    -- Document
    file_id UUID REFERENCES files(id),

    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VENDOR_RATINGS
CREATE TABLE IF NOT EXISTS vendor_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Ratings (1-5)
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    schedule_rating INTEGER CHECK (schedule_rating BETWEEN 1 AND 5),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),

    comments TEXT,

    rated_by UUID REFERENCES users(id),
    rating_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTRACTS
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    contract_type VARCHAR(50), -- prime, owner

    -- Parties
    owner_name VARCHAR(255),
    contractor_name VARCHAR(255),

    -- Value
    original_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2),

    -- Dates
    execution_date DATE,
    start_date DATE,
    end_date DATE,

    -- Terms
    payment_terms VARCHAR(100),
    retainage_percent DECIMAL(5, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Document
    file_id UUID REFERENCES files(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBCONTRACTS
CREATE TABLE IF NOT EXISTS subcontracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    commitment_id UUID REFERENCES commitments(id),

    -- Identity
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,

    -- Scope
    trade VARCHAR(100),
    scope_of_work TEXT,

    -- Value
    original_value DECIMAL(15, 2),
    approved_changes DECIMAL(15, 2) DEFAULT 0,
    current_value DECIMAL(15, 2),

    -- Dates
    execution_date DATE,
    start_date DATE,
    end_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PURCHASE_ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    commitment_id UUID REFERENCES commitments(id),

    -- Identity
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,

    -- Value
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax DECIMAL(15, 2) DEFAULT 0,
    shipping DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,

    -- Dates
    order_date DATE,
    required_date DATE,

    -- Shipping
    ship_to_address TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PO_ITEMS
CREATE TABLE IF NOT EXISTS po_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id),

    -- Item
    item_number INTEGER,
    description TEXT NOT NULL,

    -- Quantity
    quantity DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(50),
    unit_price DECIMAL(15, 4) NOT NULL,
    total_price DECIMAL(15, 2),

    -- Delivery
    required_date DATE,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INSURANCE_CERTS
CREATE TABLE IF NOT EXISTS insurance_certs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Type
    insurance_type VARCHAR(100) NOT NULL, -- gl, auto, workers_comp, umbrella

    -- Coverage
    policy_number VARCHAR(100),
    carrier_name VARCHAR(255),

    -- Limits
    coverage_limit DECIMAL(15, 2),
    per_occurrence_limit DECIMAL(15, 2),
    aggregate_limit DECIMAL(15, 2),

    -- Dates
    effective_date DATE,
    expiry_date DATE,

    -- Certificate
    file_id UUID REFERENCES files(id),

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LIEN_WAIVERS
CREATE TABLE IF NOT EXISTS lien_waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Type
    waiver_type VARCHAR(50) NOT NULL, -- conditional, unconditional, partial, final

    -- Amount
    amount DECIMAL(15, 2) NOT NULL,
    through_date DATE,

    -- Document
    file_id UUID REFERENCES files(id),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    received_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMUNICATIONS MODULE (10 tables)
-- ============================================================

-- 1. RFIS
CREATE TABLE IF NOT EXISTS rfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,

    -- Question
    question TEXT NOT NULL,

    -- References
    specification_section VARCHAR(100),
    drawing_reference VARCHAR(100),
    location VARCHAR(255),

    -- Classification
    discipline VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',

    -- Dates
    submitted_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Routing
    submitted_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),

    -- Cost/Schedule impact
    has_cost_impact BOOLEAN DEFAULT false,
    cost_impact DECIMAL(15, 2),
    has_schedule_impact BOOLEAN DEFAULT false,
    schedule_impact_days INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Attachments
    attachments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RFI_RESPONSES
CREATE TABLE IF NOT EXISTS rfi_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,

    -- Response
    response TEXT NOT NULL,

    -- Responder
    responder_id UUID REFERENCES users(id),
    responder_name VARCHAR(200),
    responder_company VARCHAR(200),

    -- Date
    response_date DATE DEFAULT CURRENT_DATE,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Is official response
    is_official BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBMITTALS
CREATE TABLE IF NOT EXISTS submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    specification_section VARCHAR(100),
    type VARCHAR(100), -- shop_drawing, product_data, sample, etc

    -- Dates
    submitted_date DATE,
    required_date DATE,

    -- Submitter
    submitted_by_vendor_id UUID REFERENCES vendors(id),
    submitted_by_user_id UUID REFERENCES users(id),

    -- Current reviewer
    current_reviewer_id UUID REFERENCES users(id),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Result
    review_result VARCHAR(50), -- approved, approved_as_noted, revise_resubmit, rejected

    -- Revision
    revision_number INTEGER DEFAULT 0,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBMITTAL_REVIEWS
CREATE TABLE IF NOT EXISTS submittal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,

    -- Reviewer
    reviewer_id UUID REFERENCES users(id),
    reviewer_name VARCHAR(200),
    reviewer_company VARCHAR(200),

    -- Review
    action VARCHAR(50) NOT NULL, -- approved, approved_as_noted, revise_resubmit, rejected
    comments TEXT,

    -- Date
    review_date DATE DEFAULT CURRENT_DATE,

    -- Attachments (marked up drawings, etc)
    attachments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSMITTALS
CREATE TABLE IF NOT EXISTS transmittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identity
    number VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,

    -- Recipient
    recipient_name VARCHAR(200),
    recipient_company VARCHAR(200),
    recipient_email VARCHAR(255),

    -- Items
    items JSONB NOT NULL,

    -- Delivery
    delivery_method VARCHAR(50), -- email, mail, hand_delivery

    -- Date
    sent_date DATE DEFAULT CURRENT_DATE,

    sent_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEETING_MINUTES
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Meeting info
    meeting_type VARCHAR(100),
    title VARCHAR(255) NOT NULL,

    -- Date/Time
    meeting_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,

    -- Location
    location VARCHAR(255),

    -- Attendees
    attendees JSONB DEFAULT '[]',

    -- Content
    agenda TEXT,
    notes TEXT,
    decisions JSONB DEFAULT '[]',

    -- Distribution
    distribution_list JSONB DEFAULT '[]',

    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTION_ITEMS
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meeting_minutes(id) ON DELETE SET NULL,

    -- Item
    description TEXT NOT NULL,

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_to_name VARCHAR(200),
    assigned_to_company VARCHAR(200),

    -- Dates
    due_date DATE,
    completed_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Priority
    priority VARCHAR(20) DEFAULT 'medium',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DAILY_REPORTS
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    report_date DATE NOT NULL,

    -- Weather
    weather_am VARCHAR(100),
    weather_pm VARCHAR(100),
    temperature_high INTEGER,
    temperature_low INTEGER,
    precipitation VARCHAR(100),

    -- Workforce
    workforce JSONB DEFAULT '[]',
    total_workers INTEGER DEFAULT 0,

    -- Equipment
    equipment JSONB DEFAULT '[]',

    -- Activities
    activities JSONB DEFAULT '[]',

    -- Visitors
    visitors JSONB DEFAULT '[]',

    -- Deliveries
    deliveries JSONB DEFAULT '[]',

    -- Issues
    issues TEXT,
    delays TEXT,

    -- Safety
    safety_observations TEXT,
    incidents_today BOOLEAN DEFAULT false,

    -- Photos
    photos JSONB DEFAULT '[]',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, report_date)
);

-- 9. CORRESPONDENCE
CREATE TABLE IF NOT EXISTS correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Type
    correspondence_type VARCHAR(50), -- letter, email, memo
    direction VARCHAR(20), -- incoming, outgoing

    -- Subject
    subject VARCHAR(255) NOT NULL,

    -- Parties
    from_name VARCHAR(200),
    from_company VARCHAR(200),
    to_name VARCHAR(200),
    to_company VARCHAR(200),

    -- Content
    content TEXT,

    -- Date
    correspondence_date DATE,

    -- Document
    file_id UUID REFERENCES files(id),

    -- Reference
    reference_number VARCHAR(100),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PHOTO_LOGS
CREATE TABLE IF NOT EXISTS photo_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Photo
    file_id UUID NOT NULL REFERENCES files(id),

    -- Details
    title VARCHAR(255),
    description TEXT,

    -- Location
    location VARCHAR(255),
    area VARCHAR(100),

    -- Date
    photo_date DATE DEFAULT CURRENT_DATE,

    -- Tags
    tags JSONB DEFAULT '[]',

    taken_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_incidents_project ON incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(org_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_subcontracts_project ON subcontracts(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date ON daily_reports(project_id, report_date);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_investigations_updated_at BEFORE UPDATE ON incident_investigations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jhas_updated_at BEFORE UPDATE ON jhas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontracts_updated_at BEFORE UPDATE ON subcontracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_certs_updated_at BEFORE UPDATE ON insurance_certs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfis_updated_at BEFORE UPDATE ON rfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submittals_updated_at BEFORE UPDATE ON submittals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_osha_logs_updated_at BEFORE UPDATE ON osha_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

