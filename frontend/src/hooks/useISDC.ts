/**
 * OC Pipeline - ISDC React Query Hooks
 * Custom hooks for Submittals, Specifications, and Closeout operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  submittalService,
  specificationService,
  closeoutService,
} from '@/services/isdcService';
import type {
  Submittal,
  CreateSubmittalRequest,
  UpdateSubmittalRequest,
  UpdateSubmittalStatusRequest,
  Specification,
  UploadSpecificationRequest,
  ExtractSubmittalsRequest,
  CreateSubmittalsFromExtractionRequest,
  AIExtraction,
  CloseoutDocument,
  CloseoutDashboard,
  CreateCloseoutDocumentRequest,
  UpdateCloseoutDocumentRequest,
  CreateOutreachRequest,
  CloseoutPackage,
} from '@/types/isdc';

/**
 * Query Keys
 */
export const ISDC_KEYS = {
  all: ['isdc'] as const,
  submittals: (projectId?: string) => [...ISDC_KEYS.all, 'submittals', projectId] as const,
  submittal: (id: string) => [...ISDC_KEYS.all, 'submittal', id] as const,
  specifications: (projectId?: string) => [...ISDC_KEYS.all, 'specifications', projectId] as const,
  specification: (id: string) => [...ISDC_KEYS.all, 'specification', id] as const,
  closeoutDashboard: (projectId: string) => [...ISDC_KEYS.all, 'closeout', 'dashboard', projectId] as const,
  closeoutDocuments: (projectId?: string) => [...ISDC_KEYS.all, 'closeout', 'documents', projectId] as const,
};

/**
 * Submittal Hooks
 */

/**
 * Fetch submittals list for a project
 */
export function useSubmittals(
  projectId: string | undefined,
  filters?: {
    status?: string;
    submittal_type?: string;
    spec_section?: string;
    priority?: string;
    assigned_to?: string;
  }
) {
  return useQuery({
    queryKey: ISDC_KEYS.submittals(projectId),
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return submittalService.list(projectId, filters);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single submittal by ID
 */
export function useSubmittal(id: string | undefined) {
  return useQuery({
    queryKey: ISDC_KEYS.submittal(id!),
    queryFn: () => {
      if (!id) {
        throw new Error('Submittal ID is required');
      }
      return submittalService.get(id);
    },
    enabled: !!id,
  });
}

/**
 * Create submittal mutation
 */
export function useCreateSubmittal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubmittalRequest) => submittalService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittals(data.project_id) });
      toast({
        title: 'Success',
        description: 'Submittal created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create submittal',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update submittal mutation
 */
export function useUpdateSubmittal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubmittalRequest }) =>
      submittalService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittal(data.id) });
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittals(data.project_id) });
      toast({
        title: 'Success',
        description: 'Submittal updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update submittal',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update submittal status mutation
 */
export function useUpdateSubmittalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubmittalStatusRequest }) =>
      submittalService.updateStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittal(data.id) });
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittals(data.project_id) });
      toast({
        title: 'Success',
        description: 'Submittal status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update submittal status',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete submittal mutation
 */
export function useDeleteSubmittal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      submittalService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.submittals(variables.projectId) });
      toast({
        title: 'Success',
        description: 'Submittal deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete submittal',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Specification Hooks
 */

/**
 * Fetch specifications list for a project
 */
export function useSpecifications(
  projectId: string | undefined,
  filters?: {
    division?: string;
    status?: string;
  }
) {
  return useQuery({
    queryKey: ISDC_KEYS.specifications(projectId),
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return specificationService.list(projectId, filters);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single specification by ID
 */
export function useSpecification(id: string | undefined) {
  return useQuery({
    queryKey: ISDC_KEYS.specification(id!),
    queryFn: () => {
      if (!id) {
        throw new Error('Specification ID is required');
      }
      return specificationService.get(id);
    },
    enabled: !!id,
  });
}

/**
 * Upload specification mutation
 */
export function useUploadSpecification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadSpecificationRequest) => specificationService.upload(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ISDC_KEYS.specifications(data.project_id) });
      toast({
        title: 'Success',
        description: 'Specification uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload specification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Extract submittals from specification mutation
 */
export function useExtractSubmittals() {
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options?: ExtractSubmittalsRequest }) =>
      specificationService.extract(id, options),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'AI extraction started successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to extract submittals',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Create submittals from extraction mutation
 */
export function useCreateSubmittalsFromExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateSubmittalsFromExtractionRequest;
    }) => specificationService.createSubmittals(id, data),
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ISDC_KEYS.submittals(data[0].project_id),
        });
      }
      toast({
        title: 'Success',
        description: `Created ${data.length} submittals successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create submittals',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete specification mutation
 */
export function useDeleteSpecification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      specificationService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.specifications(variables.projectId),
      });
      toast({
        title: 'Success',
        description: 'Specification deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete specification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Closeout Hooks
 */

/**
 * Fetch closeout dashboard for a project
 */
export function useCloseoutDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: ISDC_KEYS.closeoutDashboard(projectId!),
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return closeoutService.getDashboard(projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch closeout documents list for a project
 */
export function useCloseoutDocuments(
  projectId: string | undefined,
  filters?: {
    document_type?: string;
    status?: string;
    subcontractor_id?: string;
  }
) {
  return useQuery({
    queryKey: ISDC_KEYS.closeoutDocuments(projectId),
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return closeoutService.listDocuments(projectId, filters);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create closeout document mutation
 */
export function useCreateCloseoutDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCloseoutDocumentRequest) =>
      closeoutService.createDocument(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.closeoutDocuments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.closeoutDashboard(data.project_id),
      });
      toast({
        title: 'Success',
        description: 'Closeout document created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create closeout document',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update closeout document mutation
 */
export function useUpdateCloseoutDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCloseoutDocumentRequest }) =>
      closeoutService.updateDocument(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.closeoutDocuments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.closeoutDashboard(data.project_id),
      });
      toast({
        title: 'Success',
        description: 'Closeout document updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update closeout document',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Create outreach campaign mutation
 */
export function useCreateOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOutreachRequest) => closeoutService.createOutreach(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ISDC_KEYS.closeoutDocuments(data.project_id),
      });
      toast({
        title: 'Success',
        description: 'Outreach campaign created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create outreach campaign',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Send outreach email mutation
 */
export function useSendOutreach() {
  return useMutation({
    mutationFn: (id: string) => closeoutService.sendOutreach(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Outreach email sent successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send outreach email',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Generate closeout package mutation
 */
export function useGenerateCloseoutPackage() {
  return useMutation({
    mutationFn: (projectId: string) => closeoutService.generatePackage(projectId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Closeout package generated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate closeout package',
        variant: 'destructive',
      });
    },
  });
}

