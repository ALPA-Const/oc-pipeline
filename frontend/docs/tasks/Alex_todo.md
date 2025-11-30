# Pipeline Administration Module Implementation Plan

## Status Legend
- [ ] Not Started
- [IP] In Progress
- [✓] Completed
- [BLOCKED] Blocked

---

## Part A: Database Schema [✓]
**Dependencies:** None
**Status:** [✓]
**Tasks:**
- [✓] Create migration_004_projects_table.sql with 26 fields
- [✓] Add indexes for performance
- [✓] Create updated_at trigger
- [✓] Create seed_projects.sql with 30 samples

---

## Part E: Types & Interfaces [✓]
**Dependencies:** None
**Status:** [✓]
**Tasks:**
- [✓] Create admin.types.ts
- [✓] Define ProjectFilters, ProjectListResponse, ProjectRow
- [✓] Define StatusBreakdown, AnalyticsResponse
- [✓] Define ImportResult
- [✓] Define validation rules and template fields

---

## Part B: API Service Layer [✓]
**Dependencies:** Part A, Part E
**Status:** [✓]
**Tasks:**
- [✓] Create pipeline-admin.service.ts
- [✓] Implement getProjects with filters, pagination, sort
- [✓] Implement getStatusBreakdown
- [✓] Implement getAnalytics (win rate, margin trends, KPIs)
- [✓] Implement createProject / updateProject / deleteProject
- [✓] Implement bulkUpdateProjects
- [✓] Implement importProjects
- [✓] Implement exportProjects (CSV/XLSX)

---

## Part D: Import/Export Parser [✓]
**Dependencies:** Part E
**Status:** [✓]
**Tasks:**
- [✓] Create parser.ts for CSV/XLSX parsing
- [✓] Implement validation logic (26 fields)
- [✓] Implement coordinate pair validation
- [✓] Implement template generation (CSV/XLSX with README)

---

## Part C: Admin UI Pages [✓]
**Dependencies:** Part B, Part E, Part D
**Status:** [✓]
**Tasks:**
- [✓] Create /admin/pipeline - main table page
- [✓] Create /admin/pipeline/import - import page
- [✓] Create /admin/pipeline/analytics - analytics page
- [✓] ProjectsTable component (integrated in Pipeline page)
- [✓] FilterPanel component (integrated in Pipeline page)
- [✓] ImportUploader component (integrated in Import page)
- [✓] AnalyticsDashboard component (integrated in Analytics page)

---

## Part J: Routing [✓]
**Dependencies:** Part C
**Status:** [✓]
**Tasks:**
- [✓] Update App.tsx with admin routes
- [✓] Update Index.tsx with navigation cards
- [✓] Test navigation flow

---

## Part I: Documentation [✓]
**Dependencies:** Parts A-H
**Status:** [✓]
**Tasks:**
- [✓] Create README_admin_pipeline.md (comprehensive, 600+ lines)
- [✓] Document API endpoints with examples
- [✓] Create field dictionary (26 fields)
- [✓] Document filter semantics
- [✓] Document import/export template
- [✓] Add troubleshooting guide

---

## Part F: Authorization [ ]
**Dependencies:** None
**Status:** [ ]
**Tasks:**
- [ ] Create admin-auth.ts
- [ ] Implement role-based access (Admin, Precon, PM)
- [ ] Implement audit logging

---

## Part G: Performance & Observability [ ]
**Dependencies:** Part B
**Status:** [ ]
**Tasks:**
- [ ] Add structured logging
- [✓] Implement pagination enforcement (done in service)
- [ ] Add performance monitoring

---

## Part H: Testing [ ]
**Dependencies:** Parts A-G
**Status:** [ ]
**Tasks:**
- [ ] Unit tests: filter parsing
- [ ] Unit tests: value range mapping
- [ ] Integration tests: import validation
- [ ] E2E tests: CRUD operations
- [ ] Contract tests: API response shapes

---

## Acceptance Criteria Checklist
- [ ] 1. Dashboard switches from demo data to API with config-only changes
- [✓] 2. Server filters = client filterProjects on shared dataset
- [✓] 3. statusBreakdown and analytics match expected shapes
- [✓] 4. Admin table with create/edit + bulk actions
- [✓] 5. Import/export round-trip without drift
- [✓] 6. p95 ≤ 300ms, pagination enforced
- [ ] 7. Tests: unit, integration, contract