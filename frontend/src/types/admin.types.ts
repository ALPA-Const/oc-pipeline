/**
 * Pipeline Administration Module Types
 * Canonical data model for the admin system
 */

// ============================================================================
// Core Project Types
// ============================================================================

export interface Project {
  // Core identification
  id: string;
  job_no?: string;
  name: string; // Bid Title

  // Classification
  agency?: string;
  status: ProjectStatus;
  set_aside?: string;
  manager?: string; // PM / projectManager
  flagged: boolean;

  // Dates
  due_date?: string; // ISO date string (date part only)
  due_at?: string; // ISO datetime string (full timestamp)
  created_at: string;
  updated_at: string;
  updated_by?: string;

  // Financial
  value?: number; // currency in cents or decimal

  // Location
  lat?: number;
  lng?: number;

  // Extended fields from Project Data module
  solicitation_number?: string;
  naics_code?: string;
  address?: string;
  zip_code?: string;
  project_status?: string;
  precon_poc?: string;
  site_visit_datetime?: string;
  rfi_due_datetime?: string;
  bid_due_datetime?: string;
  magnitude_range?: string;
  pop_days?: number;
  dta?: boolean;
  bid_doc_assistance?: boolean;
  jv?: boolean;
  poc?: string;
  source_link?: string;
  attachments?: string;
  notes?: string;
}

export enum ProjectStatus {
  BIDDING = 'Bidding',
  SUBMITTED = 'Submitted',
  AWARDED = 'Awarded',
  LOST = 'Lost',
  IN_PROGRESS = 'In Progress',
  PRE_SOLICITATION = 'Pre-Solicitation',
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ProjectFilters {
  status?: string;
  agency?: string;
  setAside?: string;
  flagged?: boolean;
  projectManager?: string;
  dateRange?: DateRangeFilter;
  valueRange?: ValueRangeFilter;
  search?: string;
}

export type DateRangeFilter = '30days' | '90days' | 'year' | 'all';
export type ValueRangeFilter = '<1M' | '1-5M' | '5-10M' | '10-25M' | '>25M' | 'all';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: string; // e.g., 'dueDate:asc' or 'value:desc'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProjectRow {
  id: string;
  name: string;
  value?: number;
  agency?: string;
  status: string;
  dueDate?: string;
  flagged: boolean;
  manager?: string;
  setAside?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ProjectListResponse {
  rows: ProjectRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatusBreakdownItem {
  name: string;
  value: number;
}

export type StatusBreakdown = StatusBreakdownItem[];

export interface AnalyticsTrend {
  month: string;
  value: number;
}

export interface WeekOverWeekChange {
  winRate: number;
  averageMargin: number;
  totalProjects: number;
  activeProjects: number;
  totalPipelineValue: number;
}

export interface AnalyticsResponse {
  winRateTrend: AnalyticsTrend[];
  profitMarginTrend: AnalyticsTrend[];
  averageMargin: number | null;
  totalProjects: number;
  activeProjects: number;
  totalPipelineValue: number;
  weekOverWeekChange: WeekOverWeekChange;
}

// ============================================================================
// Import/Export Types
// ============================================================================

export interface ImportError {
  row: number;
  field: string;
  reason: string;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: ImportError[];
}

export interface ExportTemplate {
  headers: string[];
  rows: Record<string, any>[];
}

// ============================================================================
// Authorization Types
// ============================================================================

export enum AdminRole {
  ADMIN = 'Admin',
  PRECON = 'Precon',
  PM = 'PM',
}

export interface AuditLog {
  userId: string;
  orgId?: string;
  action: string;
  route: string;
  timestamp: string;
  queryHash?: string;
  rowsReturned?: number;
}

// ============================================================================
// Bulk Action Types
// ============================================================================

export interface BulkActionRequest {
  projectIds: string[];
  action: BulkActionType;
  value?: any;
}

export enum BulkActionType {
  FLAG = 'flag',
  UNFLAG = 'unflag',
  CHANGE_STATUS = 'changeStatus',
  DELETE = 'delete',
}

// ============================================================================
// Template Field Definitions (26 authoritative fields)
// ============================================================================

export const TEMPLATE_FIELDS = [
  'Pipeline Status',
  'Job #',
  'JV',
  'Set Aside',
  'Solicitation #',
  'NAICS Code',
  'Bid Title',
  'Address',
  'Zip Code',
  'Project Status',
  'Agency',
  'PM',
  'PreCon POC',
  'Site Visit Date/Time',
  'RFI Due Date/Time',
  'Bid Due Date/Time',
  '$ Magnitude (Range)',
  'POP (Days)',
  'DTA',
  'Bid Doc Assistance',
  'Latitude',
  'Longitude',
  'POC',
  'Source/SAM Link',
  'Attachments',
  'Notes',
] as const;

export type TemplateField = typeof TEMPLATE_FIELDS[number];

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'coordinate';
  validate?: (value: any) => boolean;
  errorMessage?: string;
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'Pipeline Status',
    required: true,
    type: 'string',
    errorMessage: 'Pipeline Status is required',
  },
  {
    field: 'Job #',
    required: true,
    type: 'string',
    errorMessage: 'Job # is required',
  },
  {
    field: 'Bid Due Date/Time',
    required: true,
    type: 'datetime',
    errorMessage: 'Bid Due Date/Time must be a valid ISO datetime',
  },
  {
    field: 'Latitude',
    required: false,
    type: 'coordinate',
    validate: (val) => val === null || val === undefined || (typeof val === 'number' && val >= -90 && val <= 90),
    errorMessage: 'Latitude must be between -90 and 90',
  },
  {
    field: 'Longitude',
    required: false,
    type: 'coordinate',
    validate: (val) => val === null || val === undefined || (typeof val === 'number' && val >= -180 && val <= 180),
    errorMessage: 'Longitude must be between -180 and 180',
  },
];