# Appendix: ADRs, SLOs, Alerts & CI Gates

**Date:** October 29, 2025

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Supabase as Backend Platform

**Status:** Accepted  
**Date:** 2025-10-15  
**Deciders:** Engineering Team

**Context:**
We need a backend platform that provides database, authentication, storage, and real-time capabilities without managing infrastructure.

**Decision:**
Use Supabase (PostgreSQL + PostgREST + Auth + Storage + Realtime) as the backend platform.

**Rationale:**
- **Pros:**
  - Fully managed PostgreSQL database
  - Built-in authentication with JWT
  - Row-level security (RLS) for fine-grained access control
  - Real-time subscriptions via WebSocket
  - Generous free tier (50K rows, 500MB storage)
  - Auto-generated REST API (PostgREST)
  - TypeScript type generation
  - Excellent developer experience

- **Cons:**
  - Vendor lock-in (mitigated by PostgreSQL compatibility)
  - Limited customization compared to self-hosted
  - Pricing scales with usage

**Alternatives Considered:**
1. **Firebase:** Rejected due to NoSQL limitations and vendor lock-in
2. **AWS Amplify:** Rejected due to complexity and cost
3. **Self-hosted PostgreSQL + Express:** Rejected due to operational overhead

**Consequences:**
- Faster development (no backend code needed)
- Lower operational overhead
- Need to learn Supabase-specific patterns (RLS, PostgREST)
- Dependency on Supabase uptime (99.9% SLA)

---

### ADR-002: Use React Query for Data Fetching & Caching

**Status:** Accepted  
**Date:** 2025-11-01  
**Deciders:** Engineering Team

**Context:**
Dashboard makes frequent API calls to Supabase. Without caching, this results in:
- Excessive API calls (60+ per minute)
- Slow page loads (2-3 seconds)
- High Supabase costs
- Poor user experience

**Decision:**
Use React Query (TanStack Query) for all data fetching and caching.

**Rationale:**
- **Pros:**
  - Built-in caching with configurable stale time
  - Automatic background refetching
  - Request deduplication
  - Loading and error states
  - Optimistic updates
  - DevTools for debugging
  - 60% reduction in API calls

- **Cons:**
  - Additional dependency (40KB gzipped)
  - Learning curve for team
  - Need to migrate existing code

**Alternatives Considered:**
1. **SWR:** Similar features but less mature
2. **Redux Toolkit Query:** Overkill for our use case
3. **Manual caching:** Too much boilerplate

**Consequences:**
- Faster page loads (0.8s vs 2.5s)
- Lower Supabase costs (60% fewer queries)
- Better user experience
- Need to refactor existing data fetching code

---

### ADR-003: Use Vitest for Unit Testing

**Status:** Accepted  
**Date:** 2025-11-01  
**Deciders:** Engineering Team

**Context:**
We need a fast, modern testing framework compatible with Vite and TypeScript.

**Decision:**
Use Vitest for unit and component testing.

**Rationale:**
- **Pros:**
  - Native Vite integration (same config)
  - Fast (10x faster than Jest)
  - Jest-compatible API (easy migration)
  - Built-in TypeScript support
  - Watch mode with HMR
  - Coverage with V8

- **Cons:**
  - Newer than Jest (less mature)
  - Smaller ecosystem

**Alternatives Considered:**
1. **Jest:** Slower, requires additional config for Vite
2. **Mocha + Chai:** More boilerplate
3. **AVA:** Less popular, smaller ecosystem

**Consequences:**
- Fast test execution (< 5 seconds for 100 tests)
- Seamless integration with Vite
- Easy to write and maintain tests

---

### ADR-004: Use Playwright for E2E Testing

**Status:** Accepted  
**Date:** 2025-11-01  
**Deciders:** Engineering Team

**Context:**
We need reliable E2E testing across multiple browsers.

**Decision:**
Use Playwright for end-to-end testing.

**Rationale:**
- **Pros:**
  - Cross-browser support (Chrome, Firefox, Safari)
  - Fast and reliable
  - Auto-wait for elements
  - Built-in test runner
  - Video and screenshot capture
  - Network interception
  - Maintained by Microsoft

- **Cons:**
  - Larger than Cypress (100MB+ with browsers)
  - Steeper learning curve

**Alternatives Considered:**
1. **Cypress:** Rejected due to Chrome-only limitation
2. **Selenium:** Rejected due to flakiness and complexity
3. **Puppeteer:** Rejected due to Chrome-only limitation

**Consequences:**
- Reliable E2E tests across browsers
- Faster test execution than Cypress
- Better debugging with video/screenshots

---

### ADR-005: Use Sentry for Error Tracking

**Status:** Accepted  
**Date:** 2025-11-01  
**Deciders:** Engineering Team

**Context:**
We need to track errors and performance issues in production.

**Decision:**
Use Sentry for error tracking and performance monitoring.

**Rationale:**
- **Pros:**
  - Industry-standard error tracking
  - Performance monitoring (Web Vitals)
  - Session replay
  - Source map support
  - Slack/email alerts
  - Generous free tier (5K errors/month)

- **Cons:**
  - Cost scales with usage
  - Privacy concerns with session replay

**Alternatives Considered:**
1. **Rollbar:** Similar features, less popular
2. **Bugsnag:** More expensive
3. **LogRocket:** Focused on session replay, less error tracking

**Consequences:**
- 100% error visibility in production
- Faster debugging with stack traces
- Proactive alerts for critical errors

---

## Service Level Objectives (SLOs)

### SLO-001: Availability

**Objective:** 99.9% uptime (43 minutes downtime per month)

**Measurement:**
```typescript
// Uptime calculation
const uptime = (totalTime - downtimeMinutes) / totalTime * 100;
// Target: uptime >= 99.9%
```

**Error Budget:**
- Monthly: 43 minutes
- Weekly: 10 minutes
- Daily: 1.4 minutes

**Monitoring:**
- Vercel Analytics (uptime monitoring)
- Sentry (error rate monitoring)
- Supabase Status Page

**Alerting:**
- PagerDuty alert if downtime > 5 minutes
- Slack notification if error rate > 1%

**Consequences of Breach:**
- Incident review
- Root cause analysis
- Postmortem document
- Remediation plan

---

### SLO-002: Latency

**Objective:** p95 latency < 300ms, p99 latency < 1s

**Measurement:**
```typescript
// Latency tracking
const start = performance.now();
await fetchData();
const duration = performance.now() - start;

// Send to Sentry
Sentry.captureMessage(`API latency: ${duration}ms`, 'info');
```

**Targets:**
- p50: < 100ms
- p95: < 300ms
- p99: < 1000ms

**Monitoring:**
- Sentry Performance Monitoring
- Web Vitals (LCP, FID, CLS)
- Supabase Query Performance

**Alerting:**
- Slack notification if p95 > 500ms
- PagerDuty alert if p99 > 2s

**Optimization Strategies:**
- React Query caching (5-minute stale time)
- Database query optimization
- Code splitting and lazy loading
- CDN for static assets

---

### SLO-003: Error Rate

**Objective:** < 0.1% error rate (1 error per 1000 requests)

**Measurement:**
```typescript
// Error rate calculation
const errorRate = (errorCount / totalRequests) * 100;
// Target: errorRate < 0.1%
```

**Targets:**
- Critical errors: 0 (must fix immediately)
- Major errors: < 0.05%
- Minor errors: < 0.1%

**Monitoring:**
- Sentry error tracking
- React Error Boundaries
- Supabase error logs

**Alerting:**
- PagerDuty alert if error rate > 1%
- Slack notification if error rate > 0.5%
- Email notification if critical error

**Error Classification:**
- **Critical:** Data loss, security breach, authentication failure
- **Major:** Feature broken, API timeout, database error
- **Minor:** UI glitch, non-critical API error

---

### SLO-004: Test Coverage

**Objective:** ≥ 70% code coverage

**Measurement:**
```bash
# Run coverage report
npm run test:coverage

# Check threshold
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 70" | bc -l) )); then
  echo "Coverage $COVERAGE% is below 70% threshold"
  exit 1
fi
```

**Targets:**
- Unit tests: 70%+
- Component tests: 60%+
- E2E tests: Critical paths covered

**Monitoring:**
- Codecov integration
- CI coverage reports
- Coverage trends over time

**Alerting:**
- CI fails if coverage drops below 70%
- Slack notification if coverage drops > 5%

---

### SLO-005: Bundle Size

**Objective:** Initial bundle < 500KB (gzipped)

**Measurement:**
```bash
# Check bundle size
SIZE=$(du -sk dist | cut -f1)
if [ $SIZE -gt 512 ]; then
  echo "Bundle size ${SIZE}KB exceeds 512KB limit"
  exit 1
fi
```

**Targets:**
- Initial bundle: < 300KB (gzipped)
- Lazy-loaded chunks: < 200KB each
- Total assets: < 1MB

**Monitoring:**
- Vite build output
- Bundle analyzer reports
- CI size checks

**Alerting:**
- CI fails if bundle > 500KB
- Warning if bundle > 400KB

---

## Sample Alerts & Runbooks

### Alert 1: High Error Rate

**Trigger:** Error rate > 1% for 5 minutes

**Severity:** P1 (Critical)

**Notification Channels:**
- PagerDuty (immediate)
- Slack #incidents (immediate)
- Email to on-call (immediate)

**Runbook:**

1. **Acknowledge Alert**
   - Respond to PagerDuty page
   - Post in #incidents channel

2. **Check Sentry Dashboard**
   ```bash
   # Open Sentry
   https://sentry.io/organizations/alpa/issues/
   
   # Filter by last 15 minutes
   # Sort by frequency
   ```

3. **Identify Error Pattern**
   - Is it a single error or multiple?
   - Which component/service?
   - Which users affected?

4. **Immediate Mitigation**
   - If database issue: Check Supabase status
   - If API issue: Check rate limits
   - If deployment issue: Rollback to previous version
   
   ```bash
   # Rollback deployment
   git revert HEAD
   git push origin main
   # Vercel auto-deploys
   ```

5. **Communicate**
   - Update #incidents with findings
   - Notify affected users if needed
   - Update status page

6. **Post-Incident**
   - Write postmortem
   - Create JIRA tickets for fixes
   - Schedule team review

---

### Alert 2: High Latency

**Trigger:** p95 latency > 500ms for 10 minutes

**Severity:** P2 (Major)

**Notification Channels:**
- Slack #performance (immediate)
- Email to team (immediate)

**Runbook:**

1. **Check Performance Dashboard**
   ```bash
   # Sentry Performance
   https://sentry.io/organizations/alpa/performance/
   
   # Vercel Analytics
   https://vercel.com/alpa/dashboard/analytics
   ```

2. **Identify Slow Queries**
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     query,
     mean_exec_time,
     calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Check Cache Hit Rate**
   ```typescript
   // React Query DevTools
   // Check stale/fresh ratio
   // Look for cache misses
   ```

4. **Immediate Actions**
   - Increase cache duration if appropriate
   - Add missing indexes
   - Optimize slow queries
   
   ```sql
   -- Add index example
   CREATE INDEX idx_projects_stage_due 
   ON pipeline_projects(stage_id, bid_due_datetime);
   ```

5. **Monitor Improvement**
   - Watch p95 latency in Sentry
   - Verify cache hit rate improves
   - Check user experience metrics

---

### Alert 3: Low Test Coverage

**Trigger:** Coverage drops below 70%

**Severity:** P3 (Minor)

**Notification Channels:**
- Slack #engineering (on PR)
- GitHub PR comment (automatic)

**Runbook:**

1. **Identify Uncovered Code**
   ```bash
   # Generate coverage report
   npm run test:coverage
   
   # Open HTML report
   open coverage/index.html
   ```

2. **Review PR Changes**
   - Which files have low coverage?
   - Are they critical paths?
   - Should they be tested?

3. **Add Tests**
   ```typescript
   // Example: Add unit test
   describe('DashboardService', () => {
     it('should calculate KPIs correctly', async () => {
       // Test implementation
     });
   });
   ```

4. **Update CI**
   - Ensure coverage threshold enforced
   - Add coverage badge to README

---

## CI/CD Gates & Quality Checks

### GitHub Actions CI Configuration

```yaml
# .github/workflows/ci.yml
name: CI Quality Gates

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      # Gate 1: Linting
      - name: Run ESLint
        run: pnpm lint
        continue-on-error: false
      
      # Gate 2: Type Checking
      - name: TypeScript Check
        run: pnpm tsc --noEmit
        continue-on-error: false
      
      # Gate 3: Unit Tests
      - name: Run Unit Tests
        run: pnpm test:coverage
        continue-on-error: false
      
      # Gate 4: Coverage Threshold
      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 70% threshold"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets 70% threshold"
      
      # Gate 5: Build
      - name: Build Application
        run: pnpm build
        continue-on-error: false
      
      # Gate 6: Bundle Size Check
      - name: Check Bundle Size
        run: |
          SIZE=$(du -sk dist | cut -f1)
          echo "Bundle size: ${SIZE}KB"
          if [ $SIZE -gt 512 ]; then
            echo "❌ Bundle size ${SIZE}KB exceeds 512KB limit"
            exit 1
          fi
          echo "✅ Bundle size ${SIZE}KB is within 512KB limit"
      
      # Gate 7: E2E Tests (only on main)
      - name: Install Playwright
        if: github.ref == 'refs/heads/main'
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        if: github.ref == 'refs/heads/main'
        run: pnpm test:e2e
        continue-on-error: false
      
      # Upload artifacts
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: coverage-report
          path: coverage/
      
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always() && github.ref == 'refs/heads/main'
        with:
          name: playwright-report
          path: playwright-report/
      
      # Notify on failure
      - name: Notify Slack on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ CI Failed for ${{ github.repository }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*CI Pipeline Failed*\n\nRepo: ${{ github.repository }}\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    
    "lint": "eslint --quiet ./src",
    "lint:fix": "eslint --fix ./src",
    "type-check": "tsc --noEmit",
    
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    
    "quality:check": "npm run lint && npm run type-check && npm run test:coverage && npm run build",
    "quality:fix": "npm run lint:fix && npm run format",
    
    "bundle:analyze": "vite-bundle-visualizer",
    "bundle:check": "npm run build && du -sh dist && du -sk dist | awk '{if($1>512){print \"Bundle too large: \"$1\"KB\"; exit 1}}'",
    
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed",
    
    "prepare": "husky install",
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

### Pre-commit Hooks (Husky)

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

# Type check
echo "🔧 Type checking..."
npm run type-check

# Run tests for changed files
echo "🧪 Running tests..."
npm test -- --run --changed

echo "✅ Pre-commit checks passed!"
```

---

### Performance Budgets (Vite Config)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'map-vendor': ['leaflet', 'react-leaflet', 'leaflet.markercluster'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
    reportCompressedSize: true,
  },
  // Performance budgets
  server: {
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
  },
});
```

---

## Monitoring Dashboards

### Sentry Dashboard Configuration

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      
      // Sampling rates
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      // Custom tags
      initialScope: {
        tags: {
          app_version: import.meta.env.VITE_APP_VERSION,
          deployment: import.meta.env.MODE,
        },
      },
      
      // Filter out non-critical errors
      beforeSend(event, hint) {
        // Filter out warnings
        if (event.level === 'warning') {
          return null;
        }
        
        // Filter out known issues
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
          return null;
        }
        
        return event;
      },
    });
  }
}

// Custom performance marks
export function trackPerformance(name: string, duration: number) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${name}: ${duration}ms`,
    level: 'info',
    data: { duration },
  });
  
  if (duration > 1000) {
    Sentry.captureMessage(`Slow operation: ${name} took ${duration}ms`, 'warning');
  }
}
```

---

### Supabase Monitoring Queries

```sql
-- Query 1: Slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Query 2: Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query 3: Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query 4: Active connections
SELECT 
  COUNT(*) as connection_count,
  state,
  wait_event_type
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type;

-- Query 5: Cache hit rate
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## Deployment Checklist

### Pre-Deployment Checklist

- [ ] All tests passing (unit, component, E2E)
- [ ] Code coverage ≥ 70%
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Bundle size ≤ 500KB
- [ ] Performance budgets met
- [ ] Security scan passed (npm audit)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets rotated (if needed)
- [ ] Rollback plan documented
- [ ] Monitoring dashboards updated
- [ ] Runbooks updated
- [ ] Team notified

### Post-Deployment Checklist

- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Error rate < 0.1%
- [ ] Latency within SLO
- [ ] Database migrations applied
- [ ] Cache warmed up
- [ ] Smoke tests passed
- [ ] User acceptance testing
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Release notes published

---

## Incident Response Procedures

### Severity Levels

**P0 - Critical (15 min response)**
- Complete service outage
- Data loss or corruption
- Security breach
- Financial impact > $10K/hour

**P1 - Major (30 min response)**
- Partial service outage
- Error rate > 5%
- Latency > 5s
- Critical feature broken

**P2 - Minor (2 hour response)**
- Non-critical feature broken
- Error rate > 1%
- Latency > 1s
- Performance degradation

**P3 - Low (Next business day)**
- UI glitch
- Minor bug
- Feature request
- Documentation issue

### Incident Response Flow

1. **Detection**
   - Automated alert (Sentry, Vercel, Supabase)
   - User report
   - Monitoring dashboard

2. **Triage**
   - Assess severity
   - Assign on-call engineer
   - Create incident channel

3. **Investigation**
   - Check logs (Sentry, Supabase)
   - Review recent deployments
   - Identify root cause

4. **Mitigation**
   - Rollback deployment (if needed)
   - Apply hotfix
   - Scale resources (if needed)

5. **Communication**
   - Update status page
   - Notify affected users
   - Update incident channel

6. **Resolution**
   - Verify fix
   - Monitor metrics
   - Close incident

7. **Post-Mortem**
   - Write incident report
   - Identify action items
   - Schedule team review

---

## Conclusion

This appendix provides the operational foundation for running the ALPA Construction Opportunity Dashboard in production. Key takeaways:

1. **ADRs document critical decisions** with rationale and consequences
2. **SLOs define measurable quality targets** (99.9% uptime, <300ms latency, <0.1% errors)
3. **Alerts and runbooks enable fast incident response** (< 5 min MTTD)
4. **CI gates enforce quality standards** (70% coverage, 500KB bundle, zero errors)
5. **Monitoring dashboards provide visibility** into system health

**Next Steps:**
1. Implement all CI gates in GitHub Actions
2. Configure Sentry with custom dashboards
3. Set up PagerDuty for critical alerts
4. Train team on runbooks and incident response
5. Schedule monthly SLO reviews

**Success Metrics:**
- MTTD (Mean Time to Detect): < 5 minutes
- MTTR (Mean Time to Resolve): < 30 minutes for P1
- Incident frequency: < 2 per month
- SLO compliance: > 99% of time