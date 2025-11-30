/**
 * OC Pipeline - Elite Dashboard
 * Federal-grade construction management dashboard with CMMC compliance
 *
 * Layout:
 * - Top: Hero Metrics (5 KPI cards)
 * - Left Column: Project List
 * - Center Column: Analytics (Budget + Schedule charts)
 * - Right Column: Alerts + CUI Compliance
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Settings, Bell, User } from 'lucide-react';

// Components
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import DashboardError from '@/components/dashboard/DashboardError';
import HeroMetrics, { HeroMetricsData } from '@/components/dashboard/HeroMetrics';
import ProjectList, { Project } from '@/components/dashboard/ProjectList';
import AnalyticsPanel, { BudgetTrendData, ScheduleData } from '@/components/dashboard/AnalyticsPanel';
import AlertsPanel, { Alert } from '@/components/dashboard/AlertsPanel';
import CUIComplianceWidget, { CUIComplianceData } from '@/components/dashboard/CUIComplianceWidget';

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/AuthContext';

export default function DashboardElite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    metrics,
    projects,
    budgetTrend,
    scheduleData,
    alerts,
    cuiCompliance,
    loading,
    error,
    refetch
  } = useDashboardData();

  // Greet user based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.projectId) {
      navigate(`/projects/${alert.projectId}`);
    }
  };

  if (error) {
    return <DashboardError />;
  }

  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left - Greeting */}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Commander'}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Here's your operational overview for today
                </p>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => refetch()}
                  disabled={loading}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {alerts.filter(a => a.type === 'critical').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {alerts.filter(a => a.type === 'critical').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-slate-700 mx-2" />
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.user_metadata?.full_name?.[0] || <User className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-white hidden lg:block">
                    {user?.user_metadata?.full_name || 'User'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {/* Hero Metrics Row */}
          <section aria-label="Key Performance Indicators">
            <HeroMetrics metrics={metrics} loading={loading} />
          </section>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Projects (3 cols) */}
            <aside className="lg:col-span-3" aria-label="My Projects">
              <ProjectList
                projects={projects}
                loading={loading}
                onProjectClick={handleProjectClick}
                onViewAll={() => navigate('/projects')}
              />
            </aside>

            {/* Center Column - Analytics (5 cols) */}
            <section className="lg:col-span-5" aria-label="Analytics">
              <AnalyticsPanel
                budgetTrend={budgetTrend}
                scheduleData={scheduleData}
                loading={loading}
              />
            </section>

            {/* Right Column - Alerts + CUI (4 cols) */}
            <aside className="lg:col-span-4 space-y-6" aria-label="Alerts and Compliance">
              <AlertsPanel
                alerts={alerts}
                loading={loading}
                onAlertClick={handleAlertClick}
                onViewAll={() => navigate('/alerts')}
              />
              <CUIComplianceWidget
                data={cuiCompliance}
                loading={loading}
                onViewDetails={() => navigate('/compliance')}
              />
            </aside>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700 bg-slate-900/50 mt-8">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <p>© 2025 O'Neill Contractors. All rights reserved.</p>
              <p>OC Pipeline v2.0 • CMMC Level 2 Compliant</p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export { DashboardElite };

