/**
 * OC Pipeline - Specifications Page
 * Route: /isdc/specifications?project_id=uuid
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Trash2, Sparkles, FileText } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  useSpecifications,
  useUploadSpecification,
  useExtractSubmittals,
  useCreateSubmittalsFromExtraction,
  useDeleteSpecification,
} from '@/hooks/useISDC';
import type { Specification, AIExtraction } from '@/types/isdc';

export default function SpecificationsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<Specification | null>(null);
  const [extractionResult, setExtractionResult] = useState<AIExtraction | null>(null);
  const [selectedSubmittals, setSelectedSubmittals] = useState<number[]>([]);

  // Fetch specifications
  const { data: specifications = [], isLoading, error, refetch } = useSpecifications(projectId);

  // Mutations
  const uploadMutation = useUploadSpecification();
  const extractMutation = useExtractSubmittals();
  const createSubmittalsMutation = useCreateSubmittalsFromExtraction();
  const deleteMutation = useDeleteSpecification();

  // Form state
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: '',
    division: '',
    section_number: '',
    section_title: '',
    file: null as File | null,
  });

  const handleUpload = async () => {
    if (!projectId || !formData.file) {
      alert('Project ID and file are required');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        project_id: projectId,
        document_name: formData.document_name,
        document_type: formData.document_type,
        division: formData.division,
        section_number: formData.section_number || undefined,
        section_title: formData.section_title || undefined,
        file_path: formData.file.name,
        file: formData.file,
      });
      setIsUploadDialogOpen(false);
      setFormData({
        document_name: '',
        document_type: '',
        division: '',
        section_number: '',
        section_title: '',
        file: null,
      });
      refetch();
    } catch (error) {
      console.error('Failed to upload specification:', error);
    }
  };

  const handleExtract = async (spec: Specification) => {
    setSelectedSpec(spec);
    try {
      const result = await extractMutation.mutateAsync({
        id: spec.id,
        options: {},
      });
      setExtractionResult(result);
    } catch (error) {
      console.error('Failed to extract submittals:', error);
    }
  };

  const handleCreateSubmittals = async () => {
    if (!selectedSpec || !extractionResult) return;

    try {
      await createSubmittalsMutation.mutateAsync({
        id: selectedSpec.id,
        data: {
          extraction_id: extractionResult.id,
          selected_submittals: selectedSubmittals.length > 0 ? selectedSubmittals : undefined,
        },
      });
      setExtractionResult(null);
      setSelectedSpec(null);
      setSelectedSubmittals([]);
      refetch();
    } catch (error) {
      console.error('Failed to create submittals:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    if (!confirm('Are you sure you want to delete this specification?')) return;

    try {
      await deleteMutation.mutateAsync({ id, projectId });
      refetch();
    } catch (error) {
      console.error('Failed to delete specification:', error);
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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
          <h1 className="text-3xl font-bold">Specifications</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage project specifications
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Specification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Specification Document</DialogTitle>
              <DialogDescription>
                Upload a specification document to extract submittals using AI
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Document File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_name">Document Name *</Label>
                <Input
                  id="document_name"
                  value={formData.document_name}
                  onChange={(e) =>
                    setFormData({ ...formData, document_name: e.target.value })
                  }
                  placeholder="Project Specifications"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type</Label>
                  <Input
                    id="document_type"
                    value={formData.document_type}
                    onChange={(e) =>
                      setFormData({ ...formData, document_type: e.target.value })
                    }
                    placeholder="Master Spec"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Input
                    id="division"
                    value={formData.division}
                    onChange={(e) =>
                      setFormData({ ...formData, division: e.target.value })
                    }
                    placeholder="03"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section_number">Section Number</Label>
                  <Input
                    id="section_number"
                    value={formData.section_number}
                    onChange={(e) =>
                      setFormData({ ...formData, section_number: e.target.value })
                    }
                    placeholder="03 30 00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section_title">Section Title</Label>
                  <Input
                    id="section_title"
                    value={formData.section_title}
                    onChange={(e) =>
                      setFormData({ ...formData, section_title: e.target.value })
                    }
                    placeholder="Cast-in-Place Concrete"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !formData.file || !formData.document_name}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Specifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications ({specifications.length})</CardTitle>
          <CardDescription>Uploaded specification documents</CardDescription>
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
                {error instanceof Error ? error.message : 'Failed to load specifications'}
              </AlertDescription>
            </Alert>
          ) : specifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No specifications found. Upload your first specification to get started.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Confidence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specifications.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {spec.document_name}
                        </div>
                      </TableCell>
                      <TableCell>{spec.document_type}</TableCell>
                      <TableCell>{spec.division}</TableCell>
                      <TableCell>
                        {spec.section_number && (
                          <div>
                            <div className="font-medium">{spec.section_number}</div>
                            {spec.section_title && (
                              <div className="text-xs text-muted-foreground">
                                {spec.section_title}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getProcessingStatusBadge(spec.processing_status)}</TableCell>
                      <TableCell>
                        {spec.ai_confidence_score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Progress value={spec.ai_confidence_score * 100} className="w-16" />
                            <span className="text-xs">
                              {Math.round(spec.ai_confidence_score * 100)}%
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtract(spec)}
                            disabled={extractMutation.isPending}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            Extract
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(spec.id)}
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

      {/* Extraction Results Dialog */}
      <Dialog open={!!extractionResult} onOpenChange={(open) => !open && setExtractionResult(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Extraction Results</DialogTitle>
            <DialogDescription>
              Review extracted submittals from {selectedSpec?.document_name}
            </DialogDescription>
          </DialogHeader>
          {extractionResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Confidence Score: {Math.round(extractionResult.confidence_score * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Found {extractionResult.extracted_data.submittals?.length || 0} submittals
                  </p>
                </div>
              </div>
              {extractionResult.extracted_data.submittals && extractionResult.extracted_data.submittals.length > 0 ? (
                <div className="space-y-2">
                  {extractionResult.extracted_data.submittals.map((submittal, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSubmittals.includes(index)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubmittals([...selectedSubmittals, index]);
                                  } else {
                                    setSelectedSubmittals(
                                      selectedSubmittals.filter((i) => i !== index)
                                    );
                                  }
                                }}
                              />
                              <h4 className="font-semibold">{submittal.submittal_title}</h4>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <p>Spec Section: {submittal.spec_section}</p>
                              <p>Type: {submittal.submittal_type}</p>
                              {submittal.items && submittal.items.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium">Items:</p>
                                  <ul className="list-disc list-inside ml-2">
                                    {submittal.items.map((item, itemIndex) => (
                                      <li key={itemIndex}>
                                        {item.product_name}
                                        {item.manufacturer && ` - ${item.manufacturer}`}
                                        {item.model_number && ` (${item.model_number})`}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No submittals were extracted from this specification.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtractionResult(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmittals}
              disabled={
                createSubmittalsMutation.isPending ||
                !extractionResult?.extracted_data.submittals ||
                extractionResult.extracted_data.submittals.length === 0
              }
            >
              {createSubmittalsMutation.isPending
                ? 'Creating...'
                : `Create ${selectedSubmittals.length > 0 ? selectedSubmittals.length : 'All'} Submittals`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

