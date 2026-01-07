// ============================================================
// OC PIPELINE - CORE TYPE DEFINITIONS
// Pipeline Intelligence & Pursuit Platform
// ============================================================

// ============================================================
// OPPORTUNITY TYPES
// ============================================================

export interface Opportunity {
  id: string;
  
  // External identifiers
  notice_id: string | null;
  solicitation_number: string | null;
  
  // Core metadata
  title: string;
  description: string | null;
  
  // Classification
  type: OpportunityType | null;
  set_aside_type: SetAsideType | null;
  competition_type: string | null;
  contract_type: ContractType | null;
  
  // Codes
  naics_code: string | null;
  naics_description: string | null;
  psc_code: string | null;
  psc_description: string | null;
  
  // Value
  estimated_value_low: number | null;
  estimated_value_high: number | null;
  award_value: number | null;
  
  // Dates
  posted_date: string | null;
  response_deadline: string | null;
  archive_date: string | null;
  award_date: string | null;
  
  // Location
  place_city: string | null;
  place_state: string | null;
  place_zip: string | null;
  place_country: string;
  
  // Relations (IDs)
  agency_id: string | null;
  sub_agency_id: string | null;
  office_id: string | null;
  vehicle_id: string | null;
  
  // Status
  status: 'active' | 'archived' | 'cancelled' | 'awarded';
  source: string;
  source_url: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
  
  // Expanded relations (when joined)
  agency?: Agency;
  sub_agency?: Agency;
  contacts?: OpportunityContact[];
  amendments?: OpportunityAmendment[];
  documents?: Document[];
  pursuit?: Pursuit | null;
}

export type OpportunityType = 
  | 'Solicitation'
  | 'Award Notice'
  | 'Sources Sought'
  | 'Special Notice'
  | 'Pre-Solicitation'
  | 'Combined Synopsis/Solicitation'
  | 'Modification'
  | 'Justification';

export type SetAsideType =
  | 'Total Small Business'
  | '8(a)'
  | 'SDVOSB'
  | 'WOSB'
  | 'EDWOSB'
  | 'HUBZone'
  | 'Partial Small Business'
  | 'None'
  | null;

export type ContractType =
  | 'FFP'      // Firm Fixed Price
  | 'CPFF'     // Cost Plus Fixed Fee
  | 'CPIF'     // Cost Plus Incentive Fee
  | 'T&M'      // Time & Materials
  | 'IDIQ'     // Indefinite Delivery/Indefinite Quantity
  | 'BPA'      // Blanket Purchase Agreement
  | 'GWAC'     // Government-Wide Acquisition Contract
  | 'Other';

export interface OpportunityContact {
  id: string;
  opportunity_id: string;
  contact_type: 'Primary' | 'Contracting Officer' | 'Technical' | 'Other' | null;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface OpportunityAmendment {
  id: string;
  opportunity_id: string;
  amendment_number: string | null;
  amendment_date: string | null;
  description: string | null;
  changes: Record<string, any> | null;
  created_at: string;
}


// ============================================================
// ENTITY TYPES (Agencies, Vendors, Vehicles)
// ============================================================

export interface Agency {
  id: string;
  agency_code: string | null;
  cgac_code: string | null;
  name: string;
  abbreviation: string | null;
  type: 'Cabinet' | 'Independent' | 'Sub-agency' | null;
  parent_agency_id: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  
  // Expanded
  parent_agency?: Agency;
  sub_agencies?: Agency[];
  offices?: Office[];
}

export interface Office {
  id: string;
  agency_id: string | null;
  office_code: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  uei: string | null;
  cage_code: string | null;
  duns: string | null;
  name: string;
  dba_name: string | null;
  business_types: string[];
  naics_codes: string[];
  size_standard: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  website: string | null;
  phone: string | null;
  is_competitor: boolean;
  is_partner: boolean;
  is_teaming_target: boolean;
  created_at: string;
  updated_at: string;
  
  // Expanded
  awards?: Award[];
  vehicles?: ContractVehicle[];
}

export interface ContractVehicle {
  id: string;
  vehicle_number: string | null;
  piid: string | null;
  name: string;
  description: string | null;
  type: 'IDIQ' | 'GWAC' | 'BPA' | 'FSS' | null;
  awarding_agency_id: string | null;
  award_date: string | null;
  start_date: string | null;
  end_date: string | null;
  ordering_period_end: string | null;
  ceiling_value: number | null;
  obligated_value: number | null;
  created_at: string;
  updated_at: string;
  
  // Expanded
  awarding_agency?: Agency;
  holders?: Vendor[];
}

export interface Award {
  id: string;
  piid: string | null;
  award_id: string | null;
  referenced_idv_piid: string | null;
  opportunity_id: string | null;
  vehicle_id: string | null;
  vendor_id: string | null;
  agency_id: string | null;
  title: string | null;
  description: string | null;
  base_value: number | null;
  total_value: number | null;
  obligated_amount: number | null;
  award_date: string | null;
  start_date: string | null;
  end_date: string | null;
  current_end_date: string | null;
  award_type: string | null;
  set_aside_type: SetAsideType;
  competition_type: string | null;
  place_city: string | null;
  place_state: string | null;
  place_country: string;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  
  // Expanded
  opportunity?: Opportunity;
  vehicle?: ContractVehicle;
  vendor?: Vendor;
  agency?: Agency;
}

export interface Incumbent {
  id: string;
  opportunity_id: string | null;
  agency_id: string | null;
  naics_code: string | null;
  vendor_id: string;
  award_id: string | null;
  confidence_level: 'high' | 'medium' | 'low' | 'inferred';
  source: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  
  // Expanded
  vendor?: Vendor;
  award?: Award;
}


// ============================================================
// PURSUIT & PIPELINE TYPES
// ============================================================

export interface PipelineStage {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sequence: number;
  stage_type: 'discovery' | 'capture' | 'bid' | 'award' | 'execution' | null;
  color: string;
  icon: string | null;
  is_terminal: boolean;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Pursuit {
  id: string;
  opportunity_id: string | null;
  manual_entry: boolean;
  
  // Override fields
  title: string | null;
  description: string | null;
  estimated_value: number | null;
  response_deadline: string | null;
  
  // Pipeline state
  stage_id: string;
  stage_entered_at: string;
  
  // Win probability
  win_probability: number | null;
  probability_source: 'manual' | 'ai_calculated';
  probability_confidence: 'high' | 'medium' | 'low' | null;
  
  // Ownership
  owner_id: string | null;
  capture_manager_id: string | null;
  proposal_manager_id: string | null;
  
  // Decision
  go_no_go_decision: 'pending' | 'go' | 'no_go' | 'conditional' | null;
  go_no_go_date: string | null;
  go_no_go_notes: string | null;
  
  // Bid details
  bid_amount: number | null;
  bid_submitted_at: string | null;
  
  // Outcome
  outcome: 'won' | 'lost' | 'cancelled' | 'withdrawn' | null;
  outcome_date: string | null;
  outcome_notes: string | null;
  award_amount: number | null;
  
  // Flags
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_archived: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Expanded
  opportunity?: Opportunity;
  stage?: PipelineStage;
  tasks?: PursuitTask[];
  team?: PursuitTeamMember[];
  stage_history?: PursuitStageHistory[];
}

export interface PursuitStageHistory {
  id: string;
  pursuit_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
  
  // Expanded
  from_stage?: PipelineStage;
  to_stage?: PipelineStage;
}

export interface PursuitTask {
  id: string;
  pursuit_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  sequence: number | null;
  created_at: string;
  created_by: string | null;
}

export interface PursuitTeamMember {
  id: string;
  pursuit_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

export interface Document {
  id: string;
  filename: string;
  original_filename: string | null;
  file_extension: string | null;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  storage_bucket: string;
  document_type: DocumentType | null;
  document_category: DocumentCategory | null;
  classification_confidence: number | null;
  classified_at: string | null;
  classified_by: 'ai' | 'manual' | null;
  source: string | null;
  source_url: string | null;
  version: number;
  parent_document_id: string | null;
  is_latest: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at: string | null;
  processing_error: string | null;
  extracted_text: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
  
  // Expanded
  links?: DocumentLink[];
  sections?: DocumentSection[];
  extractions?: DocumentExtraction[];
}

export type DocumentType =
  | 'RFP'
  | 'RFQ'
  | 'RFI'
  | 'Amendment'
  | 'SOW'
  | 'PWS'
  | 'Specifications'
  | 'Drawings'
  | 'Attachment'
  | 'Q&A'
  | 'Award Notice'
  | 'Other';

export type DocumentCategory =
  | 'Solicitation'
  | 'Proposal'
  | 'Contract'
  | 'Modification'
  | 'Correspondence'
  | 'Internal';

export interface DocumentLink {
  id: string;
  document_id: string;
  linked_entity_type: 'opportunity' | 'pursuit' | 'agency' | 'vendor' | 'award' | 'vehicle';
  linked_entity_id: string;
  link_type: 'primary' | 'attachment' | 'reference' | null;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface DocumentSection {
  id: string;
  document_id: string;
  section_type: string | null;
  section_title: string | null;
  section_number: string | null;
  content: string | null;
  page_start: number | null;
  page_end: number | null;
  extraction_confidence: number | null;
  extracted_at: string | null;
  created_at: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string | null;
  field_type: 'date' | 'currency' | 'text' | 'list' | null;
  page_number: number | null;
  location_context: string | null;
  confidence: number | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}


// ============================================================
// SEARCH & ALERT TYPES
// ============================================================

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: SearchFilters;
  alert_enabled: boolean;
  alert_frequency: 'immediate' | 'daily' | 'weekly';
  last_alert_sent_at: string | null;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  keywords?: string[];
  naics_codes?: string[];
  psc_codes?: string[];
  set_asides?: SetAsideType[];
  agencies?: string[];  // Agency IDs
  states?: string[];
  cities?: string[];
  value_min?: number;
  value_max?: number;
  posted_after?: string;
  posted_before?: string;
  deadline_after?: string;
  deadline_before?: string;
  opportunity_types?: OpportunityType[];
  exclude_archived?: boolean;
}

export interface SearchAlert {
  id: string;
  saved_search_id: string;
  opportunity_ids: string[];
  opportunity_count: number;
  sent_at: string | null;
  delivery_method: 'email' | 'in_app';
  delivery_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

// ============================================================
// AI INTELLIGENCE TYPES
// ============================================================

export interface AIAnalysis {
  id: string;
  entity_type: 'opportunity' | 'pursuit' | 'document';
  entity_id: string;
  analysis_type: AIAnalysisType;
  result: AIAnalysisResult;
  confidence_score: number | null;
  explanation: string | null;
  model_used: string | null;
  model_version: string | null;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export type AIAnalysisType =
  | 'risk_assessment'
  | 'win_probability'
  | 'incumbent_match'
  | 'gap_analysis'
  | 'competitive_analysis'
  | 'document_summary';

export interface AIAnalysisResult {
  // Risk Assessment
  overall_score?: number;
  risk_factors?: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  
  // Win Probability
  probability?: number;
  factors_positive?: string[];
  factors_negative?: string[];
  
  // Incumbent Match
  incumbents?: Array<{
    vendor_id: string;
    vendor_name: string;
    match_score: number;
    supporting_awards: string[];
  }>;
  
  // Gap Analysis
  gaps?: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    recommendation: string;
  }>;
  
  // Generic
  recommendations?: string[];
  summary?: string;
}

export interface AIRecommendation {
  id: string;
  analysis_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  recommendation_type: 'pursue' | 'avoid' | 'investigate' | 'team_with' | 'action';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  urgency: 'immediate' | 'soon' | 'whenever' | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  actioned_by: string | null;
  actioned_at: string | null;
  action_notes: string | null;
  created_at: string;
}

// ============================================================
// ACTIVITY & AUDIT TYPES
// ============================================================

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: 'create' | 'update' | 'delete' | 'view' | 'import' | 'export' | 'stage_change';
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  changes: Record<string, { old: any; new: any }> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  parent_comment_id: string | null;
  user_id: string;
  edited_at: string | null;
  created_at: string;
  
  // Expanded
  replies?: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;  // null = org-wide
  created_at: string;
}

// ============================================================
// PIPELINE VIEW TYPES (for UI)
// ============================================================

export interface PipelineColumn {
  stage: PipelineStage;
  pursuits: Pursuit[];
  count: number;
  totalValue: number;
}

export interface OpportunitySearchResult {
  opportunity: Opportunity;
  matchScore?: number;
  highlights?: {
    field: string;
    matches: string[];
  }[];
}

export interface DashboardMetrics {
  totalOpportunities: number;
  activePursuits: number;
  pursuitsByStage: Record<string, number>;
  totalPipelineValue: number;
  upcomingDeadlines: Array<{
    pursuit: Pursuit;
    daysRemaining: number;
  }>;
  recentActivity: ActivityLogEntry[];
  winRate: number;
}
