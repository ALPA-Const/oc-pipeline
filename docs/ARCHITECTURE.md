# OC PIPELINE — ELITE MVP ARCHITECTURE
## Pipeline Intelligence & Pursuit Execution Platform

---

## 1. EXECUTIVE SUMMARY

OC Pipeline is a federal contractor-focused platform that transforms fragmented government opportunity data into a connected, actionable pursuit pipeline. It provides GovTribe-equivalent functionality with enterprise-grade architecture and AI-driven intelligence.

### Core Value Proposition
- **Discover** → Federal opportunities from SAM.gov, FPDS, USASpending
- **Research** → Agencies, incumbents, vehicles, competitors
- **Pursue** → Convert opportunities to tracked pursuits through pipeline stages
- **Execute** → Manage capture, proposal, and preconstruction workflows

---

## 2. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐          │
│  │  Discovery   │   Research   │   Pipeline   │   Documents  │          │
│  │   Module     │    Module    │    Module    │    Module    │          │
│  └──────────────┴──────────────┴──────────────┴──────────────┘          │
├──────────────────────────────────────────────────────────────────────────┤
│                         APPLICATION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Opportunity Service │ Pursuit Service │ Entity Service         │    │
│  │  Document Service    │ Search Service  │ Alert Service          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│                         AI INTELLIGENCE LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Document Intel  │  Opportunity Intel  │  Pursuit Intel         │    │
│  │  (Classification, │  (Risk Scoring,     │  (Win Probability,    │    │
│  │   Extraction)     │   Incumbent Match)   │   Gap Analysis)       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓                                           │
│                    HUMAN-IN-THE-LOOP GATES                              │
├──────────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Supabase) │ File Storage │ Full-Text Search       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│                        INTEGRATION LAYER                                  │
│  ┌──────────┬──────────┬──────────────┬──────────┐                      │
│  │ SAM.gov  │  FPDS    │ USASpending  │  DSBS    │                      │
│  │   API    │   API    │     API      │   API    │                      │
│  └──────────┴──────────┴──────────────┴──────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DATA MODEL OVERVIEW

### Entity Relationship Diagram

```
                              ┌─────────────┐
                              │   AGENCY    │
                              │─────────────│
                              │ id          │
                              │ name        │
                              │ parent_id   │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐           ┌─────────────┐          ┌─────────────┐
    │ OPPORTUNITY │           │   AWARD     │          │   VEHICLE   │
    │─────────────│           │─────────────│          │─────────────│
    │ id          │           │ id          │          │ id          │
    │ notice_id   │           │ piid        │          │ name        │
    │ title       │◄─────────►│ value       │◄────────►│ ceiling     │
    │ set_aside   │           │ vendor_id   │          │ type        │
    │ naics       │           │ agency_id   │          │ end_date    │
    └──────┬──────┘           └──────┬──────┘          └──────┬──────┘
           │                         │                         │
           │                         ▼                         │
           │                  ┌─────────────┐                  │
           │                  │   VENDOR    │                  │
           │                  │─────────────│                  │
           │                  │ id          │◄─────────────────┘
           │                  │ uei         │     (vehicle_holders)
           │                  │ name        │
           │                  │ cage_code   │
           │                  │ set_asides  │
           │                  └─────────────┘
           │
           ▼
    ┌─────────────┐           ┌─────────────┐          ┌─────────────┐
    │  PURSUIT    │           │  DOCUMENT   │          │  INCUMBENT  │
    │─────────────│           │─────────────│          │─────────────│
    │ id          │           │ id          │          │ id          │
    │ opp_id      │           │ filename    │          │ vendor_id   │
    │ stage_id    │◄─────────►│ doc_type    │◄────────►│ opp_id      │
    │ win_prob    │           │ extracted   │          │ award_id    │
    │ priority    │           │ links       │          │ confidence  │
    └─────────────┘           └─────────────┘          └─────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `opportunities` | Federal solicitations | notice_id, title, naics, set_aside, deadline |
| `pursuits` | Active pipeline items | opportunity_id, stage_id, win_probability |
| `agencies` | Government agencies | name, abbreviation, parent_id |
| `vendors` | Contractors | uei, cage_code, business_types |
| `awards` | Contract awards | piid, vendor_id, value, dates |
| `contract_vehicles` | IDIQs, GWACs, BPAs | name, ceiling, holder_ids |
| `documents` | All ingested files | filename, type, storage_path, extracted_text |
| `pipeline_stages` | Configurable stages | name, sequence, is_terminal |

---

## 4. AI WORKFLOW DESCRIPTIONS

### AI Capabilities Matrix

| Capability | AI Role | Human Role | Confidence Display |
|------------|---------|------------|-------------------|
| **Document Classification** | Classify type (RFP, SOW, etc.) | Verify if low confidence | Show % confidence |
| **Data Extraction** | Extract dates, values, requirements | Review flagged items | Highlight uncertainty |
| **Incumbent Matching** | Correlate to prior awards | Approve/reject matches | Show match score |
| **Risk Scoring** | Score opportunity risk factors | Review before pursuit decisions | Explain factors |
| **Win Probability** | Calculate based on historical data | Override if needed | Show basis |
| **Gap Analysis** | Identify missing info in solicitation | Issue RFIs | List gaps |

### AI Never Does
- ❌ Fabricate data or entities
- ❌ Make final pursuit decisions
- ❌ Submit proposals or bids
- ❌ Approve without human review
- ❌ Hide confidence levels

### Human-in-the-Loop Gates

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI ANALYSIS WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Document Upload                                                │
│        │                                                         │
│        ▼                                                         │
│   ┌────────────┐                                                │
│   │ AI: Classify│──► Confidence < 80%? ──► [HUMAN REVIEW]       │
│   │  Document   │                              │                 │
│   └────────────┘         ▼ ≥80%                ▼                 │
│        │            Auto-classify         Manual classify        │
│        ▼                                                         │
│   ┌────────────┐                                                │
│   │ AI: Extract │──► Low confidence? ──► [HUMAN VERIFY]         │
│   │    Data     │                              │                 │
│   └────────────┘         ▼                     ▼                 │
│        │            Auto-populate         Mark for review        │
│        ▼                                                         │
│   ┌────────────┐                                                │
│   │ AI: Match   │──► Match score > 70%? ──► Show as suggestion  │
│   │ Incumbents  │                              │                 │
│   └────────────┘         ▼ ≤70%                ▼                 │
│                     Flag uncertainty      [HUMAN CONFIRM]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. UX FLOW: OPPORTUNITY → PURSUIT → EXECUTION

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  DISCOVERY   │    │   RESEARCH   │    │   PIPELINE   │               │
│  │──────────────│    │──────────────│    │──────────────│               │
│  │              │    │              │    │              │               │
│  │ • Search     │    │ • Agency     │    │ • Kanban     │               │
│  │ • Filter     │───►│ • Incumbent  │───►│ • Go/No-Go   │               │
│  │ • Alerts     │    │ • Vehicle    │    │ • Tasks      │               │
│  │ • Import     │    │ • History    │    │ • Team       │               │
│  │              │    │              │    │              │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    OPPORTUNITY DETAIL VIEW                       │   │
│  │─────────────────────────────────────────────────────────────────│   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ HEADER                                                   │   │   │
│  │  │ Title | Agency | Set-Aside | Deadline | [Track] [Pursue]│   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ Overview │ │Documents │ │ Research │ │   AI     │          │   │
│  │  │          │ │          │ │          │ │ Insights │          │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │   │
│  │                                                                  │   │
│  │  Content Area:                                                   │   │
│  │  • Key dates & milestones                                       │   │
│  │  • Classification & codes                                       │   │
│  │  • Points of contact                                            │   │
│  │  • Attached documents (RFP, amendments)                         │   │
│  │  • Related awards & incumbents                                  │   │
│  │  • AI risk assessment & recommendations                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PURSUIT DETAIL VIEW                         │   │
│  │─────────────────────────────────────────────────────────────────│   │
│  │                                                                  │   │
│  │  Pipeline Stage: [Identified] ─► [Capture] ─► [Proposal] ─► ... │   │
│  │                                                                  │   │
│  │  Win Probability: 65% (AI-calculated)                           │   │
│  │  Priority: HIGH                                                  │   │
│  │                                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ Overview │ │  Tasks   │ │   Team   │ │ Activity │          │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │   │
│  │                                                                  │   │
│  │  Go/No-Go Decision: [PENDING]                                   │   │
│  │  [Record Go] [Record No-Go] [Request More Info]                 │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Screen-by-Screen Flow

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Discovery | Enter search criteria | Query SAM.gov, show results |
| 2 | Results List | Click opportunity | Open detail view |
| 3 | Opportunity Detail | Review, click "Pursue" | Create pursuit, set to "Identified" |
| 4 | Pursuit Detail | Assign team, set priority | Update pursuit record |
| 5 | Go/No-Go | Record decision | Move to Capture or No-Bid |
| 6 | Capture | Complete tasks | Track progress, update stage |
| 7 | Proposal | Submit bid | Record submission |
| 8 | Award | Record outcome | Mark Won/Lost, log lessons |

---

## 6. MVP FEATURE LIST

### Phase 1: Core Discovery & Pipeline (MVP)

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| SAM.gov search & import | P0 | Medium | Already started |
| Opportunity list with filters | P0 | Medium | GovTribe parity |
| Opportunity detail view | P0 | Medium | All metadata + docs |
| Document storage & viewing | P0 | Medium | Supabase storage |
| Convert to pursuit | P0 | Low | One-click action |
| Pipeline kanban view | P0 | Medium | Drag-drop stages |
| Pipeline table view | P0 | Low | Sortable/filterable |
| Stage configuration | P1 | Low | Admin UI |
| Task tracking | P1 | Medium | Per-pursuit tasks |
| Activity log | P1 | Low | Audit trail |

### Phase 2: Research & Intelligence

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Agency database | P1 | Medium | From SAM.gov |
| Vendor/competitor database | P1 | Medium | From FPDS |
| Award history | P1 | High | FPDS integration |
| Vehicle database | P2 | Medium | IDIQs, GWACs |
| Incumbent identification | P2 | High | AI-assisted |
| Entity relationship graph | P2 | High | Navigation links |

### Phase 3: AI Enhancements

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Document classification | P2 | Medium | AI with confidence |
| Key data extraction | P2 | High | Dates, values, scope |
| Risk scoring | P2 | Medium | Factor-based |
| Win probability | P3 | High | Historical correlation |
| Gap analysis | P3 | Medium | Missing info flags |
| Recommendations | P3 | Medium | Suggested actions |

### Phase 4: Advanced Features

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Saved searches & alerts | P2 | Medium | Email notifications |
| Team collaboration | P2 | Medium | Comments, assignments |
| Custom fields | P3 | Medium | Per-org configuration |
| Reporting dashboard | P3 | Medium | Pipeline analytics |
| State/local opportunities | P4 | High | Future data sources |
| Proposal management | P4 | High | Out of MVP scope |

---

## 7. EXTENSIBILITY NOTES

### Adding New Data Sources
```typescript
// Integration interface
interface DataSourceIntegration {
  name: string;
  fetchOpportunities(params: SearchParams): Promise<Opportunity[]>;
  fetchAwards(params: SearchParams): Promise<Award[]>;
  mapToInternalSchema(raw: any): Opportunity | Award;
}

// Example: Adding state-level source
class CaliforniaEBidIntegration implements DataSourceIntegration {
  name = 'california_ebid';
  // Implementation...
}
```

### Adding New AI Capabilities
```typescript
// AI analysis interface
interface AIAnalysisPlugin {
  type: string;
  analyze(entity: any): Promise<AIAnalysisResult>;
  getConfidence(): number;
  explainResult(): string;
}

// Example: Adding competitive analysis
class CompetitiveAnalysisPlugin implements AIAnalysisPlugin {
  type = 'competitive_analysis';
  // Implementation...
}
```

### Adding New Pipeline Stages
- Admin UI → Pipeline Configuration → Add Stage
- Define: name, sequence, color, behaviors
- No code changes required

---

## 8. TECHNICAL STACK

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Tailwind |
| State | React Query + Context |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI API / Anthropic API |
| Search | PostgreSQL Full-Text + pg_trgm |
| File Storage | Supabase Storage |
| Hosting | Vercel (Frontend) + Render (Backend) |

---

## 9. SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Time to find relevant opportunity | < 30 seconds |
| Time to convert to pursuit | < 5 seconds |
| Document processing time | < 2 minutes |
| AI confidence accuracy | > 85% correlation with human judgment |
| Pipeline stage audit coverage | 100% of transitions logged |

---

## 10. NEXT IMMEDIATE ACTIONS

1. **Complete SAM.gov integration** - Sync full opportunity details
2. **Build opportunity detail page** - GovTribe-equivalent view
3. **Implement pipeline kanban** - Drag-drop stage management
4. **Add document storage** - Upload/view solicitation files
5. **Create saved search** - Reusable filter configurations
6. **Build agency database** - Synced from SAM.gov
