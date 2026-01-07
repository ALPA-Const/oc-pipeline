// ============================================================
// OC PIPELINE - PRECONSTRUCTION & ESTIMATING MODULE
// Full-featured module with Pursuits, Estimates, Bid Packages
// ============================================================

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Bot,
} from 'lucide-react';
import { AITakeoffTab } from '@/components/ai-takeoff';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { estimatingService } from '@/services/estimating.service';
import type { 
  Pursuit, 
  Estimate, 
  BidPackage, 
  EstimatingSummary,
  CSI_DIVISIONS,
} from '@/types/estimating.types';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-800',
    in_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    issued: 'bg-blue-100 text-blue-800',
    bidding: 'bg-purple-100 text-purple-800',
    evaluation: 'bg-orange-100 text-orange-800',
    awarded: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};


// ============================================================
// SUMMARY CARDS COMPONENT
// ============================================================

function SummaryCards({ summary }: { summary: EstimatingSummary | null }) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Active Pursuits',
      value: summary.activePursuits,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(summary.totalPipelineValue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Win Rate',
      value: `${summary.winRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Upcoming Deadlines',
      value: summary.upcomingDeadlines,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


// ============================================================
// PURSUITS TAB COMPONENT
// ============================================================

function PursuitsTab({ 
  pursuits, 
  loading, 
  onRefresh 
}: { 
  pursuits: Pursuit[]; 
  loading: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPursuit, setNewPursuit] = useState({
    name: '',
    clientName: '',
    estimatedValue: '',
    dueDate: '',
    priority: 'medium',
    setAsideType: '',
  });

  const filteredPursuits = pursuits.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    try {
      await estimatingService.createPursuit({
        name: newPursuit.name,
        clientName: newPursuit.clientName,
        estimatedValue: newPursuit.estimatedValue ? parseFloat(newPursuit.estimatedValue) : undefined,
        dueDate: newPursuit.dueDate || undefined,
        priority: newPursuit.priority as any,
        setAsideType: newPursuit.setAsideType || undefined,
      });
      setShowCreateDialog(false);
      setNewPursuit({ name: '', clientName: '', estimatedValue: '', dueDate: '', priority: 'medium', setAsideType: '' });
      onRefresh();
    } catch (error) {
      console.error('Error creating pursuit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pursuit?')) {
      try {
        await estimatingService.deletePursuit(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting pursuit:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search pursuits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Pursuit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Pursuit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={newPursuit.name}
                  onChange={(e) => setNewPursuit({ ...newPursuit, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label>Client / Agency</Label>
                <Input
                  value={newPursuit.clientName}
                  onChange={(e) => setNewPursuit({ ...newPursuit, clientName: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label>Estimated Value ($)</Label>
                <Input
                  type="number"
                  value={newPursuit.estimatedValue}
                  onChange={(e) => setNewPursuit({ ...newPursuit, estimatedValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newPursuit.dueDate}
                  onChange={(e) => setNewPursuit({ ...newPursuit, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newPursuit.priority}
                  onValueChange={(v) => setNewPursuit({ ...newPursuit, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Set-Aside Type</Label>
                <Select
                  value={newPursuit.setAsideType}
                  onValueChange={(v) => setNewPursuit({ ...newPursuit, setAsideType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select set-aside" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8a">8(a)</SelectItem>
                    <SelectItem value="SDVOSB">SDVOSB</SelectItem>
                    <SelectItem value="HUBZone">HUBZone</SelectItem>
                    <SelectItem value="WOSB">WOSB</SelectItem>
                    <SelectItem value="small_business">Small Business</SelectItem>
                    <SelectItem value="full_open">Full & Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newPursuit.name}>
                Create Pursuit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Est. Value</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Loading pursuits...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPursuits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {search ? 'No pursuits match your search' : 'No pursuits yet. Create one to get started!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPursuits.map((pursuit) => (
                  <TableRow key={pursuit.id}>
                    <TableCell className="font-medium">{pursuit.name}</TableCell>
                    <TableCell>{pursuit.clientName || pursuit.clientAgency || '-'}</TableCell>
                    <TableCell>{formatCurrency(pursuit.estimatedValue)}</TableCell>
                    <TableCell>{formatDate(pursuit.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(pursuit.priority)}>
                        {pursuit.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pursuit.status)}>
                        {pursuit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(pursuit.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


// ============================================================
// ESTIMATES TAB COMPONENT
// ============================================================

function EstimatesTab({ 
  estimates, 
  loading,
  onRefresh,
}: { 
  estimates: Estimate[]; 
  loading: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEstimate, setNewEstimate] = useState({
    name: '',
    description: '',
    overheadPercent: '10',
    profitPercent: '10',
    contingencyPercent: '5',
  });

  const filteredEstimates = estimates.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await estimatingService.createEstimate({
        name: newEstimate.name,
        description: newEstimate.description,
        overheadPercent: parseFloat(newEstimate.overheadPercent) || 0,
        profitPercent: parseFloat(newEstimate.profitPercent) || 0,
        contingencyPercent: parseFloat(newEstimate.contingencyPercent) || 0,
      });
      setShowCreateDialog(false);
      setNewEstimate({ name: '', description: '', overheadPercent: '10', profitPercent: '10', contingencyPercent: '5' });
      onRefresh();
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      try {
        await estimatingService.deleteEstimate(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting estimate:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search estimates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Estimate Name *</Label>
                <Input
                  value={newEstimate.name}
                  onChange={(e) => setNewEstimate({ ...newEstimate, name: e.target.value })}
                  placeholder="Enter estimate name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newEstimate.description}
                  onChange={(e) => setNewEstimate({ ...newEstimate, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Overhead %</Label>
                  <Input
                    type="number"
                    value={newEstimate.overheadPercent}
                    onChange={(e) => setNewEstimate({ ...newEstimate, overheadPercent: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Profit %</Label>
                  <Input
                    type="number"
                    value={newEstimate.profitPercent}
                    onChange={(e) => setNewEstimate({ ...newEstimate, profitPercent: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contingency %</Label>
                  <Input
                    type="number"
                    value={newEstimate.contingencyPercent}
                    onChange={(e) => setNewEstimate({ ...newEstimate, contingencyPercent: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newEstimate.name}>
                Create Estimate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Loading estimates...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEstimates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {search ? 'No estimates match your search' : 'No estimates yet. Create one to get started!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEstimates.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell className="font-medium">{estimate.name}</TableCell>
                    <TableCell>v{estimate.version}</TableCell>
                    <TableCell>{formatCurrency(estimate.subtotal)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(estimate.total)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(estimate.status)}>
                        {estimate.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(estimate.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(estimate.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


// ============================================================
// BID PACKAGES TAB COMPONENT
// ============================================================

function BidPackagesTab({ 
  bidPackages, 
  loading,
  onRefresh,
}: { 
  bidPackages: BidPackage[]; 
  loading: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBidPackage, setNewBidPackage] = useState({
    name: '',
    trade: '',
    csiDivision: '',
    budgetAmount: '',
    dueDate: '',
  });

  const filteredBidPackages = bidPackages.filter(bp => 
    bp.name.toLowerCase().includes(search.toLowerCase()) ||
    (bp.trade && bp.trade.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    try {
      await estimatingService.createBidPackage({
        name: newBidPackage.name,
        trade: newBidPackage.trade || undefined,
        csiDivision: newBidPackage.csiDivision || undefined,
        budgetAmount: newBidPackage.budgetAmount ? parseFloat(newBidPackage.budgetAmount) : undefined,
        dueDate: newBidPackage.dueDate || undefined,
      });
      setShowCreateDialog(false);
      setNewBidPackage({ name: '', trade: '', csiDivision: '', budgetAmount: '', dueDate: '' });
      onRefresh();
    } catch (error) {
      console.error('Error creating bid package:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bid package?')) {
      try {
        await estimatingService.deleteBidPackage(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting bid package:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search bid packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bid Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Bid Package</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Package Name *</Label>
                <Input
                  value={newBidPackage.name}
                  onChange={(e) => setNewBidPackage({ ...newBidPackage, name: e.target.value })}
                  placeholder="e.g., BP-01 Concrete"
                />
              </div>
              <div>
                <Label>Trade</Label>
                <Input
                  value={newBidPackage.trade}
                  onChange={(e) => setNewBidPackage({ ...newBidPackage, trade: e.target.value })}
                  placeholder="e.g., Concrete, Electrical"
                />
              </div>
              <div>
                <Label>CSI Division</Label>
                <Select
                  value={newBidPackage.csiDivision}
                  onValueChange={(v) => setNewBidPackage({ ...newBidPackage, csiDivision: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CSI Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="03">03 - Concrete</SelectItem>
                    <SelectItem value="04">04 - Masonry</SelectItem>
                    <SelectItem value="05">05 - Metals</SelectItem>
                    <SelectItem value="06">06 - Wood & Plastics</SelectItem>
                    <SelectItem value="07">07 - Thermal & Moisture</SelectItem>
                    <SelectItem value="08">08 - Openings</SelectItem>
                    <SelectItem value="09">09 - Finishes</SelectItem>
                    <SelectItem value="22">22 - Plumbing</SelectItem>
                    <SelectItem value="23">23 - HVAC</SelectItem>
                    <SelectItem value="26">26 - Electrical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Amount ($)</Label>
                <Input
                  type="number"
                  value={newBidPackage.budgetAmount}
                  onChange={(e) => setNewBidPackage({ ...newBidPackage, budgetAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newBidPackage.dueDate}
                  onChange={(e) => setNewBidPackage({ ...newBidPackage, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newBidPackage.name}>
                Create Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>CSI Div</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Loading bid packages...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBidPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {search ? 'No bid packages match your search' : 'No bid packages yet. Create one to get started!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBidPackages.map((bp) => (
                  <TableRow key={bp.id}>
                    <TableCell className="font-medium">{bp.name}</TableCell>
                    <TableCell>{bp.trade || '-'}</TableCell>
                    <TableCell>{bp.csiDivision || '-'}</TableCell>
                    <TableCell>{formatCurrency(bp.budgetAmount)}</TableCell>
                    <TableCell>{formatDate(bp.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bp.status)}>
                        {bp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(bp.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


// ============================================================
// MAIN PRECONSTRUCTION COMPONENT
// ============================================================

export default function Preconstruction() {
  const [activeTab, setActiveTab] = useState('pursuits');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EstimatingSummary | null>(null);
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [bidPackages, setBidPackages] = useState<BidPackage[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, pursuitsData, estimatesData, bidPackagesData] = await Promise.all([
        estimatingService.getEstimatingSummary(),
        estimatingService.fetchPursuits(),
        estimatingService.fetchEstimates(),
        estimatingService.fetchBidPackages(),
      ]);
      setSummary(summaryData);
      setPursuits(pursuitsData);
      setEstimates(estimatesData);
      setBidPackages(bidPackagesData);
    } catch (error) {
      console.error('Error loading estimating data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BarChart3 className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Preconstruction & Estimating</h1>
          <p className="text-gray-500">Manage pursuits, estimates, and bid packages</p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pursuits" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Pursuits
            {pursuits.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pursuits.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="estimates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Estimates
            {estimates.length > 0 && (
              <Badge variant="secondary" className="ml-1">{estimates.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bid-packages" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Bid Packages
            {bidPackages.length > 0 && (
              <Badge variant="secondary" className="ml-1">{bidPackages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai-takeoff" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Takeoff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pursuits">
          <PursuitsTab 
            pursuits={pursuits} 
            loading={loading} 
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="estimates">
          <EstimatesTab 
            estimates={estimates} 
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="bid-packages">
          <BidPackagesTab 
            bidPackages={bidPackages} 
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="ai-takeoff">
          <AITakeoffTab onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
