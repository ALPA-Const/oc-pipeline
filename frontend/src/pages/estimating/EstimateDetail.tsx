/**
 * Estimate Detail Page
 * View and manage a single estimate
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  Copy,
  Trash2,
  Clock,
  DollarSign,
  User,
  Building,
  Calendar,
  FileText,
  Calculator,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CostLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface EstimateDetail {
  id: string;
  estimateNumber: string;
  projectName: string;
  client: string;
  status: 'draft' | 'in_review' | 'submitted' | 'won' | 'lost';
  estimatedValue: number;
  dueDate: string;
  estimator: string;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
  winProbability: number;
  description: string;
  scope: string;
  notes: string;
  lineItems: CostLineItem[];
}

const mockEstimate: EstimateDetail = {
  id: '1',
  estimateNumber: 'EST-2024-001',
  projectName: 'VA Medical Center Renovation',
  client: 'Department of Veterans Affairs',
  status: 'in_review',
  estimatedValue: 12500000,
  dueDate: '2024-02-15',
  estimator: 'Sarah Johnson',
  reviewer: 'Mike Chen',
  createdAt: '2024-01-10',
  updatedAt: '2024-01-28',
  winProbability: 65,
  description:
    'Complete renovation of the existing VA Medical Center facility including HVAC upgrades, electrical systems, and patient room modernization.',
  scope:
    'Phase 1: Demolition and site prep. Phase 2: Structural modifications. Phase 3: MEP installation. Phase 4: Finishes and equipment.',
  notes:
    'Client has indicated preference for local subcontractors. Consider SDVOSB requirements for compliance.',
  lineItems: [
    {
      id: '1',
      category: 'General Conditions',
      description: 'Project management and supervision',
      quantity: 1,
      unit: 'LS',
      unitCost: 850000,
      totalCost: 850000,
    },
    {
      id: '2',
      category: 'Demolition',
      description: 'Selective demolition of existing interior',
      quantity: 45000,
      unit: 'SF',
      unitCost: 12,
      totalCost: 540000,
    },
    {
      id: '3',
      category: 'Concrete',
      description: 'Foundation repairs and new slabs',
      quantity: 8500,
      unit: 'SF',
      unitCost: 85,
      totalCost: 722500,
    },
    {
      id: '4',
      category: 'Structural Steel',
      description: 'Steel framing and reinforcement',
      quantity: 120,
      unit: 'TONS',
      unitCost: 4500,
      totalCost: 540000,
    },
    {
      id: '5',
      category: 'HVAC',
      description: 'Complete HVAC system replacement',
      quantity: 1,
      unit: 'LS',
      unitCost: 2800000,
      totalCost: 2800000,
    },
    {
      id: '6',
      category: 'Electrical',
      description: 'Electrical distribution and lighting',
      quantity: 1,
      unit: 'LS',
      unitCost: 2200000,
      totalCost: 2200000,
    },
    {
      id: '7',
      category: 'Plumbing',
      description: 'Medical gas and plumbing systems',
      quantity: 1,
      unit: 'LS',
      unitCost: 1600000,
      totalCost: 1600000,
    },
    {
      id: '8',
      category: 'Interior Finishes',
      description: 'Flooring, walls, and ceilings',
      quantity: 45000,
      unit: 'SF',
      unitCost: 45,
      totalCost: 2025000,
    },
    {
      id: '9',
      category: 'Contingency',
      description: 'Project contingency (10%)',
      quantity: 1,
      unit: 'LS',
      unitCost: 1222500,
      totalCost: 1222500,
    },
  ],
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700' },
  won: { label: 'Won', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEstimate(mockEstimate);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Estimate not found</p>
        <Link to="/preconstruction/estimates">
          <Button variant="link" className="mt-4">
            Back to Estimates
          </Button>
        </Link>
      </div>
    );
  }

  const totalCost = estimate.lineItems.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/preconstruction/estimates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {estimate.estimateNumber}
              </h1>
              <Badge className={statusConfig[estimate.status].color}>
                {statusConfig[estimate.status].label}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{estimate.projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/preconstruction/estimates/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-xl font-bold">{formatDate(estimate.dueDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimator</p>
                <p className="text-xl font-bold">{estimate.estimator}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Probability</p>
                <p className="text-xl font-bold">{estimate.winProbability}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{estimate.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800">{estimate.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scope</p>
                  <p className="text-gray-800">{estimate.scope}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estimate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(estimate.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(estimate.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimator</p>
                    <p className="font-medium">{estimate.estimator}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reviewer</p>
                    <p className="font-medium">{estimate.reviewer}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-gray-800">{estimate.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost-breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={5}>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Estimate updated</p>
                    <p className="text-sm text-gray-600">
                      Sarah Johnson updated cost breakdown • Jan 28, 2024
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Status changed to In Review</p>
                    <p className="text-sm text-gray-600">
                      Mike Chen moved to review • Jan 25, 2024
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Estimate created</p>
                    <p className="text-sm text-gray-600">
                      Sarah Johnson created estimate • Jan 10, 2024
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Project Specifications.pdf</p>
                      <p className="text-sm text-gray-600">2.4 MB • Uploaded Jan 12, 2024</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Architectural Drawings.dwg</p>
                      <p className="text-sm text-gray-600">15.8 MB • Uploaded Jan 11, 2024</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">RFP Document.pdf</p>
                      <p className="text-sm text-gray-600">850 KB • Uploaded Jan 10, 2024</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
