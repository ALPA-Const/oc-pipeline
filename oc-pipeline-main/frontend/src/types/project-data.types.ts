/**
 * Project Data Types
 * Authoritative schema for all dashboard data
 * 
 * CRITICAL: Field names and order MUST NOT be changed
 * These are the source of truth for all dashboards
 */

// 26 Authoritative Fields in EXACT order
export const AUTHORITATIVE_FIELDS = [
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
  'POP (Period of Performance, Days)',
  'DTA',
  'Bid Doc Assistance',
  'Latitude',
  'Longitude',
  'POC',
  'Source/SAM Link',
  'Attachments',
  'Notes',
] as const;

export type AuthoritativeFieldName = typeof AUTHORITATIVE_FIELDS[number];

export interface FieldSchema {
  name: AuthoritativeFieldName;
  type: 'text' | 'datetime' | 'date' | 'number' | 'dropdown' | 'url' | 'long_text';
  required: boolean;
  description: string;
  example: string;
  allowedValues?: string[];
  validation?: string;
}

export interface ProjectDataRecord {
  id: string;
  'Pipeline Status': string; // Required: Bidding, Submitted, Awarded, Lost, Pre-Solicitation
  'Job #': string; // Required
  'JV': string | null; // None, Sawtooth JV, Other JV
  'Set Aside': string | null; // SDVOSB, 8(a), WOSB/EDWOSB, HUBZone, SB, Unrestricted
  'Solicitation #': string | null;
  'NAICS Code': string | null;
  'Bid Title': string; // Required
  'Address': string | null;
  'Zip Code': string | null;
  'Project Status': string | null; // Active, On Hold, Cancelled, Complete
  'Agency': string | null;
  'PM': string | null;
  'PreCon POC': string | null;
  'Site Visit Date/Time': string | null; // ISO 8601
  'RFI Due Date/Time': string | null; // ISO 8601
  'Bid Due Date/Time': string; // Required, ISO 8601
  '$ Magnitude (Range)': string | null; // <$1M, $1–5M, $5–10M, $10–25M, >$25M
  'POP (Period of Performance, Days)': number | null;
  'DTA': string | null; // YYYY-MM-DD
  'Bid Doc Assistance': string | null; // None, Estimating, Scheduling, MEP, Roofing, Other
  'Latitude': number | null;
  'Longitude': number | null;
  'POC': string | null;
  'Source/SAM Link': string | null;
  'Attachments': string | null;
  'Notes': string | null;
  _warnings?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectDataFilters {
  'Pipeline Status'?: string;
  'JV'?: string;
  'Set Aside'?: string;
  'Agency'?: string;
  search?: string;
}

export interface ProjectDataResponse {
  data: ProjectDataRecord[];
  total: number;
  page: number;
  pageSize: number;
  filters: ProjectDataFilters;
}

export interface SchemaResponse {
  fields: FieldSchema[];
  version: string;
  lastUpdated: string;
}

export interface ExportTemplateParams {
  format: 'csv' | 'xlsx';
}

export interface ValidationError {
  field: AuthoritativeFieldName;
  value: unknown;
  reason: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Dropdown allowed values (EXACT strings)
export const DROPDOWN_VALUES = {
  'Pipeline Status': ['Bidding', 'Submitted', 'Awarded', 'Lost', 'Pre-Solicitation'],
  'JV': ['None', 'Sawtooth JV', 'Other JV'],
  'Set Aside': ['SDVOSB', '8(a)', 'WOSB/EDWOSB', 'HUBZone', 'SB', 'Unrestricted'],
  'Project Status': ['Active', 'On Hold', 'Cancelled', 'Complete'],
  '$ Magnitude (Range)': ['<$1M', '$1–5M', '$5–10M', '$10–25M', '>$25M'],
  'Bid Doc Assistance': ['None', 'Estimating', 'Scheduling', 'MEP', 'Roofing', 'Other'],
} as const;

// Required fields
export const REQUIRED_FIELDS: AuthoritativeFieldName[] = [
  'Pipeline Status',
  'Job #',
  'Bid Title',
  'Bid Due Date/Time',
];

// Field type mapping
export const FIELD_TYPES: Record<AuthoritativeFieldName, FieldSchema['type']> = {
  'Pipeline Status': 'dropdown',
  'Job #': 'text',
  'JV': 'dropdown',
  'Set Aside': 'dropdown',
  'Solicitation #': 'text',
  'NAICS Code': 'text',
  'Bid Title': 'text',
  'Address': 'text',
  'Zip Code': 'text',
  'Project Status': 'dropdown',
  'Agency': 'text',
  'PM': 'text',
  'PreCon POC': 'text',
  'Site Visit Date/Time': 'datetime',
  'RFI Due Date/Time': 'datetime',
  'Bid Due Date/Time': 'datetime',
  '$ Magnitude (Range)': 'dropdown',
  'POP (Period of Performance, Days)': 'number',
  'DTA': 'date',
  'Bid Doc Assistance': 'dropdown',
  'Latitude': 'number',
  'Longitude': 'number',
  'POC': 'text',
  'Source/SAM Link': 'url',
  'Attachments': 'text',
  'Notes': 'long_text',
};