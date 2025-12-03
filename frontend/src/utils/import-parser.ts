/**
 * Import Parser for CSV/XLSX files
 * Validates and transforms uploaded files into Project objects
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Project,
  ImportError,
  TEMPLATE_FIELDS,
  VALIDATION_RULES,
} from '@/types/admin.types';

// ============================================================================
// Type Definitions
// ============================================================================

interface ParsedRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface ParseResult {
  data: Partial<Project>[];
  errors: ImportError[];
}

// ============================================================================
// Field Mapping (Template → Database)
// ============================================================================

const FIELD_MAPPING: Record<string, keyof Project> = {
  'Pipeline Status': 'status',
  'Job #': 'job_no',
  'JV': 'jv',
  'Set Aside': 'set_aside',
  'Solicitation #': 'solicitation_number',
  'NAICS Code': 'naics_code',
  'Bid Title': 'name',
  'Address': 'address',
  'Zip Code': 'zip_code',
  'Project Status': 'project_status',
  'Agency': 'agency',
  'PM': 'manager',
  'PreCon POC': 'precon_poc',
  'Site Visit Date/Time': 'site_visit_datetime',
  'RFI Due Date/Time': 'rfi_due_datetime',
  'Bid Due Date/Time': 'bid_due_datetime',
  '$ Magnitude (Range)': 'magnitude_range',
  'POP (Days)': 'pop_days',
  'DTA': 'dta',
  'Bid Doc Assistance': 'bid_doc_assistance',
  'Latitude': 'lat',
  'Longitude': 'lng',
  'POC': 'poc',
  'Source/SAM Link': 'source_link',
  'Attachments': 'attachments',
  'Notes': 'notes',
};

// ============================================================================
// Main Parser Functions
// ============================================================================

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseResult = processRows(results.data as ParsedRow[]);
        resolve(parseResult);
      },
      error: (error: Error) => {
        resolve({
          data: [],
          errors: [
            {
              row: 0,
              field: 'file',
              reason: `CSV parsing error: ${error.message}`,
            },
          ],
        });
      },
    });
  });
}

/**
 * Parse XLSX file
 */
export async function parseXLSX(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet (Template sheet)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        }) as ParsedRow[];

        const parseResult = processRows(jsonData);
        resolve(parseResult);
      } catch (error) {
        const err = error as Error;
        resolve({
          data: [],
          errors: [
            {
              row: 0,
              field: 'file',
              reason: `XLSX parsing error: ${err.message}`,
            },
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        errors: [
          {
            row: 0,
            field: 'file',
            reason: 'Failed to read file',
          },
        ],
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Main entry point - auto-detect file type and parse
 */
export async function parseImportFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseXLSX(file);
  } else {
    return {
      data: [],
      errors: [
        {
          row: 0,
          field: 'file',
          reason: 'Unsupported file format. Please upload CSV or XLSX file.',
        },
      ],
    };
  }
}

// ============================================================================
// Row Processing
// ============================================================================

/**
 * Process parsed rows into Project objects
 */
function processRows(rows: ParsedRow[]): ParseResult {
  const data: Partial<Project>[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for header row and 0-index

    try {
      // Transform row to Project object
      const project = transformRow(row, rowNumber, errors);

      // Validate project
      const validationErrors = validateProject(project, rowNumber);
      errors.push(...validationErrors);

      // Only add if no critical errors
      if (validationErrors.length === 0) {
        data.push(project);
      }
    } catch (error) {
      const err = error as Error;
      errors.push({
        row: rowNumber,
        field: 'general',
        reason: err.message || 'Unknown error processing row',
      });
    }
  });

  return { data, errors };
}

/**
 * Transform parsed row to Project object
 */
function transformRow(
  row: ParsedRow,
  rowNumber: number,
  errors: ImportError[]
): Partial<Project> {
  const project: Partial<Project> = {};

  // Map each template field to database field
  Object.entries(FIELD_MAPPING).forEach(([templateField, dbField]) => {
    const value = row[templateField];

    if (value === undefined || value === null || value === '') {
      return; // Skip empty values
    }

    try {
      // Type conversion based on field
      switch (dbField) {
        case 'jv':
        case 'dta':
        case 'bid_doc_assistance':
          (project as Record<string, boolean>)[dbField] = parseBoolean(value);
          break;

        case 'pop_days':
          (project as Record<string, number>)[dbField] = parseInt(String(value), 10);
          break;

        case 'lat':
        case 'lng':
          (project as Record<string, number>)[dbField] = parseFloat(String(value));
          break;

        case 'site_visit_datetime':
        case 'rfi_due_datetime':
        case 'bid_due_datetime':
          (project as Record<string, string>)[dbField] = parseDateTime(value);
          break;

        default:
          (project as Record<string, string>)[dbField] = String(value).trim();
      }
    } catch (error) {
      const err = error as Error;
      errors.push({
        row: rowNumber,
        field: templateField,
        reason: `Invalid value: ${err.message}`,
      });
    }
  });

  // Set default values
  project.flagged = false;
  project.created_at = new Date().toISOString();
  project.updated_at = new Date().toISOString();

  return project;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate project against rules
 */
function validateProject(
  project: Partial<Project>,
  rowNumber: number
): ImportError[] {
  const errors: ImportError[] = [];

  VALIDATION_RULES.forEach((rule) => {
    const dbField = FIELD_MAPPING[rule.field];
    const value = project[dbField];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        row: rowNumber,
        field: rule.field,
        reason: rule.errorMessage || `${rule.field} is required`,
      });
      return;
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Custom validation
    if (rule.validate && !rule.validate(value)) {
      errors.push({
        row: rowNumber,
        field: rule.field,
        reason: rule.errorMessage || `Invalid ${rule.field}`,
      });
    }
  });

  // Coordinate pair validation
  if (
    (project.lat !== undefined && project.lng === undefined) ||
    (project.lat === undefined && project.lng !== undefined)
  ) {
    errors.push({
      row: rowNumber,
      field: 'Latitude/Longitude',
      reason: 'Both Latitude and Longitude must be provided together',
    });
  }

  // Status validation
  const validStatuses = [
    'Bidding',
    'Submitted',
    'Awarded',
    'Lost',
    'In Progress',
    'Pre-Solicitation',
  ];
  if (project.status && !validStatuses.includes(project.status)) {
    errors.push({
      row: rowNumber,
      field: 'Pipeline Status',
      reason: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  return errors;
}

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Parse boolean value from various formats
 */
function parseBoolean(value: string | number | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;

  const str = String(value).toLowerCase().trim();
  return ['yes', 'true', '1', 'y'].includes(str);
}

/**
 * Parse datetime string to ISO format
 */
function parseDateTime(value: string | number | boolean | null | undefined): string {
  if (!value) return '';

  try {
    // Try parsing as ISO string
    const date = new Date(String(value));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try parsing common formats
    // MM/DD/YYYY HH:MM
    const match = String(value).match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/
    );
    if (match) {
      const [, month, day, year, hour, minute] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
      return date.toISOString();
    }

    throw new Error('Invalid date format');
  } catch (error) {
    throw new Error(
      'Invalid datetime. Expected ISO format (YYYY-MM-DDTHH:MM:SS) or MM/DD/YYYY HH:MM'
    );
  }
}

// ============================================================================
// Template Generation
// ============================================================================

/**
 * Generate empty template CSV
 */
export function generateTemplateCSV(): Blob {
  const headers = TEMPLATE_FIELDS.join(',');
  const csvContent = headers + '\n';

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate template XLSX with README sheet
 */
export function generateTemplateXLSX(): Blob {
  const workbook = XLSX.utils.book_new();

  // Template sheet - convert readonly array to mutable array
  const templateHeaders = [...TEMPLATE_FIELDS];
  const templateData = [templateHeaders];
  const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
  
  // Freeze header row
  if (!templateSheet['!freeze']) {
    templateSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  }
  
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template');

  // README sheet
  const readmeData = [
    ['Pipeline Administration Import Template'],
    [''],
    ['Field Definitions:'],
    [''],
    ['Pipeline Status', 'REQUIRED', 'Bidding | Submitted | Awarded | Lost | In Progress | Pre-Solicitation'],
    ['Job #', 'REQUIRED', 'Internal tracking number'],
    ['JV', 'Optional', 'Yes/No - Joint Venture'],
    ['Set Aside', 'Optional', 'SDVOSB, 8(a), HUBZone, Woman-Owned, Small Business, None'],
    ['Solicitation #', 'Optional', 'Government solicitation number'],
    ['NAICS Code', 'Optional', '6-digit NAICS code'],
    ['Bid Title', 'Optional', 'Project name/title'],
    ['Address', 'Optional', 'Project address'],
    ['Zip Code', 'Optional', 'Project zip code'],
    ['Project Status', 'Optional', 'Current project status'],
    ['Agency', 'Optional', 'Government agency'],
    ['PM', 'Optional', 'Project Manager name'],
    ['PreCon POC', 'Optional', 'Preconstruction Point of Contact'],
    ['Site Visit Date/Time', 'Optional', 'ISO datetime (YYYY-MM-DDTHH:MM:SS)'],
    ['RFI Due Date/Time', 'Optional', 'ISO datetime (YYYY-MM-DDTHH:MM:SS)'],
    ['Bid Due Date/Time', 'REQUIRED', 'ISO datetime (YYYY-MM-DDTHH:MM:SS)'],
    ['$ Magnitude (Range)', 'Optional', '<1M | 1-5M | 5-10M | 10-25M | >25M'],
    ['POP (Days)', 'Optional', 'Period of Performance in days (number)'],
    ['DTA', 'Optional', 'Yes/No - Design-to-Award'],
    ['Bid Doc Assistance', 'Optional', 'Yes/No'],
    ['Latitude', 'Optional', 'Decimal degrees (-90 to 90), must pair with Longitude'],
    ['Longitude', 'Optional', 'Decimal degrees (-180 to 180), must pair with Latitude'],
    ['POC', 'Optional', 'Point of Contact'],
    ['Source/SAM Link', 'Optional', 'URL to SAM.gov or source'],
    ['Attachments', 'Optional', 'Attachment references'],
    ['Notes', 'Optional', 'Additional notes'],
    [''],
    ['Notes:'],
    ['- Required fields: Pipeline Status, Job #, Bid Due Date/Time'],
    ['- Latitude and Longitude must both be provided if either is present'],
    ['- Boolean fields accept: Yes/No, True/False, 1/0, Y/N'],
    ['- Datetime fields should be in ISO format: YYYY-MM-DDTHH:MM:SS'],
    ['- If Job # matches existing project, it will be updated; otherwise inserted'],
  ];
  
  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeData);
  XLSX.utils.book_append_sheet(workbook, readmeSheet, 'README');

  // Generate binary string
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

  // Convert to blob
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xff;
  }

  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download template file
 */
export function downloadTemplate(format: 'csv' | 'xlsx' = 'xlsx'): void {
  const blob = format === 'csv' ? generateTemplateCSV() : generateTemplateXLSX();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pipeline_import_template.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}