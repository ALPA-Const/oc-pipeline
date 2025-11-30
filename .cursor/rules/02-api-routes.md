**OC PIPELINE**

BACKEND REBUILD SPECIFICATION

**DOCUMENT 2 OF 3**

API Routes (ALL Modules) + Complete Folder Structure

*Version 2.0 - Agentic Edition*

Date: November 2025

**CONFIDENTIAL - INTERNAL USE ONLY**

1\. COMPLETE FOLDER STRUCTURE

Create this EXACT folder structure:

backend/

├── package.json

├── .env

├── src/

│ ├── index.js \# Entry point

│ ├── app.js \# Express configuration

│ │

│ ├── config/

│ │ ├── database.js \# PostgreSQL pool

│ │ ├── supabase.js \# Supabase clients

│ │ └── constants.js \# App constants

│ │

│ ├── middleware/

│ │ ├── auth.js \# JWT authentication

│ │ ├── rbac.js \# Role-based access control

│ │ ├── errorHandler.js \# Global error handler

│ │ ├── requestLogger.js \# Request logging

│ │ ├── rateLimiter.js \# Rate limiting

│ │ └── validateRequest.js \# Request validation

│ │

│ ├── routes/

│ │ ├── index.js \# Route aggregator

│ │ ├── health.routes.js \# Health checks

│ │ ├── auth.routes.js \# Authentication

│ │ │

│ │ │ \# === ADMINISTRATION MODULE ===

│ │ ├── admin/

│ │ │ ├── index.js

│ │ │ ├── users.routes.js

│ │ │ ├── roles.routes.js

│ │ │ ├── permissions.routes.js

│ │ │ ├── organizations.routes.js

│ │ │ ├── audit.routes.js

│ │ │ └── settings.routes.js

│ │ │

│ │ │ \# === PRECONSTRUCTION MODULE ===

│ │ ├── preconstruction/

│ │ │ ├── index.js

│ │ │ ├── projects.routes.js

│ │ │ ├── packages.routes.js

│ │ │ ├── estimates.routes.js

│ │ │ ├── pursuits.routes.js

│ │ │ ├── pipeline.routes.js

│ │ │ └── ai-estimator.routes.js

│ │ │

│ │ │ \# === COST MODULE ===

│ │ ├── cost/

│ │ │ ├── index.js

│ │ │ ├── budgets.routes.js

│ │ │ ├── cost-codes.routes.js

│ │ │ ├── change-orders.routes.js

│ │ │ ├── forecasts.routes.js

│ │ │ ├── commitments.routes.js

│ │ │ └── pay-applications.routes.js

│ │ │ \# === SCHEDULE MODULE ===

│ │ ├── schedule/

│ │ │ ├── index.js

│ │ │ ├── schedules.routes.js

│ │ │ ├── milestones.routes.js

│ │ │ ├── activities.routes.js

│ │ │ ├── dependencies.routes.js

│ │ │ └── baselines.routes.js

│ │ │

│ │ │ \# === RISK MODULE ===

│ │ ├── risk/

│ │ │ ├── index.js

│ │ │ ├── risks.routes.js

│ │ │ ├── mitigations.routes.js

│ │ │ └── risk-categories.routes.js

│ │ │

│ │ │ \# === QUALITY MODULE ===

│ │ ├── quality/

│ │ │ ├── index.js

│ │ │ ├── deficiencies.routes.js

│ │ │ ├── punch-lists.routes.js

│ │ │ ├── inspections.routes.js

│ │ │ └── checklists.routes.js

│ │ │

│ │ │ \# === SAFETY MODULE ===

│ │ ├── safety/

│ │ │ ├── index.js

│ │ │ ├── incidents.routes.js

│ │ │ ├── safety-plans.routes.js

│ │ │ ├── observations.routes.js

│ │ │ ├── training.routes.js

│ │ │ └── metrics.routes.js

│ │ │

│ │ │ \# === PROCUREMENT MODULE ===

│ │ ├── procurement/

│ │ │ ├── index.js

│ │ │ ├── vendors.routes.js

│ │ │ ├── contracts.routes.js

│ │ │ ├── purchase-orders.routes.js

│ │ │ ├── bids.routes.js

│ │ │ └── subcontracts.routes.js

│ │ │

│ │ │ \# === COMMUNICATIONS MODULE ===

│ │ ├── communications/

│ │ │ ├── index.js

│ │ │ ├── rfis.routes.js

│ │ │ ├── submittals.routes.js

│ │ │ ├── transmittals.routes.js

│ │ │ ├── meetings.routes.js

│ │ │ ├── correspondence.routes.js

│ │ │ └── approvals.routes.js

│ │ │ \# === STAFFING MODULE ===

│ │ ├── staffing/

│ │ │ ├── index.js

│ │ │ ├── resources.routes.js

│ │ │ ├── assignments.routes.js

│ │ │ ├── certifications.routes.js

│ │ │ ├── timesheets.routes.js

│ │ │ └── utilization.routes.js

│ │ │

│ │ │ \# === CLOSEOUT MODULE ===

│ │ ├── closeout/

│ │ │ ├── index.js

│ │ │ ├── closeout-items.routes.js

│ │ │ ├── warranties.routes.js

│ │ │ ├── as-builts.routes.js

│ │ │ ├── lessons-learned.routes.js

│ │ │ └── handover.routes.js

│ │ │

│ │ │ \# === PORTFOLIO MODULE ===

│ │ ├── portfolio/

│ │ │ ├── index.js

│ │ │ ├── dashboard.routes.js

│ │ │ ├── analytics.routes.js

│ │ │ ├── reports.routes.js

│ │ │ └── kpis.routes.js

│ │ │

│ │ │ \# === DOCUMENTS MODULE ===

│ │ ├── documents/

│ │ │ ├── index.js

│ │ │ ├── documents.routes.js

│ │ │ ├── folders.routes.js

│ │ │ ├── versions.routes.js

│ │ │ └── tags.routes.js

│ │ │

│ │ │ \# === TASKS MODULE ===

│ │ ├── tasks/

│ │ │ ├── index.js

│ │ │ ├── tasks.routes.js

│ │ │ ├── workflows.routes.js

│ │ │ └── notifications.routes.js

│ │ │

│ │ │ \# === AGENTIC MODULE ===

│ │ └── agentic/

│ │ ├── index.js

│ │ ├── agents.routes.js

│ │ ├── agent-tasks.routes.js

│ │ ├── agent-messages.routes.js

│ │ ├── knowledge-graph.routes.js

│ │ ├── coordination.routes.js

│ │ └── events.routes.js

│ ├── controllers/

│ │ ├── auth.controller.js

│ │ ├── admin/ \# One controller per route file

│ │ ├── preconstruction/

│ │ ├── cost/

│ │ ├── schedule/

│ │ ├── risk/

│ │ ├── quality/

│ │ ├── safety/

│ │ ├── procurement/

│ │ ├── communications/

│ │ ├── staffing/

│ │ ├── closeout/

│ │ ├── portfolio/

│ │ ├── documents/

│ │ ├── tasks/

│ │ └── agentic/

│ │

│ ├── services/

│ │ ├── audit.service.js \# Audit logging

│ │ ├── notification.service.js \# Notifications

│ │ ├── file.service.js \# File handling

│ │ └── ai/

│ │ ├── agent-orchestrator.service.js

│ │ ├── knowledge-graph.service.js

│ │ └── event-bus.service.js

│ │

│ ├── validators/

│ │ ├── auth.validator.js

│ │ ├── common.validator.js

│ │ └── \[module\].validator.js \# One per module

│ │

│ └── utils/

│ ├── response.js \# Standardized responses

│ ├── pagination.js \# Pagination helpers

│ ├── errors.js \# Custom error classes

│ └── logger.js \# Winston logger

2\. API ROUTES - ALL MODULES

Base URL: https://oc-pipeline.onrender.com/api

2.1 Health & Auth Routes

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  GET          /health                    Basic health check

  GET          /health/detailed           Detailed health with DB

  POST         /auth/signup               User registration

  POST         /auth/login                User login

  POST         /auth/logout               User logout

  POST         /auth/refresh              Refresh token

  GET          /auth/me                   Current user profile
  -------------------------------------------------------------------------

2.2 Administration Routes (/admin/\*)

  -----------------------------------------------------------------------------
  **Method**   **Endpoint**                   **Description**
  ------------ ------------------------------ ---------------------------------
  GET          /admin/users                   List all users

  GET          /admin/users/:id               Get user by ID

  POST         /admin/users                   Create user

  PUT          /admin/users/:id               Update user

  DELETE       /admin/users/:id               Deactivate user

  GET          /admin/roles                   List all roles

  GET          /admin/permissions             List all permissions

  PUT          /admin/roles/:id/permissions   Update role permissions

  GET          /admin/audit                   Query audit logs

  GET          /admin/settings                Get org settings

  PUT          /admin/settings                Update org settings
  -----------------------------------------------------------------------------

2.3 Preconstruction Routes (/precon/\*)

  ------------------------------------------------------------------------------
  **Method**   **Endpoint**                    **Description**
  ------------ ------------------------------- ---------------------------------
  CRUD         /precon/projects                Project management

  CRUD         /precon/packages                Package management

  CRUD         /precon/estimates               Estimate management

  CRUD         /precon/pursuits                Pursuit tracking

  GET          /precon/pipeline                Pipeline dashboard data

  GET          /precon/pipeline/stats          Pipeline statistics

  POST         /precon/ai-estimator/extract    Start AI extraction job

  GET          /precon/ai-estimator/jobs/:id   Get extraction job status
  ------------------------------------------------------------------------------

2.4 Cost Routes (/cost/\*)

  --------------------------------------------------------------------------------
  **Method**   **Endpoint**                      **Description**
  ------------ --------------------------------- ---------------------------------
  CRUD         /cost/budgets                     Budget management

  CRUD         /cost/cost-codes                  Cost code library

  CRUD         /cost/change-orders               Change orders

  POST         /cost/change-orders/:id/approve   Approve change order

  CRUD         /cost/forecasts                   Cost forecasting

  CRUD         /cost/commitments                 Commitments/contracts

  CRUD         /cost/pay-apps                    Pay applications
  --------------------------------------------------------------------------------

2.5 Schedule Routes (/schedule/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /schedule/schedules        Project schedules

  CRUD         /schedule/milestones       Milestones

  CRUD         /schedule/activities       Activities/tasks

  CRUD         /schedule/dependencies     Dependencies

  CRUD         /schedule/baselines        Schedule baselines

  GET          /schedule/critical-path    Critical path analysis
  -------------------------------------------------------------------------

2.6 Risk Routes (/risk/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /risk/risks                Risk register

  CRUD         /risk/mitigations          Mitigation actions

  CRUD         /risk/categories           Risk categories

  GET          /risk/heatmap              Risk heat map data
  -------------------------------------------------------------------------

2.7 Quality Routes (/quality/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /quality/deficiencies      Deficiency tracking

  CRUD         /quality/punch-lists       Punch lists

  CRUD         /quality/inspections       Inspections

  CRUD         /quality/checklists        Inspection checklists
  -------------------------------------------------------------------------

2.8 Safety Routes (/safety/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /safety/incidents          Incident reports

  CRUD         /safety/plans              Safety plans

  CRUD         /safety/observations       Field observations

  CRUD         /safety/training           Training records

  GET          /safety/metrics            TRIR/DART/EMR metrics
  -------------------------------------------------------------------------

2.9 Procurement Routes (/procurement/\*)

  -----------------------------------------------------------------------------
  **Method**   **Endpoint**                   **Description**
  ------------ ------------------------------ ---------------------------------
  CRUD         /procurement/vendors           Vendor database

  CRUD         /procurement/contracts         Subcontracts

  CRUD         /procurement/purchase-orders   Purchase orders

  CRUD         /procurement/bids              Bid tracking

  CRUD         /procurement/subcontracts      Subcontract management
  -----------------------------------------------------------------------------

2.10 Communications Routes (/comms/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /comms/rfis                RFI management

  CRUD         /comms/submittals          Submittal packages

  CRUD         /comms/transmittals        Transmittals

  CRUD         /comms/meetings            Meeting records

  CRUD         /comms/correspondence      Correspondence log

  CRUD         /comms/approvals           Approval workflows
  -------------------------------------------------------------------------

2.11 Staffing Routes (/staffing/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /staffing/resources        Resource database

  CRUD         /staffing/assignments      Project assignments

  CRUD         /staffing/certifications   Certification tracking

  CRUD         /staffing/timesheets       Timesheets

  GET          /staffing/utilization      Utilization metrics
  -------------------------------------------------------------------------

2.12 Closeout Routes (/closeout/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /closeout/items            Closeout items

  CRUD         /closeout/warranties       Warranty tracking

  CRUD         /closeout/as-builts        As-built docs

  CRUD         /closeout/lessons          Lessons learned

  CRUD         /closeout/handover         Handover packages
  -------------------------------------------------------------------------

2.13 Documents Routes (/documents/\*)

  ------------------------------------------------------------------------------
  **Method**   **Endpoint**                    **Description**
  ------------ ------------------------------- ---------------------------------
  CRUD         /documents/files                Document management

  CRUD         /documents/folders              Folder structure

  GET          /documents/files/:id/versions   Version history

  CRUD         /documents/tags                 Document tags

  POST         /documents/upload               File upload
  ------------------------------------------------------------------------------

2.14 Tasks Routes (/tasks/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  CRUD         /tasks                     Task management

  POST         /tasks/:id/assign          Assign task

  POST         /tasks/:id/complete        Mark complete

  CRUD         /tasks/workflows           Workflow definitions

  GET          /tasks/notifications       Get notifications
  -------------------------------------------------------------------------

2.15 Portfolio Routes (/portfolio/\*)

  -------------------------------------------------------------------------
  **Method**   **Endpoint**               **Description**
  ------------ -------------------------- ---------------------------------
  GET          /portfolio/dashboard       Dashboard data

  GET          /portfolio/analytics       Analytics data

  CRUD         /portfolio/reports         Report templates

  GET          /portfolio/kpis            KPI metrics
  -------------------------------------------------------------------------

2.16 Agentic Routes (/agentic/\*)

Routes for ATLAS agentic AI system:

  ---------------------------------------------------------------------------
  **Method**   **Endpoint**                 **Description**
  ------------ ---------------------------- ---------------------------------
  GET          /agentic/agents              List all agents

  GET          /agentic/agents/:id          Get agent status

  POST         /agentic/agents/:id/start    Start agent

  POST         /agentic/agents/:id/stop     Stop agent

  POST         /agentic/agents/:id/pause    Pause agent

  POST         /agentic/agents/:id/resume   Resume agent

  CRUD         /agentic/tasks               Agent tasks

  CRUD         /agentic/messages            Agent messages

  GET          /agentic/knowledge/nodes     Knowledge graph nodes

  GET          /agentic/knowledge/edges     Knowledge graph edges

  POST         /agentic/knowledge/query     Query knowledge graph

  POST         /agentic/coordinate          Multi-agent coordination

  POST         /agentic/events/publish      Publish event

  POST         /agentic/events/subscribe    Subscribe to events

  GET          /agentic/events/stream       Event stream (SSE)
  ---------------------------------------------------------------------------

3\. ROUTE STUB PATTERN

Each module route file follows this pattern. Implement business logic
only for the module being built:

// src/routes/\[module\]/\[resource\].routes.js

import express from \'express\';

import { authenticate } from \'../../middleware/auth.js\';

import { requirePermission } from \'../../middleware/rbac.js\';

const router = express.Router();

// List all

router.get(\'/\', authenticate, requirePermission(\'view\'), async (req,
res) =\> {

// TODO: Implement when building this module

res.status(501).json({

success: false,

error: { code: \'NOT_IMPLEMENTED\', message: \'Module not yet
implemented\' }

});

});

// Get by ID

router.get(\'/:id\', authenticate, requirePermission(\'view\'), async
(req, res) =\> {

res.status(501).json({ success: false, error: { code:
\'NOT_IMPLEMENTED\' }});

});

// Create

router.post(\'/\', authenticate, requirePermission(\'create\'), async
(req, res) =\> {

res.status(501).json({ success: false, error: { code:
\'NOT_IMPLEMENTED\' }});

});

// Update

router.put(\'/:id\', authenticate, requirePermission(\'edit\'), async
(req, res) =\> {

res.status(501).json({ success: false, error: { code:
\'NOT_IMPLEMENTED\' }});

});

// Delete

router.delete(\'/:id\', authenticate, requirePermission(\'delete\'),
async (req, res) =\> {

res.status(501).json({ success: false, error: { code:
\'NOT_IMPLEMENTED\' }});

});

export default router;

**END OF DOCUMENT 2 OF 3**

Continue to Document 3: Agentic Infrastructure + Core Implementation +
Deployment
