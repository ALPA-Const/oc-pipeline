/**
 * OC Pipeline - Dashboard Components Index
 * Export all dashboard components for easy importing
 */

export { default as HeroMetrics, HeroMetricsSkeleton } from './HeroMetrics';
export type { HeroMetricsData } from './HeroMetrics';

export { default as ProjectList, ProjectListSkeleton } from './ProjectList';
export type { Project } from './ProjectList';

export { default as AnalyticsPanel, AnalyticsPanelSkeleton } from './AnalyticsPanel';
export type { BudgetTrendData, ScheduleData } from './AnalyticsPanel';

export { default as AlertsPanel, AlertsPanelSkeleton } from './AlertsPanel';
export type { Alert } from './AlertsPanel';

export { default as CUIComplianceWidget, CUIComplianceWidgetSkeleton } from './CUIComplianceWidget';
export type { CUIComplianceData } from './CUIComplianceWidget';

export { default as DashboardError } from './DashboardError';

