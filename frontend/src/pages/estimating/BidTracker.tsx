/**
 * Bid Tracker Page
 * Track and manage bid submissions and outcomes
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  ArrowRight,
  Filter,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Bid {
  id: string;
  projectName: string;
  client: string;
  bidAmount: number;
  submittedDate: string;
  dueDate: string;
  status: 'pending' | 'won' | 'lost' | 'no_bid';
  competitorCount: number;
  winProbability: number;
  notes: string;
  estimateId: string;
}

const mockBids: Bid[] = [
  {
    id: '1',
    projectName: 'VA Medical Center Renovation',
    client: 'Department of Veterans Affairs',
    bidAmount: 12500000,
    submittedDate: '2024-01-20',
    dueDate: '2024-02-15',
    status: 'pending',
    competitorCount: 5,
    winProbability: 65,
    notes: 'Strong relationship with client',
    estimateId: '1',
  },
  {
    id: '2',
    projectName: 'DOD Facility Upgrade',
    client: 'Department of Defense',
    bidAmount: 24000000,
    submittedDate: '2024-01-15',
    dueDate: '2024-01-30',
    status: 'pending',
    competitorCount: 8,
    winProbability: 70,
    notes: 'Past performance advantage',
    estimateId: '3',
  },
  {
    id: '3',
    projectName: 'GSA Building Modernization',
    client: 'General Services Administration',
    bidAmount: 14200000,
    submittedDate: '2023-12-01',
    dueDate: '2023-12-15',
    status: 'won',
    competitorCount: 6,
    winProbability: 100,
    notes: 'Lowest responsive bid',
    estimateId: '5',
  },
  {
    id: '4',
    projectName: 'Army Corps Office Renovation',
    client: 'US Army Corps of Engineers',
    bidAmount: 8500000,
    submittedDate: '2023-12-10',
    dueDate: '2023-12-20',
    status: 'won',
    competitorCount: 4,
    winProbability: 100,
    notes: 'Best value selection',
    estimateId: '6',
  },
  {
    id: '5',
    projectName: 'IRS Processing Center',
    client: 'Internal Revenue Service',
    bidAmount: 18000000,
    submittedDate: '2023-11-15',
    dueDate: '2023-11-30',
    status: 'lost',
    competitorCount: 7,
    winProbability: 0,
    notes: 'Lost on price - 5% higher than winner',
    estimateId: '7',
  },
  {
    id: '6',
    projectName: 'NASA Research Lab',
    client: 'NASA',
    bidAmount: 32000000,
    submittedDate: '',
    dueDate: '2024-03-01',
    status: 'no_bid',
    competitorCount: 0,
    winProbability: 0,
    notes: 'Decided not to bid - outside core competency',
    estimateId: '8',
  },
];

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  won: { label: 'Won', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle },
  no_bid: { label: 'No Bid', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function BidTracker() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBids = mockBids.filter((bid) => {
    const matchesSearch =
      bid.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingBids = mockBids.filter((b) => b.status === 'pending');
  const wonBids = mockBids.filter((b) => b.status === 'won');
  const lostBids = mockBids.filter((b) => b.status === 'lost');
  const noBids = mockBids.filter((b) => b.status === 'no_bid');

  const totalPendingValue = pendingBids.reduce((sum, b) => sum + b.bidAmount, 0);
  const totalWonValue = wonBids.reduce((sum, b) => sum + b.bidAmount, 0);
  const winRate = wonBids.length / (wonBids.length + lostBids.length) * 100 || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bid Tracker</h1>
          <p className="text-gray-600">Track bid submissions and outcomes</p>
        </div>
        <Link to="/preconstruction/estimates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Bid
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bids</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBids.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {formatCurrency(totalPendingValue)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won This Year</p>
                <p className="text-2xl font-bold text-green-600">{wonBids.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {formatCurrency(totalWonValue)} awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{winRate.toFixed(0)}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {wonBids.length} won / {wonBids.length + lostBids.length} decided
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lost / No Bid</p>
                <p className="text-2xl font-bold text-red-600">{lostBids.length + noBids.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {lostBids.length} lost, {noBids.length} no bid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search bids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="no_bid">No Bid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bid Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Bids ({mockBids.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingBids.length})</TabsTrigger>
          <TabsTrigger value="won">Won ({wonBids.length})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({lostBids.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {filteredBids.map((bid) => {
              const StatusIcon = statusConfig[bid.status].icon;
              const daysUntilDue = getDaysUntilDue(bid.dueDate);

              return (
                <Card key={bid.id} className="hover:border-purple-300 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{bid.projectName}</h3>
                          <Badge className={statusConfig[bid.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[bid.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {bid.client}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(bid.dueDate)}
                          </div>
                          {bid.status === 'pending' && daysUntilDue > 0 && (
                            <span className={daysUntilDue <= 7 ? 'text-orange-600 font-medium' : ''}>
                              {daysUntilDue} days left
                            </span>
                          )}
                        </div>
                        {bid.notes && (
                          <p className="mt-2 text-sm text-gray-500">{bid.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(bid.bidAmount)}
                        </p>
                        {bid.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <span className="text-sm text-gray-600">Win:</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  bid.winProbability >= 70
                                    ? 'bg-green-500'
                                    : bid.winProbability >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${bid.winProbability}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{bid.winProbability}%</span>
                          </div>
                        )}
                        <Link to={`/preconstruction/estimates/${bid.estimateId}`}>
                          <Button variant="ghost" size="sm" className="mt-2">
                            View Estimate
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingBids.map((bid) => {
              const daysUntilDue = getDaysUntilDue(bid.dueDate);
              return (
                <Card key={bid.id} className={daysUntilDue <= 7 ? 'border-orange-300 bg-orange-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{bid.projectName}</h3>
                        <p className="text-sm text-gray-600">{bid.client}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className={`h-4 w-4 ${daysUntilDue <= 7 ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span className={daysUntilDue <= 7 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            {daysUntilDue > 0 ? `${daysUntilDue} days until decision` : 'Decision overdue'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(bid.bidAmount)}</p>
                        <p className="text-sm text-gray-600">{bid.competitorCount} competitors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="won">
          <div className="space-y-4">
            {wonBids.map((bid) => (
              <Card key={bid.id} className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">{bid.projectName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{bid.client}</p>
                      <p className="text-sm text-green-700 mt-2">{bid.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-700">{formatCurrency(bid.bidAmount)}</p>
                      <p className="text-sm text-gray-600">Awarded {formatDate(bid.dueDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lost">
          <div className="space-y-4">
            {lostBids.map((bid) => (
              <Card key={bid.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-gray-900">{bid.projectName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{bid.client}</p>
                      <p className="text-sm text-red-600 mt-2">{bid.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-600">{formatCurrency(bid.bidAmount)}</p>
                      <p className="text-sm text-gray-500">Our bid amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
