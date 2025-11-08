import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePipelineStore } from '@/stores/pipeline';
import { formatCurrency } from '@/utils/pipeline';
import { PipelineProject } from '@/types/pipeline.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Target,
  Activity,
} from 'lucide-react';

interface StageMetric {
  stageName: string;
  projectCount: number;
  totalValue: number;
  conversionRate: number;
}

interface Bottleneck {
  stageId: string;
  stageName: string;
  projectCount: number;
  averageDuration: number;
  expectedDuration: number;
  variance: number;
  stalledProjects: number;
}

export function PipelineMetrics() {
  const { 
    metrics, 
    totalPipelineValue, 
    weightedPipelineValue, 
    filteredProjects, 
    stalledProjects 
  } = usePipelineStore();

  const stalledPercentage = filteredProjects.length > 0 
    ? Math.round((stalledProjects.length / filteredProjects.length) * 100)
    : 0;

  const conversionRate = metrics?.conversionRate || 0;
  const averageCycleTime = metrics?.averageCycleTime || 0;

  // Prepare chart data
  const stageData = metrics?.stageMetrics?.map((stage: StageMetric) => ({
    name: stage.stageName,
    projects: stage.projectCount,
    value: stage.totalValue / 1000000, // Convert to millions
    conversion: stage.conversionRate,
  })) || [];

  const bottleneckData = metrics?.bottlenecks?.map((bottleneck: Bottleneck) => ({
    name: bottleneck.stageName,
    actual: bottleneck.averageDuration,
    expected: bottleneck.expectedDuration,
    variance: bottleneck.variance,
  })) || [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active pipeline projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPipelineValue, true)}
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted: {formatCurrency(weightedPipelineValue, true)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCycleTime}d</div>
            <p className="text-xs text-muted-foreground">
              Average stage duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to award rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stalled Projects Alert */}
      {stalledProjects.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Stalled Projects Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">
                  {stalledProjects.length} projects are stalled ({stalledPercentage}% of pipeline)
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Total value at risk: {formatCurrency(
                    stalledProjects.reduce((sum: number, p: PipelineProject) => sum + p.value, 0), 
                    true
                  )}
                </p>
              </div>
              <Badge variant="destructive">
                {stalledPercentage}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Projects by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="projects" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Value Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Value Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((_entry: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}M`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Rates by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="conversion" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottleneck Analysis */}
        {bottleneckData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Bottleneck Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bottleneckData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="expected" fill="#10B981" name="Expected" />
                  <Bar dataKey="actual" fill="#EF4444" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottleneck Details Table */}
      {metrics?.bottlenecks && metrics.bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Identified Bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Stage</th>
                    <th className="text-left p-2">Projects</th>
                    <th className="text-left p-2">Avg Duration</th>
                    <th className="text-left p-2">Expected</th>
                    <th className="text-left p-2">Variance</th>
                    <th className="text-left p-2">Stalled</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.bottlenecks.map((bottleneck: Bottleneck) => (
                    <tr key={bottleneck.stageId} className="border-b">
                      <td className="p-2 font-medium">{bottleneck.stageName}</td>
                      <td className="p-2">{bottleneck.projectCount}</td>
                      <td className="p-2">{bottleneck.averageDuration}d</td>
                      <td className="p-2">{bottleneck.expectedDuration}d</td>
                      <td className={`p-2 ${bottleneck.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {bottleneck.variance > 0 ? '+' : ''}{bottleneck.variance}d
                      </td>
                      <td className="p-2">
                        {bottleneck.stalledProjects > 0 ? (
                          <Badge variant="destructive">
                            {bottleneck.stalledProjects}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}