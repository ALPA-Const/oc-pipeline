-- ============================================
-- OC Pipeline - CUI Compliance Schema
-- CMMC Level 2 Compliance for Federal Projects
-- ============================================

-- Add CUI-related columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_cui BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_category VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_secured BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_secured_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_secured_by UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_review_required BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cui_review_due_date DATE;

-- CUI Categories enum-like constraint
COMMENT ON COLUMN documents.cui_category IS 'CUI category: CTI (Controlled Technical Information), ITAR (Export Controlled), FOUO (For Official Use Only), SBU (Sensitive But Unclassified), PII (Personally Identifiable Information)';

-- ============================================
-- Compliance Certifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Certification Details
  certification_type VARCHAR(50) NOT NULL, -- CMMC, ISO27001, SOC2, etc.
  level VARCHAR(20), -- Level 1, 2, 3 for CMMC
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, expired, revoked

  -- Dates
  issued_date DATE,
  expiration_date DATE,
  last_audit_date DATE,
  next_audit_date DATE,

  -- Assessor Info
  assessor_name VARCHAR(255),
  assessor_organization VARCHAR(255),
  certificate_number VARCHAR(100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT valid_cert_status CHECK (status IN ('pending', 'active', 'expired', 'revoked'))
);

-- ============================================
-- Compliance Control Assessments Table
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_control_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  certification_id UUID REFERENCES compliance_certifications(id) ON DELETE CASCADE,

  -- Control Details
  control_family VARCHAR(50) NOT NULL, -- AC, AT, AU, CM, IA, IR, MA, MP, PE, PS, RA, SA, SC, SI
  control_id VARCHAR(20) NOT NULL, -- e.g., AC-1, AT-2
  control_name VARCHAR(255) NOT NULL,

  -- Assessment
  status VARCHAR(20) NOT NULL DEFAULT 'not_assessed', -- not_assessed, pass, warning, fail
  assessment_date DATE,
  assessor_notes TEXT,
  evidence_links TEXT[], -- Array of document IDs or URLs

  -- Remediation (if failed)
  remediation_required BOOLEAN DEFAULT FALSE,
  remediation_plan TEXT,
  remediation_due_date DATE,
  remediation_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_control_status CHECK (status IN ('not_assessed', 'pass', 'warning', 'fail'))
);

-- ============================================
-- Compliance Reviews Table
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Review Details
  review_type VARCHAR(50) NOT NULL, -- cui_marking, access_review, annual_review
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, overdue
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  due_date DATE,

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  review_notes TEXT,
  outcome VARCHAR(20), -- approved, rejected, needs_changes

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_review_status CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'))
);

-- ============================================
-- Dashboard Alerts Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type VARCHAR(20) NOT NULL, -- critical, warning, info, success
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Context
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  source_module VARCHAR(50), -- cost, schedule, compliance, etc.
  action_url VARCHAR(500),

  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Targeting
  target_user_id UUID REFERENCES users(id), -- NULL means org-wide
  target_role VARCHAR(50), -- NULL means all roles

  CONSTRAINT valid_alert_type CHECK (alert_type IN ('critical', 'warning', 'info', 'success'))
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_documents_cui ON documents(org_id, is_cui) WHERE is_cui = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_cui_review ON documents(org_id, cui_review_required, cui_review_due_date) WHERE cui_review_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_compliance_certs_org ON compliance_certifications(org_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_certs_expiry ON compliance_certifications(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_compliance_controls_org ON compliance_control_assessments(org_id, control_family);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_pending ON compliance_reviews(org_id, status, due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_active ON dashboard_alerts(org_id, alert_type, created_at) WHERE dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_user ON dashboard_alerts(target_user_id, created_at) WHERE dismissed_at IS NULL;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE compliance_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_control_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;

-- Compliance Certifications RLS
CREATE POLICY compliance_certifications_org_isolation ON compliance_certifications
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- Compliance Control Assessments RLS
CREATE POLICY compliance_control_assessments_org_isolation ON compliance_control_assessments
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- Compliance Reviews RLS
CREATE POLICY compliance_reviews_org_isolation ON compliance_reviews
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- Dashboard Alerts RLS
CREATE POLICY dashboard_alerts_org_isolation ON dashboard_alerts
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- ============================================
-- Audit Triggers
-- ============================================
CREATE OR REPLACE FUNCTION audit_compliance_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    org_id,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    COALESCE(NEW.org_id, OLD.org_id),
    current_setting('app.current_user_id', TRUE)::UUID
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_compliance_certifications
  AFTER INSERT OR UPDATE OR DELETE ON compliance_certifications
  FOR EACH ROW EXECUTE FUNCTION audit_compliance_changes();

CREATE TRIGGER audit_compliance_control_assessments
  AFTER INSERT OR UPDATE OR DELETE ON compliance_control_assessments
  FOR EACH ROW EXECUTE FUNCTION audit_compliance_changes();

CREATE TRIGGER audit_compliance_reviews
  AFTER INSERT OR UPDATE OR DELETE ON compliance_reviews
  FOR EACH ROW EXECUTE FUNCTION audit_compliance_changes();

-- ============================================
-- Updated_at Triggers
-- ============================================
CREATE TRIGGER set_updated_at_compliance_certifications
  BEFORE UPDATE ON compliance_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_compliance_control_assessments
  BEFORE UPDATE ON compliance_control_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_compliance_reviews
  BEFORE UPDATE ON compliance_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Data for CMMC Controls
-- ============================================
INSERT INTO compliance_control_assessments (org_id, control_family, control_id, control_name, status)
SELECT
  o.id,
  c.control_family,
  c.control_id,
  c.control_name,
  'not_assessed'
FROM organizations o
CROSS JOIN (VALUES
  ('AC', 'AC-1', 'Access Control Policy and Procedures'),
  ('AC', 'AC-2', 'Account Management'),
  ('AC', 'AC-3', 'Access Enforcement'),
  ('AC', 'AC-4', 'Information Flow Enforcement'),
  ('AC', 'AC-5', 'Separation of Duties'),
  ('AT', 'AT-1', 'Security Awareness and Training Policy'),
  ('AT', 'AT-2', 'Security Awareness Training'),
  ('AT', 'AT-3', 'Role-Based Security Training'),
  ('AU', 'AU-1', 'Audit and Accountability Policy'),
  ('AU', 'AU-2', 'Audit Events'),
  ('AU', 'AU-3', 'Content of Audit Records'),
  ('AU', 'AU-6', 'Audit Review, Analysis, and Reporting'),
  ('IR', 'IR-1', 'Incident Response Policy'),
  ('IR', 'IR-2', 'Incident Response Training'),
  ('IR', 'IR-4', 'Incident Handling'),
  ('IR', 'IR-6', 'Incident Reporting'),
  ('RA', 'RA-1', 'Risk Assessment Policy'),
  ('RA', 'RA-2', 'Security Categorization'),
  ('RA', 'RA-3', 'Risk Assessment'),
  ('RA', 'RA-5', 'Vulnerability Scanning')
) AS c(control_family, control_id, control_name)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE compliance_certifications IS 'Tracks organizational compliance certifications (CMMC, ISO 27001, SOC 2, etc.)';
COMMENT ON TABLE compliance_control_assessments IS 'Individual control assessments for compliance frameworks';
COMMENT ON TABLE compliance_reviews IS 'Pending and completed compliance reviews for documents and projects';
COMMENT ON TABLE dashboard_alerts IS 'System-generated alerts displayed on the dashboard';

