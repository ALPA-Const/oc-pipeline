/**
 * OC Pipeline - Dashboard Data Hook
 * Fetches all dashboard data with React Query caching
 */

import { useState, useEffect, useCallback } from 'react';
import { HeroMetricsData } from '@/components/dashboard/HeroMetrics';
import { Project } from '@/components/dashboard/ProjectList';
import { BudgetTrendData, ScheduleData } from '@/components/dashboard/AnalyticsPanel';
import { Alert } from '@/components/dashboard/AlertsPanel';
import { CUIComplianceData } from '@/components/dashboard/CUIComplianceWidget';

interface DashboardData {
  metrics: HeroMetricsData | null;
  projects: Project[];
  budgetTrend: BudgetTrendData[];
  scheduleData: ScheduleData[];
  alerts: Alert[];
  cuiCompliance: CUIComplianceData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mock data for initial development - will be replaced with API calls
const mockMetrics: HeroMetricsData = {
  activeProjects: 12,
  pipelineValue: 45600000,
  budgetAtRisk: 2300000,
  winRate: 67.5,
  cuiDocumentsSecured: 156,
  trends: {
    activeProjects: 8.3,
    pipelineValue: 12.5,
    budgetAtRisk: -5.2,
    winRate: 3.1,
  },
};

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'VA Medical Center Renovation',
    location: 'Washington, DC',
    value: 12500000,
    progress: 45,
    status: 'active',
    risks: 2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'DoD Headquarters Expansion',
    location: 'Arlington, VA',
    value: 28000000,
    progress: 22,
    status: 'active',
    risks: 0,
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'GSA Federal Building Modernization',
    location: 'Philadelphia, PA',
    value: 8500000,
    progress: 78,
    status: 'active',
    risks: 1,
    lastUpdated: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    name: 'USDA Research Facility',
    location: 'Beltsville, MD',
    value: 5200000,
    progress: 10,
    status: 'planning',
    risks: 0,
    lastUpdated: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '5',
    name: 'NASA Testing Complex',
    location: 'Greenbelt, MD',
    value: 15800000,
    progress: 65,
    status: 'active',
    risks: 3,
    lastUpdated: new Date(Date.now() - 345600000).toISOString(),
  },
];

const mockBudgetTrend: BudgetTrendData[] = [
  { month: 'Jul', budget: 4200000, actual: 4100000, forecast: 4200000 },
  { month: 'Aug', budget: 4200000, actual: 4350000, forecast: 4300000 },
  { month: 'Sep', budget: 4200000, actual: 4180000, forecast: 4200000 },
  { month: 'Oct', budget: 4200000, actual: 4420000, forecast: 4400000 },
  { month: 'Nov', budget: 4200000, actual: 4050000, forecast: 4100000 },
  { month: 'Dec', budget: 4200000, actual: 0, forecast: 4250000 },
];

const mockScheduleData: ScheduleData[] = [
  { phase: 'Design', completed: 100 },
  { phase: 'Procurement', completed: 85 },
  { phase: 'Construction', completed: 52 },
  { phase: 'Testing', completed: 15 },
  { phase: 'Closeout', completed: 0 },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Budget Overrun Detected',
    message: 'VA Medical Center project has exceeded budget threshold by 8%. Immediate review required.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    projectId: '1',
    projectName: 'VA Medical Center Renovation',
  },
  {
    id: '2',
    type: 'critical',
    title: 'CUI Document Expiring',
    message: 'Security clearance for 3 documents expires in 7 days. Action required.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'warning',
    title: 'Schedule Delay Risk',
    message: 'NASA Testing Complex may experience 2-week delay due to material shortage.',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    projectId: '5',
    projectName: 'NASA Testing Complex',
  },
  {
    id: '4',
    type: 'warning',
    title: 'Subcontractor Issue',
    message: 'HVAC subcontractor has requested timeline extension for DoD project.',
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    projectId: '2',
    projectName: 'DoD Headquarters Expansion',
  },
  {
    id: '5',
    type: 'info',
    title: 'Weekly Report Ready',
    message: 'Your weekly portfolio summary is ready for review.',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: '6',
    type: 'success',
    title: 'Milestone Achieved',
    message: 'GSA Federal Building reached 75% completion milestone ahead of schedule.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    projectId: '3',
    projectName: 'GSA Federal Building Modernization',
  },
];

const mockCUICompliance: CUIComplianceData = {
  overallScore: 87,
  status: 'at-risk',
  documentsSecured: 156,
  documentsTotal: 180,
  pendingReviews: 8,
  expiringCertifications: 3,
  lastAudit: '2025-10-15',
  nextAuditDue: '2026-01-15',
  controlsStatus: {
    accessControl: 'pass',
    awareness: 'pass',
    auditLog: 'pass',
    incidentResponse: 'warning',
    riskAssessment: 'pass',
  },
};

export function useDashboardData(): DashboardData {
  const [metrics, setMetrics] = useState<HeroMetricsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetTrend, setBudgetTrend] = useState<BudgetTrendData[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cuiCompliance, setCuiCompliance] = useState<CUIComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API calls
      // const response = await fetch('/api/dashboard/summary');
      // const data = await response.json();

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use mock data for now
      setMetrics(mockMetrics);
      setProjects(mockProjects);
      setBudgetTrend(mockBudgetTrend);
      setScheduleData(mockScheduleData);
      setAlerts(mockAlerts);
      setCuiCompliance(mockCUICompliance);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    projects,
    budgetTrend,
    scheduleData,
    alerts,
    cuiCompliance,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useDashboardData;

