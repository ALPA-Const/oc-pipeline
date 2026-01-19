/**
 * OC Pipeline - ISDC Module TypeScript Interfaces
 * Submittals, Specifications, and Closeout types
 */

/**
 * Submittal Status Enum
 */
export type SubmittalStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'approved_as_noted'
  | 'rejected'
  | 'resubmitted'
  | 'cancelled';

/**
 * Submittal Type Enum
 */
export type SubmittalType = 
  | 'product_data'
  | 'shop_drawing'
  | 'sample'
  | 'mix_design'
  | 'test_report'
  | 'certification'
  | 'other';

/**
 * Submittal Priority Enum
 */
export type SubmittalPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Submittal Interface
 */
export interface Submittal {
  id: string;
  project_id: string;
  submittal_number: string;
  spec_section: string;
  submittal_title: string;
  submittal_type: SubmittalType;
  status: SubmittalStatus;
  priority: SubmittalPriority;
  due_date?: string;
  submitted_date?: string;
  reviewed_date?: string;
  approved_date?: string;
  vendor_id?: string;
  responsible_contractor?: string;
  assigned_to?: string;
  reviewer_id?: string;
  description?: string;
  comments?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  // Joined fields
  assigned_to_name?: string;
  reviewer_name?: string;
  contractor_name?: string;
  item_count?: number;
  review_count?: number;
}

/**
 * Submittal Item Interface
 */
export interface SubmittalItem {
  id: string;
  submittal_id: string;
  item_number: string;
  product_name: string;
  manufacturer?: string;
  model_number?: string;
  quantity?: number;
  unit?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Submittal Review Interface
 */
export interface SubmittalReview {
  id: string;
  submittal_id: string;
  reviewer_id: string;
  review_status: SubmittalStatus;
  comments?: string;
  reviewed_at: string;
  reviewer_name?: string;
}

/**
 * Specification Processing Status Enum
 */
export type SpecificationProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Specification Interface
 */
export interface Specification {
  id: string;
  project_id: string;
  document_name: string;
  document_type: string;
  division: string;
  section_number?: string;
  section_title?: string;
  file_path: string;
  file_size?: number;
  processing_status: SpecificationProcessingStatus;
  ai_confidence_score?: number;
  extracted_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * AI Extraction Interface
 */
export interface AIExtraction {
  id: string;
  project_id: string;
  source_document_id: string;
  extraction_type: string;
  extracted_data: {
    submittals?: Array<{
      spec_section: string;
      submittal_title: string;
      submittal_type: SubmittalType;
      items?: Array<{
        product_name: string;
        manufacturer?: string;
        model_number?: string;
        quantity?: number;
      }>;
    }>;
    [key: string]: any;
  };
  confidence_score: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * Closeout Document Type Enum
 */
export type CloseoutDocumentType = 
  | 'as_built_drawing'
  | 'warranty'
  | 'operation_manual'
  | 'maintenance_manual'
  | 'test_report'
  | 'certificate'
  | 'warranty_letter'
  | 'closeout_form'
  | 'other';

/**
 * Closeout Document Status Enum
 */
export type CloseoutDocumentStatus = 
  | 'pending'
  | 'requested'
  | 'received'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'overdue';

/**
 * Closeout Document Interface
 */
export interface CloseoutDocument {
  id: string;
  project_id: string;
  document_type: CloseoutDocumentType;
  document_title: string;
  spec_section?: string;
  subcontractor_id?: string;
  status: CloseoutDocumentStatus;
  due_date?: string;
  requested_date?: string;
  received_date?: string;
  accepted_date?: string;
  file_path?: string;
  file_size?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Joined fields
  subcontractor_name?: string;
}

/**
 * Closeout Dashboard Statistics
 */
export interface CloseoutDashboard {
  statistics: {
    total_documents: number;
    pending: number;
    requested: number;
    received: number;
    accepted: number;
    overdue: number;
    completion_percentage: number;
  };
  documentsByType: Array<{
    document_type: CloseoutDocumentType;
    total: number;
    pending: number;
    received: number;
    accepted: number;
  }>;
  subcontractorCompliance: Array<{
    subcontractor_id: string;
    subcontractor_name: string;
    total_required: number;
    received: number;
    pending: number;
    overdue: number;
    compliance_percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    document_title: string;
    status: CloseoutDocumentStatus;
    updated_at: string;
    action: string;
  }>;
}

/**
 * Outreach Campaign Interface
 */
export interface OutreachCampaign {
  id: string;
  project_id: string;
  subcontractor_id?: string;
  outreach_type: 'email' | 'phone' | 'letter';
  subject?: string;
  message_body?: string;
  documents_requested: string[];
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Closeout Package Interface
 */
export interface CloseoutPackage {
  package_id: string;
  project_id: string;
  generated_at: string;
  documents: Array<{
    document_id: string;
    document_type: CloseoutDocumentType;
    document_title: string;
    status: CloseoutDocumentStatus;
    file_path?: string;
  }>;
  summary: {
    total_documents: number;
    completed: number;
    pending: number;
    completion_percentage: number;
  };
  download_url?: string;
}

/**
 * Create Submittal Request
 */
export interface CreateSubmittalRequest {
  project_id: string;
  submittal_number: string;
  spec_section: string;
  submittal_title: string;
  submittal_type: SubmittalType;
  priority?: SubmittalPriority;
  due_date?: string;
  vendor_id?: string;
  responsible_contractor?: string;
  assigned_to?: string;
  description?: string;
  items?: Omit<SubmittalItem, 'id' | 'submittal_id' | 'created_at' | 'updated_at'>[];
}

/**
 * Update Submittal Request
 */
export interface UpdateSubmittalRequest {
  submittal_title?: string;
  submittal_type?: SubmittalType;
  priority?: SubmittalPriority;
  due_date?: string;
  vendor_id?: string;
  responsible_contractor?: string;
  assigned_to?: string;
  reviewer_id?: string;
  description?: string;
  comments?: string;
  file_path?: string;
}

/**
 * Update Submittal Status Request
 */
export interface UpdateSubmittalStatusRequest {
  status: SubmittalStatus;
  comments?: string;
}

/**
 * Upload Specification Request
 */
export interface UploadSpecificationRequest {
  project_id: string;
  document_name: string;
  document_type: string;
  division: string;
  section_number?: string;
  section_title?: string;
  file_path: string;
  file?: File;
}

/**
 * Extract Submittals Request
 */
export interface ExtractSubmittalsRequest {
  extraction_options?: {
    confidence_threshold?: number;
    include_items?: boolean;
  };
}

/**
 * Create Submittals from Extraction Request
 */
export interface CreateSubmittalsFromExtractionRequest {
  extraction_id: string;
  selected_submittals?: number[]; // Indices of submittals to create
}

/**
 * Create Closeout Document Request
 */
export interface CreateCloseoutDocumentRequest {
  project_id: string;
  document_type: CloseoutDocumentType;
  document_title: string;
  spec_section?: string;
  subcontractor_id?: string;
  due_date?: string;
  notes?: string;
}

/**
 * Update Closeout Document Request
 */
export interface UpdateCloseoutDocumentRequest {
  document_title?: string;
  status?: CloseoutDocumentStatus;
  received_date?: string;
  accepted_date?: string;
  file_path?: string;
  notes?: string;
}

/**
 * Create Outreach Campaign Request
 */
export interface CreateOutreachRequest {
  project_id: string;
  subcontractor_id?: string;
  outreach_type: 'email' | 'phone' | 'letter';
  subject?: string;
  message_body?: string;
  documents_requested: string[];
}

