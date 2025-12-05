import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import {
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Temporary mock data until backend is connected
const mockKPIs = {
  totalProjects: 12,
  activeProjects: 8,
  totalBudget: 45000000,
  atRisk: 2,
  completedThisMonth: 1,
  openRFIs: 23,
  pendingSubmittals: 15,
  safetyIncidents: 0,
};

const mockRecentProjects = [
  { id: '1', name: 'VA Medical Center Renovation', status: 'active', value: 12500000, phase: 'Construction', health: 'good' },
  { id: '2', name: 'Federal Courthouse HVAC Upgrade', status: 'active', value: 3200000, phase: 'Preconstruction', health: 'warning' },
  { id: '3', name: 'Army Reserve Center Buildout', status: 'active', value: 8700000, phase: 'Construction', health: 'good' },
  { id: '4', name: 'GSA Office Modernization', status: 'bidding', value: 5100000, phase: 'Bidding', health: 'good' },
  { id: '5', name: 'DoD Secure Facility', status: 'active', value: 15400000, phase: 'Construction', health: 'critical' },
];

const mockUpcomingDeadlines = [
  { id: '1', title: 'RFI Response - VA Medical Center', date: '2025-01-15', type: 'rfi' },
  { id: '2', title: 'Submittal Review - Federal Courthouse', date: '2025-01-17', type: 'submittal' },
  { id: '3', title: 'Bid Submission - GSA Office', date: '2025-01-20', type: 'bid' },
  { id: '4', title: 'Safety Audit - Army Reserve', date: '2025-01-22', type: 'safety' },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function getHealthColor(health: string): string {
  switch (health) {
    case 'good': return 'bg-green-100 text-green-700';
    case 'warning': return 'bg-yellow-100 text-yellow-700';
    case 'critical': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-blue-100 text-blue-700';
    case 'bidding': return 'bg-purple-100 text-purple-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'on-hold': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legacy Dashboard (Deprecated)</h1>
          <p className="mt-1 text-sm text-gray-600">
            This is the legacy dashboard. Please use /dashboard for the Elite Dashboard.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-blue-100 p-2">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                12%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{mockKPIs.activeProjects}</p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-green-100 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                8%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockKPIs.totalBudget)}</p>
              <p className="text-sm text-gray-500">Portfolio Value</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-yellow-100 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-red-600">
                <ArrowDownRight className="h-4 w-4" />
                1
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{mockKPIs.atRisk}</p>
              <p className="text-sm text-gray-500">Projects at Risk</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-100 p-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{mockKPIs.openRFIs}</p>
              <p className="text-sm text-gray-500">Open RFIs</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Projects - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {mockRecentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.phase}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.value)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getHealthColor(project.health)}`}>
                      {project.health}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 px-6 py-3">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all projects →
              </button>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {mockUpcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{deadline.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(deadline.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 px-6 py-3">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View calendar →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{mockKPIs.completedThisMonth}</p>
                <p className="text-xs text-gray-500">Completed This Month</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{mockKPIs.pendingSubmittals}</p>
                <p className="text-xs text-gray-500">Pending Submittals</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{mockKPIs.totalProjects}</p>
                <p className="text-xs text-gray-500">Total Projects</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{mockKPIs.safetyIncidents}</p>
                <p className="text-xs text-gray-500">Safety Incidents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
