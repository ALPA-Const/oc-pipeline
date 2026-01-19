# Observability Documentation

## Overview

This document describes the observability stack for the ALPA Construction Opportunity Dashboard, including error tracking, performance monitoring, logging, and alerting.

## Tools & Services

### Sentry (Error Tracking & Performance Monitoring)

**Purpose:** Capture and track application errors, performance issues, and user sessions

**Features Enabled:**
- ✅ Automatic error capture with stack traces
- ✅ Performance monitoring (p95 latency tracking)
- ✅ Session replay for debugging (errors only)
- ✅ User context and tags
- ✅ PII redaction
- ✅ Release tracking
- ✅ Source maps for production debugging

**Configuration Files:**
- `src/lib/sentry.ts` - Sentry initialization and utilities
- `vite.config.ts` - Sentry Vite plugin for source maps
- `.env.example` - Environment variables template

## Setup Instructions

### 1. Create Sentry Project

```bash
# Sign up at https://sentry.io
# Create new project: React

# Copy DSN from Settings → Projects → [Your Project] → Client Keys (DSN)
# Example: https://abc123@o123456.ingest.sentry.io/7890123
```

### 2. Configure Environment Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local and add your Sentry credentials
VITE_SENTRY_DSN=https://your-sentry-dsn@o123456.ingest.sentry.io/7890123
SENTRY_AUTH_TOKEN=your-sentry-auth-token-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
VITE_APP_VERSION=1.0.0
```

### 3. Generate Sentry Auth Token

```bash
# Go to: https://sentry.io/settings/account/api/auth-tokens/
# Click "Create New Token"
# Scopes: project:read, project:releases, org:read
# Copy token and add to .env.local
```

### 4. Verify Sentry Integration

```bash
# Start development server
pnpm run dev

# Check console for: "✅ Sentry initialized (development, release: 1.0.0)"

# Trigger test error (add to any component):
throw new Error('Test Sentry error');

# Check Sentry dashboard for error: https://sentry.io/issues/
```

## Features & Configuration

### 1. Error Tracking

**Automatic Error Capture:**
- Unhandled exceptions
- Promise rejections
- React component errors (via ErrorBoundary)
- Network errors (fetch, axios)

**Manual Error Capture:**
```typescript
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Some code that might throw
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    context: 'riskyOperation',
    userId: user.id,
  });
}

// Capture informational message
captureMessage('User completed onboarding', 'info');
```

### 2. Performance Monitoring

**Automatic Tracking:**
- Page load time
- Route transitions (React Router)
- API request duration
- Component render time

**Sample Rates:**
- Development: 100% (all transactions)
- Production: 10% (to reduce costs)

**Manual Transaction Tracking:**
```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('fetchProjects', 'http.request');
try {
  const response = await fetch('/api/projects');
  transaction?.setHttpStatus(response.status);
} finally {
  transaction?.finish();
}
```

### 3. PII Redaction

**Automatic Redaction:**
- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- SSN → `[SSN_REDACTED]`
- Credit card numbers → `[CC_REDACTED]`
- IP addresses → `[IP_REDACTED]`
- API keys → `[API_KEY_REDACTED]`

**Sensitive Keys Redacted:**
- `email`, `phone`, `ssn`, `password`, `token`, `apiKey`, `secret`

**Custom Redaction:**
```typescript
// Edit src/lib/sentry.ts → redactPII() function
// Add custom patterns as needed
```

### 4. User Context

**Set User Context:**
```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// On login
setSentryUser({
  id: user.id,
  username: user.username,
  // Don't send email for PII protection
});

// On logout
clearSentryUser();
```

### 5. Custom Tags & Context

**Add Tags:**
```typescript
import { setSentryTag, setSentryContext } from '@/lib/sentry';

// Add custom tag
setSentryTag('feature', 'dashboard');
setSentryTag('tenant_id', tenantId);

// Add custom context
setSentryContext('project', {
  id: project.id,
  stage: project.stage,
  value: project.value,
});
```

### 6. Breadcrumbs (Debug Trail)

**Automatic Breadcrumbs:**
- Console logs (info, warn, error)
- Network requests
- User interactions (clicks, navigation)
- DOM mutations

**Manual Breadcrumbs:**
```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb('User clicked export button', 'user', 'info');
addBreadcrumb('API request started', 'http', 'debug');
```

### 7. Session Replay

**Configuration:**
- Sample Rate: 10% of all sessions
- Error Sample Rate: 100% of sessions with errors
- PII Protection: All text and media masked

**Viewing Replays:**
1. Go to Sentry dashboard
2. Click on an error
3. Click "Replays" tab
4. Watch session recording leading to error

## Dashboards & Metrics

### Sentry Dashboard Widgets

**1. Error Rate Dashboard**
- Widget: "Error Rate Over Time"
- Metric: Errors per minute
- Threshold: Alert if >10 errors/min

**2. Performance Dashboard**
- Widget: "p95 Latency"
- Metric: 95th percentile response time
- Threshold: Alert if >300ms

**3. Release Health**
- Widget: "Crash-Free Sessions"
- Metric: % of sessions without crashes
- Target: >99.9%

### Creating Dashboards

```bash
# Go to: https://sentry.io/organizations/[org]/dashboards/
# Click "Create Dashboard"
# Add widgets:
#   - Error Rate (Time Series)
#   - p95 Latency (Time Series)
#   - Top Errors (Table)
#   - Affected Users (Number)
```

## Alerting

### Alert Rules

**1. Error Rate Spike**
- **Condition:** Error count >10 in 5 minutes
- **Action:** Send to #alpa-alerts Slack channel
- **Severity:** High

**2. p95 Latency Breach**
- **Condition:** p95 latency >300ms for 5 minutes
- **Action:** Send to #alpa-alerts Slack channel
- **Severity:** Medium

**3. Crash-Free Sessions Drop**
- **Condition:** Crash-free rate <99% for 10 minutes
- **Action:** Send to #alpa-alerts Slack channel
- **Severity:** Critical

### Setting Up Alerts

```bash
# Go to: https://sentry.io/organizations/[org]/alerts/rules/
# Click "Create Alert Rule"

# Alert 1: Error Rate Spike
Name: Error Rate Spike
Condition: When error count is more than 10 in 5 minutes
Action: Send notification to #alpa-alerts
Environment: production

# Alert 2: p95 Latency Breach
Name: p95 Latency Breach
Condition: When p95 transaction duration is more than 300ms for 5 minutes
Action: Send notification to #alpa-alerts
Environment: production

# Alert 3: Crash-Free Sessions Drop
Name: Crash-Free Sessions Drop
Condition: When crash-free session rate is less than 99% for 10 minutes
Action: Send notification to #alpa-alerts
Environment: production
```

### Slack Integration

```bash
# Go to: https://sentry.io/settings/[org]/integrations/slack/
# Click "Add Workspace"
# Authorize Sentry in Slack
# Configure alert routing to #alpa-alerts channel
```

## Verification & Testing

### 1. Test Error Capture

```typescript
// Add to any component temporarily
const TestErrorButton = () => (
  <button onClick={() => {
    throw new Error('Test Sentry error - please ignore');
  }}>
    Test Sentry
  </button>
);
```

**Expected Result:**
- Error appears in Sentry dashboard within 30 seconds
- Stack trace shows correct file and line number
- User context and tags are attached

### 2. Test Performance Monitoring

```bash
# Open browser DevTools → Network tab
# Navigate to /dashboard
# Check Sentry dashboard → Performance

# Expected metrics:
# - Page load time: <2s
# - API requests: <300ms p95
# - Route transitions: <100ms
```

### 3. Test PII Redaction

```typescript
// Trigger error with PII
throw new Error('User email: test@example.com failed to load');

// Check Sentry dashboard
// Expected: "User email: [EMAIL_REDACTED] failed to load"
```

### 4. Test Session Replay

```bash
# Trigger an error while interacting with the app
# Go to Sentry → Issues → [Your Error] → Replays tab
# Expected: Video replay of session leading to error
```

## Production Deployment

### 1. Configure Production Environment Variables

```bash
# Vercel/Netlify Dashboard → Environment Variables
VITE_SENTRY_DSN=https://your-production-dsn@o123456.ingest.sentry.io/7890123
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### 2. Enable Source Maps Upload

```bash
# Source maps are automatically uploaded during build
# via @sentry/vite-plugin in vite.config.ts

# Verify upload in Sentry:
# Settings → Projects → [Your Project] → Source Maps
```

### 3. Create Release

```bash
# Releases are automatically created during build
# via @sentry/vite-plugin

# Verify release in Sentry:
# Releases → [Your Version]
```

### 4. Monitor Deployment

```bash
# After deployment, check Sentry dashboard:
# - No new errors introduced
# - p95 latency within SLO (<300ms)
# - Crash-free rate >99.9%
```

## Troubleshooting

### Issue: "Sentry DSN not configured"

**Cause:** `VITE_SENTRY_DSN` environment variable not set

**Fix:**
```bash
# Add to .env.local
VITE_SENTRY_DSN=https://your-sentry-dsn@o123456.ingest.sentry.io/7890123

# Restart dev server
pnpm run dev
```

### Issue: Errors not appearing in Sentry

**Cause:** Sentry not initialized or DSN incorrect

**Fix:**
1. Check console for "✅ Sentry initialized" message
2. Verify DSN in .env.local matches Sentry dashboard
3. Check network tab for Sentry API calls (should see POST to sentry.io)

### Issue: Source maps not working

**Cause:** Source maps not uploaded or auth token invalid

**Fix:**
```bash
# Verify SENTRY_AUTH_TOKEN is set
echo $SENTRY_AUTH_TOKEN

# Re-generate auth token if needed:
# https://sentry.io/settings/account/api/auth-tokens/

# Rebuild with source maps
pnpm run build
```

### Issue: Too many events (quota exceeded)

**Cause:** Sample rate too high or error loop

**Fix:**
```typescript
// Reduce sample rate in src/lib/sentry.ts
tracesSampleRate: 0.05, // 5% instead of 10%
replaysSessionSampleRate: 0.05, // 5% instead of 10%

// Add more ignored errors
ignoreErrors: [
  'NetworkError',
  'Failed to fetch',
  'ResizeObserver loop limit exceeded',
  // Add your patterns here
],
```

## Cost Optimization

### Sentry Pricing Tiers

- **Free:** 5,000 errors/month, 10,000 performance units/month
- **Team:** $26/month - 50,000 errors/month, 100,000 performance units/month
- **Business:** $80/month - 500,000 errors/month, 1,000,000 performance units/month

### Reducing Costs

1. **Lower Sample Rates:**
   ```typescript
   tracesSampleRate: 0.05, // 5% instead of 10%
   replaysSessionSampleRate: 0.05, // 5% instead of 10%
   ```

2. **Ignore Non-Critical Errors:**
   ```typescript
   ignoreErrors: [
     'NetworkError',
     'Failed to fetch',
     'ResizeObserver loop limit exceeded',
   ],
   ```

3. **Filter Transactions:**
   ```typescript
   beforeSendTransaction(event) {
     // Don't send health check transactions
     if (event.transaction?.includes('/health')) {
       return null;
     }
     return event;
   }
   ```

4. **Set Quotas:**
   - Sentry Dashboard → Settings → Quotas
   - Set monthly error limit
   - Set monthly performance unit limit

## Compliance & Security

### Data Retention

- **Errors:** 90 days
- **Performance:** 90 days
- **Replays:** 30 days

### GDPR Compliance

- ✅ PII redaction enabled
- ✅ User consent not required (legitimate interest)
- ✅ Data processing agreement with Sentry
- ✅ Right to erasure: Contact Sentry support

### SOC 2 Compliance

- ✅ Sentry is SOC 2 Type II certified
- ✅ Data encrypted in transit (TLS)
- ✅ Data encrypted at rest (AES-256)

## References

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Sentry PII Scrubbing](https://docs.sentry.io/platforms/javascript/data-management/sensitive-data/)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial Sentry integration | DevOps Team |

## Support

For observability-related issues:
- **Slack:** #alpa-devops
- **Email:** devops@alpaconstruction.com
- **Sentry Support:** support@sentry.io