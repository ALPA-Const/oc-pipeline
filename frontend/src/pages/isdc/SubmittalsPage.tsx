/**
 * OC Pipeline - Submittals Page
 * Route: /isdc/submittals?project_id=uuid
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useSubmittals,
  useCreateSubmittal,
  useUpdateSubmittal,
  useUpdateSubmittalStatus,
  useDeleteSubmittal,
} from '@/hooks/useISDC';
import type { Submittal, SubmittalStatus, SubmittalType, SubmittalPriority } from '@/types/isdc';

export default function SubmittalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSubmittal, setEditingSubmittal] = useState<Submittal | null>(null);
  const [statusUpdateSubmittal, setStatusUpdateSubmittal] = useState<Submittal | null>(null);

  // Fetch submittals
  const { data: submittals = [], isLoading, error, refetch } = useSubmittals(
    projectId,
    {
      status: statusFilter || undefined,
      submittal_type: typeFilter || undefined,
    }
  );

  // Mutations
  const createMutation = useCreateSubmittal();
  const updateMutation = useUpdateSubmittal();
  const statusMutation = useUpdateSubmittalStatus();
  const deleteMutation = useDeleteSubmittal();

  // Form state
  const [formData, setFormData] = useState({
    submittal_number: '',
    spec_section: '',
    submittal_title: '',
    submittal_type: 'product_data' as SubmittalType,
    priority: 'normal' as SubmittalPriority,
    due_date: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!projectId) {
      alert('Project ID is required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        project_id: projectId,
      });
      setIsCreateDialogOpen(false);
      setFormData({
        submittal_number: '',
        spec_section: '',
        submittal_title: '',
        submittal_type: 'product_data',
        priority: 'normal',
        due_date: '',
        description: '',
      });
      refetch();
    } catch (error) {
      console.error('Failed to create submittal:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSubmittal) return;

    try {
      await updateMutation.mutateAsync({
        id: editingSubmittal.id,
        data: formData,
      });
      setEditingSubmittal(null);
      setFormData({
        submittal_number: '',
        spec_section: '',
        submittal_title: '',
        submittal_type: 'product_data',
        priority: 'normal',
        due_date: '',
        description: '',
      });
      refetch();
    } catch (error) {
      console.error('Failed to update submittal:', error);
    }
  };

  const handleStatusUpdate = async (status: SubmittalStatus) => {
    if (!statusUpdateSubmittal) return;

    try {
      await statusMutation.mutateAsync({
        id: statusUpdateSubmittal.id,
        data: { status },
      });
      setStatusUpdateSubmittal(null);
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    if (!confirm('Are you sure you want to delete this submittal?')) return;

    try {
      await deleteMutation.mutateAsync({ id, projectId });
      refetch();
    } catch (error) {
      console.error('Failed to delete submittal:', error);
    }
  };

  const openEditDialog = (submittal: Submittal) => {
    setEditingSubmittal(submittal);
    setFormData({
      submittal_number: submittal.submittal_number,
      spec_section: submittal.spec_section,
      submittal_title: submittal.submittal_title,
      submittal_type: submittal.submittal_type,
      priority: submittal.priority,
      due_date: submittal.due_date || '',
      description: submittal.description || '',
    });
  };

  const getStatusBadgeVariant = (status: SubmittalStatus) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'approved_as_noted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'submitted':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Project ID is required. Please provide project_id in the URL query parameters.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-muted-foreground mt-1">
            Manage project submittals and track their status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Submittal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Submittal</DialogTitle>
                <DialogDescription>
                  Add a new submittal to track for this project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submittal_number">Submittal Number *</Label>
                    <Input
                      id="submittal_number"
                      value={formData.submittal_number}
                      onChange={(e) =>
                        setFormData({ ...formData, submittal_number: e.target.value })
                      }
                      placeholder="S-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spec_section">Spec Section *</Label>
                    <Input
                      id="spec_section"
                      value={formData.spec_section}
                      onChange={(e) =>
                        setFormData({ ...formData, spec_section: e.target.value })
                      }
                      placeholder="03 30 00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submittal_title">Submittal Title *</Label>
                  <Input
                    id="submittal_title"
                    value={formData.submittal_title}
                    onChange={(e) =>
                      setFormData({ ...formData, submittal_title: e.target.value })
                    }
                    placeholder="Product Data for Concrete"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submittal_type">Type</Label>
                    <Select
                      value={formData.submittal_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, submittal_type: value as SubmittalType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product_data">Product Data</SelectItem>
                        <SelectItem value="shop_drawing">Shop Drawing</SelectItem>
                        <SelectItem value="sample">Sample</SelectItem>
                        <SelectItem value="mix_design">Mix Design</SelectItem>
                        <SelectItem value="test_report">Test Report</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as SubmittalPriority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved_as_noted">Approved as Noted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resubmitted">Resubmitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="product_data">Product Data</SelectItem>
                  <SelectItem value="shop_drawing">Shop Drawing</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                  <SelectItem value="mix_design">Mix Design</SelectItem>
                  <SelectItem value="test_report">Test Report</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submittals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submittals ({submittals.length})</CardTitle>
          <CardDescription>List of all submittals for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load submittals'}
              </AlertDescription>
            </Alert>
          ) : submittals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submittals found. Create your first submittal to get started.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Spec Section</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittals.map((submittal) => (
                    <TableRow key={submittal.id}>
                      <TableCell className="font-medium">
                        {submittal.submittal_number}
                      </TableCell>
                      <TableCell>{submittal.submittal_title}</TableCell>
                      <TableCell>{submittal.spec_section}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submittal.submittal_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(submittal.status)}>
                          {submittal.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submittal.priority === 'urgent'
                              ? 'destructive'
                              : submittal.priority === 'high'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {submittal.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submittal.due_date
                          ? new Date(submittal.due_date).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusUpdateSubmittal(submittal)}
                          >
                            Status
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(submittal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(submittal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={!!statusUpdateSubmittal} onOpenChange={(open) => !open && setStatusUpdateSubmittal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Submittal Status</DialogTitle>
            <DialogDescription>
              Change the status of {statusUpdateSubmittal?.submittal_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                onValueChange={(value) => handleStatusUpdate(value as SubmittalStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved_as_noted">Approved as Noted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resubmitted">Resubmitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubmittal} onOpenChange={(open) => !open && setEditingSubmittal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Submittal</DialogTitle>
            <DialogDescription>
              Update submittal details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_submittal_number">Submittal Number</Label>
                <Input
                  id="edit_submittal_number"
                  value={formData.submittal_number}
                  onChange={(e) =>
                    setFormData({ ...formData, submittal_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_spec_section">Spec Section</Label>
                <Input
                  id="edit_spec_section"
                  value={formData.spec_section}
                  onChange={(e) =>
                    setFormData({ ...formData, spec_section: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_submittal_title">Submittal Title</Label>
              <Input
                id="edit_submittal_title"
                value={formData.submittal_title}
                onChange={(e) =>
                  setFormData({ ...formData, submittal_title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_submittal_type">Type</Label>
                <Select
                  value={formData.submittal_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, submittal_type: value as SubmittalType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_data">Product Data</SelectItem>
                    <SelectItem value="shop_drawing">Shop Drawing</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="mix_design">Mix Design</SelectItem>
                    <SelectItem value="test_report">Test Report</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as SubmittalPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_due_date">Due Date</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubmittal(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

