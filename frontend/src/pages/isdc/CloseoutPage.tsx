/**
 * OC Pipeline - Closeout Page
 * Route: /isdc/closeout?project_id=uuid
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Mail, Download, FileText } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import {
  useCloseoutDashboard,
  useCloseoutDocuments,
  useCreateCloseoutDocument,
  useUpdateCloseoutDocument,
  useCreateOutreach,
  useSendOutreach,
  useGenerateCloseoutPackage,
} from '@/hooks/useISDC';
import type {
  CloseoutDocument,
  CloseoutDocumentType,
  CloseoutDocumentStatus,
} from '@/types/isdc';

export default function CloseoutPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOutreachDialogOpen, setIsOutreachDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<CloseoutDocument | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch dashboard and documents
  const { data: dashboard, isLoading: dashboardLoading } = useCloseoutDashboard(projectId);
  const { data: documents = [], isLoading: documentsLoading, refetch } = useCloseoutDocuments(
    projectId,
    { status: statusFilter || undefined }
  );

  // Mutations
  const createMutation = useCreateCloseoutDocument();
  const updateMutation = useUpdateCloseoutDocument();
  const outreachMutation = useCreateOutreach();
  const sendOutreachMutation = useSendOutreach();
  const generatePackageMutation = useGenerateCloseoutPackage();

  // Form state
  const [formData, setFormData] = useState({
    document_type: 'as_built_drawing' as CloseoutDocumentType,
    document_title: '',
    spec_section: '',
    due_date: '',
    notes: '',
  });

  const [outreachData, setOutreachData] = useState({
    outreach_type: 'email' as 'email' | 'phone' | 'letter',
    subject: '',
    message_body: '',
    documents_requested: [] as string[],
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
        document_type: 'as_built_drawing',
        document_title: '',
        spec_section: '',
        due_date: '',
        notes: '',
      });
      refetch();
    } catch (error) {
      console.error('Failed to create closeout document:', error);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<CloseoutDocument>) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: updates,
      });
      setEditingDocument(null);
      refetch();
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const handleCreateOutreach = async () => {
    if (!projectId) return;

    try {
      await outreachMutation.mutateAsync({
        ...outreachData,
        project_id: projectId,
      });
      setIsOutreachDialogOpen(false);
      setOutreachData({
        outreach_type: 'email',
        subject: '',
        message_body: '',
        documents_requested: [],
      });
    } catch (error) {
      console.error('Failed to create outreach:', error);
    }
  };

  const handleGeneratePackage = async () => {
    if (!projectId) return;

    try {
      const packageData = await generatePackageMutation.mutateAsync(projectId);
      if (packageData.download_url) {
        window.open(packageData.download_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate package:', error);
    }
  };

  const getStatusBadgeVariant = (status: CloseoutDocumentStatus) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'received':
        return 'outline';
      case 'overdue':
        return 'destructive';
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
          <h1 className="text-3xl font-bold">Closeout</h1>
          <p className="text-muted-foreground mt-1">
            Manage project closeout documents and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGeneratePackage}>
            <Download className="h-4 w-4 mr-2" />
            Generate Package
          </Button>
          <Dialog open={isOutreachDialogOpen} onOpenChange={setIsOutreachDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Create Outreach
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Outreach Campaign</DialogTitle>
                <DialogDescription>
                  Send requests to subcontractors for closeout documents
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Outreach Type</Label>
                  <Select
                    value={outreachData.outreach_type}
                    onValueChange={(value: 'email' | 'phone' | 'letter') =>
                      setOutreachData({ ...outreachData, outreach_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={outreachData.subject}
                    onChange={(e) =>
                      setOutreachData({ ...outreachData, subject: e.target.value })
                    }
                    placeholder="Request for Closeout Documents"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={outreachData.message_body}
                    onChange={(e) =>
                      setOutreachData({ ...outreachData, message_body: e.target.value })
                    }
                    placeholder="Please provide the following closeout documents..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOutreachDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOutreach} disabled={outreachMutation.isPending}>
                  {outreachMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Closeout Document Requirement</DialogTitle>
                <DialogDescription>
                  Add a new closeout document requirement for this project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, document_type: value as CloseoutDocumentType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as_built_drawing">As-Built Drawing</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                      <SelectItem value="operation_manual">Operation Manual</SelectItem>
                      <SelectItem value="maintenance_manual">Maintenance Manual</SelectItem>
                      <SelectItem value="test_report">Test Report</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="warranty_letter">Warranty Letter</SelectItem>
                      <SelectItem value="closeout_form">Closeout Form</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Title *</Label>
                  <Input
                    value={formData.document_title}
                    onChange={(e) =>
                      setFormData({ ...formData, document_title: e.target.value })
                    }
                    placeholder="As-Built Drawing Set - Building A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spec Section</Label>
                    <Input
                      value={formData.spec_section}
                      onChange={(e) =>
                        setFormData({ ...formData, spec_section: e.target.value })
                      }
                      placeholder="01 78 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
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

      {/* Dashboard Stats */}
      {dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.statistics.total_documents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.statistics.received}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(dashboard.statistics.completion_percentage)}%
              </div>
              <Progress
                value={dashboard.statistics.completion_percentage}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Closeout Documents ({documents.length})</CardTitle>
          <CardDescription>List of all closeout documents for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No closeout documents found. Create your first document requirement to get started.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Accepted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.document_title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.document_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.due_date ? new Date(doc.due_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {doc.received_date
                          ? new Date(doc.received_date).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {doc.accepted_date
                          ? new Date(doc.accepted_date).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDocument(doc)}
                          >
                            <Edit className="h-4 w-4" />
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

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={(open) => !open && setEditingDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Closeout Document</DialogTitle>
            <DialogDescription>
              Update document status and information
            </DialogDescription>
          </DialogHeader>
          {editingDocument && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingDocument.status}
                  onValueChange={(value) =>
                    handleUpdate(editingDocument.id, {
                      status: value as CloseoutDocumentStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Received Date</Label>
                  <Input
                    type="date"
                    value={
                      editingDocument.received_date
                        ? new Date(editingDocument.received_date).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleUpdate(editingDocument.id, {
                        received_date: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accepted Date</Label>
                  <Input
                    type="date"
                    value={
                      editingDocument.accepted_date
                        ? new Date(editingDocument.accepted_date).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleUpdate(editingDocument.id, {
                        accepted_date: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDocument(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

