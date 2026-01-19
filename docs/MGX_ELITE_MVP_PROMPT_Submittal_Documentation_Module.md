# MGX ELITE MVP PROMPT
## Intelligent Submittal & Construction Documentation Module
### OC Pipeline — Federal-Grade Construction Management Platform

---

## 🎯 PROJECT IDENTITY

**Module Name:** Intelligent Submittal & Documentation Control (ISDC)  
**Platform:** OC Pipeline (Federal-Grade Construction SaaS)  
**Company:** O'Neill Contractors — SDVOSB Federal Contractor  
**Target Agencies:** VA, USACE, DOD, GSA, NAVFAC  
**Compliance:** NIST 800-171, SOC 2, WCAG 2.2 AA, FAR/DFAR

---

## 📋 MISSION STATEMENT

Build an AI-powered Submittal & Construction Documentation system that rivals and exceeds Pype by Autodesk — covering the complete lifecycle from preconstruction specification analysis through construction submittals to closeout documentation handoff. The system uses advanced NLP/ML to analyze specification documents and drawings, auto-generate ultra-accurate submittal registers, track all submittals through approval, automate subcontractor outreach, and deliver digital closeout packages compliant with federal construction requirements.

---

## 🤖 MGX AGENT TEAM ASSIGNMENTS

### TEAM LEADER AGENT
**Role:** Orchestrator & Quality Controller  
**Responsibilities:**
- Coordinate all agent outputs into unified deliverables
- Enforce federal compliance standards (NIST 800-171, FAR, Davis-Bacon)
- Validate cross-module integration points
- Quality gate all code and documentation before delivery
- Ensure 90%+ feature parity with Procore/Pype/CMiC standards

### PRODUCT MANAGER AGENT
**Role:** Requirements & User Stories  
**Responsibilities:**
- Translate this prompt into detailed user stories with acceptance criteria
- Define user personas (Estimator, Project Manager, Document Controller, Subcontractor, Owner)
- Prioritize features for MVP vs. Phase 2/3
- Create product roadmap with milestones
- Define success metrics and KPIs

### ARCHITECT AGENT
**Role:** System Design & Database  
**Responsibilities:**
- Design PostgreSQL database schema (Supabase-compatible)
- Define API architecture (REST/GraphQL)
- Plan AI/ML integration (NLP for spec parsing, CV for drawing analysis)
- Design file storage architecture (S3/Supabase Storage)
- Create system integration diagram (Procore, Bluebeam, Sage, QuickBooks)

### ENGINEER AGENT
**Role:** Implementation & Code  
**Responsibilities:**
- Write production-ready TypeScript/React frontend
- Build Express.js/Node.js backend API
- Implement Supabase database with RLS policies
- Develop AI extraction pipelines (OpenAI/Claude API integration)
- Create automated testing suite (Jest, Playwright)

### DATA ANALYST AGENT
**Role:** Analytics & Reporting  
**Responsibilities:**
- Design analytics dashboards for submittal tracking
- Create closeout compliance reporting
- Build subcontractor performance scoring
- Develop predictive analytics (approval timelines, risk flags)
- Design executive summary reports

---

## 🎯 DEDICATED AI SPECIALIST: SUBMITTAL INTELLIGENCE AGENT

### Agent Identity
**Name:** ISDC-AI (Intelligent Submittal & Document Control AI)  
**Tier:** Specialist Agent with Governed Autonomy  
**Domain:** Construction Documentation, Specifications, Submittals, Closeout

### Core Capabilities

#### 1. SPEC ANALYZER (AutoSpecs Equivalent)
```
INPUTS:
- PDF/Word specification documents (CSI MasterFormat)
- Project type (healthcare, federal, commercial)
- Agency requirements (VA, USACE, DOD, GSA)

PROCESSING:
- NLP parsing of specification sections (Divisions 00-49)
- Extract: Action submittals, Product data, Shop drawings
- Extract: Closeout submittals, Warranties, O&M manuals
- Extract: QA/QC requirements, Tests, Inspections
- Extract: Certifications, LEED, Davis-Bacon, Buy American
- Cross-reference with ML database (millions of projects)
- Gap detection for missing requirements
- Confidence scoring per extraction (0-100%)

OUTPUTS:
- Structured submittal register (JSON/Excel)
- Missing requirements report
- Compliance checklist (federal/agency-specific)
- Extraction confidence report
```

#### 2. DRAWING ANALYZER (SmartPlans Equivalent)
```
INPUTS:
- PDF/DWG/DXF construction drawings
- Equipment schedules, Finish schedules
- Door/Hardware schedules

PROCESSING:
- Computer Vision (CV) for drawing analysis
- OCR text extraction from drawings
- Symbol recognition (equipment, products)
- Schedule table extraction
- Cross-reference with spec requirements

OUTPUTS:
- Equipment/Product schedules (Excel export)
- Drawing-based submittal items
- Spec-to-drawing reconciliation report
```

#### 3. SUBMITTAL TRACKER
```
INPUTS:
- Submittal register (from Spec/Drawing Analyzer)
- Responsible party assignments
- Due dates and milestones

PROCESSING:
- Workflow routing (Contractor → Architect → Owner)
- Status tracking (Pending, Submitted, Reviewed, Approved, Rejected)
- Resubmittal management
- Timeline predictions (ML-based)
- Critical path integration

OUTPUTS:
- Live submittal log dashboard
- Overdue/at-risk alerts
- Approval timeline predictions
- Integration sync (Procore, BIM360)
```

#### 4. CLOSEOUT MANAGER
```
INPUTS:
- Contract closeout requirements
- Subcontractor contact database
- Warranty requirements per spec section

PROCESSING:
- Auto-generate closeout document checklist
- Automated subcontractor outreach (email campaigns)
- Document collection tracking per subcontractor
- Compliance verification
- O&M manual assembly
- As-built collection
- Warranty calendar creation

OUTPUTS:
- Closeout status dashboard
- Subcontractor compliance scorecards
- Digital closeout package (eBinder)
- Owner handoff documentation
- Payment release verification
```

### Agent Governance Rules

```yaml
ISDC_AI_GOVERNANCE:
  
  CAN_DO:
    - Extract data from uploaded documents
    - Generate submittal registers with confidence scores
    - Suggest missing requirements based on ML patterns
    - Draft subcontractor outreach emails (for approval)
    - Create compliance checklists
    - Predict approval timelines
    - Flag high-risk items
    - Generate reports and analytics
  
  CANNOT_DO:
    - Approve/reject submittals (human approval required)
    - Send emails without user confirmation
    - Modify contract documents
    - Delete project data
    - Bypass RBAC permissions
    - Access cross-project data without authorization
    - Override compliance requirements
  
  CONFIDENCE_THRESHOLDS:
    - HIGH (90-100%): Auto-populate, minimal review
    - MEDIUM (70-89%): Populate with review flag
    - LOW (50-69%): Suggest only, require manual entry
    - REJECT (<50%): Do not populate, request human input
  
  AUDIT_REQUIREMENTS:
    - Log all AI actions with timestamp
    - Record confidence scores
    - Track human corrections for ML improvement
    - Maintain 7-year audit trail (federal compliance)
```

---

## 📊 DATABASE SCHEMA (PostgreSQL/Supabase)

```sql
-- ============================================
-- CORE TABLES: SUBMITTAL & DOCUMENTATION MODULE
-- ============================================

-- Specification Documents
CREATE TABLE specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    document_name TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('specification', 'addendum', 'amendment')),
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

-- Drawings
CREATE TABLE drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    drawing_number TEXT NOT NULL,
    drawing_title TEXT,
    discipline TEXT CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'landscape', 'fire_protection')),
    revision TEXT,
    revision_date DATE,
    file_path TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'dwg', 'dxf', 'rvt')),
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending',
    ai_processed_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submittal Register (Master Log)
CREATE TABLE submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
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
    
    -- Assignments
    responsible_contractor UUID REFERENCES companies(id),
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

-- Submittal Items (Line Items within a Submittal)
CREATE TABLE submittal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submittal Reviews (Approval Workflow)
CREATE TABLE submittal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id),
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

-- Closeout Documents
CREATE TABLE closeout_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    submittal_id UUID REFERENCES submittals(id),
    document_type TEXT NOT NULL CHECK (document_type IN (
        'warranty', 'om_manual', 'as_built', 'test_report',
        'certificate', 'attic_stock', 'spare_parts', 'training_record',
        'commissioning', 'leed_documentation', 'final_inspection'
    )),
    document_title TEXT NOT NULL,
    spec_section TEXT,
    
    -- Responsibility
    subcontractor_id UUID REFERENCES companies(id),
    responsible_contact TEXT,
    
    -- Requirements
    required BOOLEAN DEFAULT TRUE,
    required_copies INTEGER DEFAULT 1,
    format_required TEXT, -- 'digital', 'hard_copy', 'both'
    
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

-- Subcontractor Outreach (Automated Communications)
CREATE TABLE closeout_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    subcontractor_id UUID NOT NULL REFERENCES companies(id),
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

-- AI Extractions (Audit Trail)
CREATE TABLE ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    source_document_id UUID NOT NULL,
    source_type TEXT CHECK (source_type IN ('specification', 'drawing', 'schedule')),
    extraction_type TEXT CHECK (extraction_type IN ('submittal', 'product', 'test', 'closeout', 'compliance')),
    extracted_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2),
    model_version TEXT,
    processing_time_ms INTEGER,
    extraction_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Human Review
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    corrections JSONB, -- What the human changed
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_submittals_project ON submittals(project_id);
CREATE INDEX idx_submittals_status ON submittals(status);
CREATE INDEX idx_submittals_spec ON submittals(spec_section);
CREATE INDEX idx_submittals_type ON submittals(submittal_type);
CREATE INDEX idx_closeout_project ON closeout_documents(project_id);
CREATE INDEX idx_closeout_status ON closeout_documents(status);
CREATE INDEX idx_closeout_sub ON closeout_documents(subcontractor_id);
CREATE INDEX idx_ai_extractions_project ON ai_extractions(project_id);

-- Row Level Security
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;
```

---

## 👥 RBAC PERMISSIONS MATRIX

| Permission | Admin | Executive | PreconManager | Estimator | DocController | Viewer |
|------------|-------|-----------|---------------|-----------|---------------|--------|
| view_submittals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_submittals | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| edit_submittals | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| delete_submittals | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| approve_submittals | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| upload_specs | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| run_ai_extraction | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| view_closeout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_closeout | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| send_outreach | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| export_reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| view_analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin_settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 TECHNOLOGY STACK

```yaml
FRONTEND:
  framework: React 19
  language: TypeScript
  styling: Tailwind CSS
  components: shadcn/ui
  state: Zustand
  forms: React Hook Form + Zod
  tables: TanStack Table
  charts: Recharts
  pdf_viewer: react-pdf
  file_upload: react-dropzone

BACKEND:
  runtime: Node.js 20
  framework: Express.js
  language: TypeScript
  validation: Zod
  auth: Supabase Auth + JWT
  file_storage: Supabase Storage / AWS S3

DATABASE:
  primary: PostgreSQL 15 (Supabase)
  cache: Redis
  search: PostgreSQL Full-Text Search
  
AI_INTEGRATION:
  llm: Claude API (Anthropic) / OpenAI GPT-4
  embeddings: OpenAI text-embedding-3
  ocr: Google Cloud Vision / Tesseract
  vector_db: pgvector (Supabase)

INTEGRATIONS:
  construction: Procore API, Autodesk BIM360
  accounting: Sage, QuickBooks
  documents: Bluebeam Revu, Google Drive
  email: SendGrid / AWS SES
  
DEPLOYMENT:
  hosting: Vercel (frontend), Render (backend)
  cdn: Cloudflare
  monitoring: Sentry
  ci_cd: GitHub Actions
```

---

## 📱 USER INTERFACE REQUIREMENTS

### 1. SPECIFICATION UPLOAD & ANALYSIS
```
SCREEN: Spec Analyzer
COMPONENTS:
- Drag-drop upload zone (multi-file)
- Processing progress indicator
- Division/Section tree view
- AI extraction results table
- Confidence score badges (green/yellow/red)
- "Add to Register" bulk action
- Export to Excel button
```

### 2. SUBMITTAL REGISTER (MAIN LOG)
```
SCREEN: Submittal Log
COMPONENTS:
- Filterable/sortable data table
- Quick filters: Status, Type, Priority, Spec Section
- Search bar (full-text)
- Bulk actions: Assign, Update Status, Export
- Timeline view toggle
- Gantt-style critical path view
- AI suggestions panel ("Missing submittals detected")
```

### 3. SUBMITTAL DETAIL VIEW
```
SCREEN: Submittal Detail
COMPONENTS:
- Header: Number, Title, Status badge
- Tabs: Details, Items, Reviews, History, Files
- Approval workflow diagram
- Comment thread
- File attachments with preview
- Related RFIs link
```

### 4. CLOSEOUT DASHBOARD
```
SCREEN: Closeout Manager
COMPONENTS:
- Progress donut chart (% complete)
- Subcontractor compliance cards
- Document collection matrix
- Automated outreach button
- Warranty calendar
- Export closeout package button
```

### 5. ANALYTICS DASHBOARD
```
SCREEN: Submittal Analytics
COMPONENTS:
- Submission rate trend chart
- Approval rate by reviewer
- Average review time
- Overdue submittals list
- Subcontractor performance ranking
- Closeout completion forecast
```

---

## ✅ ACCEPTANCE CRITERIA

### MVP Features (Phase 1)
1. ✅ Upload PDF specifications (single/batch)
2. ✅ AI extraction of submittals with confidence scoring
3. ✅ Manual submittal register creation/editing
4. ✅ Status tracking workflow (7 statuses)
5. ✅ Basic closeout document checklist
6. ✅ Export to Excel

### Phase 2 Features
1. ⬜ Drawing analysis (CV-based)
2. ⬜ Automated subcontractor outreach
3. ⬜ Procore integration (bidirectional sync)
4. ⬜ Advanced analytics dashboard
5. ⬜ Warranty tracking with alerts

### Phase 3 Features
1. ⬜ Sage/QuickBooks integration
2. ⬜ Mobile app (React Native)
3. ⬜ Bluebeam markup integration
4. ⬜ Federal compliance automation (Davis-Bacon, Buy American)
5. ⬜ Predictive analytics (ML-based)

---

## 📏 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Submittal log creation time | 80% reduction | Minutes vs. manual |
| AI extraction accuracy | 94%+ | Correct items / Total items |
| First-time approval rate | 85%+ | Approved on first submit |
| Closeout duration | 60% reduction | Days to complete |
| Subcontractor response rate | 90%+ | Responses within 48 hours |
| User satisfaction | 4.5+ / 5.0 | NPS survey |

---

## 🚀 DELIVERABLES REQUIRED FROM MGX

1. **Complete React Frontend** (TypeScript)
   - All screens listed above
   - Responsive design (desktop, tablet, mobile)
   - Dark/light mode support
   - WCAG 2.2 AA accessibility

2. **Express.js Backend API** (TypeScript)
   - RESTful endpoints for all CRUD operations
   - File upload handling
   - AI integration endpoints
   - Authentication middleware

3. **Database Migration Files** (SQL)
   - All tables listed above
   - Indexes and constraints
   - RLS policies
   - Seed data for testing

4. **AI Extraction Pipeline**
   - Spec parsing service
   - Confidence scoring logic
   - Human-in-the-loop review workflow

5. **Integration Modules**
   - Procore API connector
   - Email service (SendGrid)
   - File storage (S3/Supabase)

6. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - User guide
   - Admin configuration guide
   - Deployment guide

7. **Test Suite**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)

---

## ⚠️ CONSTRAINTS & NON-NEGOTIABLES

1. **Federal Compliance**: All features must support NIST 800-171, 7-year audit trails
2. **No Vendor Lock-in**: Must be deployable on any PostgreSQL (not just Supabase)
3. **Offline Capability**: Core features must work with intermittent connectivity
4. **Data Sovereignty**: All data stored in US-based infrastructure
5. **Accessibility**: Zero WCAG 2.2 AA violations
6. **Performance**: <2s page load, <30s AI extraction for typical spec document
7. **Security**: OAuth2 + JWT, encrypted at rest/transit, RBAC enforced at API level

---

## 📝 NOTES FOR MGX AGENTS

- This is a federal government construction platform — quality standards are extremely high
- Reference the Pype by Autodesk feature set as the baseline, then exceed it
- O'Neill Contractors is an 8(a) SDVOSB contractor — understand federal construction workflows
- All code must be production-ready, not prototype quality
- Include comprehensive error handling and logging
- Design for multi-tenant architecture from the start

---

**END OF ELITE MVP PROMPT**

*Document Version: 1.0*  
*Created: December 2025*  
*Platform: OC Pipeline*  
*Module: Intelligent Submittal & Documentation Control (ISDC)*
