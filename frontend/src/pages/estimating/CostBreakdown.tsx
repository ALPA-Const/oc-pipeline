/**
 * Cost Breakdown Page
 * Analyze and compare project costs across estimates
 */

import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Filter,
  Download,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CostCategory {
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentOfTotal: number;
}

interface ProjectCost {
  id: string;
  name: string;
  totalBudget: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  overhead: number;
  contingency: number;
}

const mockCategories: CostCategory[] = [
  { name: 'General Conditions', budgeted: 850000, actual: 820000, variance: -30000, percentOfTotal: 6.8 },
  { name: 'Demolition', budgeted: 540000, actual: 565000, variance: 25000, percentOfTotal: 4.3 },
  { name: 'Concrete', budgeted: 722500, actual: 710000, variance: -12500, percentOfTotal: 5.8 },
  { name: 'Structural Steel', budgeted: 540000, actual: 540000, variance: 0, percentOfTotal: 4.3 },
  { name: 'HVAC', budgeted: 2800000, actual: 2750000, variance: -50000, percentOfTotal: 22.4 },
  { name: 'Electrical', budgeted: 2200000, actual: 2280000, variance: 80000, percentOfTotal: 17.6 },
  { name: 'Plumbing', budgeted: 1600000, actual: 1580000, variance: -20000, percentOfTotal: 12.8 },
  { name: 'Interior Finishes', budgeted: 2025000, actual: 2100000, variance: 75000, percentOfTotal: 16.2 },
  { name: 'Contingency', budgeted: 1222500, actual: 0, variance: -1222500, percentOfTotal: 9.8 },
];

const mockProjects: ProjectCost[] = [
  {
    id: '1',
    name: 'VA Medical Center Renovation',
    totalBudget: 12500000,
    laborCost: 4375000,
    materialCost: 3750000,
    equipmentCost: 1250000,
    subcontractorCost: 2000000,
    overhead: 625000,
    contingency: 500000,
  },
  {
    id: '2',
    name: 'Federal Courthouse Addition',
    totalBudget: 8700000,
    laborCost: 3045000,
    materialCost: 2610000,
    equipmentCost: 870000,
    subcontractorCost: 1392000,
    overhead: 435000,
    contingency: 348000,
  },
  {
    id: '3',
    name: 'DOD Facility Upgrade',
    totalBudget: 24000000,
    laborCost: 8400000,
    materialCost: 7200000,
    equipmentCost: 2400000,
    subcontractorCost: 3840000,
    overhead: 1200000,
    contingency: 960000,
  },
];

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CostBreakdown() {
  const [selectedProject, setSelectedProject] = useState<string>('1');
  const [viewMode, setViewMode] = useState<'category' | 'comparison'>('category');

  const totalBudgeted = mockCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalActual = mockCategories.reduce((sum, cat) => sum + cat.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Breakdown</h1>
          <p className="text-gray-600">Analyze project costs and compare estimates</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'category' | 'comparison')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="comparison">Project Comparison</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeted)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actual Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                </p>
              </div>
              <div className={`p-3 ${totalVariance >= 0 ? 'bg-red-100' : 'bg-green-100'} rounded-full`}>
                <TrendingUp className={`h-6 w-6 ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((totalBudgeted / totalActual) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'category' ? (
        <>
          {/* Project Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cost by Category Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCategories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        {formatFullCurrency(category.budgeted)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFullCurrency(category.actual)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          category.variance > 0 ? 'text-red-600' : category.variance < 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {category.variance >= 0 ? '+' : ''}
                        {formatFullCurrency(category.variance)}
                      </TableCell>
                      <TableCell className="text-right">{category.percentOfTotal}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                category.actual > category.budgeted
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (category.actual / category.budgeted) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-12">
                            {((category.actual / category.budgeted) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatFullCurrency(totalBudgeted)}</TableCell>
                    <TableCell className="text-right">{formatFullCurrency(totalActual)}</TableCell>
                    <TableCell
                      className={`text-right ${
                        totalVariance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {totalVariance >= 0 ? '+' : ''}
                      {formatFullCurrency(totalVariance)}
                    </TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategories.slice(0, 5).map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-gray-600">{category.percentOfTotal}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${category.percentOfTotal}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategories.slice(0, 5).map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span
                          className={
                            category.variance > 0 ? 'text-red-600' : 'text-green-600'
                          }
                        >
                          {category.variance >= 0 ? '+' : ''}
                          {formatCurrency(category.variance)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div
                          className="bg-blue-500 rounded-l"
                          style={{
                            width: `${(category.budgeted / totalBudgeted) * 100}%`,
                          }}
                        />
                        <div
                          className={`${
                            category.actual > category.budgeted
                              ? 'bg-red-400'
                              : 'bg-green-400'
                          } rounded-r`}
                          style={{
                            width: `${Math.abs(
                              ((category.actual - category.budgeted) / totalBudgeted) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span>Over Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    <span>Under Budget</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Project Comparison View */
        <Card>
          <CardHeader>
            <CardTitle>Project Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Total Budget</TableHead>
                  <TableHead className="text-right">Labor (35%)</TableHead>
                  <TableHead className="text-right">Materials (30%)</TableHead>
                  <TableHead className="text-right">Equipment (10%)</TableHead>
                  <TableHead className="text-right">Subcontractors (16%)</TableHead>
                  <TableHead className="text-right">Overhead (5%)</TableHead>
                  <TableHead className="text-right">Contingency (4%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(project.totalBudget)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.laborCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.materialCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.equipmentCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.subcontractorCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.overhead)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.contingency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
