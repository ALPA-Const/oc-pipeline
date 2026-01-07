import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  Download,
  ChevronDown,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types - matching your actual database schema
interface Pursuit {
  id: string;
  solicitation_number: string;
  title: string;
  agency: string;
  location_city: string;
  location_state: string;
  estimated_value: number;
  bid_due_date: string;  // Your DB uses bid_due_date
  stage: 'identified' | 'tracking' | 'go' | 'no_go' | 'bidding' | 'submitted' | 'won' | 'lost' | 'cancelled';  // Your DB uses stage
  set_aside_type: string;  // Your DB uses set_aside_type
  naics_code: string;
  win_probability: number;
  project_type: string;
  workspace_id: string;  // Your DB uses workspace_id
  created_at: string;
  updated_at: string;
}

interface PipelineMetrics {
  total_pursuits: number;
  total_value: number;
  weighted_value: number;
  avg_win_rate: number;
  due_this_week: number;
  due_this_month: number;
}

// Mock data - replace with actual API calls
const mockPursuits: Pursuit[] = [
  {
    id: '1',
    solicitation_number: 'VA-123-24-R-0045',
    title: 'Jesse Brown VA Medical Center - HVAC Modernization',
    agency: 'Department of Veterans Affairs',
    location_city: 'Chicago',
    location_state: 'IL',
    estimated_value: 12500000,
    bid_due_date: '2025-01-15T14:00:00Z',
    stage: 'go',
    set_aside_type: 'SDVOSB',
    naics_code: '236220',
    win_probability: 65,
    project_type: 'Healthcare',
    workspace_id: '1',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    id: '2',
    solicitation_number: 'GSA-PBS-24-R-0089',
    title: 'Kluczynski Federal Building - Elevator Modernization',
    agency: 'General Services Administration',
    location_city: 'Chicago',
    location_state: 'IL',
    estimated_value: 8200000,
    bid_due_date: '2025-01-08T16:00:00Z',
    stage: 'tracking',
    set_aside_type: '8(a)',
    naics_code: '238290',
    win_probability: 45,
    project_type: 'Federal Office',
    workspace_id: '1',
    created_at: '2024-11-15T00:00:00Z',
    updated_at: '2024-12-12T00:00:00Z',
  },
  {
    id: '3',
    solicitation_number: 'USACE-LRC-24-R-0112',
    title: 'Great Lakes Naval Station - Barracks Renovation Phase II',
    agency: 'US Army Corps of Engineers',
    location_city: 'Great Lakes',
    location_state: 'IL',
    estimated_value: 24800000,
    bid_due_date: '2025-02-01T14:00:00Z',
    stage: 'identified',
    set_aside_type: 'SDVOSB',
    naics_code: '236220',
    win_probability: 0,
    project_type: 'Military',
    workspace_id: '1',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-14T00:00:00Z',
  },
  {
    id: '4',
    solicitation_number: 'VA-688-24-R-0023',
    title: 'Hines VA Hospital - Emergency Room Expansion',
    agency: 'Department of Veterans Affairs',
    location_city: 'Hines',
    location_state: 'IL',
    estimated_value: 18500000,
    bid_due_date: '2024-12-20T14:00:00Z',
    stage: 'submitted',
    set_aside_type: 'SDVOSB',
    naics_code: '236220',
    win_probability: 72,
    project_type: 'Healthcare',
    workspace_id: '1',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-12-16T00:00:00Z',
  },
  {
    id: '5',
    solicitation_number: 'GSA-PBS-24-R-0056',
    title: 'Metcalfe Federal Building - Security Upgrades',
    agency: 'General Services Administration',
    location_city: 'Chicago',
    location_state: 'IL',
    estimated_value: 4200000,
    bid_due_date: '2024-11-30T16:00:00Z',
    stage: 'won',
    set_aside_type: '8(a)',
    naics_code: '561621',
    win_probability: 100,
    project_type: 'Federal Office',
    workspace_id: '1',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
];

const mockMetrics: PipelineMetrics = {
  total_pursuits: 12,
  total_value: 89500000,
  weighted_value: 42750000,
  avg_win_rate: 48,
  due_this_week: 2,
  due_this_month: 5,
};

// Stage configuration - matching your database values
const stageConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  identified: { label: 'Identified', color: 'bg-slate-100 text-slate-700', icon: <AlertCircle className="w-3 h-3" /> },
  tracking: { label: 'Tracking', color: 'bg-blue-100 text-blue-700', icon: <Search className="w-3 h-3" /> },
  go: { label: 'Go', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  no_go: { label: 'No-Go', color: 'bg-slate-100 text-slate-500', icon: <XCircle className="w-3 h-3" /> },
  bidding: { label: 'Bidding', color: 'bg-amber-100 text-amber-700', icon: <FileText className="w-3 h-3" /> },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: <FileText className="w-3 h-3" /> },
  won: { label: 'Won', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="w-3 h-3" /> },
};

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const calculateDaysUntilDue = (bidDueDate: string): number => {
  const now = new Date();
  const due = new Date(bidDueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getDaysUntilDueColor = (days: number): string => {
  if (days < 0) return 'text-slate-400';
  if (days <= 7) return 'text-red-600 font-medium';
  if (days <= 14) return 'text-amber-600';
  return 'text-slate-600';
};

export default function Pursuits() {
  const navigate = useNavigate();
  const [pursuits, setPursuits] = useState<Pursuit[]>(mockPursuits);
  const [metrics, setMetrics] = useState<PipelineMetrics>(mockMetrics);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isGoNoGoOpen, setIsGoNoGoOpen] = useState(false);
  const [selectedPursuit, setSelectedPursuit] = useState<Pursuit | null>(null);

  // Filter pursuits based on search and filters
  const filteredPursuits = pursuits.filter((pursuit) => {
    const matchesSearch =
      pursuit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pursuit.solicitation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pursuit.agency.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'all' || pursuit.stage === stageFilter;
    const matchesAgency = agencyFilter === 'all' || pursuit.agency === agencyFilter;

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && ['identified', 'tracking', 'go', 'bidding', 'submitted'].includes(pursuit.stage)) ||
      (activeTab === 'won' && pursuit.stage === 'won') ||
      (activeTab === 'lost' && pursuit.stage === 'lost');

    return matchesSearch && matchesStage && matchesAgency && matchesTab;
  });

  // Get unique agencies for filter
  const uniqueAgencies = [...new Set(pursuits.map((p) => p.agency))];

  const handleGoNoGoDecision = (decision: 'go' | 'no_go') => {
    if (selectedPursuit) {
      setPursuits(
        pursuits.map((p) =>
          p.id === selectedPursuit.id
            ? { ...p, stage: decision }
            : p
        )
      );
      setIsGoNoGoOpen(false);
      setSelectedPursuit(null);
    }
  };

  const openGoNoGoModal = (pursuit: Pursuit) => {
    setSelectedPursuit(pursuit);
    setIsGoNoGoOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Target className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pursuits</h1>
            <p className="text-sm text-gray-500">Track and manage federal contracting opportunities</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Pursuit
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active Pursuits</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.total_pursuits}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.total_value)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Weighted Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.weighted_value)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.avg_win_rate}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Due This Week</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{metrics.due_this_week}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Due This Month</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.due_this_month}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title, solicitation number, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="tracking">Tracking</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="no_go">No-Go</SelectItem>
                <SelectItem value="bidding">Bidding</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="All Agencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {uniqueAgencies.map((agency) => (
                  <SelectItem key={agency} value={agency}>
                    {agency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="all">All ({pursuits.length})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({pursuits.filter((p) => ['identified', 'tracking', 'go', 'bidding', 'submitted'].includes(p.stage)).length})
              </TabsTrigger>
              <TabsTrigger value="won">Won ({pursuits.filter((p) => p.stage === 'won').length})</TabsTrigger>
              <TabsTrigger value="lost">Lost ({pursuits.filter((p) => p.stage === 'lost').length})</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[300px]">Opportunity</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Bid Due Date</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Win Prob</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPursuits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No pursuits found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPursuits.map((pursuit) => {
                      const daysUntilDue = calculateDaysUntilDue(pursuit.bid_due_date);
                      return (
                        <TableRow
                          key={pursuit.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/pursuits/${pursuit.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{pursuit.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{pursuit.solicitation_number}</span>
                                <Badge variant="outline" className="text-xs">
                                  {pursuit.set_aside_type}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{pursuit.agency}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {pursuit.location_city}, {pursuit.location_state}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(pursuit.estimated_value)}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{formatDate(pursuit.bid_due_date)}</p>
                              <p className={`text-xs ${getDaysUntilDueColor(daysUntilDue)}`}>
                                {daysUntilDue < 0
                                  ? `${Math.abs(daysUntilDue)} days ago`
                                  : daysUntilDue === 0
                                  ? 'Due today'
                                  : `${daysUntilDue} days left`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stageConfig[pursuit.stage]?.color || 'bg-gray-100 text-gray-700'} gap-1`}>
                              {stageConfig[pursuit.stage]?.icon}
                              {stageConfig[pursuit.stage]?.label || pursuit.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pursuit.win_probability > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      pursuit.win_probability >= 70
                                        ? 'bg-green-500'
                                        : pursuit.win_probability >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${pursuit.win_probability}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{pursuit.win_probability}%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/pursuits/${pursuit.id}`); }}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {pursuit.stage === 'tracking' && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openGoNoGoModal(pursuit); }}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Go/No-Go Decision
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  View on SAM.gov
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Tabs>
      </Card>

      {/* Go/No-Go Decision Modal */}
      <Dialog open={isGoNoGoOpen} onOpenChange={setIsGoNoGoOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Go/No-Go Decision</DialogTitle>
            <DialogDescription>
              Make a pursuit decision for this opportunity
            </DialogDescription>
          </DialogHeader>
          {selectedPursuit && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{selectedPursuit.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{selectedPursuit.solicitation_number}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="font-medium">{formatCurrency(selectedPursuit.estimated_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="font-medium">{formatDate(selectedPursuit.bid_due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Set-Aside</p>
                    <p className="font-medium">{selectedPursuit.set_aside_type}</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Consider these factors:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Resource availability and capacity</li>
                  <li>Competition and win probability</li>
                  <li>Strategic alignment with company goals</li>
                  <li>Technical capabilities and past performance</li>
                  <li>Profit margin and risk assessment</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsGoNoGoOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGoNoGoDecision('no_go')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              No-Go
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleGoNoGoDecision('go')}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
