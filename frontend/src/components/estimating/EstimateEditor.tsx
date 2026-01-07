// ============================================================
// OC PIPELINE - ESTIMATE EDITOR
// Full-featured estimate line item editor with CSI divisions
// Federal-grade construction estimating interface
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calculator,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GripVertical,
  MoreHorizontal,
  Settings,
  Percent,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { estimatingService } from '@/services/estimating.service';
import type { Estimate, EstimateItem } from '@/types/estimating.types';

// ============================================================
// CSI MASTERFORMAT DIVISIONS
// ============================================================

const CSI_DIVISIONS = [
  { code: '01', name: 'General Requirements', color: 'bg-gray-100' },
  { code: '02', name: 'Existing Conditions', color: 'bg-stone-100' },
  { code: '03', name: 'Concrete', color: 'bg-slate-100' },
  { code: '04', name: 'Masonry', color: 'bg-red-50' },
  { code: '05', name: 'Metals', color: 'bg-zinc-100' },
  { code: '06', name: 'Wood, Plastics, Composites', color: 'bg-amber-50' },
  { code: '07', name: 'Thermal & Moisture Protection', color: 'bg-blue-50' },
  { code: '08', name: 'Openings', color: 'bg-cyan-50' },
  { code: '09', name: 'Finishes', color: 'bg-purple-50' },
  { code: '10', name: 'Specialties', color: 'bg-pink-50' },
  { code: '11', name: 'Equipment', color: 'bg-indigo-50' },
  { code: '12', name: 'Furnishings', color: 'bg-violet-50' },
  { code: '13', name: 'Special Construction', color: 'bg-fuchsia-50' },
  { code: '14', name: 'Conveying Equipment', color: 'bg-rose-50' },
  { code: '21', name: 'Fire Suppression', color: 'bg-red-100' },
  { code: '22', name: 'Plumbing', color: 'bg-blue-100' },
  { code: '23', name: 'HVAC', color: 'bg-sky-100' },
  { code: '26', name: 'Electrical', color: 'bg-yellow-100' },
  { code: '27', name: 'Communications', color: 'bg-orange-100' },
  { code: '28', name: 'Electronic Safety & Security', color: 'bg-emerald-100' },
  { code: '31', name: 'Earthwork', color: 'bg-lime-100' },
  { code: '32', name: 'Exterior Improvements', color: 'bg-green-100' },
  { code: '33', name: 'Utilities', color: 'bg-teal-100' },
];

const UNITS = [
  'EA', 'LF', 'SF', 'SY', 'CF', 'CY', 'TON', 'LB', 'GAL',
  'HR', 'DAY', 'WK', 'MO', 'LS', 'ALLOW', '%',
];

// ============================================================
// TYPES
// ============================================================

interface EstimateEditorProps {
  estimateId: string;
  onBack: () => void;
  onSave?: () => void;
}

interface LineItemForm {
  id?: string;
  costCode: string;
  description: string;
  unit: string;
  quantity: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  otherCost: number;
  notes: string;
}

const emptyLineItem: LineItemForm = {
  costCode: '',
  description: '',
  unit: 'EA',
  quantity: 1,
  laborCost: 0,
  materialCost: 0,
  equipmentCost: 0,
  subcontractorCost: 0,
  otherCost: 0,
  notes: '',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const calculateLineTotal = (item: LineItemForm): number => {
  return (
    (item.laborCost || 0) +
    (item.materialCost || 0) +
    (item.equipmentCost || 0) +
    (item.subcontractorCost || 0) +
    (item.otherCost || 0)
  ) * (item.quantity || 1);
};

const getUnitCost = (item: LineItemForm): number => {
  return (
    (item.laborCost || 0) +
    (item.materialCost || 0) +
    (item.equipmentCost || 0) +
    (item.subcontractorCost || 0) +
    (item.otherCost || 0)
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function EstimateEditor({ estimateId, onBack, onSave }: EstimateEditorProps) {
  // State
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMarkupsDialog, setShowMarkupsDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItemForm | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  
  // Expanded divisions
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  
  // Form state
  const [itemForm, setItemForm] = useState<LineItemForm>(emptyLineItem);
  const [markups, setMarkups] = useState({
    overhead: 10,
    profit: 10,
    contingency: 5,
  });

  // ============================================================
  // DATA LOADING
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [estimateData, itemsData] = await Promise.all([
        estimatingService.fetchEstimateById(estimateId),
        estimatingService.fetchEstimateItems(estimateId),
      ]);
      
      if (!estimateData) {
        setError('Estimate not found');
        return;
      }
      
      setEstimate(estimateData);
      setLineItems(itemsData);
      setMarkups({
        overhead: estimateData.overheadPercent || 10,
        profit: estimateData.profitPercent || 10,
        contingency: estimateData.contingencyPercent || 5,
      });
      
      // Auto-expand divisions that have items
      const divisionsWithItems = new Set(
        itemsData.map(item => item.costCode?.substring(0, 2) || '01')
      );
      setExpandedDivisions(divisionsWithItems);
    } catch (err) {
      console.error('Error loading estimate:', err);
      setError('Failed to load estimate data');
    } finally {
      setLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const calculations = useCallback(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const overheadAmount = subtotal * (markups.overhead / 100);
    const profitAmount = (subtotal + overheadAmount) * (markups.profit / 100);
    const contingencyAmount = subtotal * (markups.contingency / 100);
    const grandTotal = subtotal + overheadAmount + profitAmount + contingencyAmount;
    
    // By cost type
    const laborTotal = lineItems.reduce((sum, item) => sum + ((item.laborCost || 0) * (item.quantity || 1)), 0);
    const materialTotal = lineItems.reduce((sum, item) => sum + ((item.materialCost || 0) * (item.quantity || 1)), 0);
    const equipmentTotal = lineItems.reduce((sum, item) => sum + ((item.equipmentCost || 0) * (item.quantity || 1)), 0);
    const subcontractorTotal = lineItems.reduce((sum, item) => sum + ((item.subcontractorCost || 0) * (item.quantity || 1)), 0);
    const otherTotal = lineItems.reduce((sum, item) => sum + ((item.otherCost || 0) * (item.quantity || 1)), 0);
    
    return {
      subtotal,
      overheadAmount,
      profitAmount,
      contingencyAmount,
      grandTotal,
      laborTotal,
      materialTotal,
      equipmentTotal,
      subcontractorTotal,
      otherTotal,
    };
  }, [lineItems, markups]);

  const totals = calculations();

  // Group items by CSI division
  const itemsByDivision = useCallback(() => {
    const grouped: Record<string, EstimateItem[]> = {};
    lineItems.forEach(item => {
      const div = item.costCode?.substring(0, 2) || '01';
      if (!grouped[div]) grouped[div] = [];
      grouped[div].push(item);
    });
    return grouped;
  }, [lineItems]);

  const groupedItems = itemsByDivision();

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleAddItem = async () => {
    if (!itemForm.description.trim()) {
      setError('Description is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const totalCost = calculateLineTotal(itemForm);
      const unitCost = getUnitCost(itemForm);
      
      if (editingItem?.id) {
        // Update existing
        await estimatingService.updateEstimateItem(editingItem.id, {
          costCode: itemForm.costCode || selectedDivision + '0000',
          description: itemForm.description,
          unit: itemForm.unit,
          quantity: itemForm.quantity,
          unitCost: unitCost,
          totalCost: totalCost,
          laborCost: itemForm.laborCost,
          materialCost: itemForm.materialCost,
          equipmentCost: itemForm.equipmentCost,
          subcontractorCost: itemForm.subcontractorCost,
          otherCost: itemForm.otherCost,
          notes: itemForm.notes,
        });
        setSuccessMessage('Line item updated');
      } else {
        // Create new
        await estimatingService.createEstimateItem({
          estimateId: estimateId,
          costCode: itemForm.costCode || selectedDivision + '0000',
          description: itemForm.description,
          unit: itemForm.unit,
          quantity: itemForm.quantity,
          unitCost: unitCost,
          totalCost: totalCost,
          laborCost: itemForm.laborCost,
          materialCost: itemForm.materialCost,
          equipmentCost: itemForm.equipmentCost,
          subcontractorCost: itemForm.subcontractorCost,
          otherCost: itemForm.otherCost,
          notes: itemForm.notes,
          orderIndex: lineItems.length,
        });
        setSuccessMessage('Line item added');
      }
      
      setShowAddDialog(false);
      setItemForm(emptyLineItem);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error('Error saving line item:', err);
      setError('Failed to save line item');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this line item?')) return;
    
    setSaving(true);
    try {
      await estimatingService.deleteEstimateItem(itemId);
      setSuccessMessage('Line item deleted');
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete line item');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleEditItem = (item: EstimateItem) => {
    setEditingItem({
      id: item.id,
      costCode: item.costCode || '',
      description: item.description || '',
      unit: item.unit || 'EA',
      quantity: item.quantity || 1,
      laborCost: item.laborCost || 0,
      materialCost: item.materialCost || 0,
      equipmentCost: item.equipmentCost || 0,
      subcontractorCost: item.subcontractorCost || 0,
      otherCost: item.otherCost || 0,
      notes: item.notes || '',
    });
    setItemForm({
      id: item.id,
      costCode: item.costCode || '',
      description: item.description || '',
      unit: item.unit || 'EA',
      quantity: item.quantity || 1,
      laborCost: item.laborCost || 0,
      materialCost: item.materialCost || 0,
      equipmentCost: item.equipmentCost || 0,
      subcontractorCost: item.subcontractorCost || 0,
      otherCost: item.otherCost || 0,
      notes: item.notes || '',
    });
    setSelectedDivision(item.costCode?.substring(0, 2) || '01');
    setShowAddDialog(true);
  };

  const handleSaveMarkups = async () => {
    setSaving(true);
    try {
      await estimatingService.updateEstimate(estimateId, {
        overheadPercent: markups.overhead,
        profitPercent: markups.profit,
        contingencyPercent: markups.contingency,
        subtotal: totals.subtotal,
        overheadAmount: totals.overheadAmount,
        profitAmount: totals.profitAmount,
        contingencyAmount: totals.contingencyAmount,
        total: totals.grandTotal,
      });
      setShowMarkupsDialog(false);
      setSuccessMessage('Markups saved');
      await loadData();
    } catch (err) {
      console.error('Error saving markups:', err);
      setError('Failed to save markups');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSaveEstimate = async () => {
    setSaving(true);
    try {
      await estimatingService.updateEstimate(estimateId, {
        subtotal: totals.subtotal,
        overheadPercent: markups.overhead,
        overheadAmount: totals.overheadAmount,
        profitPercent: markups.profit,
        profitAmount: totals.profitAmount,
        contingencyPercent: markups.contingency,
        contingencyAmount: totals.contingencyAmount,
        total: totals.grandTotal,
      });
      setSuccessMessage('Estimate saved');
      onSave?.();
    } catch (err) {
      console.error('Error saving estimate:', err);
      setError('Failed to save estimate');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const toggleDivision = (divCode: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divCode)) {
        newSet.delete(divCode);
      } else {
        newSet.add(divCode);
      }
      return newSet;
    });
  };

  const openAddDialog = (divisionCode: string) => {
    setSelectedDivision(divisionCode);
    setItemForm({ ...emptyLineItem, costCode: divisionCode + '0000' });
    setEditingItem(null);
    setShowAddDialog(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-3 text-lg">Loading estimate...</span>
      </div>
    );
  }

  if (error && !estimate) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg text-red-600">{error}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{estimate?.name}</h1>
              <p className="text-gray-500">Version {estimate?.version} • {estimate?.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {successMessage && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {successMessage}
              </Badge>
            )}
            {error && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </Badge>
            )}
            <Button variant="outline" onClick={() => setShowMarkupsDialog(true)}>
              <Percent className="w-4 h-4 mr-2" />
              Markups
            </Button>
            <Button onClick={handleSaveEstimate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Estimate
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Labor</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.laborTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Material</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totals.materialTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Equipment</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.equipmentTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Subcontractor</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(totals.subcontractorTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Subtotal</p>
              <p className="text-lg font-bold">{formatCurrency(totals.subtotal)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <p className="text-xs text-purple-600 uppercase font-medium">Grand Total</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(totals.grandTotal)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Markups Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <strong>Subtotal:</strong> {formatCurrency(totals.subtotal)}
                </span>
                <span>
                  + <strong>OH {markups.overhead}%:</strong> {formatCurrency(totals.overheadAmount)}
                </span>
                <span>
                  + <strong>Profit {markups.profit}%:</strong> {formatCurrency(totals.profitAmount)}
                </span>
                <span>
                  + <strong>Contingency {markups.contingency}%:</strong> {formatCurrency(totals.contingencyAmount)}
                </span>
                <span className="text-lg font-bold text-purple-700">
                  = {formatCurrency(totals.grandTotal)}
                </span>
              </div>
              <Badge variant="outline">{lineItems.length} line items</Badge>
            </div>
          </CardContent>
        </Card>

        {/* CSI Divisions */}
        <div className="space-y-2">
          {CSI_DIVISIONS.map((division) => {
            const divItems = groupedItems[division.code] || [];
            const divTotal = divItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
            const isExpanded = expandedDivisions.has(division.code);
            
            return (
              <Collapsible
                key={division.code}
                open={isExpanded}
                onOpenChange={() => toggleDivision(division.code)}
              >
                <Card className={divItems.length > 0 ? division.color : ''}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 px-4 cursor-pointer hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Badge variant="outline" className="font-mono">
                            {division.code}
                          </Badge>
                          <span className="font-medium">{division.name}</span>
                          {divItems.length > 0 && (
                            <Badge variant="secondary">{divItems.length} items</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {divItems.length > 0 && (
                            <span className="font-semibold">{formatCurrency(divTotal)}</span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddDialog(division.code);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      {divItems.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No items in this division. Click "Add" to create one.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-[80px] text-right">Qty</TableHead>
                              <TableHead className="w-[60px]">Unit</TableHead>
                              <TableHead className="w-[100px] text-right">Labor</TableHead>
                              <TableHead className="w-[100px] text-right">Material</TableHead>
                              <TableHead className="w-[100px] text-right">Equip</TableHead>
                              <TableHead className="w-[100px] text-right">Sub</TableHead>
                              <TableHead className="w-[100px] text-right">Unit Cost</TableHead>
                              <TableHead className="w-[120px] text-right">Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {divItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-gray-50">
                                <TableCell className="font-mono text-xs">
                                  {item.costCode}
                                </TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(item.quantity, 2)}
                                </TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right text-blue-600">
                                  {formatCurrency(item.laborCost || 0)}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {formatCurrency(item.materialCost || 0)}
                                </TableCell>
                                <TableCell className="text-right text-orange-600">
                                  {formatCurrency(item.equipmentCost || 0)}
                                </TableCell>
                                <TableCell className="text-right text-purple-600">
                                  {formatCurrency(item.subcontractorCost || 0)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.unitCost || 0)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(item.totalCost || 0)}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleDeleteItem(item.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Add/Edit Line Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Line Item' : 'Add Line Item'}
                {selectedDivision && (
                  <span className="ml-2 text-gray-500 font-normal">
                    - Division {selectedDivision}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>CSI Code</Label>
                  <Input
                    value={itemForm.costCode}
                    onChange={(e) => setItemForm({ ...itemForm, costCode: e.target.value })}
                    placeholder="030000"
                    className="font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Description *</Label>
                  <Input
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select
                    value={itemForm.unit}
                    onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Unit Cost (calculated)</Label>
                  <div className="h-10 px-3 py-2 bg-gray-100 rounded-md flex items-center font-medium">
                    {formatCurrency(getUnitCost(itemForm))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-blue-600">Labor</Label>
                  <Input
                    type="number"
                    value={itemForm.laborCost}
                    onChange={(e) => setItemForm({ ...itemForm, laborCost: parseFloat(e.target.value) || 0 })}
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-green-600">Material</Label>
                  <Input
                    type="number"
                    value={itemForm.materialCost}
                    onChange={(e) => setItemForm({ ...itemForm, materialCost: parseFloat(e.target.value) || 0 })}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="text-orange-600">Equipment</Label>
                  <Input
                    type="number"
                    value={itemForm.equipmentCost}
                    onChange={(e) => setItemForm({ ...itemForm, equipmentCost: parseFloat(e.target.value) || 0 })}
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label className="text-purple-600">Subcontractor</Label>
                  <Input
                    type="number"
                    value={itemForm.subcontractorCost}
                    onChange={(e) => setItemForm({ ...itemForm, subcontractorCost: parseFloat(e.target.value) || 0 })}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-600">Other</Label>
                  <Input
                    type="number"
                    value={itemForm.otherCost}
                    onChange={(e) => setItemForm({ ...itemForm, otherCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Line Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateLineTotal(itemForm))}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(itemForm.quantity, 2)} {itemForm.unit} × {formatCurrency(getUnitCost(itemForm))} = {formatCurrency(calculateLineTotal(itemForm))}
                </p>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={saving || !itemForm.description.trim()}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Markups Dialog */}
        <Dialog open={showMarkupsDialog} onOpenChange={setShowMarkupsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Markups</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Overhead %</Label>
                <Input
                  type="number"
                  value={markups.overhead}
                  onChange={(e) => setMarkups({ ...markups, overhead: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount: {formatCurrency(totals.subtotal * (markups.overhead / 100))}
                </p>
              </div>
              <div>
                <Label>Profit %</Label>
                <Input
                  type="number"
                  value={markups.profit}
                  onChange={(e) => setMarkups({ ...markups, profit: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount: {formatCurrency((totals.subtotal + totals.overheadAmount) * (markups.profit / 100))}
                </p>
              </div>
              <div>
                <Label>Contingency %</Label>
                <Input
                  type="number"
                  value={markups.contingency}
                  onChange={(e) => setMarkups({ ...markups, contingency: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount: {formatCurrency(totals.subtotal * (markups.contingency / 100))}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Overhead ({markups.overhead}%):</span>
                    <span>{formatCurrency(totals.subtotal * (markups.overhead / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Profit ({markups.profit}%):</span>
                    <span>{formatCurrency((totals.subtotal + totals.subtotal * (markups.overhead / 100)) * (markups.profit / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Contingency ({markups.contingency}%):</span>
                    <span>{formatCurrency(totals.subtotal * (markups.contingency / 100))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Grand Total:</span>
                    <span className="text-purple-700">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMarkupsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMarkups} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Markups
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default EstimateEditor;
