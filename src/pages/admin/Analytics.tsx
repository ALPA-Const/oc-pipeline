/**
 * Admin Analytics Page
 * Display charts, KPIs, and trends from analytics API
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAnalytics,
  getStatusBreakdown,
} from '@/services/pipeline-admin.service';
import {
  AnalyticsResponse,
  StatusBreakdown,
  ProjectFilters,
} from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Target,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/pipeline';

const STATUS_COLORS: Record<string, string> = {
  Bidding: '#3B82F6',
  Submitted: '#F59E0B',
  Awarded: '#10B981',
  Lost: '#EF4444',
  'In Progress': '#8B5CF6',
  'Pre-Solicitation': '#6B7280',
};

export default function AdminAnalytics() {
  const navigate = useNavigate();

  // State
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>({});

  // Load data
  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, statusData] = await Promise.all([
        getAnalytics(filters),
        getStatusBreakdown(filters),
      ]);
      setAnalytics(analyticsData);
      setStatusBreakdown(statusData);
    } catch (error: any) {
      toast.error(`Failed to load analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/pipeline')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pipeline Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Performance metrics and trends
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Filter by:</span>
              <Select
                value={filters.agency || 'all'}
                onValueChange={(value) =>
                  updateFilter('agency', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agencies</SelectItem>
                  <SelectItem value="GSA">GSA</SelectItem>
                  <SelectItem value="VA">VA</SelectItem>
                  <SelectItem value="DOD">DOD</SelectItem>
                  <SelectItem value="DOJ">DOJ</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.setAside || 'all'}
                onValueChange={(value) =>
                  updateFilter('setAside', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All set-asides" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All set-asides</SelectItem>
                  <SelectItem value="SDVOSB">SDVOSB</SelectItem>
                  <SelectItem value="8(a)">8(a)</SelectItem>
                  <SelectItem value="Small Business">Small Business</SelectItem>
                  <SelectItem value="Woman-Owned">Woman-Owned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Projects */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="text-3xl font-bold mt-2">
                      {analytics.totalProjects}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.weekOverWeekChange.totalProjects >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          analytics.weekOverWeekChange.totalProjects >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(analytics.weekOverWeekChange.totalProjects)} WoW
                      </span>
                    </div>
                  </div>
                  <Briefcase className="h-12 w-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-3xl font-bold mt-2">
                      {analytics.activeProjects}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.weekOverWeekChange.activeProjects >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          analytics.weekOverWeekChange.activeProjects >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(analytics.weekOverWeekChange.activeProjects)} WoW
                      </span>
                    </div>
                  </div>
                  <Activity className="h-12 w-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Total Pipeline Value */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pipeline Value</p>
                    <p className="text-3xl font-bold mt-2">
                      {formatCurrency(analytics.totalPipelineValue, true)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.weekOverWeekChange.totalPipelineValue >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          analytics.weekOverWeekChange.totalPipelineValue >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(
                          Math.abs(analytics.weekOverWeekChange.totalPipelineValue),
                          true
                        )}{' '}
                        WoW
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Average Margin */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Margin</p>
                    <p className="text-3xl font-bold mt-2">
                      {analytics.averageMargin !== null
                        ? `${analytics.averageMargin.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {analytics.weekOverWeekChange.averageMargin >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          analytics.weekOverWeekChange.averageMargin >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(analytics.weekOverWeekChange.averageMargin).toFixed(
                          1
                        )}
                        % WoW
                      </span>
                    </div>
                  </div>
                  <Target className="h-12 w-12 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row 1 */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Win Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.winRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Win Rate"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Margin Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.profitMarginTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Profit Margin"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Breakdown - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Projects">
                    {statusBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#6B7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}