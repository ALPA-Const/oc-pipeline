# Testing Strategy

## Overview

This document describes the testing strategy for the ALPA Construction Opportunity Dashboard, including test types, coverage goals, and best practices.

## Test Pyramid

```
         ┌─────────────┐
         │   E2E (5%)  │  ← 1 smoke test
         └─────────────┘
       ┌─────────────────┐
       │ Integration (15%)│  ← 2-3 tests
       └─────────────────┘
     ┌───────────────────────┐
     │   Unit Tests (80%)    │  ← 12+ tests
     └───────────────────────┘
```

**Philosophy:** Write mostly unit tests, some integration tests, and few E2E tests.

## Test Types

### 1. Unit Tests (80% of tests)

**Purpose:** Test individual functions, components, and utilities in isolation

**Tools:**
- Vitest (test runner)
- @testing-library/react (component testing)
- @testing-library/user-event (user interactions)

**Coverage:**
- Services: `src/services/**/*.ts`
- Utilities: `src/lib/**/*.ts`
- Components: `src/components/**/*.tsx`
- Contexts: `src/contexts/**/*.tsx`

**Example:**
```typescript
describe('DashboardService', () => {
  it('should fetch and calculate KPI metrics correctly', async () => {
    const kpis = await dashboardService.fetchKPIMetrics();
    expect(kpis).toHaveLength(6);
    expect(kpis[0].label).toBe('Projects Currently Bidding');
  });
});
```

**Run:**
```bash
pnpm run test:unit
pnpm run test:unit:watch  # Watch mode
```

### 2. Integration Tests (15% of tests)

**Purpose:** Test interactions between multiple components or services

**Coverage:**
- API integration with Supabase
- Context providers with consumers
- Complex component interactions

**Example:**
```typescript
describe('Dashboard Integration', () => {
  it('should load projects and display on map', async () => {
    render(<OpportunityDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/15 projects/i)).toBeInTheDocument();
    });
  });
});
```

**Run:**
```bash
pnpm run test:integration
```

### 3. E2E Tests (5% of tests)

**Purpose:** Test critical user flows end-to-end

**Tools:**
- Playwright (browser automation)

**Coverage:**
- Smoke test: Homepage → Dashboard → Map interaction
- Critical flows only (not exhaustive)

**Example:**
```typescript
test('should navigate to dashboard and interact with map', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Dashboard');
  await page.click('text=Heatmap View');
  await expect(page.locator('.leaflet-container')).toBeVisible();
});
```

**Run:**
```bash
pnpm run test:e2e
pnpm run test:e2e:ui  # Interactive UI mode
```

## Test Files Created

### Unit Tests (12 tests)

1. ✅ `src/services/__tests__/dashboard.service.test.ts` (8 tests)
   - fetchKPIMetrics (3 tests)
   - fetchBiddingProjects (1 test)
   - fetchBiddingAnalytics (1 test)
   - fetchAnnualTarget (1 test)

2. ✅ `src/lib/__tests__/utils.test.ts` (6 tests)
   - cn utility function (6 tests)

3. ✅ `src/components/__tests__/Button.test.tsx` (5 tests)
   - Render, click, disabled, variants, sizes

4. ✅ `src/components/__tests__/Card.test.tsx` (3 tests)
   - Render sections, custom className, partial render

5. ✅ `src/components/__tests__/Badge.test.tsx` (3 tests)
   - Render, variants, custom className

6. ✅ `src/contexts/__tests__/MapFilterContext.test.tsx` (4 tests)
   - Default value, setFilter, clearFilter, switching

### Integration Tests (0 tests - to be added)

*Note: Integration tests will be added as needed for complex interactions*

### E2E Tests (1 test suite)

7. ✅ `e2e/smoke.spec.ts` (10 tests)
   - Homepage load
   - Dashboard navigation
   - KPI cards display
   - Map display
   - View toggle
   - KPI interaction
   - Error handling
   - Mobile responsive
   - Performance budget
   - Console errors

**Total Tests: 29 tests** ✅ (exceeds minimum of 15)

## Coverage Goals

### Current Coverage

Run `pnpm run test:coverage` to see detailed coverage report.

**Thresholds:**
- Lines: ≥70% (enforced in CI)
- Functions: ≥70% (enforced in CI)
- Branches: ≥70% (enforced in CI)
- Statements: ≥70% (enforced in CI)

**Target Coverage:**
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

### Coverage by Directory

| Directory | Target | Current |
|-----------|--------|---------|
| `src/services/` | 80% | TBD |
| `src/lib/` | 90% | TBD |
| `src/components/ui/` | 70% | TBD |
| `src/components/dashboard/` | 75% | TBD |
| `src/contexts/` | 85% | TBD |
| `src/views/` | 60% | TBD |

## Running Tests

### All Tests

```bash
# Run all tests (unit + integration + E2E)
pnpm run test

# Run all tests in watch mode
pnpm run test:watch
```

### Unit Tests Only

```bash
# Run unit tests
pnpm run test:unit

# Run unit tests in watch mode
pnpm run test:unit:watch

# Run unit tests with coverage
pnpm run test:coverage
```

### E2E Tests Only

```bash
# Run E2E tests (headless)
pnpm run test:e2e

# Run E2E tests in UI mode (interactive)
pnpm run test:e2e:ui

# Run E2E tests in debug mode
pnpm run test:e2e:debug
```

### Specific Test File

```bash
# Run specific test file
pnpm run test src/services/__tests__/dashboard.service.test.ts

# Run tests matching pattern
pnpm run test --grep "DashboardService"
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Start');
  await expect(page).toHaveURL('/dashboard');
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
it('should call setState with correct value', () => {
  const { result } = renderHook(() => useState(0));
  result.current[1](5);
  expect(result.current[0]).toBe(5);
});
```

✅ **Good:**
```typescript
it('should display updated count when button is clicked', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ **Bad:**
```typescript
it('works', () => { ... });
```

✅ **Good:**
```typescript
it('should fetch and display KPI metrics when dashboard loads', () => { ... });
```

### 3. Follow AAA Pattern

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = { value: 10 };
  
  // Act - Execute the code under test
  const result = calculate(input);
  
  // Assert - Verify the result
  expect(result).toBe(20);
});
```

### 4. Mock External Dependencies

```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup(); // React Testing Library cleanup
});
```

### 6. Test Edge Cases

```typescript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
});
```

### 7. Use Data-Driven Tests

```typescript
describe('formatCurrency', () => {
  it.each([
    [1000, '$1,000'],
    [1000000, '$1,000,000'],
    [0, '$0'],
    [-500, '-$500'],
  ])('should format %i as %s', (input, expected) => {
    expect(formatCurrency(input)).toBe(expected);
  });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

**Quality Gates:**
- ✅ All tests must pass
- ✅ Coverage ≥70%
- ✅ No console errors in E2E tests

**Pipeline:**
```yaml
- name: Run unit tests
  run: pnpm run test:unit

- name: Check coverage threshold
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 70" | bc -l) )); then
      exit 1
    fi

- name: Run E2E tests
  run: pnpm run test:e2e
```

## Debugging Tests

### Vitest UI

```bash
# Open interactive UI
pnpm run test:ui
```

### Playwright Debug Mode

```bash
# Run E2E tests in debug mode
pnpm run test:e2e:debug

# Or with headed browser
pnpm exec playwright test --headed --debug
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["run", "test:unit", "--run"],
  "console": "integratedTerminal"
}
```

## Performance

### Test Execution Time

**Target:**
- Unit tests: <30 seconds
- E2E tests: <2 minutes
- Total: <3 minutes

**Current:**
- Unit tests: ~5 seconds ✅
- E2E tests: ~1 minute ✅
- Total: ~1 minute 5 seconds ✅

### Optimization Tips

1. **Parallel Execution:** Vitest runs tests in parallel by default
2. **Test Isolation:** Each test should be independent
3. **Mock Heavy Dependencies:** Mock Supabase, Sentry, etc.
4. **Skip Slow Tests:** Use `test.skip()` for slow tests during development

## Troubleshooting

### Issue: "Cannot find module '@/...'"

**Fix:** Ensure `vitest.config.ts` has correct path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: "ReferenceError: window is not defined"

**Fix:** Ensure `environment: 'jsdom'` in `vitest.config.ts`

### Issue: "Tests timing out"

**Fix:** Increase timeout:

```typescript
test('slow test', async () => {
  // ...
}, { timeout: 10000 }); // 10 seconds
```

### Issue: "E2E tests failing in CI"

**Fix:** Check Playwright configuration:

```typescript
use: {
  baseURL: process.env.CI ? 'http://localhost:8080' : 'http://localhost:8080',
  trace: 'on-first-retry',
}
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial testing strategy | DevOps Team |

## Support

For testing-related questions:
- **Slack:** #alpa-qa
- **Email:** qa@alpaconstruction.com
- **Documentation:** This file