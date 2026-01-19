**OC PIPELINE**

BACKEND REBUILD SPECIFICATION

**DOCUMENT 1 OF 3**

Foundation + Environment + Database Schema (ALL 126 Tables)

*Version 2.0 - Agentic Edition*

Date: November 2025

**CONFIDENTIAL - INTERNAL USE ONLY**

1\. EXECUTIVE SUMMARY

1.1 Document Set Overview

This Backend Rebuild Specification is split into 3 documents:

- Document 1 (THIS): Foundation + Environment + Database Schema (126
  tables)

- Document 2: API Routes (ALL modules) + Folder Structure

- Document 3: Agentic Infrastructure + Core Implementation Code +
  Deployment

1.2 Platform Overview

OC Pipeline is a federal-grade construction management platform with 16
modules plus agentic AI infrastructure.

1.3 Module List (16 Total)

  ---------------------------------------------------------------------------
  **\#**   **Module**                 **Description**
  -------- -------------------------- ---------------------------------------
  1        Preconstruction            Bid pipeline, AI estimator, packages,
                                      pursuits

  2        Cost                       Budgets, cost codes, change orders,
                                      forecasts

  3        Schedule                   Gantt, milestones, dependencies, SPI
                                      tracking

  4        Risk                       Risk register, heat maps, mitigation
                                      tracking

  5        Quality                    Deficiency tracking, punch lists,
                                      inspections

  6        Safety                     OSHA compliance, incidents,
                                      TRIR/DART/EMR

  7        Procurement                Vendor management, contracts, POs

  8        Communications             RFIs, submittals, meeting minutes,
                                      approvals

  9        Staffing                   Resource allocation, certifications,
                                      utilization

  10       Closeout                   Punch lists, as-builts, warranties,
                                      handover

  11       Administration             Users, roles, permissions, audit logs

  12       Portfolio                  Cross-project analytics, KPIs,
                                      dashboards

  \+       AI Estimator               PDF extraction, cost modeling (with
                                      Preconstruction)

  \+       Documents                  Document management layer
                                      (cross-module)

  \+       Finance                    Detailed financial views (with Cost)

  \+       Tasks                      Cross-module task engine
  ---------------------------------------------------------------------------

2\. INFRASTRUCTURE & DEPLOYMENT

2.1 Deployment Architecture

  ----------------------------------------------------------------------------
  **Component**      **Platform**           **URL / Details**
  ------------------ ---------------------- ----------------------------------
  Frontend           Vercel                 https://ocpipeline.vercel.app

  Backend            Render                 https://oc-pipeline.onrender.com

  Database           Supabase PostgreSQL 15 Project ID: cwrjhtpycynjzeiggyhf

  File Storage       Supabase Storage       S3-compatible buckets

  Authentication     Supabase Auth          JWT with RS256/HS256

  Source Control     GitHub                 Auto-deploy on push to main
  ----------------------------------------------------------------------------

3\. ENVIRONMENT VARIABLES

3.1 Required Variables for Render

Set ALL of the following environment variables in Render dashboard:

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Variable**                **Value**
  --------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  PORT                        10000

  NODE_ENV                    production

  SUPABASE_URL                https://cwrjhtpycynjzeiggyhf.supabase.co

  SUPABASE_ANON_KEY           eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmpodHB5Y3luanplaWdneWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDIzMDAsImV4cCI6MjA3NzAxODMwMH0.bl7-6rdapIcq9Dr7cDIuOqV2FbCTIvBYlP5znQbJNjk

  SUPABASE_SERVICE_ROLE_KEY   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmpodHB5Y3luanplaWdneWhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ0MjMwMCwiZXhwIjoyMDc3MDE4MzAwfQ.GlMVNbfp9bbuKREDwuP1jD6IE_3n6jnWdx5eNmuULw4

  DATABASE_URL                postgresql://postgres.cwrjhtpycynjzeiggyhf:Alpaconstruct2025\$@aws-0-us-east-1.pooler.supabase.com:6543/postgres

  JWT_SECRET                  8V3xYfCZEzorGZ8EyGY2uBRyqYtIJoOT

  JWT_ISSUER                  https://cwrjhtpycynjzeiggyhf.supabase.co/auth/v1

  JWT_AUDIENCE                authenticated

  FRONTEND_URL                https://ocpipeline.vercel.app

  ALLOWED_ORIGINS             https://ocpipeline.vercel.app,http://localhost:5173,http://localhost:3000
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

4\. TECHNOLOGY STACK

4.1 Backend Dependencies

  ------------------------------------------------------------------------
  **Package**                **Version**     **Purpose**
  -------------------------- --------------- -----------------------------
  express                    \^4.19.x        Web framework

  pg                         \^8.12.x        PostgreSQL client

  \@supabase/supabase-js     \^2.x           Supabase client

  jsonwebtoken               \^9.x           JWT handling

  helmet                     \^7.x           Security headers

  cors                       \^2.8.x         CORS middleware

  morgan                     \^1.10.x        HTTP logging

  zod                        \^3.x           Schema validation

  compression                \^1.7.x         Response compression

  express-rate-limit         \^7.x           Rate limiting

  uuid                       \^9.x           UUID generation

  dotenv                     \^16.x          Environment variables
  ------------------------------------------------------------------------

5\. DATABASE SCHEMA - ALL 126 TABLES

5.1 Foundation Tables (10 tables)

Required for ALL modules - create FIRST:

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  workspaces              Multi-tenant root entity (organization isolation)

  users                   User profiles with workspace scope

  roles                   System roles (admin, exec, pm, pe, super, precon,
                          sub, client)

  permissions             Granular permissions (23 types)

  role_permissions        Role-to-permission mapping

  user_roles              User-to-role assignments (workspace scoped)

  sessions                Active user sessions with token management

  audit_events            7-year audit trail (append-only)

  organization_settings   Workspace configuration and preferences

  feature_flags           Module/feature enablement per workspace
  -------------------------------------------------------------------------

5.2 Administration Module (6 tables)

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  project_memberships     Project-level access control

  user_preferences        User-specific settings and preferences

  notification_settings   Per-user notification configuration

  api_keys                Scoped API tokens with rotation

  invitations             Pending user invitations

  login_history           Authentication attempt logging
  -------------------------------------------------------------------------

5.3 Preconstruction Module (12 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  projects              Core project entity

  pipelines             Bid pipeline stages

  pursuits              Bid opportunities

  packages              Bid/work packages

  estimates             Cost estimates with versioning

  estimate_lines        Estimate line items

  estimate_assemblies   Grouped estimate components

  alternates            Value engineering alternates

  bid_invitations       Vendor bid invitations

  vendor_quotes         Received vendor quotes

  awards                Contract awards

  ai_extraction_jobs    AI estimator processing jobs
  -----------------------------------------------------------------------

5.4 Cost Module (10 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  budgets               Project budgets

  budget_lines          Budget line items

  cost_codes            CSI MasterFormat cost codes

  change_orders         Change orders with approval workflow

  change_order_items    Change order line items

  commitments           Contracts and POs

  cost_forecasts        EAC/ETC forecasts

  pay_applications      G702/G703 pay apps

  invoices              Vendor invoices

  payments              Payment tracking
  -----------------------------------------------------------------------

5.5 Schedule Module (8 tables)

  ------------------------------------------------------------------------
  **Table**              **Purpose**
  ---------------------- -------------------------------------------------
  schedules              Project schedules

  schedule_versions      Schedule version history

  activities             Schedule activities/tasks

  milestones             Key project milestones

  dependencies           Activity dependencies (FS, SS, FF, SF)

  baselines              Schedule baselines for variance

  resource_assignments   Resource allocation to activities

  delay_logs             Schedule delay tracking
  ------------------------------------------------------------------------

5.6 Risk Module (5 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  risks                 Risk register entries

  risk_categories       Risk classification

  risk_assessments      Risk scoring over time

  mitigations           Risk mitigation actions

  risk_triggers         Early warning indicators
  -----------------------------------------------------------------------

5.7 Quality Module (7 tables)

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  deficiencies            Quality deficiencies/NCRs

  punch_lists             Punch list headers

  punch_list_items        Individual punch items

  inspections             Quality inspections

  inspection_checklists   Inspection templates

  inspection_results      Checklist item results

  corrective_actions      CAR tracking
  -------------------------------------------------------------------------

5.8 Safety Module (9 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  safety_incidents      Incident reports

  safety_observations   Field safety observations

  safety_plans          Site safety plans

  jha_records           Job hazard analyses

  toolbox_talks         Safety meeting records

  safety_training       Training completion records

  safety_equipment      PPE and equipment tracking

  osha_logs             OSHA 300/300A logs

  safety_metrics        TRIR, DART, EMR calculations
  -----------------------------------------------------------------------

5.9 Procurement Module (8 tables)

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  vendors                 Vendor/subcontractor database

  vendor_certifications   Vendor qualifications

  vendor_insurance        Insurance tracking

  vendor_performance      Performance ratings

  contracts               Subcontracts

  purchase_orders         Material POs

  po_lines                PO line items

  lien_waivers            Lien waiver tracking
  -------------------------------------------------------------------------

5.10 Communications Module (10 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  rfis                  Request for information

  rfi_responses         RFI response tracking

  submittals            Submittal packages

  submittal_reviews     Review/approval workflow

  transmittals          Document transmittals

  meetings              Meeting records

  meeting_attendees     Meeting attendance

  action_items          Meeting action items

  correspondence        Formal correspondence log

  approval_workflows    Multi-step approvals
  -----------------------------------------------------------------------

5.11 Staffing Module (7 tables)

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  resources               Staffing resources

  resource_assignments    Project assignments

  certifications          Staff certifications

  timesheets              Time tracking

  timesheet_entries       Daily time entries

  utilization_snapshots   Utilization history

  skill_matrix            Skills inventory
  -------------------------------------------------------------------------

5.12 Closeout Module (6 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  closeout_checklists   Project closeout checklists

  closeout_items        Individual closeout items

  warranties            Warranty tracking

  as_builts             As-built document tracking

  lessons_learned       Project lessons learned

  handover_packages     Client handover packages
  -----------------------------------------------------------------------

5.13 Documents Module (5 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  documents             Document registry

  document_versions     Version history

  document_folders      Folder structure

  document_tags         Document tagging

  document_links        Cross-references
  -----------------------------------------------------------------------

5.14 Tasks Module (4 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  tasks                 Cross-module tasks

  task_assignments      Task assignments

  task_comments         Task discussion

  notifications         System notifications
  -----------------------------------------------------------------------

5.15 Portfolio Module (4 tables)

  -----------------------------------------------------------------------
  **Table**             **Purpose**
  --------------------- -------------------------------------------------
  portfolio_views       Saved dashboard views

  kpi_definitions       KPI configuration

  kpi_snapshots         Historical KPI values

  report_templates      Report definitions
  -----------------------------------------------------------------------

5.16 AGENTIC INFRASTRUCTURE (15 tables)

These tables support the ATLAS agentic AI system:

  -------------------------------------------------------------------------
  **Table**               **Purpose**
  ----------------------- -------------------------------------------------
  agents                  Agent registry (orchestrator + module agents)

  agent_configurations    Agent behavior configuration

  agent_tasks             Tasks assigned to agents

  agent_task_results      Task execution results

  agent_messages          Inter-agent communication

  agent_memory            Agent context/memory storage

  knowledge_graph_nodes   Knowledge graph entities

  knowledge_graph_edges   Knowledge graph relationships

  system_events           Event bus messages

  event_subscriptions     Agent event subscriptions

  coordination_sessions   Multi-agent coordination

  module_ownership        Agent-to-module mapping

  evolution_history       System evolution tracking

  agent_metrics           Agent performance metrics

  safety_boundaries       Agent autonomy limits
  -------------------------------------------------------------------------

5.17 DATABASE TABLE SUMMARY

  -----------------------------------------------------------------------
  **Category**                        **Table Count**
  ----------------------------------- -----------------------------------
  Foundation                          10

  Administration                      6

  Preconstruction                     12

  Cost                                10

  Schedule                            8

  Risk                                5

  Quality                             7

  Safety                              9

  Procurement                         8

  Communications                      10

  Staffing                            7

  Closeout                            6

  Documents                           5

  Tasks                               4

  Portfolio                           4

  Agentic Infrastructure              15

  TOTAL TABLES                        126
  -----------------------------------------------------------------------

**END OF DOCUMENT 1 OF 3**

Continue to Document 2: API Routes + Folder Structure
