/**
 * Estimating Analytics Page
 * Analytics and insights for the estimating module
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyData {
  month: string;
  submitted: number;
  won: number;
  lost: number;
  value: number;
}

interface EstimatorPerformance {
  name: string;
  estimatesCompleted: number;
  winRate: number;
  totalValue: number;
  avgAccuracy: number;
}

const monthlyData: MonthlyData[] = [
  { month: 'Jan', submitted: 8, won: 3, lost: 2, value: 45000000 },
  { month: 'Feb', submitted: 6, won: 2, lost: 1, value: 32000000 },
  { month: 'Mar', submitted: 10, won: 4, lost: 3, value: 58000000 },
  { month: 'Apr', submitted: 7, won: 3, lost: 2, value: 41000000 },
  { month: 'May', submitted: 9, won: 4, lost: 2, value: 52000000 },
  { month: 'Jun', submitted: 11, won: 5, lost: 3, value: 67000000 },
  { month: 'Jul', submitted: 8, won: 3, lost: 2, value: 48000000 },
  { month: 'Aug', submitted: 12, won: 5, lost: 4, value: 72000000 },
  { month: 'Sep', submitted: 9, won: 4, lost: 2, value: 55000000 },
  { month: 'Oct', submitted: 10, won: 4, lost: 3, value: 61000000 },
  { month: 'Nov', submitted: 7, won: 3, lost: 2, value: 43000000 },
  { month: 'Dec', submitted: 5, won: 2, lost: 1, value: 28000000 },
];

const estimatorPerformance: EstimatorPerformance[] = [
  { name: 'Sarah Johnson', estimatesCompleted: 28, winRate: 52, totalValue: 156000000, avgAccuracy: 94 },
  { name: 'Mike Chen', estimatesCompleted: 24, winRate: 48, totalValue: 134000000, avgAccuracy: 91 },
  { name: 'Lisa Anderson', estimatesCompleted: 31, winRate: 55, totalValue: 178000000, avgAccuracy: 96 },
  { name: 'John Smith', estimatesCompleted: 19, winRate: 42, totalValue: 98000000, avgAccuracy: 88 },
];

const projectTypeBreakdown = [
  { type: 'Healthcare', count: 18, value: 245000000, percentage: 35 },
  { type: 'Government', count: 24, value: 312000000, percentage: 45 },
  { type: 'Commercial', count: 8, value: 98000000, percentage: 14 },
  { type: 'Education', count: 5, value: 42000000, percentage: 6 },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function EstimatingAnalytics() {
  const [timeRange, setTimeRange] = useState('year');

  const totalSubmitted = monthlyData.reduce((sum, m) => sum + m.submitted, 0);
  const totalWon = monthlyData.reduce((sum, m) => sum + m.won, 0);
  const totalLost = monthlyData.reduce((sum, m) => sum + m.lost, 0);
  const totalValue = monthlyData.reduce((sum, m) => sum + m.value, 0);
  const winRate = (totalWon / (totalWon + totalLost)) * 100;

  const maxSubmitted = Math.max(...monthlyData.map((m) => m.submitted));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimating Analytics</h1>
          <p className="text-gray-600">Performance insights and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submitted</p>
                <p className="text-3xl font-bold text-gray-900">{totalSubmitted}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">12%</span>
              <span className="text-gray-500">vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-3xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">3.2%</span>
              <span className="text-gray-500">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won Value</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalValue * 0.48)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">18%</span>
              <span className="text-gray-500">vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Estimate Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">92.4%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">1.1%</span>
              <span className="text-gray-500">vs last year</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Submissions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bid Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((month) => (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600">{month.month}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <div
                      className="h-6 bg-blue-500 rounded-l"
                      style={{
                        width: `${(month.submitted / maxSubmitted) * 60}%`,
                      }}
                    />
                    <div
                      className="h-6 bg-green-500"
                      style={{
                        width: `${(month.won / maxSubmitted) * 60}%`,
                      }}
                    />
                    <div
                      className="h-6 bg-red-400 rounded-r"
                      style={{
                        width: `${(month.lost / maxSubmitted) * 60}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm text-gray-600 text-right">{month.submitted}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Won</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span>Lost</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Project Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectTypeBreakdown.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.type}</span>
                    <span className="text-gray-600">
                      {type.count} projects • {formatCurrency(type.value)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-right">{type.percentage}% of portfolio</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estimator Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estimator Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {estimatorPerformance.map((estimator) => (
              <Card key={estimator.name} className="border border-gray-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900">{estimator.name}</h4>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estimates</span>
                      <span className="font-medium">{estimator.estimatesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Win Rate</span>
                      <span className={`font-medium ${estimator.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                        {estimator.winRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Value</span>
                      <span className="font-medium">{formatCurrency(estimator.totalValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Accuracy</span>
                      <span className={`font-medium ${estimator.avgAccuracy >= 92 ? 'text-green-600' : 'text-orange-600'}`}>
                        {estimator.avgAccuracy}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Win/Loss Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Win Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Top Win Factors</h4>
                <ul className="mt-2 space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Past performance with agency (65% correlation)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Competitive pricing within 5% of average (58% win rate)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Healthcare sector expertise (72% win rate)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loss Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Top Loss Factors</h4>
                <ul className="mt-2 space-y-2 text-sm text-red-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Price above competitors by &gt;10% (45% of losses)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Limited experience in sector (28% of losses)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Technical approach scoring (18% of losses)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Key Trends & Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Growing Sectors</h4>
              </div>
              <p className="text-sm text-blue-700">
                Healthcare and government projects showing 25% YoY growth. Consider increasing capacity in these areas.
              </p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Sweet Spot</h4>
              </div>
              <p className="text-sm text-purple-700">
                Projects $8M-$15M have highest win rate (58%). Focus on this range for optimal conversion.
              </p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-800">Seasonal Pattern</h4>
              </div>
              <p className="text-sm text-orange-700">
                Q3 shows highest submission volume. Plan resources for August-September peak.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
