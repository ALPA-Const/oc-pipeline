import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardKPICards } from '@/components/dashboard/DashboardKPICards';
import { BiddingProjectsTable } from '@/components/dashboard/BiddingProjectsTable';
import { BiddingAnalyticsPanel } from '@/components/dashboard/BiddingAnalyticsPanel';
import { AnnualTargetCard } from '@/components/dashboard/AnnualTargetCard';
import GeoMapTemplate_HeatView from '@/templates/maps/GeoMapTemplate_HeatView';
import { MapFilterProvider } from '@/contexts/MapFilterContext';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardKPI, BiddingProject, BiddingAnalytics, AnnualTarget } from '@/types/dashboard.types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Home, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function OpportunityDashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [biddingProjects, setBiddingProjects] = useState<BiddingProject[]>([]);
  const [analytics, setAnalytics] = useState<BiddingAnalytics | null>(null);
  const [annualTarget, setAnnualTarget] = useState<AnnualTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');

      // Load all data in parallel
      const [kpisData, projectsData, analyticsData, targetData] = await Promise.all([
        dashboardService.fetchKPIMetrics(),
        dashboardService.fetchBiddingProjects(),
        dashboardService.fetchBiddingAnalytics(),
        dashboardService.fetchAnnualTarget(),
      ]);

      setKpis(kpisData);
      setBiddingProjects(projectsData);
      setAnalytics(analyticsData);
      setAnnualTarget(targetData);

      console.log('✅ Dashboard data loaded successfully');
      toast.success('Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    toast.info('Refreshing dashboard...');
    loadDashboardData();
  };

  const handleExport = () => {
    // Export bidding projects to CSV
    const headers = [
      'Agency',
      'Set Aside',
      'Bid Title',
      'Solicitation Number',
      'Bid Due Date',
      'Days Until Due',
      'Magnitude',
      'NAICS Code',
      'Location',
      'Capacity %',
    ];

    const rows = biddingProjects.map(p => [
      p.agency,
      p.setAside,
      p.bidTitle,
      p.solicitationNumber,
      p.bidDueDateTime,
      p.daysUntilDue,
      p.magnitude,
      p.naicsCode,
      `${p.projectCity}, ${p.projectState}`,
      p.capacityPercentage,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bidding-projects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Exported bidding projects to CSV');
  };

  return (
    <MapFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 hover:text-blue-600"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Opportunity Dashboard</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Opportunity Pipeline Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Business Intelligence & Analytics for ALPA Construction
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" disabled={loading || biddingProjects.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Annual Target Card */}
          {annualTarget && <AnnualTargetCard target={annualTarget} loading={loading} />}

          {/* KPI Cards - Now clickable with map sync */}
          <DashboardKPICards kpis={kpis} loading={loading} />

          {/* Geographic Map Widget - Now with heatmap view */}
          <GeoMapTemplate_HeatView />

          {/* Bidding Analytics Panel */}
          {analytics && <BiddingAnalyticsPanel analytics={analytics} loading={loading} />}

          {/* Bidding Projects Table */}
          <BiddingProjectsTable projects={biddingProjects} loading={loading} />
        </div>
      </div>
    </MapFilterProvider>
  );
}