/**
 * Project Data Service
 * Backend API for authoritative project data
 * 
 * Endpoints:
 * 1. GET /api/project-data/schema
 * 2. GET /api/project-data?filters=...&page=...&pageSize=...
 * 3. POST /api/project-data/template?format=csv|xlsx
 */

import { supabase } from '@/lib/supabase';
import type {
  FieldSchema,
  ProjectDataRecord,
  ProjectDataFilters,
  ProjectDataResponse,
  SchemaResponse,
  ExportTemplateParams,
  ValidationResult,
  ValidationError,
  AuthoritativeFieldName,
} from '@/types/project-data.types';
import {
  AUTHORITATIVE_FIELDS,
  DROPDOWN_VALUES,
  REQUIRED_FIELDS,
  FIELD_TYPES,
} from '@/types/project-data.types';

export class ProjectDataService {
  /**
   * Get schema definition
   * Returns ordered fields with metadata
   */
  async getSchema(): Promise<SchemaResponse> {
    const fields: FieldSchema[] = AUTHORITATIVE_FIELDS.map(name => {
      const type = FIELD_TYPES[name];
      const required = REQUIRED_FIELDS.includes(name);
      const allowedValues = type === 'dropdown' ? DROPDOWN_VALUES[name as keyof typeof DROPDOWN_VALUES] : undefined;

      return {
        name,
        type,
        required,
        description: this.getFieldDescription(name),
        example: this.getFieldExample(name),
        allowedValues: allowedValues ? [...allowedValues] : undefined,
        validation: this.getFieldValidation(name),
      };
    });

    return {
      fields,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get project data with filters and pagination
   */
  async getProjectData(
    filters: ProjectDataFilters = {},
    page: number = 1,
    pageSize: number = 100
  ): Promise<ProjectDataResponse> {
    try {
      let query = supabase
        .from('pipeline_projects')
        .select('*', { count: 'exact' })
        .eq('pipeline_type', 'opportunity');

      // Apply filters
      if (filters['Pipeline Status']) {
        query = query.eq('stage_id', this.mapPipelineStatusToStageId(filters['Pipeline Status']));
      }
      if (filters['JV']) {
        if (filters['JV'] === 'None') {
          query = query.or('is_joint_venture.is.null,is_joint_venture.eq.false');
        } else {
          query = query.eq('is_joint_venture', true);
        }
      }
      if (filters['Set Aside']) {
        query = query.eq('set_aside', filters['Set Aside'].toLowerCase().replace(/[^a-z]/g, '_'));
      }
      if (filters['Agency']) {
        query = query.ilike('agency', `%${filters['Agency']}%`);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,solicitation_number.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform to authoritative format
      const records: ProjectDataRecord[] = (data || []).map(row => this.transformToAuthoritativeFormat(row));

      return {
        data: records,
        total: count || 0,
        page,
        pageSize,
        filters,
      };
    } catch (error) {
      console.error('Error fetching project data:', error);
      throw error;
    }
  }

  /**
   * Validate project data record
   */
  validateRecord(record: Partial<ProjectDataRecord>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!record[field]) {
        errors.push({
          field,
          value: record[field],
          reason: `Required field "${field}" is missing`,
        });
      }
    }

    // Validate datatypes
    for (const [fieldName, value] of Object.entries(record)) {
      if (fieldName.startsWith('_') || !AUTHORITATIVE_FIELDS.includes(fieldName as AuthoritativeFieldName)) {
        continue;
      }

      const field = fieldName as AuthoritativeFieldName;
      const type = FIELD_TYPES[field];

      if (value === null || value === undefined) continue;

      switch (type) {
        case 'datetime': {
          if (!this.isValidISO8601(value as string)) {
            errors.push({
              field,
              value,
              reason: `Invalid datetime format. Expected ISO 8601, got: ${value}`,
            });
          }
          break;
        }

        case 'date': {
          if (!this.isValidDate(value as string)) {
            errors.push({
              field,
              value,
              reason: `Invalid date format. Expected YYYY-MM-DD, got: ${value}`,
            });
          }
          break;
        }

        case 'number': {
          const numValue = typeof value === 'number' ? value : Number(value);
          if (isNaN(numValue)) {
            errors.push({
              field,
              value,
              reason: `Invalid number. Expected numeric value, got: ${value}`,
            });
          }
          // Validate coordinate ranges
          if (field === 'Latitude' && (numValue < -90 || numValue > 90)) {
            errors.push({
              field,
              value,
              reason: `Latitude must be between -90 and 90, got: ${value}`,
            });
          }
          if (field === 'Longitude' && (numValue < -180 || numValue > 180)) {
            errors.push({
              field,
              value,
              reason: `Longitude must be between -180 and 180, got: ${value}`,
            });
          }
          break;
        }

        case 'dropdown': {
          const allowedValues = DROPDOWN_VALUES[field as keyof typeof DROPDOWN_VALUES];
          if (allowedValues && !allowedValues.includes(value as never)) {
            warnings.push(
              `Field "${field}" has value "${value}" which is not in allowed list: ${allowedValues.join(', ')}`
            );
          }
          break;
        }

        case 'url': {
          if (value && !this.isValidURL(value as string)) {
            warnings.push(`Field "${field}" has invalid URL format: ${value}`);
          }
          break;
        }
      }
    }

    // Validate coordinate pairs
    if ((record['Latitude'] && !record['Longitude']) || (!record['Latitude'] && record['Longitude'])) {
      errors.push({
        field: 'Latitude',
        value: record['Latitude'],
        reason: 'Both Latitude and Longitude must be provided together',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate export template
   */
  async generateTemplate(params: ExportTemplateParams): Promise<Blob> {
    if (params.format === 'csv') {
      return this.generateCSVTemplate();
    } else {
      return this.generateXLSXTemplate();
    }
  }

  /**
   * Generate CSV template
   */
  private generateCSVTemplate(): Blob {
    const headers = AUTHORITATIVE_FIELDS.map(field => `"${field}"`).join(',');
    const csv = headers + '\n';
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate XLSX template with README sheet
   */
  private async generateXLSXTemplate(): Promise<Blob> {
    // This would use a library like xlsx or exceljs
    // For now, return a placeholder
    const schema = await this.getSchema();
    
    // Create README content
    const readme = [
      ['Field', 'Type', 'Required', 'Allowed Values / Format', 'Example', 'Notes'],
      ...schema.fields.map(field => [
        field.name,
        field.type,
        field.required ? 'yes' : 'no',
        field.allowedValues?.join(', ') || field.validation || '',
        field.example,
        field.description,
      ]),
    ];

    // In production, use xlsx library to create actual Excel file
    // For now, return CSV as fallback
    return this.generateCSVTemplate();
  }

  /**
   * Transform database row to authoritative format
   */
  private transformToAuthoritativeFormat(row: Record<string, unknown>): ProjectDataRecord {
    const warnings: string[] = [];

    const record: ProjectDataRecord = {
      id: row.id as string,
      'Pipeline Status': this.mapStageIdToPipelineStatus(row.stage_id as string),
      'Job #': row.job_number as string || '',
      'JV': row.is_joint_venture ? 'Sawtooth JV' : 'None',
      'Set Aside': this.formatSetAside(row.set_aside as string),
      'Solicitation #': row.solicitation_number as string || null,
      'NAICS Code': row.naics_code as string || null,
      'Bid Title': row.name as string || '',
      'Address': this.formatAddress(row),
      'Zip Code': row.project_zip as string || null,
      'Project Status': row.status as string || 'Active',
      'Agency': row.agency as string || null,
      'PM': row.pm_name as string || null,
      'PreCon POC': row.precon_poc as string || null,
      'Site Visit Date/Time': row.site_visit_datetime as string || null,
      'RFI Due Date/Time': row.rfi_due_datetime as string || null,
      'Bid Due Date/Time': row.bid_due_datetime as string || '',
      '$ Magnitude (Range)': this.formatMagnitudeRange(row.value as number),
      'POP (Period of Performance, Days)': this.parsePOP(row.period_of_performance as string),
      'DTA': row.decision_target_award as string || null,
      'Bid Doc Assistance': row.bid_doc_assistance as string || 'None',
      'Latitude': row.project_latitude as number || null,
      'Longitude': row.project_longitude as number || null,
      'POC': row.external_poc as string || null,
      'Source/SAM Link': row.web_link as string || null,
      'Attachments': row.attachments as string || null,
      'Notes': row.notes as string || null,
      _warnings: warnings.length > 0 ? warnings : undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    // Add warnings for missing required fields
    for (const field of REQUIRED_FIELDS) {
      if (!record[field]) {
        warnings.push(`Required field "${field}" is missing`);
      }
    }

    return record;
  }

  // Helper methods
  private getFieldDescription(field: AuthoritativeFieldName): string {
    const descriptions: Partial<Record<AuthoritativeFieldName, string>> = {
      'Pipeline Status': 'Drives dashboards and filters',
      'Job #': 'Internal identifier',
      'JV': 'Use None if not JV',
      'Set Aside': 'Match RFP',
      'Bid Title': 'Appears on cards/maps',
      'Zip Code': 'Treat as text',
      'Project Status': 'Operational state',
      'Site Visit Date/Time': 'UTC preferred',
      'Bid Due Date/Time': 'Powers countdown timers',
      '$ Magnitude (Range)': 'Literal strings',
      'Latitude': 'If provided, must pair with Longitude',
      'POC': 'External POC',
      'Attachments': 'Store links, not files',
      'Notes': 'Site visit badge required',
    };
    return descriptions[field] || '';
  }

  private getFieldExample(field: AuthoritativeFieldName): string {
    const examples: Partial<Record<AuthoritativeFieldName, string>> = {
      'Pipeline Status': 'Bidding',
      'Job #': '26-001',
      'JV': 'Sawtooth JV',
      'Set Aside': 'SDVOSB',
      'Solicitation #': '47PF0025R0048',
      'NAICS Code': '236220',
      'Bid Title': 'U.S. Trustees 8th Floor Renovation',
      'Address': '219 S Dearborn St, Chicago, IL',
      'Zip Code': '60604',
      'Project Status': 'Active',
      'Agency': 'GSA',
      'PM': 'Jane Smith',
      'PreCon POC': 'Bill Asmar',
      'Site Visit Date/Time': '2025-11-03T14:00:00Z',
      'RFI Due Date/Time': '2025-11-10T21:00:00Z',
      'Bid Due Date/Time': '2025-11-15T19:00:00Z',
      '$ Magnitude (Range)': '$5–10M',
      'POP (Period of Performance, Days)': '365',
      'DTA': '2026-01-15',
      'Bid Doc Assistance': 'Estimating',
      'Latitude': '41.8781',
      'Longitude': '-87.6298',
      'POC': 'John Doe john@agency.gov',
      'Source/SAM Link': 'https://sam.gov/opp/ABC123',
      'Attachments': 'https://…/RFP.pdf, https://…/add1.pdf',
    };
    return examples[field] || '';
  }

  private getFieldValidation(field: AuthoritativeFieldName): string {
    const validations: Partial<Record<AuthoritativeFieldName, string>> = {
      'NAICS Code': '6 digits',
      'Site Visit Date/Time': 'ISO 8601',
      'RFI Due Date/Time': 'ISO 8601',
      'Bid Due Date/Time': 'ISO 8601',
      'POP (Period of Performance, Days)': 'positive integer',
      'DTA': 'YYYY-MM-DD',
      'Latitude': '−90..90 (decimal)',
      'Longitude': '−180..180 (decimal)',
      'Source/SAM Link': 'https://…',
    };
    return validations[field] || '';
  }

  private mapPipelineStatusToStageId(status: string): string {
    const mapping: Record<string, string> = {
      'Bidding': 'opp_proposal',
      'Submitted': 'opp_negotiation',
      'Awarded': 'opp_award',
      'Lost': 'opp_lost',
      'Pre-Solicitation': 'opp_lead_gen',
    };
    return mapping[status] || 'opp_proposal';
  }

  private mapStageIdToPipelineStatus(stageId: string): string {
    const mapping: Record<string, string> = {
      'opp_proposal': 'Bidding',
      'opp_negotiation': 'Submitted',
      'opp_award': 'Awarded',
      'opp_lost': 'Lost',
      'opp_lead_gen': 'Pre-Solicitation',
    };
    return mapping[stageId] || 'Bidding';
  }

  private formatSetAside(setAside: string | null): string | null {
    if (!setAside) return null;
    
    const mapping: Record<string, string> = {
      'sdvosb': 'SDVOSB',
      '8a': '8(a)',
      'wosb_edwosb': 'WOSB/EDWOSB',
      'hubzone': 'HUBZone',
      'sb': 'SB',
      'small_business': 'SB',
      'unrestricted': 'Unrestricted',
      'none': 'Unrestricted',
    };
    
    return mapping[setAside.toLowerCase()] || setAside;
  }

  private formatAddress(row: Record<string, unknown>): string | null {
    const parts = [
      row.project_address,
      row.project_city,
      row.project_state,
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private formatMagnitudeRange(value: number | null): string | null {
    if (!value) return null;
    
    if (value < 1000000) return '<$1M';
    if (value < 5000000) return '$1–5M';
    if (value < 10000000) return '$5–10M';
    if (value < 25000000) return '$10–25M';
    return '>$25M';
  }

  private parsePOP(pop: string | null): number | null {
    if (!pop) return null;
    const match = pop.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private isValidISO8601(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('T');
  }

  private isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isValidURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}

export const projectDataService = new ProjectDataService();