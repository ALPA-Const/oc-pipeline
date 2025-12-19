/**
 * Estimating Overview Page
 * Dashboard view for the Preconstruction & Estimating module
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Calculator,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EstimateStats {
  totalEstimates: number;
  activeEstimates: number;
  pendingBids: number;
  wonBids: number;
  totalValue: number;
  avgWinRate: number;
}

interface RecentEstimate {
  id: string;
  name: string;
  projectName: string;
  status: 'draft' | 'in_review' | 'submitted' | 'won' | 'lost';
  value: number;
  dueDate: string;
  daysRemaining: number;
}

const mockStats: EstimateStats = {
  totalEstimates: 47,
  activeEstimates: 12,
  pendingBids: 8,
  wonBids: 23,
  totalValue: 156000000,
  avgWinRate: 48.9,
};

const mockRecentEstimates: RecentEstimate[] = [
  {
    id: '1',
    name: 'EST-2024-001',
    projectName: 'VA Medical Center Renovation',
    status: 'in_review',
    value: 12500000,
    dueDate: '2024-02-15',
    daysRemaining: 12,
  },
  {
    id: '2',
    name: 'EST-2024-002',
    projectName: 'Federal Courthouse Addition',
    status: 'draft',
    value: 8700000,
    dueDate: '2024-02-28',
    daysRemaining: 25,
  },
  {
    id: '3',
    name: 'EST-2024-003',
    projectName: 'DOD Facility Upgrade',
    status: 'submitted',
    value: 24000000,
    dueDate: '2024-01-30',
    daysRemaining: -3,
  },
  {
    id: '4',
    name: 'EST-2024-004',
    projectName: 'Hospital Wing Expansion',
    status: 'in_review',
    value: 18500000,
    dueDate: '2024-03-10',
    daysRemaining: 36,
  },
];

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700' },
  won: { label: 'Won', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700' },
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function EstimatingOverview() {
  const [stats, setStats] = useState<EstimateStats>(mockStats);
  const [recentEstimates, setRecentEstimates] = useState<RecentEstimate[]>(mockRecentEstimates);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Preconstruction & Estimating</h1>
        <p className="mt-1 text-gray-600">
          Manage cost estimates, bid submissions, and project planning
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Estimates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEstimates}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {stats.totalEstimates} total estimates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bids</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBids}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Awaiting decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgWinRate}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {stats.wonBids} won this year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/preconstruction/estimates/new">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Estimate</h3>
                  <p className="text-sm text-gray-600">Start a new cost estimate</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/preconstruction/cost-breakdown">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cost Breakdown</h3>
                  <p className="text-sm text-gray-600">Analyze project costs</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/preconstruction/bids">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bid Tracker</h3>
                  <p className="text-sm text-gray-600">Track bid submissions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Estimates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Estimates</CardTitle>
          <Link to="/preconstruction/estimates">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEstimates.map((estimate) => (
              <Link
                key={estimate.id}
                to={`/preconstruction/estimates/${estimate.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-gray-50 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{estimate.name}</h4>
                      <Badge className={statusConfig[estimate.status].color}>
                        {statusConfig[estimate.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{estimate.projectName}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(estimate.value)}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {estimate.daysRemaining > 0 ? (
                          <span className="text-gray-600">{estimate.daysRemaining} days left</span>
                        ) : (
                          <span className="text-red-600">Overdue</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-700">VA Medical Center Renovation</span>
                <span className="font-medium text-orange-700">12 days</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Federal Courthouse Addition</span>
                <span className="font-medium text-orange-700">25 days</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Recent Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-700">GSA Building Modernization</span>
                <span className="font-medium text-green-700">$14.2M</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Army Corps Office Renovation</span>
                <span className="font-medium text-green-700">$8.5M</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
