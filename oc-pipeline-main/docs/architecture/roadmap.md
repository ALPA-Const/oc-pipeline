# 30-60-90 Day Roadmap: ALPA Construction Opportunity Dashboard

**Start Date:** November 1, 2025  
**Target Completion:** January 31, 2026  
**Team Size:** 2 developers (1 senior + 1 mid-level)

---

## 30-Day Plan: Critical Fixes (November 1-30, 2025)

**Goal:** Achieve production-readiness for critical security, observability, and testing gaps.

### Week 1 (Nov 1-7): Security & Observability Foundation

#### Day 1-2: Enable RLS + Auth Setup
**Owner:** Senior Developer  
**Effort:** 16 hours

**Tasks:**
1. Run migration to enable RLS on all tables
   ```sql
   ALTER TABLE pipeline_projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;
   ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
   ```
2. Create RLS policies for authenticated users
3. Create `user_roles` table for RBAC
4. Test RLS policies with different user roles

**Definition of Done:**
- [ ] RLS enabled on all tables
- [ ] Policies created and tested
- [ ] Admin can CRUD all projects
- [ ] Manager can CRUD assigned projects
- [ ] Viewer can only read projects

**Measurable Outcome:** Security score increases from 2.5/5 to 3.5/5

---

#### Day 3-4: Implement Supabase Auth
**Owner:** Senior Developer  
**Effort:** 16 hours

**Tasks:**
1. Update `supabase.ts` to enable auth
2. Create `LoginPage.tsx` component
3. Create `ProtectedRoute.tsx` wrapper
4. Add auth helpers (signIn, signOut, getCurrentUser)
5. Update `App.tsx` to protect dashboard route
6. Create `.env.example` with required secrets

**Definition of Done:**
- [ ] Users can log in with email/password
- [ ] Dashboard requires authentication
- [ ] Sessions persist across page refreshes
- [ ] Logout works correctly
- [ ] `.env.example` documented

**Measurable Outcome:** 100% of routes protected by authentication

---

#### Day 5-6: Add Sentry + Structured Logging
**Owner:** Mid-Level Developer  
**Effort:** 16 hours

**Tasks:**
1. Install Sentry SDK + Vite plugin
2. Create `sentry.ts` with initialization
3. Create `Logger` class for structured logging
4. Add React Error Boundaries to all routes
5. Update `dashboard.service.ts` to use Logger
6. Configure Sentry dashboard + alerts

**Definition of Done:**
- [ ] Sentry captures all errors
- [ ] Error boundaries display friendly messages
- [ ] Structured logs include context (user, timestamp)
- [ ] Sentry dashboard shows error trends
- [ ] Alerts configured for critical errors

**Measurable Outcome:** 100% of errors tracked and logged

---

#### Day 7: Set Up CI/CD Pipeline
**Owner:** Senior Developer  
**Effort:** 8 hours

**Tasks:**
1. Create `.github/workflows/ci.yml`
2. Add lint, type-check, build jobs
3. Create `.github/workflows/deploy.yml`
4. Configure Vercel deployment
5. Add GitHub secrets (Supabase, Vercel, Sentry)
6. Test CI/CD with dummy PR

**Definition of Done:**
- [ ] CI runs on every PR
- [ ] Linting errors block merge
- [ ] Type errors block merge
- [ ] Build failures block merge
- [ ] Successful builds deploy to staging
- [ ] Tagged releases deploy to production

**Measurable Outcome:** 100% of PRs pass automated checks before merge

---

### Week 2 (Nov 8-14): Testing Infrastructure

#### Day 8-10: Set Up Testing Framework
**Owner:** Senior Developer  
**Effort:** 24 hours

**Tasks:**
1. Install Vitest + React Testing Library
2. Create `vitest.config.ts`
3. Create `src/test/setup.ts`
4. Write 10 unit tests for `dashboard.service.ts`
5. Write 5 component tests for `DashboardKPICards`
6. Add test scripts to `package.json`

**Definition of Done:**
- [ ] Vitest configured and running
- [ ] 15 tests passing
- [ ] Coverage report generated
- [ ] `npm test` runs all tests
- [ ] `npm run test:coverage` shows coverage

**Measurable Outcome:** 30% test coverage achieved

---

#### Day 11-13: Write Core Tests
**Owner:** Both Developers  
**Effort:** 24 hours

**Tasks:**
1. Write 15 more unit tests (services, utilities)
2. Write 10 component tests (KPI cards, table, map)
3. Add mock data for tests
4. Fix any bugs found during testing
5. Update CI to run tests

**Definition of Done:**
- [ ] 40 total tests passing
- [ ] All critical services tested
- [ ] All dashboard components tested
- [ ] CI runs tests on every PR
- [ ] Coverage > 50%

**Measurable Outcome:** 50% test coverage achieved

---

#### Day 14: E2E Testing Setup
**Owner:** Mid-Level Developer  
**Effort:** 8 hours

**Tasks:**
1. Install Playwright
2. Create `playwright.config.ts`
3. Write 3 E2E tests:
   - Dashboard loads successfully
   - KPI card filters map
   - Heatmap toggle works
4. Add E2E tests to CI

**Definition of Done:**
- [ ] Playwright configured
- [ ] 3 E2E tests passing locally
- [ ] E2E tests run in CI
- [ ] Test reports uploaded as artifacts

**Measurable Outcome:** Critical user flows covered by E2E tests

---

### Week 3 (Nov 15-21): Performance Optimization

#### Day 15-17: Implement React Query Caching
**Owner:** Senior Developer  
**Effort:** 24 hours

**Tasks:**
1. Install React Query + devtools
2. Create `queryClient.ts`
3. Create custom hooks (`useDashboardData.ts`)
4. Refactor `OpportunityDashboard.tsx` to use hooks
5. Add React Query DevTools
6. Test caching behavior

**Definition of Done:**
- [ ] React Query configured
- [ ] All data fetching uses React Query
- [ ] 5-minute cache working
- [ ] DevTools show cache status
- [ ] API calls reduced by 60%

**Measurable Outcome:** 60% reduction in API calls

---

#### Day 18-20: Bundle Size Optimization
**Owner:** Mid-Level Developer  
**Effort:** 24 hours

**Tasks:**
1. Add lazy loading for routes
2. Add lazy loading for map components
3. Configure code splitting in `vite.config.ts`
4. Analyze bundle with `vite-bundle-visualizer`
5. Remove unused dependencies
6. Add bundle size check to CI

**Definition of Done:**
- [ ] Initial bundle < 350KB
- [ ] Map chunk lazy loaded
- [ ] Chart chunk lazy loaded
- [ ] Bundle visualizer shows split
- [ ] CI fails if bundle > 500KB

**Measurable Outcome:** Bundle size reduced from 750KB to 350KB (53% reduction)

---

#### Day 21: Week 3 Review & Documentation
**Owner:** Both Developers  
**Effort:** 8 hours

**Tasks:**
1. Review all completed work
2. Update README with setup instructions
3. Document auth flow
4. Document testing strategy
5. Create CONTRIBUTING.md
6. Prepare demo for stakeholders

**Definition of Done:**
- [ ] All Week 3 tasks completed
- [ ] Documentation updated
- [ ] Demo prepared
- [ ] Stakeholder review scheduled

**Measurable Outcome:** 30-day checkpoint achieved

---

### Week 4 (Nov 22-30): Polish & Stabilization

#### Day 22-24: Add React.memo + Performance Tuning
**Owner:** Senior Developer  
**Effort:** 24 hours

**Tasks:**
1. Add React.memo to expensive components
2. Add useMemo for computed values
3. Add useCallback for event handlers
4. Optimize countdown timer updates
5. Profile with React DevTools
6. Fix performance bottlenecks

**Definition of Done:**
- [ ] All expensive components memoized
- [ ] Re-renders reduced by 50%
- [ ] Profiler shows improved performance
- [ ] No unnecessary re-renders

**Measurable Outcome:** 50% reduction in component re-renders

---

#### Day 25-27: Increase Test Coverage to 70%
**Owner:** Both Developers  
**Effort:** 24 hours

**Tasks:**
1. Write 20 more unit tests
2. Write 10 more component tests
3. Add integration tests for auth flow
4. Add E2E tests for error scenarios
5. Update coverage threshold to 70%

**Definition of Done:**
- [ ] 70+ tests passing
- [ ] Coverage > 70%
- [ ] CI enforces 70% threshold
- [ ] All critical paths tested

**Measurable Outcome:** 70% test coverage achieved

---

#### Day 28-30: Security Hardening & Audit
**Owner:** Senior Developer  
**Effort:** 24 hours

**Tasks:**
1. Review all RLS policies
2. Add audit logging for sensitive operations
3. Implement rate limiting (Supabase)
4. Add CORS configuration
5. Add CSP headers
6. Run security scan (npm audit, Snyk)
7. Fix vulnerabilities

**Definition of Done:**
- [ ] RLS policies reviewed and tested
- [ ] Audit logs capture all CRUD operations
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] CSP headers added
- [ ] Zero critical vulnerabilities

**Measurable Outcome:** Security score increases to 4.5/5

---

## 30-Day Checkpoint Review (Nov 30)

### Metrics Achieved

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test Coverage | 70% | TBD | ⏳ |
| Security Score | 4.5/5 | TBD | ⏳ |
| Bundle Size | < 500KB | TBD | ⏳ |
| API Call Reduction | 60% | TBD | ⏳ |
| CI/CD Pipeline | 100% | TBD | ⏳ |

### Go/No-Go Decision

**Criteria for proceeding to 60-day plan:**
- [ ] Test coverage ≥ 70%
- [ ] Security score ≥ 4.0
- [ ] Bundle size ≤ 500KB
- [ ] CI/CD pipeline operational
- [ ] Zero critical bugs

---

## 60-Day Plan: Scalability & Advanced Features (Dec 1-31, 2025)

**Goal:** Prepare system for scale (10K+ projects, 100+ users)

### Week 5-6 (Dec 1-14): Database Optimization

#### Tasks:
1. Add composite indexes for common queries
2. Implement database partitioning by year
3. Add read replicas for analytics
4. Optimize slow queries (EXPLAIN ANALYZE)
5. Add query result caching (Redis/Supabase Cache)
6. Load test with 10K projects

**Owner:** Senior Developer  
**Effort:** 80 hours

**Definition of Done:**
- [ ] Composite indexes added
- [ ] Partitioning implemented
- [ ] Read replicas configured
- [ ] All queries < 100ms
- [ ] Load test passes (10K projects)

**Measurable Outcome:** Database handles 10K+ projects with p95 latency < 100ms

---

### Week 7-8 (Dec 15-31): Advanced Features

#### Tasks:
1. Add pagination for large datasets
2. Implement virtual scrolling for tables
3. Add export to PDF (in addition to CSV)
4. Add real-time updates (Supabase Realtime)
5. Add offline support (Service Worker)
6. Add advanced filtering (date ranges, multi-select)

**Owner:** Both Developers  
**Effort:** 80 hours

**Definition of Done:**
- [ ] Pagination works for 10K+ projects
- [ ] Virtual scrolling smooth
- [ ] PDF export functional
- [ ] Real-time updates working
- [ ] Offline mode functional
- [ ] Advanced filters working

**Measurable Outcome:** System supports 10K+ projects with smooth UX

---

## 90-Day Plan: Production Hardening (Jan 1-31, 2026)

**Goal:** Achieve enterprise-grade reliability and operability

### Week 9-10 (Jan 1-14): Monitoring & Alerting

#### Tasks:
1. Set up Supabase monitoring dashboard
2. Configure Sentry alerts (error rate, latency)
3. Add custom metrics (KPI load time, map render time)
4. Create runbooks for common issues
5. Set up on-call rotation
6. Conduct incident response drill

**Owner:** Senior Developer  
**Effort:** 80 hours

**Definition of Done:**
- [ ] Monitoring dashboard live
- [ ] Alerts configured and tested
- [ ] Runbooks documented
- [ ] On-call rotation established
- [ ] Incident drill completed

**Measurable Outcome:** Mean time to detect (MTTD) < 5 minutes

---

### Week 11-12 (Jan 15-31): Final Polish & Launch Prep

#### Tasks:
1. Add Storybook for component development
2. Add Prettier for code formatting
3. Improve documentation (API docs, user guide)
4. Conduct security penetration test
5. Conduct load test (100 concurrent users)
6. Create launch checklist
7. Train users on new features

**Owner:** Both Developers  
**Effort:** 80 hours

**Definition of Done:**
- [ ] Storybook configured
- [ ] Prettier enforced
- [ ] Documentation complete
- [ ] Security test passed
- [ ] Load test passed
- [ ] Launch checklist complete
- [ ] Users trained

**Measurable Outcome:** System ready for production launch

---

## Final Scorecard (Jan 31, 2026)

### Target Metrics

| Domain | Current | Target | Expected |
|--------|---------|--------|----------|
| Architecture Coherence | 4.0 | 4.5 | ✅ |
| Data Model & Migrations | 3.5 | 4.5 | ✅ |
| API & Events Design | 3.0 | 4.0 | ✅ |
| Security & Compliance | 2.5 | 4.5 | ✅ |
| Performance & Scalability | 3.5 | 4.5 | ✅ |
| Observability & Operability | 1.5 | 4.5 | ✅ |
| CI/CD & Testing | 1.0 | 4.5 | ✅ |
| Developer Experience | 4.0 | 4.5 | ✅ |
| Cost Efficiency | 4.0 | 4.5 | ✅ |
| **Overall Score** | **3.7** | **4.5** | **✅** |

---

## Risk Management

### High Risks

1. **Supabase RLS Complexity**
   - Risk: RLS policies may be too restrictive or permissive
   - Mitigation: Thorough testing with different user roles
   - Contingency: Fallback to application-level auth

2. **Performance Degradation at Scale**
   - Risk: System may slow down with 10K+ projects
   - Mitigation: Load testing + database optimization
   - Contingency: Add pagination, caching, read replicas

3. **Team Capacity**
   - Risk: 2 developers may not complete all tasks
   - Mitigation: Prioritize critical fixes first
   - Contingency: Extend timeline or add contractor

### Medium Risks

1. **Third-Party Service Outages**
   - Risk: Supabase, Sentry, Vercel downtime
   - Mitigation: Monitor SLAs, have backup plans
   - Contingency: Graceful degradation, offline mode

2. **Breaking Changes in Dependencies**
   - Risk: React 19, Supabase updates may break code
   - Mitigation: Pin versions, test upgrades in staging
   - Contingency: Rollback to previous version

---

## Success Criteria

### Must-Have (Launch Blockers)

- [ ] Test coverage ≥ 70%
- [ ] Security score ≥ 4.5/5
- [ ] Bundle size ≤ 500KB
- [ ] p95 latency ≤ 300ms
- [ ] Error rate < 0.1%
- [ ] Availability ≥ 99.9%
- [ ] CI/CD pipeline operational
- [ ] RLS enabled and tested
- [ ] Sentry monitoring active

### Should-Have (Nice to Have)

- [ ] Test coverage ≥ 80%
- [ ] Storybook for components
- [ ] Offline support
- [ ] Real-time updates
- [ ] PDF export

### Could-Have (Future Enhancements)

- [ ] Mobile app (React Native)
- [ ] Advanced analytics (ML predictions)
- [ ] Integration with BuildingConnected API
- [ ] Multi-language support

---

## Budget & Resources

### Team Allocation

| Role | Hours/Week | Weeks | Total Hours | Rate | Cost |
|------|------------|-------|-------------|------|------|
| Senior Developer | 40 | 12 | 480 | $150/hr | $72,000 |
| Mid-Level Developer | 40 | 12 | 480 | $100/hr | $48,000 |
| **Total** | | | **960** | | **$120,000** |

### Infrastructure Costs (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Pro | $25 |
| Vercel | Pro | $20 |
| Sentry | Team | $26 |
| GitHub | Free | $0 |
| **Total** | | **$71/month** |

### Total Project Cost

- **Development:** $120,000
- **Infrastructure (3 months):** $213
- **Total:** $120,213

---

## Communication Plan

### Weekly Standups (Every Monday)

- Review progress vs. roadmap
- Identify blockers
- Adjust priorities if needed

### Bi-Weekly Demos (Every Other Friday)

- Demo completed features to stakeholders
- Gather feedback
- Adjust roadmap if needed

### Monthly Reviews (Last Friday of Month)

- Review metrics against targets
- Go/No-Go decision for next phase
- Update roadmap based on learnings

### Launch Readiness Review (Jan 25, 2026)

- Final go/no-go decision
- Review launch checklist
- Confirm launch date

---

## Conclusion

This 90-day roadmap transforms the ALPA Construction Opportunity Dashboard from a functional MVP to an enterprise-grade, production-ready system. By following this plan, we will achieve:

- ✅ 70%+ test coverage
- ✅ Hardened security (RLS + Auth + RBAC)
- ✅ Optimized performance (< 500KB bundle, < 300ms latency)
- ✅ Full observability (Sentry + structured logging)
- ✅ Automated CI/CD
- ✅ Scalability (10K+ projects, 100+ users)

**Target Launch Date:** February 1, 2026

**Next Steps:**
1. Get stakeholder approval for roadmap
2. Allocate development resources
3. Begin Week 1 tasks (Nov 1, 2025)
4. Schedule weekly check-ins