/**
 * Civora Dashboard
 * Executive construction pipeline management dashboard with bidding analytics,
 * annual target tracking, geographic distribution, and what-if scenario modeling.
 *
 * Layout:
 * - Header: Civora brand, last refresh time, refresh button, what-if trigger
 * - Filters: Global state/stage/set-aside filter chips
 * - KPIs: 10-card bidding pipeline overview (clickable to filter map)
 * - Analytics: 4-card bidding analytics summary
 * - Annual Target: Progress toward fiscal-year award goal
 * - Tabs: Map heat view | Projects table | Distribution charts
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { DashboardFilterProvider } from '@/contexts/DashboardFilterContext';
import { MapFilterProvider } from '@/contexts/MapFilterContext';
import { DashboardKPICards } from '@/components/dashboard/DashboardKPICards';
import { BiddingAnalyticsPanel } from '@/components/dashboard/BiddingAnalyticsPanel';
import { AnnualTargetCard } from '@/components/dashboard/AnnualTargetCard';
import { GlobalFilters } from '@/components/dashboard/GlobalFilters';
import { WhatIfDrawer } from '@/components/dashboard/WhatIfDrawer';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

import { dashboardService } from '@/services/dashboard.service';
import { metricsService } from '@/services/metrics/metrics.service';
import type {
  DashboardKPI,
  BiddingProject,
  BiddingAnalytics,
  AnnualTarget,
} from '@/types/dashboard.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardState {
  kpis: DashboardKPI[];
  projects: BiddingProject[];
  analytics: BiddingAnalytics | null;
  annualTarget: AnnualTarget | null;
  winRate: number;
  avgAwardSize: number;
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRefreshTime(date: Date | null): string {
  if (!date) return 'Never';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component (needs to be inside the providers)
// ─────────────────────────────────────────────────────────────────────────────

function CivoraDashboardInner() {
  const [state, setState] = useState<DashboardState>({
    kpis: [],
    projects: [],
    analytics: null,
    annualTarget: null,
    winRate: 0,
    avgAwardSize: 20_000_000,
    loading: true,
    error: null,
    lastRefreshed: null,
  });

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [kpis, projects, analytics, annualTarget, winRateMetric] =
        await Promise.all([
          dashboardService.fetchKPIMetrics(),
          dashboardService.fetchBiddingProjects(),
          dashboardService.fetchBiddingAnalytics(),
          dashboardService.fetchAnnualTarget(),
          metricsService.getWinRate(),
        ]);

      // Derive average award size from annual target data.
      // The service computes projectsNeeded = ceil(remainingToTarget / avgProjectValue),
      // so avgProjectValue ≈ remainingToTarget / projectsNeeded.
      const avgAwardSize =
        annualTarget.projectsNeeded > 0
          ? annualTarget.remainingToTarget / annualTarget.projectsNeeded
          : 20_000_000;

      setState({
        kpis,
        projects,
        analytics,
        annualTarget,
        winRate: winRateMetric.value,
        avgAwardSize,
        loading: false,
        error: null,
        lastRefreshed: new Date(),
      });
    } catch (err) {
      console.error('❌ Civora Dashboard load error:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          err instanceof Error ? err.message : 'Failed to load dashboard data',
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Civora Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Bidding pipeline &amp; executive analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.lastRefreshed && (
            <span className="hidden text-xs text-gray-400 sm:inline">
              Updated {formatRefreshTime(state.lastRefreshed)}
            </span>
          )}

          {/* What-If Analysis */}
          {state.analytics && (
            <WhatIfDrawer
              currentWinRate={state.winRate}
              currentAvgAwardSize={state.avgAwardSize}
            />
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={state.loading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Unable to load data:</strong> {state.error}
          <Button
            variant="link"
            size="sm"
            className="ml-2 text-red-700 underline p-0 h-auto"
            onClick={handleRefresh}
          >
            Try again
          </Button>
        </div>
      )}

      {/* ── Global Filters ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <GlobalFilters />
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-700">
            Pipeline Overview
          </h2>
          <Badge variant="secondary" className="text-xs">
            {state.kpis.length} metrics
          </Badge>
        </div>
        <DashboardKPICards kpis={state.kpis} loading={state.loading} />
      </section>

      {/* ── Bidding Analytics ────────────────────────────────────────────── */}
      {(state.analytics || state.loading) && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-700">
            Bidding Analytics
          </h2>
          <BiddingAnalyticsPanel
            analytics={
              state.analytics ?? {
                totalProjects: 0,
                totalValue: 0,
                averagePipelineVelocity: 0,
                capacityIfAllWon: 0,
                capacityPercentage: 0,
              }
            }
            loading={state.loading}
          />
        </section>
      )}

      {/* ── Annual Target ─────────────────────────────────────────────────── */}
      {(state.annualTarget || state.loading) && (
        <section>
          <AnnualTargetCard
            target={
              state.annualTarget ?? {
                year: 2026,
                targetAmount: 30_000_000,
                awardedYTD: 0,
                remainingToTarget: 30_000_000,
                percentageComplete: 0,
                projectedYearEnd: 0,
                onTrackStatus: 'behind',
                projectsNeeded: 0,
                currentRunRate: 0,
              }
            }
            loading={state.loading}
          />
        </section>
      )}

      {/* ── Map / Table / Distribution Tabs ──────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-700">
          Project Distribution
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <DashboardTabs
            projects={state.projects}
            loading={state.loading}
            totalProjects={state.projects.length}
          />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export – wrap with the context providers the child components need
// ─────────────────────────────────────────────────────────────────────────────

export function CivoraDashboard() {
  return (
    <DashboardFilterProvider>
      <MapFilterProvider>
        <CivoraDashboardInner />
      </MapFilterProvider>
    </DashboardFilterProvider>
  );
}
