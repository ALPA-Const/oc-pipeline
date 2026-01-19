/**
 * OC Pipeline - ISDC Service
 * Service functions for Submittals, Specifications, and Closeout operations
 */

import apiClient, { ApiResponse } from './api';
import type {
  Submittal,
  SubmittalItem,
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
  OutreachCampaign,
  CloseoutPackage,
} from '@/types/isdc';

/**
 * Submittal Service
 */
export const submittalService = {
  /**
   * List submittals for a project
   */
  async list(projectId: string, filters?: {
    status?: string;
    submittal_type?: string;
    spec_section?: string;
    priority?: string;
    assigned_to?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<Submittal[]> {
    const params = new URLSearchParams({ project_id: projectId });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<ApiResponse<Submittal[]>>(
      `/api/submittals?${params.toString()}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch submittals');
    }
    
    return response.data.data;
  },

  /**
   * Get single submittal by ID
   */
  async get(id: string): Promise<Submittal> {
    const response = await apiClient.get<ApiResponse<Submittal>>(`/api/submittals/${id}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch submittal');
    }
    
    return response.data.data;
  },

  /**
   * Create new submittal
   */
  async create(data: CreateSubmittalRequest): Promise<Submittal> {
    const response = await apiClient.post<ApiResponse<Submittal>>('/api/submittals', data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create submittal');
    }
    
    return response.data.data;
  },

  /**
   * Update submittal
   */
  async update(id: string, data: UpdateSubmittalRequest): Promise<Submittal> {
    const response = await apiClient.patch<ApiResponse<Submittal>>(
      `/api/submittals/${id}`,
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update submittal');
    }
    
    return response.data.data;
  },

  /**
   * Update submittal status
   */
  async updateStatus(id: string, data: UpdateSubmittalStatusRequest): Promise<Submittal> {
    const response = await apiClient.patch<ApiResponse<Submittal>>(
      `/api/submittals/${id}/status`,
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update submittal status');
    }
    
    return response.data.data;
  },

  /**
   * Delete submittal
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/api/submittals/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete submittal');
    }
  },
};

/**
 * Specification Service
 */
export const specificationService = {
  /**
   * List specifications for a project
   */
  async list(projectId: string, filters?: {
    division?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Specification[]> {
    const params = new URLSearchParams({ project_id: projectId });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<ApiResponse<Specification[]>>(
      `/api/specifications?${params.toString()}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch specifications');
    }
    
    return response.data.data;
  },

  /**
   * Get single specification by ID
   */
  async get(id: string): Promise<Specification> {
    const response = await apiClient.get<ApiResponse<Specification>>(
      `/api/specifications/${id}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch specification');
    }
    
    return response.data.data;
  },

  /**
   * Upload specification document
   */
  async upload(data: UploadSpecificationRequest): Promise<Specification> {
    const formData = new FormData();
    
    // Add file if provided
    if (data.file) {
      formData.append('file', data.file);
    }
    
    // Add other fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'file' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await apiClient.post<ApiResponse<Specification>>(
      '/api/specifications/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload specification');
    }
    
    return response.data.data;
  },

  /**
   * Extract submittals from specification using AI
   */
  async extract(id: string, options?: ExtractSubmittalsRequest): Promise<AIExtraction> {
    const response = await apiClient.post<ApiResponse<AIExtraction>>(
      `/api/specifications/${id}/extract`,
      options || {}
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to extract submittals');
    }
    
    return response.data.data;
  },

  /**
   * Create submittals from AI extraction
   */
  async createSubmittals(
    id: string,
    data: CreateSubmittalsFromExtractionRequest
  ): Promise<Submittal[]> {
    const response = await apiClient.post<ApiResponse<Submittal[]>>(
      `/api/specifications/${id}/create-submittals`,
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create submittals');
    }
    
    return response.data.data;
  },

  /**
   * Delete specification
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/api/specifications/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete specification');
    }
  },
};

/**
 * Closeout Service
 */
export const closeoutService = {
  /**
   * Get closeout dashboard for a project
   */
  async getDashboard(projectId: string): Promise<CloseoutDashboard> {
    const response = await apiClient.get<ApiResponse<CloseoutDashboard>>(
      `/api/closeout/dashboard?project_id=${projectId}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch closeout dashboard');
    }
    
    return response.data.data;
  },

  /**
   * List closeout documents for a project
   */
  async listDocuments(projectId: string, filters?: {
    document_type?: string;
    status?: string;
    subcontractor_id?: string;
    page?: number;
    limit?: number;
  }): Promise<CloseoutDocument[]> {
    const params = new URLSearchParams({ project_id: projectId });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<ApiResponse<CloseoutDocument[]>>(
      `/api/closeout/documents?${params.toString()}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch closeout documents');
    }
    
    return response.data.data;
  },

  /**
   * Create closeout document requirement
   */
  async createDocument(data: CreateCloseoutDocumentRequest): Promise<CloseoutDocument> {
    const response = await apiClient.post<ApiResponse<CloseoutDocument>>(
      '/api/closeout/documents',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create closeout document');
    }
    
    return response.data.data;
  },

  /**
   * Update closeout document
   */
  async updateDocument(
    id: string,
    data: UpdateCloseoutDocumentRequest
  ): Promise<CloseoutDocument> {
    const response = await apiClient.patch<ApiResponse<CloseoutDocument>>(
      `/api/closeout/documents/${id}`,
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update closeout document');
    }
    
    return response.data.data;
  },

  /**
   * Create outreach campaign
   */
  async createOutreach(data: CreateOutreachRequest): Promise<OutreachCampaign> {
    const response = await apiClient.post<ApiResponse<OutreachCampaign>>(
      '/api/closeout/outreach',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create outreach campaign');
    }
    
    return response.data.data;
  },

  /**
   * Send outreach email
   */
  async sendOutreach(id: string): Promise<OutreachCampaign> {
    const response = await apiClient.post<ApiResponse<OutreachCampaign>>(
      `/api/closeout/outreach/${id}/send`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to send outreach email');
    }
    
    return response.data.data;
  },

  /**
   * Generate closeout package
   */
  async generatePackage(projectId: string): Promise<CloseoutPackage> {
    const response = await apiClient.get<ApiResponse<CloseoutPackage>>(
      `/api/closeout/package?project_id=${projectId}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to generate closeout package');
    }
    
    return response.data.data;
  },
};

