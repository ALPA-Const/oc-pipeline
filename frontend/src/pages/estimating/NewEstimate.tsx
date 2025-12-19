/**
 * New Estimate Page
 * Form for creating a new estimate
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calculator,
  FileText,
  Building,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface LineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

const costCategories = [
  'General Conditions',
  'Site Work',
  'Demolition',
  'Concrete',
  'Masonry',
  'Structural Steel',
  'Carpentry',
  'Roofing',
  'HVAC',
  'Electrical',
  'Plumbing',
  'Fire Protection',
  'Interior Finishes',
  'Equipment',
  'Contingency',
  'Other',
];

const units = ['LS', 'SF', 'LF', 'CY', 'EA', 'TONS', 'HR', 'DAY', 'MO'];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export default function NewEstimate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    client: '',
    dueDate: '',
    estimator: '',
    description: '',
    scope: '',
    notes: '',
    winProbability: 50,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: generateId(),
      category: 'General Conditions',
      description: '',
      quantity: 1,
      unit: 'LS',
      unitCost: 0,
    },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: generateId(),
        category: 'General Conditions',
        description: '',
        quantity: 1,
        unit: 'LS',
        unitCost: 0,
      },
    ]);
  };

  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'in_review') => {
    e.preventDefault();
    setSaving(true);

    // TODO: Implement API call
    const estimateData = {
      ...formData,
      status,
      lineItems,
      totalValue: calculateTotal(),
    };

    console.log('Saving estimate:', estimateData);

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      navigate('/preconstruction/estimates');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">New Estimate</h1>
            <p className="text-gray-600">Create a new cost estimate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button onClick={(e) => handleSubmit(e, 'in_review')} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save & Submit for Review'}
          </Button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Input
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimator">Estimator</Label>
                <Select
                  value={formData.estimator}
                  onValueChange={(value) => handleSelectChange('estimator', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select estimator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="mike-chen">Mike Chen</SelectItem>
                    <SelectItem value="lisa-anderson">Lisa Anderson</SelectItem>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the project..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Scope of Work</Label>
              <Textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleInputChange}
                placeholder="Define the scope of work..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[150px]">Unit Cost</TableHead>
                  <TableHead className="w-[150px] text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.category}
                        onValueChange={(value) =>
                          updateLineItem(item.id, 'category', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {costCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, 'description', e.target.value)
                        }
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.unit}
                        onValueChange={(value) =>
                          updateLineItem(item.id, 'unit', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            'unitCost',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        placeholder="$0"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.quantity * item.unitCost)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={5}>Total Estimated Cost</TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(calculateTotal())}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="winProbability">Win Probability (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="winProbability"
                  name="winProbability"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.winProbability}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <span className="text-lg font-medium w-16 text-right">
                  {formData.winProbability}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons (Mobile) */}
        <div className="flex items-center justify-end gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'in_review')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save & Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
