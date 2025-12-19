/**
 * Estimates List Page
 * Displays all estimates with filtering, sorting, and actions
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  ArrowUpDown,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface Estimate {
  id: string;
  estimateNumber: string;
  projectName: string;
  client: string;
  status: 'draft' | 'in_review' | 'submitted' | 'won' | 'lost';
  estimatedValue: number;
  dueDate: string;
  estimator: string;
  createdAt: string;
  updatedAt: string;
  winProbability: number;
}

const mockEstimates: Estimate[] = [
  {
    id: '1',
    estimateNumber: 'EST-2024-001',
    projectName: 'VA Medical Center Renovation',
    client: 'Department of Veterans Affairs',
    status: 'in_review',
    estimatedValue: 12500000,
    dueDate: '2024-02-15',
    estimator: 'Sarah Johnson',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-28',
    winProbability: 65,
  },
  {
    id: '2',
    estimateNumber: 'EST-2024-002',
    projectName: 'Federal Courthouse Addition',
    client: 'General Services Administration',
    status: 'draft',
    estimatedValue: 8700000,
    dueDate: '2024-02-28',
    estimator: 'Mike Chen',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-25',
    winProbability: 45,
  },
  {
    id: '3',
    estimateNumber: 'EST-2024-003',
    projectName: 'DOD Facility Upgrade',
    client: 'Department of Defense',
    status: 'submitted',
    estimatedValue: 24000000,
    dueDate: '2024-01-30',
    estimator: 'Lisa Anderson',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-22',
    winProbability: 70,
  },
  {
    id: '4',
    estimateNumber: 'EST-2024-004',
    projectName: 'Hospital Wing Expansion',
    client: 'Regional Healthcare System',
    status: 'in_review',
    estimatedValue: 18500000,
    dueDate: '2024-03-10',
    estimator: 'Sarah Johnson',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-27',
    winProbability: 55,
  },
  {
    id: '5',
    estimateNumber: 'EST-2023-089',
    projectName: 'GSA Building Modernization',
    client: 'General Services Administration',
    status: 'won',
    estimatedValue: 14200000,
    dueDate: '2023-12-15',
    estimator: 'Mike Chen',
    createdAt: '2023-11-01',
    updatedAt: '2024-01-10',
    winProbability: 100,
  },
  {
    id: '6',
    estimateNumber: 'EST-2023-090',
    projectName: 'Army Corps Office Renovation',
    client: 'US Army Corps of Engineers',
    status: 'won',
    estimatedValue: 8500000,
    dueDate: '2023-12-20',
    estimator: 'Lisa Anderson',
    createdAt: '2023-11-15',
    updatedAt: '2024-01-05',
    winProbability: 100,
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EstimatesList() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<Estimate[]>(mockEstimates);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter estimates based on search and status
  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEstimates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEstimates.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDuplicate = (id: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate estimate:', id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    setEstimates(estimates.filter((e) => e.id !== id));
  };

  const handleExport = (id: string) => {
    // TODO: Implement export functionality
    console.log('Export estimate:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600">Manage all project estimates</p>
        </div>
        <Link to="/preconstruction/estimates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search estimates..."
                className="pl-10"
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-800">
                {selectedIds.size} estimate{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredEstimates.length > 0 &&
                      selectedIds.size === filteredEstimates.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Estimate #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Value
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Due Date
                  </div>
                </TableHead>
                <TableHead>Estimator</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-gray-600">Loading estimates...</p>
                  </TableCell>
                </TableRow>
              ) : filteredEstimates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <p className="text-gray-600">No estimates found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEstimates.map((estimate) => (
                  <TableRow key={estimate.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(estimate.id)}
                        onCheckedChange={() => toggleSelect(estimate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/preconstruction/estimates/${estimate.id}`}
                        className="font-medium text-purple-600 hover:text-purple-800"
                      >
                        {estimate.estimateNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {estimate.projectName}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {estimate.client}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[estimate.status].color}>
                        {statusConfig[estimate.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(estimate.estimatedValue)}
                    </TableCell>
                    <TableCell>{formatDate(estimate.dueDate)}</TableCell>
                    <TableCell>{estimate.estimator}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              estimate.winProbability >= 70
                                ? 'bg-green-500'
                                : estimate.winProbability >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${estimate.winProbability}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {estimate.winProbability}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/preconstruction/estimates/${estimate.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/preconstruction/estimates/${estimate.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(estimate.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(estimate.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(estimate.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredEstimates.length} of {estimates.length} estimates
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
