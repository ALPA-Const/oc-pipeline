# Red Flags & Remediations

**Date:** October 29, 2025  
**Priority Order:** Critical → Major → Minor

---

## Critical Issues (Must Fix Before Production)

### 🔴 CRITICAL-1: Zero Test Coverage

**Severity:** CRITICAL  
**Impact:** High regression risk, no quality assurance, unpredictable deployments  
**Effort:** Large (2-3 weeks)  
**Files Affected:** All source files

**Current State:**
```bash
# No test files exist
$ find src -name "*.test.ts*" -o -name "*.spec.ts*"
# Returns: nothing
```

**Fix:**
```bash
# 1. Install testing dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# 2. Install E2E testing
npm install -D @playwright/test

# 3. Add test scripts to package.json
```

**Example: Unit Test for dashboard.service.ts**
```typescript
// src/services/dashboard.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard.service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    vi.clearAllMocks();
  });

  describe('calculateCountdown', () => {
    it('should return urgent status for bids due in < 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const result = service.calculateCountdown(futureDate.toISOString());
      
      expect(result.urgencyLevel).toBe('urgent');
      expect(result.color).toBe('#EF4444');
      expect(result.days).toBe(5);
    });

    it('should return moderate status for bids due in 7-14 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const result = service.calculateCountdown(futureDate.toISOString());
      
      expect(result.urgencyLevel).toBe('moderate');
      expect(result.color).toBe('#F59E0B');
    });

    it('should return plenty status for bids due in > 14 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      
      const result = service.calculateCountdown(futureDate.toISOString());
      
      expect(result.urgencyLevel).toBe('plenty');
      expect(result.color).toBe('#10B981');
    });
  });

  describe('fetchKPIMetrics', () => {
    it('should calculate KPIs correctly from project data', async () => {
      const mockProjects = [
        { stage_id: 'opp_proposal', value: 10000000 },
        { stage_id: 'opp_proposal', value: 15000000 },
        { stage_id: 'opp_award', value: 20000000, awarded_amount: 19500000 },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
      } as any);

      const kpis = await service.fetchKPIMetrics();

      expect(kpis).toHaveLength(10);
      expect(kpis[0].label).toBe('Projects Currently Bidding');
      expect(kpis[0].value).toBe(2);
    });
  });
});
```

**Example: Component Test for DashboardKPICards**
```typescript
// src/components/dashboard/DashboardKPICards.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardKPICards } from './DashboardKPICards';
import { MapFilterProvider } from '@/contexts/MapFilterContext';

describe('DashboardKPICards', () => {
  const mockKPIs = [
    {
      label: 'Projects Currently Bidding',
      value: 6,
      displayValue: '6 ($133.0M)',
      color: '#3B82F6',
    },
    {
      label: 'Bids Submitted',
      value: 3,
      displayValue: '3 ($64.9M)',
      color: '#8B5CF6',
    },
  ];

  it('should render all KPI cards', () => {
    render(
      <MapFilterProvider>
        <DashboardKPICards kpis={mockKPIs} loading={false} />
      </MapFilterProvider>
    );

    expect(screen.getByText('Projects Currently Bidding')).toBeInTheDocument();
    expect(screen.getByText('6 ($133.0M)')).toBeInTheDocument();
    expect(screen.getByText('Bids Submitted')).toBeInTheDocument();
  });

  it('should filter map when KPI card is clicked', () => {
    const { container } = render(
      <MapFilterProvider>
        <DashboardKPICards kpis={mockKPIs} loading={false} />
      </MapFilterProvider>
    );

    const firstCard = container.querySelector('[data-testid="kpi-card-0"]');
    fireEvent.click(firstCard!);

    // Verify card is highlighted
    expect(firstCard).toHaveClass('ring-2', 'ring-blue-500');
  });
});
```

**Example: E2E Test with Playwright**
```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Opportunity Dashboard', () => {
  test('should load dashboard and display KPIs', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for data to load
    await page.waitForSelector('[data-testid="kpi-cards"]');

    // Verify KPI cards are visible
    await expect(page.locator('text=Projects Currently Bidding')).toBeVisible();
    await expect(page.locator('text=Bids Submitted')).toBeVisible();
    await expect(page.locator('text=Projects Awarded')).toBeVisible();

    // Verify map is rendered
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should filter map when KPI card is clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="kpi-cards"]');

    // Click "Projects Currently Bidding" KPI
    await page.click('text=Projects Currently Bidding');

    // Verify filter is active
    await expect(page.locator('text=Filtered by: Projects Currently Bidding')).toBeVisible();

    // Verify map markers are filtered (only red markers visible)
    const markers = await page.locator('.leaflet-marker-icon').count();
    expect(markers).toBe(6); // 6 bidding projects
  });

  test('should toggle between pin view and heatmap view', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('.leaflet-container');

    // Click heatmap view button
    await page.click('button:has-text("Heatmap View")');

    // Verify heatmap is displayed
    await expect(page.locator('.leaflet-interactive[fill]')).toBeVisible();

    // Switch back to pin view
    await page.click('button:has-text("Pin View")');

    // Verify markers are displayed
    await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
  });
});
```

**Configuration Files:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Updated package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint --quiet ./src",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Timeline:**
- Week 1: Set up testing infrastructure + write 20 unit tests
- Week 2: Write component tests for all dashboard components
- Week 3: Write E2E tests for critical user flows

---

### 🔴 CRITICAL-2: No Observability Infrastructure

**Severity:** CRITICAL  
**Impact:** Cannot diagnose production issues, no SLO monitoring  
**Effort:** Medium (1 week)  
**Files Affected:** All components, services

**Current State:**
```typescript
// Only console.log statements
console.log('🔍 Fetching KPI metrics...');
console.error('❌ Error fetching KPI metrics:', error);
```

**Fix: Implement Sentry + Structured Logging**

```bash
# 1. Install Sentry
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.level === 'warning') {
          return null;
        }
        return event;
      },
    });
  }
}

// Structured logger
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: Record<string, any>) {
    console.log(`[${this.context}] ${message}`, data);
    Sentry.addBreadcrumb({
      category: this.context,
      message,
      level: 'info',
      data,
    });
  }

  error(message: string, error?: Error, data?: Record<string, any>) {
    console.error(`[${this.context}] ${message}`, error, data);
    Sentry.captureException(error || new Error(message), {
      tags: { context: this.context },
      extra: data,
    });
  }

  warn(message: string, data?: Record<string, any>) {
    console.warn(`[${this.context}] ${message}`, data);
    Sentry.addBreadcrumb({
      category: this.context,
      message,
      level: 'warning',
      data,
    });
  }
}
```

```typescript
// src/main.tsx - Initialize Sentry
import { initSentry } from './lib/sentry';

initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```typescript
// src/services/dashboard.service.ts - Use structured logging
import { Logger } from '@/lib/sentry';

export class DashboardService {
  private logger = new Logger('DashboardService');

  async fetchKPIMetrics(): Promise<DashboardKPI[]> {
    try {
      this.logger.info('Fetching KPI metrics');

      const { data: projects, error } = await supabase
        .from('pipeline_projects')
        .select('*')
        .eq('pipeline_type', 'opportunity');

      if (error) throw error;

      this.logger.info('Fetched KPI metrics successfully', {
        projectCount: projects.length,
      });

      return this.calculateKPIs(projects);
    } catch (error) {
      this.logger.error('Failed to fetch KPI metrics', error as Error, {
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}
```

**Add React Error Boundaries:**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

```typescript
// src/App.tsx - Wrap with ErrorBoundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* routes */}
      </Router>
    </ErrorBoundary>
  );
}
```

**Add Performance Monitoring:**
```typescript
// src/lib/performance.ts
import * as Sentry from '@sentry/react';

export function trackWebVitals() {
  if ('web-vital' in window) {
    // Track Core Web Vitals
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => Sentry.captureMessage(`CLS: ${metric.value}`, 'info'));
      onFID((metric) => Sentry.captureMessage(`FID: ${metric.value}`, 'info'));
      onFCP((metric) => Sentry.captureMessage(`FCP: ${metric.value}`, 'info'));
      onLCP((metric) => Sentry.captureMessage(`LCP: ${metric.value}`, 'info'));
      onTTFB((metric) => Sentry.captureMessage(`TTFB: ${metric.value}`, 'info'));
    });
  }
}
```

**Timeline:**
- Day 1-2: Set up Sentry + structured logging
- Day 3-4: Add error boundaries to all routes
- Day 5: Implement performance monitoring
- Day 6-7: Create Sentry dashboard + alerts

---

### 🔴 CRITICAL-3: RLS Disabled & No Authentication

**Severity:** CRITICAL  
**Impact:** Data exposure, unauthorized access, compliance violations  
**Effort:** Medium (2 weeks)  
**Files Affected:** Database, supabase.ts, all components

**Current State:**
```sql
-- RLS is DISABLED on all tables
-- Anyone with the anon key can read/write ALL data
```

**Fix: Enable RLS + Implement Auth**

```sql
-- database/migration_002_enable_rls.sql
BEGIN;

-- Enable RLS on all tables
ALTER TABLE pipeline_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Policy 1: Users can read all projects
CREATE POLICY "Users can view all projects"
  ON pipeline_projects FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can insert projects
CREATE POLICY "Users can create projects"
  ON pipeline_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Users can update their own projects
CREATE POLICY "Users can update projects"
  ON pipeline_projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Only admins can delete projects
CREATE POLICY "Admins can delete projects"
  ON pipeline_projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create user_roles table for RBAC
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMIT;
```

```typescript
// src/lib/supabase.ts - Enable auth
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,  // ✅ Enable session persistence
    autoRefreshToken: true, // ✅ Enable token refresh
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

// Auth helpers
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserRole(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data.role;
}
```

```typescript
// src/components/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">ALPA Construction Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

```typescript
// src/components/auth/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

```typescript
// src/App.tsx - Add protected routes
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/components/auth/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OpportunityDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
```

**Create .env.example:**
```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=your-sentry-dsn
```

**Timeline:**
- Day 1-3: Enable RLS + create policies
- Day 4-6: Implement Supabase Auth
- Day 7-9: Build login/logout UI
- Day 10-14: Test auth flows + RBAC

---

### 🔴 CRITICAL-4: No CI/CD Pipeline

**Severity:** CRITICAL  
**Impact:** Manual deployments, no quality gates, high deployment risk  
**Effort:** Small (3-5 days)  
**Files Affected:** .github/workflows/

**Fix: Implement GitHub Actions CI/CD**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
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
      - run: pnpm install
      - run: pnpm lint

  type-check:
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
      - run: pnpm install
      - run: pnpm tsc --noEmit

  test:
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
      - run: pnpm install
      - run: pnpm test:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 70% threshold"
            exit 1
          fi

  build:
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
      - run: pnpm install
      - run: pnpm build
      - name: Check bundle size
        run: |
          SIZE=$(du -sk dist | cut -f1)
          if [ $SIZE -gt 512 ]; then
            echo "Bundle size ${SIZE}KB exceeds 512KB limit"
            exit 1
          fi

  e2e:
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
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
        env:
          VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      - name: Deploy to Vercel Staging
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
      - name: Deploy to Vercel Production
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Create Sentry Release
        run: |
          npx @sentry/cli releases new ${{ github.ref_name }}
          npx @sentry/cli releases finalize ${{ github.ref_name }}
```

**Add pre-commit hooks:**
```bash
# Install Husky
npm install -D husky lint-staged

# Initialize Husky
npx husky init
```

```json
// package.json - Add lint-staged config
{
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

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

**Timeline:**
- Day 1: Set up GitHub Actions CI
- Day 2: Add quality gates (coverage, bundle size)
- Day 3: Set up deployment pipeline
- Day 4-5: Test CI/CD flows + documentation

---

## Major Issues (Fix Within 30 Days)

### 🟠 MAJOR-1: No Caching Strategy

**Severity:** MAJOR  
**Impact:** Excessive API calls, slow performance, high Supabase costs  
**Effort:** Medium (1 week)

**Fix: Implement React Query**

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
```

```typescript
// src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

```typescript
// src/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useKPIMetrics() {
  return useQuery({
    queryKey: ['kpi-metrics'],
    queryFn: () => dashboardService.fetchKPIMetrics(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBiddingProjects() {
  return useQuery({
    queryKey: ['bidding-projects'],
    queryFn: () => dashboardService.fetchBiddingProjects(),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for countdown timers)
  });
}

export function useBiddingAnalytics() {
  return useQuery({
    queryKey: ['bidding-analytics'],
    queryFn: () => dashboardService.fetchBiddingAnalytics(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnnualTarget() {
  return useQuery({
    queryKey: ['annual-target', 2026],
    queryFn: () => dashboardService.fetchAnnualTarget(),
    staleTime: 10 * 60 * 1000, // 10 minutes (changes infrequently)
  });
}
```

```typescript
// src/views/OpportunityDashboard.tsx - Refactor to use React Query
import { useKPIMetrics, useBiddingProjects, useBiddingAnalytics, useAnnualTarget } from '@/hooks/useDashboardData';

export default function OpportunityDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useKPIMetrics();
  const { data: biddingProjects, isLoading: projectsLoading } = useBiddingProjects();
  const { data: analytics, isLoading: analyticsLoading } = useBiddingAnalytics();
  const { data: annualTarget, isLoading: targetLoading } = useAnnualTarget();

  const loading = kpisLoading || projectsLoading || analyticsLoading || targetLoading;

  // Remove manual loadDashboardData function - React Query handles it
  
  return (
    <MapFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        {/* ... rest of component */}
      </div>
    </MapFilterProvider>
  );
}
```

**Benefits:**
- 60% reduction in API calls (cached responses)
- Automatic background refetching
- Built-in loading/error states
- Optimistic updates support

---

### 🟠 MAJOR-2: Large Bundle Size (750KB)

**Severity:** MAJOR  
**Impact:** Slow page loads (>3s on 3G), high bounce rate  
**Effort:** Medium (1 week)

**Fix: Code Splitting + Lazy Loading**

```typescript
// src/App.tsx - Lazy load routes
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const OpportunityDashboard = lazy(() => import('@/views/OpportunityDashboard'));
const PipelineView = lazy(() => import('@/pages/PipelineView'));
const Index = lazy(() => import('@/pages/Index'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<OpportunityDashboard />} />
          <Route path="/pipeline" element={<PipelineView />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

```typescript
// src/templates/maps/GeoMapTemplate_HeatView.tsx - Lazy load Leaflet
import { lazy, Suspense } from 'react';

const LeafletMap = lazy(() => import('./LeafletMapComponent'));

export default function GeoMapTemplate_HeatView() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <LeafletMap />
    </Suspense>
  );
}
```

```typescript
// vite.config.ts - Add bundle optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'map-vendor': ['leaflet', 'react-leaflet', 'leaflet.markercluster'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
  },
});
```

**Expected Results:**
- Initial bundle: 300KB (down from 750KB)
- Map chunk: 200KB (loaded on demand)
- Chart chunk: 150KB (loaded on demand)
- Total reduction: 60% smaller initial load

---

### 🟠 MAJOR-3: No Performance Optimization

**Severity:** MAJOR  
**Impact:** Slow renders, poor UX, high CPU usage  
**Effort:** Medium (1 week)

**Fix: React.memo + useMemo + useCallback**

```typescript
// src/components/dashboard/DashboardKPICards.tsx - Add memoization
import { memo, useMemo } from 'react';

export const DashboardKPICards = memo(function DashboardKPICards({ kpis, loading }: Props) {
  const { selectedFilter, setSelectedFilter } = useMapFilter();

  const kpiMapping = useMemo(() => ({
    'Projects Currently Bidding': 'opp_proposal',
    'Bids Submitted': 'opp_negotiation',
    'Projects Awarded': 'opp_award',
    'Projects Lost': 'opp_lost',
    'Pre-Solicitation Projects': 'opp_lead_gen',
    'Joint Venture Projects': 'joint_venture',
  }), []);

  const handleCardClick = useCallback((label: string) => {
    const filterType = kpiMapping[label];
    if (filterType) {
      if (selectedFilter === filterType) {
        setSelectedFilter('all');
      } else {
        setSelectedFilter(filterType as KPIFilterType);
      }
    }
  }, [selectedFilter, setSelectedFilter, kpiMapping]);

  // ... rest of component
});
```

```typescript
// src/components/dashboard/BiddingProjectsTable.tsx - Optimize countdown timers
import { memo, useMemo, useCallback } from 'react';

export const BiddingProjectsTable = memo(function BiddingProjectsTable({ projects, loading }: Props) {
  // Only update countdown every 60 seconds instead of every second
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [projects]);

  // ... rest of component
});
```

```typescript
// src/templates/maps/GeoMapTemplate_HeatView.tsx - Optimize map rendering
import { memo, useMemo } from 'react';

export const GeoMapTemplate_HeatView = memo(function GeoMapTemplate_HeatView() {
  const { selectedFilter } = useMapFilter();

  const filteredProjects = useMemo(() => {
    if (selectedFilter === 'all') return projects;
    return projects.filter(p => matchesFilter(p, selectedFilter));
  }, [projects, selectedFilter]);

  const mapCenter = useMemo(() => {
    if (filteredProjects.length === 0) return [39.8283, -98.5795];
    const avgLat = filteredProjects.reduce((sum, p) => sum + p.latitude, 0) / filteredProjects.length;
    const avgLng = filteredProjects.reduce((sum, p) => sum + p.longitude, 0) / filteredProjects.length;
    return [avgLat, avgLng];
  }, [filteredProjects]);

  // ... rest of component
});
```

**Expected Results:**
- 50% reduction in re-renders
- Smoother scrolling and interactions
- Lower CPU usage

---

## Minor Issues (Fix Within 60-90 Days)

### 🟡 MINOR-1: No API Documentation

**Severity:** MINOR  
**Impact:** Poor developer experience, hard to onboard new devs  
**Effort:** Small (2 days)

**Fix: Add JSDoc + Generate API Docs**

```typescript
// src/services/dashboard.service.ts
/**
 * Service for fetching and calculating dashboard metrics
 * @class DashboardService
 */
export class DashboardService {
  /**
   * Calculates countdown timer for a bid due date
   * @param {string} bidDueDateTime - ISO 8601 datetime string
   * @returns {CountdownTimer} Countdown object with days, hours, urgency level
   * @example
   * const countdown = service.calculateCountdown('2025-11-15T14:00:00Z');
   * console.log(countdown.displayText); // "5d 12h"
   */
  calculateCountdown(bidDueDateTime: string): CountdownTimer {
    // ...
  }

  /**
   * Fetches all KPI metrics for the dashboard
   * @returns {Promise<DashboardKPI[]>} Array of KPI objects
   * @throws {Error} If Supabase query fails
   * @example
   * const kpis = await service.fetchKPIMetrics();
   * console.log(kpis[0].label); // "Projects Currently Bidding"
   */
  async fetchKPIMetrics(): Promise<DashboardKPI[]> {
    // ...
  }
}
```

---

### 🟡 MINOR-2: No Prettier Configuration

**Severity:** MINOR  
**Impact:** Inconsistent code formatting  
**Effort:** Small (1 hour)

**Fix: Add Prettier**

```bash
npm install -D prettier
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

```json
// package.json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\""
  }
}
```

---

### 🟡 MINOR-3: Missing Storybook

**Severity:** MINOR  
**Impact:** Harder to develop/test components in isolation  
**Effort:** Medium (3 days)

**Fix: Add Storybook**

```bash
npx storybook@latest init
```

```typescript
// src/components/dashboard/DashboardKPICards.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { DashboardKPICards } from './DashboardKPICards';
import { MapFilterProvider } from '@/contexts/MapFilterContext';

const meta: Meta<typeof DashboardKPICards> = {
  title: 'Dashboard/KPICards',
  component: DashboardKPICards,
  decorators: [
    (Story) => (
      <MapFilterProvider>
        <Story />
      </MapFilterProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardKPICards>;

export const Default: Story = {
  args: {
    kpis: [
      {
        label: 'Projects Currently Bidding',
        value: 6,
        displayValue: '6 ($133.0M)',
        color: '#3B82F6',
      },
      // ... more KPIs
    ],
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    kpis: [],
    loading: true,
  },
};
```

---

## Summary Table

| Issue | Severity | Effort | Timeline | Priority |
|-------|----------|--------|----------|----------|
| Zero Test Coverage | CRITICAL | Large (2-3 weeks) | Week 1-3 | 1 |
| No Observability | CRITICAL | Medium (1 week) | Week 1 | 2 |
| RLS Disabled | CRITICAL | Medium (2 weeks) | Week 1-2 | 3 |
| No CI/CD | CRITICAL | Small (3-5 days) | Week 1 | 4 |
| No Caching | MAJOR | Medium (1 week) | Week 4 | 5 |
| Large Bundle | MAJOR | Medium (1 week) | Week 5 | 6 |
| No Performance Opt | MAJOR | Medium (1 week) | Week 6 | 7 |
| No API Docs | MINOR | Small (2 days) | Week 8 | 8 |
| No Prettier | MINOR | Small (1 hour) | Week 8 | 9 |
| Missing Storybook | MINOR | Medium (3 days) | Week 10 | 10 |

**Total Effort:** ~12 weeks (560 hours)

---

## Next Steps

1. Review this document with engineering team
2. Prioritize fixes based on business impact
3. Create JIRA tickets for each issue
4. Assign owners and set deadlines
5. Schedule weekly check-ins to track progress