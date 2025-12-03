# Target Architecture: ALPA Construction Opportunity Dashboard

**Date:** October 29, 2025  
**Version:** 2.0 (Target State)

---

## Executive Summary

This document outlines the target architecture after implementing all recommended fixes from the audit. The system will evolve from a functional MVP to an enterprise-grade, production-ready business intelligence platform.

**Key Improvements:**
- ✅ Comprehensive test coverage (70%+)
- ✅ Full observability stack (Sentry + structured logging)
- ✅ Hardened security (RLS + Auth + RBAC)
- ✅ Optimized performance (bundle < 500KB, p95 latency < 300ms)
- ✅ Automated CI/CD pipeline
- ✅ Scalable architecture (supports 10K+ projects)

---

## C4 Model: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - ALPA Construction Opportunity Dashboard

    Person(user, "ALPA User", "Project Manager, Executive, or Analyst")
    Person(admin, "System Admin", "IT Administrator")
    
    System(dashboard, "Opportunity Dashboard", "React SPA providing BI analytics, KPI tracking, and geographic visualization")
    
    System_Ext(supabase, "Supabase", "PostgreSQL database + Auth + Storage + Real-time")
    System_Ext(sentry, "Sentry", "Error tracking and performance monitoring")
    System_Ext(vercel, "Vercel", "Static hosting and CDN")
    System_Ext(github, "GitHub Actions", "CI/CD pipeline")
    System_Ext(sam_gov, "SAM.gov", "Federal procurement data source")
    
    Rel(user, dashboard, "Views dashboards, filters data, exports reports", "HTTPS")
    Rel(admin, dashboard, "Manages users, configures settings", "HTTPS")
    
    Rel(dashboard, supabase, "Queries projects, authenticates users", "PostgREST API")
    Rel(dashboard, sentry, "Sends errors and performance metrics", "HTTPS")
    Rel(dashboard, sam_gov, "Links to solicitations", "HTTPS")
    
    Rel(vercel, dashboard, "Hosts and serves", "CDN")
    Rel(github, vercel, "Deploys on push", "Webhook")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## C4 Model: Container Diagram

```mermaid
C4Container
    title Container Diagram - Opportunity Dashboard

    Person(user, "User", "Project Manager or Executive")
    
    Container_Boundary(frontend, "Frontend (React SPA)") {
        Container(react_app, "React Application", "TypeScript, React 19", "Renders UI, manages state, handles user interactions")
        Container(map_component, "Map Component", "Leaflet, React-Leaflet", "Renders geographic visualizations with markers and heatmaps")
        Container(chart_component, "Chart Component", "Recharts", "Renders KPI charts and analytics")
    }
    
    Container_Boundary(backend, "Backend (Supabase)") {
        ContainerDb(postgres, "PostgreSQL Database", "Supabase", "Stores projects, users, targets, competitors")
        Container(auth, "Authentication", "Supabase Auth", "Handles user login, JWT tokens, sessions")
        Container(storage, "File Storage", "Supabase Storage", "Stores uploaded documents and exports")
        Container(realtime, "Real-time", "Supabase Realtime", "Broadcasts project updates to connected clients")
    }
    
    Container_Boundary(observability, "Observability") {
        Container(sentry, "Sentry", "Error Tracking", "Captures errors, performance metrics, user sessions")
        Container(logs, "Structured Logs", "Console + Sentry", "Logs application events with correlation IDs")
    }
    
    Container_Boundary(cicd, "CI/CD") {
        Container(github_actions, "GitHub Actions", "CI/CD", "Runs tests, builds, deploys")
        Container(vercel, "Vercel", "Hosting", "Serves static assets via CDN")
    }
    
    Rel(user, react_app, "Interacts with", "HTTPS")
    Rel(react_app, map_component, "Renders", "Props")
    Rel(react_app, chart_component, "Renders", "Props")
    
    Rel(react_app, postgres, "Queries data", "PostgREST API")
    Rel(react_app, auth, "Authenticates", "JWT")
    Rel(react_app, storage, "Uploads/downloads", "REST API")
    Rel(react_app, realtime, "Subscribes to updates", "WebSocket")
    
    Rel(react_app, sentry, "Sends errors", "HTTPS")
    Rel(react_app, logs, "Writes logs", "Console")
    
    Rel(github_actions, vercel, "Deploys", "Webhook")
    Rel(vercel, react_app, "Serves", "CDN")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## C4 Model: Component Diagram (Frontend)

```mermaid
C4Component
    title Component Diagram - React Frontend

    Container_Boundary(app, "React Application") {
        Component(router, "Router", "React Router", "Handles navigation and routing")
        Component(auth_guard, "Auth Guard", "ProtectedRoute", "Protects routes requiring authentication")
        
        Component(dashboard_view, "Dashboard View", "OpportunityDashboard.tsx", "Main dashboard orchestrator")
        Component(kpi_cards, "KPI Cards", "DashboardKPICards.tsx", "Displays key metrics with click-to-filter")
        Component(map_widget, "Map Widget", "GeoMapTemplate_HeatView.tsx", "Interactive map with pin/heatmap toggle")
        Component(table_widget, "Table Widget", "BiddingProjectsTable.tsx", "Sortable table with countdown timers")
        Component(analytics_panel, "Analytics Panel", "BiddingAnalyticsPanel.tsx", "Displays velocity and capacity metrics")
        
        Component(dashboard_service, "Dashboard Service", "dashboard.service.ts", "Business logic for KPI calculations")
        Component(supabase_client, "Supabase Client", "supabase.ts", "Database connection and queries")
        Component(query_hooks, "Query Hooks", "useDashboardData.ts", "React Query hooks for data fetching")
        
        Component(map_filter_context, "Map Filter Context", "MapFilterContext.tsx", "Shared state for KPI-map sync")
        Component(error_boundary, "Error Boundary", "ErrorBoundary.tsx", "Catches and displays errors")
        Component(logger, "Logger", "sentry.ts", "Structured logging and error tracking")
    }
    
    ContainerDb(postgres, "PostgreSQL", "Supabase", "Data storage")
    Container(sentry_service, "Sentry", "Error Tracking", "Observability")
    
    Rel(router, auth_guard, "Protects routes")
    Rel(auth_guard, dashboard_view, "Renders if authenticated")
    
    Rel(dashboard_view, kpi_cards, "Renders")
    Rel(dashboard_view, map_widget, "Renders")
    Rel(dashboard_view, table_widget, "Renders")
    Rel(dashboard_view, analytics_panel, "Renders")
    
    Rel(kpi_cards, map_filter_context, "Sets filter")
    Rel(map_widget, map_filter_context, "Reads filter")
    
    Rel(dashboard_view, query_hooks, "Fetches data")
    Rel(query_hooks, dashboard_service, "Calls methods")
    Rel(dashboard_service, supabase_client, "Queries database")
    Rel(supabase_client, postgres, "SQL queries", "PostgREST")
    
    Rel(error_boundary, logger, "Logs errors")
    Rel(logger, sentry_service, "Sends errors", "HTTPS")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Enhanced Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_roles : has
    users ||--o{ pipeline_projects : creates
    users ||--o{ audit_logs : generates
    
    user_roles {
        uuid id PK
        uuid user_id FK
        varchar role "admin, manager, viewer"
        timestamp created_at
    }
    
    users {
        uuid id PK
        varchar email UK
        varchar full_name
        timestamp created_at
        timestamp last_login
    }
    
    pipeline_projects ||--o{ project_attachments : has
    pipeline_projects ||--o{ project_comments : has
    pipeline_projects ||--o{ audit_logs : tracks
    pipeline_projects }o--|| pipeline_stages : "in stage"
    pipeline_projects }o--o| competitors : "lost to"
    
    pipeline_projects {
        uuid id PK
        varchar name
        varchar project_number UK
        text description
        varchar stage_id FK
        varchar pipeline_type
        decimal value
        decimal win_probability
        varchar agency
        varchar set_aside
        varchar pm
        varchar priority
        varchar status
        boolean is_stalled
        timestamp entered_stage_at
        int days_in_stage
        varchar[] tags
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        varchar web_link
        varchar solicitation_number
        timestamp site_visit_datetime
        timestamp bid_due_datetime
        timestamp rfi_due_datetime
        varchar naics_code
        varchar period_of_performance
        decimal submitted_amount
        decimal awarded_amount
        decimal winning_bid_amount
        varchar winning_contractor FK
        varchar loss_reason
        text lessons_learned
        varchar contract_type
        boolean is_joint_venture
        boolean is_presolicitation
        date expected_award_date
        date award_date
        date start_date
        date completion_date
        date submission_date
        varchar project_city
        varchar project_state
        decimal project_latitude
        decimal project_longitude
        decimal capacity_percentage
    }
    
    pipeline_stages {
        varchar id PK
        varchar name
        varchar pipeline_type
        int order_index
        varchar color
        text description
    }
    
    competitors {
        uuid id PK
        varchar name UK
        int projects_lost_to_them
        decimal total_value_lost
        timestamp created_at
        timestamp updated_at
    }
    
    annual_targets {
        uuid id PK
        int year UK
        decimal target_amount
        timestamp created_at
        timestamp updated_at
    }
    
    project_attachments {
        uuid id PK
        uuid project_id FK
        varchar file_name
        varchar file_path
        varchar file_type
        int file_size
        uuid uploaded_by FK
        timestamp uploaded_at
    }
    
    project_comments {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        text comment
        timestamp created_at
        timestamp updated_at
    }
    
    audit_logs {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        varchar action "create, update, delete, view"
        jsonb old_values
        jsonb new_values
        varchar ip_address
        varchar user_agent
        timestamp created_at
    }
```

---

## Key Architectural Changes

### 1. Security Layer (NEW)

**Before:**
```typescript
// No authentication, RLS disabled
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false }
});
```

**After:**
```typescript
// Full authentication + RLS + RBAC
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

// RLS policies enforce row-level security
// RBAC controls admin vs viewer permissions
```

### 2. Caching Layer (NEW)

**Before:**
```typescript
// Direct API calls, no caching
const loadDashboardData = async () => {
  const kpis = await dashboardService.fetchKPIMetrics();
  const projects = await dashboardService.fetchBiddingProjects();
  // ...
};
```

**After:**
```typescript
// React Query with 5-minute cache
const { data: kpis } = useQuery({
  queryKey: ['kpi-metrics'],
  queryFn: () => dashboardService.fetchKPIMetrics(),
  staleTime: 5 * 60 * 1000,
});

// 60% reduction in API calls
```

### 3. Observability Layer (NEW)

**Before:**
```typescript
// Only console.log
console.log('Fetching data...');
console.error('Error:', error);
```

**After:**
```typescript
// Structured logging + Sentry
logger.info('Fetching KPI metrics', { userId, timestamp });
logger.error('Failed to fetch KPIs', error, { context: 'dashboard' });

// Sentry captures errors with full context
// Performance monitoring tracks Web Vitals
```

### 4. Testing Layer (NEW)

**Before:**
```
No tests
```

**After:**
```
✅ Unit tests: 70% coverage (Vitest)
✅ Component tests: 60% coverage (React Testing Library)
✅ E2E tests: Critical paths (Playwright)
✅ Contract tests: API schemas (Zod)
```

### 5. CI/CD Pipeline (NEW)

**Before:**
```
Manual deployments
```

**After:**
```
✅ Automated CI: Lint → Type-check → Test → Build
✅ Quality gates: Coverage > 70%, Bundle < 500KB
✅ Automated deployments: Staging (on main), Production (on tag)
✅ Rollback strategy: Git revert + redeploy
```

---

## Performance Improvements

### Bundle Size Optimization

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Initial bundle | 750KB | 300KB | 60% |
| Map chunk | - | 200KB | Lazy loaded |
| Chart chunk | - | 150KB | Lazy loaded |
| **Total (initial)** | **750KB** | **300KB** | **60%** |

### API Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| KPI fetch | 500ms | 50ms (cached) | 90% |
| Map data | 800ms | 100ms (cached) | 87% |
| Dashboard load | 2.5s | 0.8s | 68% |
| **p95 latency** | **1200ms** | **< 300ms** | **75%** |

### Render Performance

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| KPI Cards | 120ms | 30ms (memo) | 75% |
| Map render | 500ms | 200ms (optimized) | 60% |
| Table render | 200ms | 80ms (virtualized) | 60% |

---

## Scalability Improvements

### Current Capacity (MVP)

- **Projects:** 15 (sample data)
- **Users:** 1 (no auth)
- **Concurrent users:** N/A
- **Database size:** < 1MB

### Target Capacity (Production)

- **Projects:** 10,000+ (with pagination)
- **Users:** 100+ (with RBAC)
- **Concurrent users:** 50+ (with caching)
- **Database size:** 10GB+ (with partitioning)

### Scaling Strategy

1. **Horizontal Scaling:**
   - Supabase auto-scales database connections
   - Vercel CDN handles global traffic
   - React Query reduces database load

2. **Vertical Scaling:**
   - Upgrade Supabase tier (Pro → Team → Enterprise)
   - Add read replicas for analytics queries
   - Implement database partitioning by year

3. **Caching Strategy:**
   - React Query: 5-minute cache for dashboard data
   - CDN: Cache static assets for 1 year
   - Service Worker: Offline support (future)

---

## Security Enhancements

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Supabase Auth
    participant PostgreSQL
    
    User->>React: Navigate to /dashboard
    React->>Supabase Auth: Check session
    alt No session
        Supabase Auth-->>React: Redirect to /login
        User->>React: Enter credentials
        React->>Supabase Auth: signInWithPassword()
        Supabase Auth->>PostgreSQL: Verify credentials
        PostgreSQL-->>Supabase Auth: User + JWT
        Supabase Auth-->>React: Session + Token
        React->>PostgreSQL: Fetch user role
        PostgreSQL-->>React: Role (admin/manager/viewer)
        React-->>User: Show dashboard
    else Has session
        React->>PostgreSQL: Query with RLS
        PostgreSQL-->>React: Filtered data
        React-->>User: Show dashboard
    end
```

### Row-Level Security (RLS) Policies

```sql
-- Example: Users can only view projects they have access to
CREATE POLICY "Users can view accessible projects"
  ON pipeline_projects FOR SELECT
  TO authenticated
  USING (
    -- Admins see all
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Managers see their assigned projects
    (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'manager'
      )
      AND pm = (SELECT email FROM users WHERE id = auth.uid())
    )
    OR
    -- Viewers see all (read-only)
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'viewer'
    )
  );
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Developer Workstation"
        A[Git Push]
    end
    
    subgraph "GitHub"
        B[GitHub Actions]
        C[Run Tests]
        D[Build]
        E[Deploy]
    end
    
    subgraph "Vercel (Staging)"
        F[Staging Environment]
    end
    
    subgraph "Vercel (Production)"
        G[Production Environment]
        H[CDN Edge Nodes]
    end
    
    subgraph "Supabase"
        I[PostgreSQL]
        J[Auth Service]
        K[Storage]
    end
    
    subgraph "Monitoring"
        L[Sentry]
        M[Vercel Analytics]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    G --> H
    
    F --> I
    G --> I
    F --> J
    G --> J
    F --> K
    G --> K
    
    G --> L
    G --> M
    
    style G fill:#10b981
    style I fill:#3b82f6
    style L fill:#ef4444
```

---

## Technology Stack (Updated)

### Frontend
- **Framework:** React 19 + TypeScript 5.5
- **Build Tool:** Vite 5.4
- **UI Library:** shadcn-ui + Tailwind CSS 3.4
- **State Management:** React Context + React Query 5.x
- **Routing:** React Router 6.x
- **Maps:** Leaflet 1.9 + React-Leaflet 5.x
- **Charts:** Recharts 2.x
- **Forms:** React Hook Form 7.x + Zod 3.x

### Backend
- **Database:** PostgreSQL 15 (Supabase)
- **Auth:** Supabase Auth (JWT-based)
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (WebSocket)

### Testing
- **Unit Tests:** Vitest 1.x
- **Component Tests:** React Testing Library 14.x
- **E2E Tests:** Playwright 1.x
- **Coverage:** V8 (70%+ threshold)

### Observability
- **Error Tracking:** Sentry
- **Logging:** Structured logs (Winston/Pino)
- **Monitoring:** Vercel Analytics
- **Performance:** Web Vitals

### CI/CD
- **Pipeline:** GitHub Actions
- **Hosting:** Vercel
- **Package Manager:** pnpm 8.x

---

## Migration Path

### Phase 1: Critical Fixes (Weeks 1-3)
1. Enable RLS + implement auth
2. Add Sentry + structured logging
3. Set up CI/CD pipeline
4. Write initial test suite (30% coverage)

### Phase 2: Performance (Weeks 4-6)
1. Implement React Query caching
2. Optimize bundle size (code splitting)
3. Add React.memo + useMemo
4. Increase test coverage to 70%

### Phase 3: Scalability (Weeks 7-9)
1. Add pagination for large datasets
2. Implement database partitioning
3. Add read replicas
4. Load testing + optimization

### Phase 4: Polish (Weeks 10-12)
1. Add Storybook
2. Improve documentation
3. Implement remaining minor fixes
4. Final security audit

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | 0% | 70%+ | ❌ |
| Bundle Size | 750KB | < 500KB | ❌ |
| p95 Latency | 1200ms | < 300ms | ❌ |
| Error Rate | Unknown | < 0.1% | ❌ |
| Availability | Unknown | 99.9% | ❌ |
| Security Score | 2.5/5 | 4.5/5 | ❌ |

**Target Date:** January 31, 2026 (90 days)

---

## Conclusion

The target architecture transforms the ALPA Construction Opportunity Dashboard from a functional MVP into an enterprise-grade, production-ready system. Key improvements include:

1. **Security:** RLS + Auth + RBAC + Audit logs
2. **Performance:** 60% smaller bundle, 75% faster loads
3. **Reliability:** 70%+ test coverage, error tracking, monitoring
4. **Scalability:** Supports 10K+ projects, 100+ users
5. **Operability:** Automated CI/CD, structured logging, runbooks

**Next Steps:**
1. Review and approve target architecture
2. Begin Phase 1 implementation (critical fixes)
3. Schedule weekly progress reviews
4. Track metrics against targets