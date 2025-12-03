# OC PIPELINE - MASTER SPECIFICATION

## Document Information

| Field | Value |
|-------|-------|
| **Project** | OC Pipeline |
| **Version** | 2.0 |
| **Last Updated** | 2025-11-29 |
| **Owner** | O'Neill Contractors |
| **Status** | Active Development |

---

## 1. Executive Summary

OC Pipeline is a **federal-grade, multi-tenant SaaS platform** designed for complex healthcare, federal, and mission-critical commercial construction projects.

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Modules | 16 |
| Database Tables | 126 |
| AI Agents | 17 |
| User Roles | 8 |
| Permissions | 23 |
| API Endpoints | 60+ |

### Business Value

- **67% reduction** in development time vs. traditional approaches
- **Federal-grade** security and compliance
- **AI-powered** automation through ATLAS system
- **Full lifecycle** coverage from bidding to closeout

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui | Vercel |
| Backend | Node.js, Express, TypeScript | Render |
| Database | PostgreSQL 15 | Supabase |
| Auth | Supabase Auth + Google/Microsoft OAuth | Supabase |
| Storage | S3-compatible object storage | Supabase |

### 2.2 Deployment URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | https://ocpipeline.vercel.app | https://oc-pipeline.onrender.com |

### 2.3 Database Details

- **Provider:** Supabase
- **Project ID:** cwrjhtpycynjzeiggyhf
- **Tables:** 126
- **RLS:** Enabled on all tables
- **Audit:** 7-year immutable trail

---

## 3. Module Overview

### 3.1 Construction Lifecycle Modules

| # | Module | Description | Tables | Agent |
|---|--------|-------------|--------|-------|
| 1 | Preconstruction | Bids, estimates, pipeline | 12 | precon-001 |
| 2 | Cost | Budgets, change orders, forecasts | 14 | cost-001 |
| 3 | Schedule | Gantt, milestones, dependencies | 10 | schedule-001 |
| 4 | Risk | Risk register, mitigation | 8 | risk-001 |
| 5 | Quality | Deficiencies, inspections | 8 | quality-001 |
| 6 | Safety | OSHA compliance, incidents | 10 | safety-001 |
| 7 | Procurement | Vendors, contracts, POs | 10 | procure-001 |
| 8 | Communications | RFIs, submittals | 10 | comms-001 |
| 9 | Staffing | Resources, utilization | 8 | staff-001 |
| 10 | Closeout | Warranties, as-builts | 8 | close-001 |

### 3.2 Support Modules

| # | Module | Description | Tables | Agent |
|---|--------|-------------|--------|-------|
| 11 | Administration | Users, roles, audit | 15 | admin-001 |
| 12 | Portfolio | Cross-project analytics | - | portfolio-001 |
| 13 | Documents | Version control, storage | 5 | docs-001 |
| 14 | Tasks | Workflow engine | 6 | tasks-001 |
| 15 | Finance | Financial analysis | - | finance-001 |
| 16 | AI Estimator | PDF extraction, cost modeling | - | estimate-001 |

---

## 4. Security & Compliance

### 4.1 Compliance Standards

| Standard | Description | Status |
|----------|-------------|--------|
| NIST 800-171 | Federal cybersecurity | ✅ Implemented |
| SOC 2 Type II | Data security controls | ✅ Implemented |
| FISMA | Federal information security | ✅ Implemented |
| GDPR | Data privacy (EU) | ✅ Implemented |
| HIPAA | Healthcare data (where applicable) | ✅ Implemented |

### 4.2 RBAC Matrix Summary

| Role | Authority Level | Key Permissions |
|------|-----------------|-----------------|
| Administrator | 100 | Full system access |
| Executive | 90 | Read-all, approve high-value |
| Project Manager | 80 | Full project control |
| Project Engineer | 70 | Technical management |
| Superintendent | 60 | Field operations |
| Preconstruction | 50 | Bidding, estimating |
| Subcontractor | 30 | Limited scope access |
| Client | 20 | Read-only + comments |

### 4.3 Security Features

- Row-Level Security (RLS) on all 126 tables
- 7-year immutable audit trail (partitioned monthly)
- JWT authentication (1hr access, 30-day refresh)
- MFA enforcement for admin roles
- Session management with device/IP tracking

---

## 5. ATLAS Agentic System

### 5.1 Agent Architecture

ATLAS (Autonomous Task Learning and Assistance System) consists of 17 specialized AI agents.

| Agent ID | Module | Capabilities |
|----------|--------|--------------|
| atlas-001 | Master | Orchestration, multi-agent coordination |
| precon-001 | Preconstruction | Bid analysis, win predictions |
| cost-001 | Cost | Budget monitoring, forecasts |
| schedule-001 | Schedule | Critical path, delay prediction |
| risk-001 | Risk | Risk identification, assessment |
| quality-001 | Quality | Deficiency detection, trends |
| safety-001 | Safety | Incident analysis, compliance |
| procure-001 | Procurement | Vendor recommendations |
| comms-001 | Communications | RFI routing, drafting |
| staff-001 | Staffing | Resource optimization |
| close-001 | Closeout | Documentation completeness |
| admin-001 | Administration | User management, security |
| portfolio-001 | Portfolio | Cross-project analytics |
| docs-001 | Documents | Auto-tagging, search |
| tasks-001 | Tasks | Workflow automation |
| finance-001 | Finance | Financial analysis |
| estimate-001 | AI Estimator | PDF extraction, modeling |

### 5.2 Agentic Infrastructure Tables

| Table | Purpose |
|-------|---------|
| agents | Agent definitions |
| agent_tasks | Task queue |
| agent_messages | Inter-agent communication |
| agent_memory | Persistent memory |
| agent_metrics | Performance tracking |
| knowledge_graph_nodes | KG nodes |
| knowledge_graph_edges | KG relationships |
| system_events | Event bus |
| event_subscriptions | Event handlers |
| coordination_sessions | Multi-agent sessions |
| safety_boundaries | Guardrails |

---

## 6. API Reference

### 6.1 Base URL

```
https://oc-pipeline.onrender.com/api/v1
```

### 6.2 Authentication

All requests require Bearer token:
```
Authorization: Bearer <jwt_token>
```

### 6.3 Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "iso8601"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "iso8601"
  }
}
```

### 6.4 Endpoint Categories

| Category | Prefix | Count |
|----------|--------|-------|
| Auth | /auth | 8 |
| Users | /users | 6 |
| Organizations | /orgs | 5 |
| Projects | /projects | 12 |
| Preconstruction | /precon | 15 |
| Cost | /cost | 10 |
| Schedule | /schedule | 8 |
| Risk | /risks | 6 |
| Quality | /quality | 6 |
| Safety | /safety | 8 |
| Procurement | /procurement | 8 |
| Communications | /comms | 10 |
| Documents | /docs | 6 |
| Tasks | /tasks | 6 |
| ATLAS | /atlas | 8 |

---

## 7. Database Schema Summary

### 7.1 Table Distribution

| Category | Tables |
|----------|--------|
| Foundation | 15 |
| Preconstruction | 12 |
| Cost | 14 |
| Schedule | 10 |
| Risk | 8 |
| Quality | 8 |
| Safety | 10 |
| Procurement | 10 |
| Communications | 10 |
| Staffing | 8 |
| Closeout | 8 |
| ATLAS | 15 |
| **Total** | **126** |

### 7.2 Critical Schema Rules

1. ✅ Use `org_id` (NOT `workspace_id`)
2. ✅ `organizations` table exists (NOT `workspaces`)
3. ✅ All tables have RLS policies
4. ✅ All tables have audit triggers
5. ✅ Foreign keys with ON DELETE CASCADE where appropriate

---

## 8. Development Guidelines

### 8.1 Code Standards

- TypeScript strict mode
- ES modules (import/export)
- Functional React components with hooks
- shadcn/ui components
- Tailwind CSS for styling
- Parameterized SQL queries only

### 8.2 Git Workflow

```
main (production)
  └── develop (staging)
       └── feature/xxx (feature branches)
       └── fix/xxx (bug fixes)
```

### 8.3 Commit Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: precon, cost, schedule, risk, quality, safety, etc.
```

---

## 9. Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| Database Tables | docs/specs/database-tables-reference.md | All 126 tables |
| API Routes | docs/specs/02-api-routes.md | Full endpoint docs |
| RBAC Matrix | docs/specs/rbac-matrix.md | Permission matrix |
| Compliance | docs/specs/compliance-requirements.md | Security standards |
| Architecture | docs/architecture/ | System design |

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-11-29 | Complete restructure for Cursor migration |
| 1.0 | 2025-10-01 | Initial specification |

---

**End of Master Specification**

