# CI/CD Pipeline Documentation

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the ALPA Construction Opportunity Dashboard.

## Pipeline Architecture

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Job 1: Lint & Type Check (2 min)      │
│  - ESLint                               │
│  - TypeScript type check                │
└──────┬──────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Job 2:      │  │  Job 3:      │  │  Job 6:      │
│  Test        │  │  Build       │  │  Security    │
│  (3 min)     │  │  (2 min)     │  │  (2 min)     │
│              │  │              │  │              │
│  - Unit      │  │  - Build     │  │  - Trivy     │
│  - Coverage  │  │  - Bundle    │  │  - Deps      │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                ▼
         ┌──────────────┐
         │  Job 4:      │
         │  E2E Tests   │
         │  (4 min)     │
         │              │
         │  - Playwright│
         └──────┬───────┘
                │
                ▼ (main branch only)
         ┌──────────────┐
         │  Job 5:      │
         │  Deploy      │
         │  (2 min)     │
         │              │
         │  - Staging   │
         │  - Smoke     │
         └──────────────┘
```

**Total Pipeline Time:** ~13 minutes (parallel execution)

## Pipeline Configuration

### File Location
`.github/workflows/ci.yml`

### Trigger Events
- **Push:** `main`, `develop` branches
- **Pull Request:** `main`, `develop` branches

### Environment Variables
```yaml
NODE_VERSION: '20'
PNPM_VERSION: '8'
```

## Jobs

### Job 1: Lint & Type Check

**Purpose:** Ensure code quality and type safety

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Run ESLint (`pnpm run lint`)
5. Run TypeScript type check (`pnpm run typecheck`)

**Duration:** ~2 minutes

**Failure Conditions:**
- ESLint errors
- TypeScript type errors

**Local Testing:**
```bash
pnpm run lint
pnpm run typecheck
```

### Job 2: Unit & Integration Tests

**Purpose:** Verify code functionality and coverage

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Run unit tests (`pnpm run test:unit`)
5. Upload coverage to Codecov
6. Check coverage threshold (≥70%)

**Duration:** ~3 minutes

**Failure Conditions:**
- Test failures
- Coverage below 70%

**Local Testing:**
```bash
pnpm run test:unit
pnpm run test:coverage
```

**Coverage Threshold:**
- **Minimum:** 70% line coverage
- **Target:** 80% line coverage
- **Goal:** 90% line coverage

### Job 3: Build & Bundle Size Check

**Purpose:** Ensure application builds successfully and bundle size is within budget

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Build application (`pnpm run build`)
5. Check bundle size (`node scripts/check-bundle-size.js`)
6. Upload build artifacts
7. Comment bundle size report on PR

**Duration:** ~2 minutes

**Failure Conditions:**
- Build errors
- Bundle size exceeds budget

**Bundle Size Budgets:**
| File | Budget | Current |
|------|--------|---------|
| index.js | 500 KB | ~300 KB ✅ |
| index.css | 100 KB | ~88 KB ✅ |
| **Total** | **600 KB** | **~388 KB ✅** |

**Local Testing:**
```bash
pnpm run build
node scripts/check-bundle-size.js
```

### Job 4: E2E Tests (Playwright)

**Purpose:** Verify end-to-end user flows

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Install Playwright browsers
5. Download build artifacts
6. Run E2E tests (`pnpm run test:e2e`)
7. Upload Playwright report

**Duration:** ~4 minutes

**Failure Conditions:**
- E2E test failures
- Critical user flows broken

**Local Testing:**
```bash
pnpm run test:e2e
pnpm run test:e2e:ui  # Interactive mode
```

### Job 5: Deploy to Staging

**Purpose:** Deploy to staging environment for testing

**Trigger:** Only on `main` branch push

**Steps:**
1. Checkout code
2. Download build artifacts
3. Deploy to Vercel (Staging)
4. Run smoke tests
5. Notify deployment status

**Duration:** ~2 minutes

**Failure Conditions:**
- Deployment errors
- Smoke tests fail

**Staging URL:** https://staging.alpaconstruction.com

**Smoke Tests:**
- Health check endpoint responds
- Homepage loads successfully
- API endpoints accessible

### Job 6: Security Scan

**Purpose:** Detect security vulnerabilities

**Steps:**
1. Checkout code
2. Run Trivy vulnerability scanner
3. Upload results to GitHub Security

**Duration:** ~2 minutes

**Scans:**
- Dependency vulnerabilities (npm packages)
- Container vulnerabilities (if applicable)
- Configuration issues

**Severity Levels:**
- **Critical:** Block merge
- **High:** Block merge
- **Medium:** Warning
- **Low:** Informational

### Job 7: Dependency Review (PRs only)

**Purpose:** Review dependency changes in pull requests

**Trigger:** Only on pull requests

**Steps:**
1. Checkout code
2. Run dependency review action

**Failure Conditions:**
- New dependencies with moderate+ vulnerabilities
- License compliance issues

## Quality Gates

### Merge Blockers (CI must pass)

1. ✅ **Lint Check:** No ESLint errors
2. ✅ **Type Check:** No TypeScript errors
3. ✅ **Unit Tests:** All tests pass
4. ✅ **Coverage:** ≥70% line coverage
5. ✅ **Build:** Successful build
6. ✅ **Bundle Size:** Within budget (600 KB)
7. ✅ **E2E Tests:** All critical flows pass
8. ✅ **Security:** No critical/high vulnerabilities

### Warnings (Don't block merge)

1. ⚠️ **Coverage:** <80% (below target)
2. ⚠️ **Bundle Size:** >90% of budget
3. ⚠️ **Security:** Medium vulnerabilities

## GitHub Secrets Required

### Supabase
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Sentry
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_AUTH_TOKEN` - Sentry auth token for releases
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project slug

### Vercel (Deployment)
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Setting Up Secrets

```bash
# Using GitHub CLI
gh secret set VITE_SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "your-anon-key"
gh secret set VITE_SENTRY_DSN --body "https://your-sentry-dsn"
gh secret set SENTRY_AUTH_TOKEN --body "your-sentry-token"
gh secret set SENTRY_ORG --body "your-org"
gh secret set SENTRY_PROJECT --body "your-project"
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"

# Verify secrets
gh secret list
```

## Local Development Workflow

### 1. Pre-commit Checks

```bash
# Run all checks locally before committing
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run build
node scripts/check-bundle-size.js
```

### 2. Pre-push Checks

```bash
# Run full test suite before pushing
pnpm run test
pnpm run test:e2e
```

### 3. Install Git Hooks (Recommended)

```bash
# Install husky for git hooks
pnpm add -D husky lint-staged

# Initialize husky
pnpm exec husky init

# Add pre-commit hook
echo "pnpm run lint && pnpm run typecheck" > .husky/pre-commit

# Add pre-push hook
echo "pnpm run test:unit" > .husky/pre-push
```

## Troubleshooting

### Issue: "Coverage below 70% threshold"

**Cause:** Test coverage is below the required threshold

**Fix:**
```bash
# Generate coverage report
pnpm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html

# Write tests for uncovered files
# Focus on: services, components, utilities
```

### Issue: "Bundle size exceeds budget"

**Cause:** Bundle size is too large

**Fix:**
```bash
# Analyze bundle
pnpm run build -- --analyze

# Identify large dependencies
# Use dynamic imports for heavy libraries
# Example:
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Issue: "E2E tests failing"

**Cause:** E2E tests are flaky or broken

**Fix:**
```bash
# Run E2E tests locally
pnpm run test:e2e

# Debug in UI mode
pnpm run test:e2e:ui

# Check screenshots/videos in playwright-report/
```

### Issue: "Deployment failed"

**Cause:** Vercel deployment error

**Fix:**
1. Check Vercel dashboard for error logs
2. Verify environment variables are set
3. Check build logs in GitHub Actions
4. Ensure `dist/` directory exists

### Issue: "Security scan found vulnerabilities"

**Cause:** Dependencies have known vulnerabilities

**Fix:**
```bash
# Update dependencies
pnpm update

# Check for specific vulnerabilities
pnpm audit

# Fix automatically (if possible)
pnpm audit fix

# If no fix available, consider alternatives
```

## Performance Optimization

### Pipeline Speed

**Current:** ~13 minutes (parallel execution)

**Optimization Strategies:**

1. **Cache Dependencies:**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.pnpm-store
       key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

2. **Parallel Jobs:**
   - Lint, Build, and Security run in parallel
   - E2E tests run after Build completes

3. **Skip Unnecessary Steps:**
   ```yaml
   if: github.event_name == 'pull_request'
   ```

4. **Use Smaller Runners:**
   - Consider GitHub Actions hosted runners
   - Or self-hosted runners for faster builds

### Cost Optimization

**GitHub Actions Pricing:**
- Free: 2,000 minutes/month (public repos)
- Pro: 3,000 minutes/month
- Team: 10,000 minutes/month

**Current Usage:** ~13 min/build × 50 builds/month = 650 minutes/month ✅

**Optimization:**
- Skip E2E tests on draft PRs
- Run security scans weekly instead of every push
- Use matrix strategy for parallel test execution

## Monitoring & Alerts

### GitHub Actions Dashboard

Monitor pipeline health:
- https://github.com/[org]/[repo]/actions

**Key Metrics:**
- Success rate (target: >95%)
- Average duration (target: <15 min)
- Failure reasons

### Slack Notifications (Optional)

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ CI/CD Pipeline Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Build Failed*\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}"
            }
          }
        ]
      }
```

## Best Practices

### 1. Keep Pipeline Fast
- Target: <15 minutes total
- Use caching aggressively
- Run expensive checks in parallel

### 2. Fail Fast
- Run quick checks first (lint, typecheck)
- Run expensive checks later (E2E tests)

### 3. Make Failures Actionable
- Clear error messages
- Link to documentation
- Suggest fixes

### 4. Protect Main Branch
- Require status checks before merge
- Require code review
- Require signed commits

### 5. Version Everything
- Tag releases with semantic versioning
- Track deployments in Sentry
- Maintain CHANGELOG.md

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial CI/CD pipeline | DevOps Team |

## Support

For CI/CD-related issues:
- **Slack:** #alpa-devops
- **Email:** devops@alpaconstruction.com
- **GitHub Issues:** Tag with `ci/cd` label