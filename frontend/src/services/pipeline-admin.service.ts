/**
 * Pipeline Administration Service
 * Handles all backend operations for the admin module
 */

import { supabase } from '@/lib/supabase';
import {
  Project,
  ProjectFilters,
  ProjectListResponse,
  ProjectRow,
  StatusBreakdown,
  AnalyticsResponse,
  PaginationParams,
  DateRangeFilter,
  ValueRangeFilter,
  ImportResult,
  ImportError,
} from '@/types/admin.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse date range filter into SQL conditions
 */
function parseDateRange(dateRange: DateRangeFilter): { start: Date; end: Date } | null {
  if (dateRange === 'all') return null;

  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (dateRange) {
    case '30days':
      end.setDate(now.getDate() + 30);
      break;
    case '90days':
      end.setDate(now.getDate() + 90);
      break;
    case 'year':
      end.setFullYear(now.getFullYear(), 11, 31); // End of current year
      break;
  }

  return { start: now, end };
}

/**
 * Parse value range filter into min/max values
 */
function parseValueRange(valueRange: ValueRangeFilter): { min: number; max: number } | null {
  if (valueRange === 'all') return null;

  const ranges: Record<ValueRangeFilter, { min: number; max: number }> = {
    '<1M': { min: 0, max: 1000000 },
    '1-5M': { min: 1000000, max: 5000000 },
    '5-10M': { min: 5000000, max: 10000000 },
    '10-25M': { min: 10000000, max: 25000000 },
    '>25M': { min: 25000000, max: Number.MAX_SAFE_INTEGER },
    'all': { min: 0, max: Number.MAX_SAFE_INTEGER },
  };

  return ranges[valueRange];
}

/**
 * Parse sort parameter into column and direction
 */
function parseSort(sort?: string): { column: string; ascending: boolean } {
  if (!sort) return { column: 'created_at', ascending: false };

  const [column, direction] = sort.split(':');
  return {
    column: column || 'created_at',
    ascending: direction === 'asc',
  };
}

/**
 * Transform database row to API response format
 */
function transformToProjectRow(project: any): ProjectRow {
  return {
    id: project.id,
    name: project.name,
    value: project.value,
    agency: project.agency,
    status: project.status,
    dueDate: project.due_date,
    flagged: project.flagged,
    manager: project.manager,
    setAside: project.set_aside,
    location:
      project.lat && project.lng
        ? { lat: project.lat, lng: project.lng }
        : undefined,
  };
}

// ============================================================================
// Main API Methods
// ============================================================================

/**
 * Get projects list with filters, pagination, and sorting
 */
export async function getProjects(
  filters: ProjectFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 25 }
): Promise<ProjectListResponse> {
  try {
    // Enforce pagination limits
    const pageSize = Math.min(pagination.pageSize, 100);
    const page = Math.max(pagination.page, 1);
    const offset = (page - 1) * pageSize;

    // Start query
    let query = supabase.from('projects').select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.agency) {
      query = query.eq('agency', filters.agency);
    }

    if (filters.setAside) {
      query = query.eq('set_aside', filters.setAside);
    }

    if (filters.projectManager) {
      query = query.eq('manager', filters.projectManager);
    }

    if (filters.flagged !== undefined) {
      query = query.eq('flagged', filters.flagged);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const dateRange = parseDateRange(filters.dateRange);
      if (dateRange) {
        query = query
          .gte('due_date', dateRange.start.toISOString().split('T')[0])
          .lte('due_date', dateRange.end.toISOString().split('T')[0]);
      }
    }

    // Value range filter
    if (filters.valueRange && filters.valueRange !== 'all') {
      const valueRange = parseValueRange(filters.valueRange);
      if (valueRange) {
        query = query.gte('value', valueRange.min).lte('value', valueRange.max);
      }
    }

    // Search filter (name)
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Apply sorting
    const { column, ascending } = parseSort(pagination.sort);
    query = query.order(column, { ascending });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Transform to API format
    const rows = (data || []).map(transformToProjectRow);

    return {
      rows,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('getProjects error:', error);
    throw error;
  }
}

/**
 * Get status breakdown for charts
 */
export async function getStatusBreakdown(
  filters: ProjectFilters = {}
): Promise<StatusBreakdown> {
  try {
    // Build query with filters (excluding status)
    let query = supabase.from('projects').select('status');

    if (filters.agency) {
      query = query.eq('agency', filters.agency);
    }

    if (filters.setAside) {
      query = query.eq('set_aside', filters.setAside);
    }

    if (filters.projectManager) {
      query = query.eq('manager', filters.projectManager);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const dateRange = parseDateRange(filters.dateRange);
      if (dateRange) {
        query = query
          .gte('due_date', dateRange.start.toISOString().split('T')[0])
          .lte('due_date', dateRange.end.toISOString().split('T')[0]);
      }
    }

    if (filters.valueRange && filters.valueRange !== 'all') {
      const valueRange = parseValueRange(filters.valueRange);
      if (valueRange) {
        query = query.gte('value', valueRange.min).lte('value', valueRange.max);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching status breakdown:', error);
      throw new Error(`Failed to fetch status breakdown: ${error.message}`);
    }

    // Count by status
    const statusCounts: Record<string, number> = {};
    (data || []).forEach((project) => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });

    // Transform to array format
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  } catch (error) {
    console.error('getStatusBreakdown error:', error);
    throw error;
  }
}

/**
 * Get analytics data including trends and KPIs
 */
export async function getAnalytics(
  filters: ProjectFilters = {}
): Promise<AnalyticsResponse> {
  try {
    // Get all projects with filters
    let query = supabase.from('projects').select('*');

    if (filters.agency) {
      query = query.eq('agency', filters.agency);
    }

    if (filters.setAside) {
      query = query.eq('set_aside', filters.setAside);
    }

    if (filters.projectManager) {
      query = query.eq('manager', filters.projectManager);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    const allProjects = projects || [];

    // Calculate KPIs
    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter((p) =>
      ['Bidding', 'In Progress', 'Submitted'].includes(p.status)
    ).length;
    const totalPipelineValue = allProjects
      .filter((p) => ['Bidding', 'Submitted', 'In Progress'].includes(p.status))
      .reduce((sum, p) => sum + (p.value || 0), 0);

    // Calculate win rate trend (last 12 months)
    const winRateTrend = calculateWinRateTrend(allProjects);

    // Profit margin trend (placeholder - would need actual margin data)
    const profitMarginTrend = calculateProfitMarginTrend(allProjects);

    // Average margin (placeholder)
    const averageMargin = profitMarginTrend.length > 0
      ? profitMarginTrend.reduce((sum, t) => sum + t.value, 0) / profitMarginTrend.length
      : null;

    // Week-over-week changes
    const weekOverWeekChange = await calculateWeekOverWeekChange(filters);

    return {
      winRateTrend,
      profitMarginTrend,
      averageMargin,
      totalProjects,
      activeProjects,
      totalPipelineValue,
      weekOverWeekChange,
    };
  } catch (error) {
    console.error('getAnalytics error:', error);
    throw error;
  }
}

/**
 * Calculate win rate trend for last 12 months
 */
function calculateWinRateTrend(projects: any[]): Array<{ month: string; value: number }> {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const now = new Date();
  const trend: Array<{ month: string; value: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = months[date.getMonth()];

    // Filter projects for this month
    const monthProjects = projects.filter((p) => {
      const createdDate = new Date(p.created_at);
      return (
        createdDate.getMonth() === date.getMonth() &&
        createdDate.getFullYear() === date.getFullYear()
      );
    });

    const awarded = monthProjects.filter((p) => p.status === 'Awarded').length;
    const lost = monthProjects.filter((p) => p.status === 'Lost').length;
    const total = awarded + lost;

    const winRate = total > 0 ? (awarded / total) * 100 : 0;

    trend.push({
      month: monthStr,
      value: Math.round(winRate * 10) / 10, // Round to 1 decimal
    });
  }

  return trend;
}

/**
 * Calculate profit margin trend (placeholder implementation)
 */
function calculateProfitMarginTrend(projects: any[]): Array<{ month: string; value: number }> {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const now = new Date();
  const trend: Array<{ month: string; value: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = months[date.getMonth()];

    // Placeholder: Generate realistic margin data (8-15%)
    const margin = 10 + Math.random() * 5;

    trend.push({
      month: monthStr,
      value: Math.round(margin * 10) / 10,
    });
  }

  return trend;
}

/**
 * Calculate week-over-week changes
 */
async function calculateWeekOverWeekChange(filters: ProjectFilters) {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get current week data
  const currentWeekQuery = supabase
    .from('projects')
    .select('*')
    .gte('created_at', lastWeek.toISOString());

  const { data: currentWeekProjects } = await currentWeekQuery;

  // Get previous week data
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const previousWeekQuery = supabase
    .from('projects')
    .select('*')
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', lastWeek.toISOString());

  const { data: previousWeekProjects } = await previousWeekQuery;

  // Calculate changes
  const currentActive = (currentWeekProjects || []).filter((p) =>
    ['Bidding', 'In Progress', 'Submitted'].includes(p.status)
  ).length;

  const previousActive = (previousWeekProjects || []).filter((p) =>
    ['Bidding', 'In Progress', 'Submitted'].includes(p.status)
  ).length;

  const currentValue = (currentWeekProjects || [])
    .filter((p) => ['Bidding', 'Submitted', 'In Progress'].includes(p.status))
    .reduce((sum, p) => sum + (p.value || 0), 0);

  const previousValue = (previousWeekProjects || [])
    .filter((p) => ['Bidding', 'Submitted', 'In Progress'].includes(p.status))
    .reduce((sum, p) => sum + (p.value || 0), 0);

  return {
    winRate: 0, // Placeholder
    averageMargin: 0.4, // Placeholder
    totalProjects: (currentWeekProjects || []).length - (previousWeekProjects || []).length,
    activeProjects: currentActive - previousActive,
    totalPipelineValue: currentValue - previousValue,
  };
}

/**
 * Create a new project
 */
export async function createProject(project: Partial<Project>): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('createProject error:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('updateProject error:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  } catch (error) {
    console.error('deleteProject error:', error);
    throw error;
  }
}

/**
 * Bulk update projects
 */
export async function bulkUpdateProjects(
  projectIds: string[],
  updates: Partial<Project>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .in('id', projectIds);

    if (error) {
      console.error('Error bulk updating projects:', error);
      throw new Error(`Failed to bulk update projects: ${error.message}`);
    }
  } catch (error) {
    console.error('bulkUpdateProjects error:', error);
    throw error;
  }
}

/**
 * Import projects from parsed data
 */
export async function importProjects(
  projects: Partial<Project>[]
): Promise<ImportResult> {
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];

    try {
      // Check if project exists by job_no
      if (project.job_no) {
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('job_no', project.job_no)
          .single();

        if (existing) {
          // Update existing
          await updateProject(existing.id, project);
          result.updated++;
        } else {
          // Insert new
          await createProject(project);
          result.inserted++;
        }
      } else {
        // Insert new (no job_no to check)
        await createProject(project);
        result.inserted++;
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        row: i + 2, // +2 for header row and 0-index
        field: 'general',
        reason: error.message || 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Export projects to CSV/XLSX format
 */
export async function exportProjects(
  filters: ProjectFilters = {},
  format: 'csv' | 'xlsx' = 'csv'
): Promise<Blob> {
  try {
    // Get all projects with filters (no pagination)
    const { rows } = await getProjects(filters, { page: 1, pageSize: 10000 });

    // Get full project data
    const projectIds = rows.map((r) => r.id);
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (error) {
      throw new Error(`Failed to fetch projects for export: ${error.message}`);
    }

    if (format === 'csv') {
      return generateCSV(projects || []);
    } else {
      return generateXLSX(projects || []);
    }
  } catch (error) {
    console.error('exportProjects error:', error);
    throw error;
  }
}

/**
 * Generate CSV file
 */
function generateCSV(projects: any[]): Blob {
  const headers = [
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
  ];

  const rows = projects.map((p) => [
    p.status || '',
    p.job_no || '',
    p.jv ? 'Yes' : 'No',
    p.set_aside || '',
    p.solicitation_number || '',
    p.naics_code || '',
    p.name || '',
    p.address || '',
    p.zip_code || '',
    p.project_status || '',
    p.agency || '',
    p.manager || '',
    p.precon_poc || '',
    p.site_visit_datetime || '',
    p.rfi_due_datetime || '',
    p.bid_due_datetime || '',
    p.magnitude_range || '',
    p.pop_days || '',
    p.dta ? 'Yes' : 'No',
    p.bid_doc_assistance ? 'Yes' : 'No',
    p.lat || '',
    p.lng || '',
    p.poc || '',
    p.source_link || '',
    p.attachments || '',
    p.notes || '',
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate XLSX file (placeholder - would use a library like xlsx)
 */
function generateXLSX(projects: any[]): Blob {
  // This would use a library like 'xlsx' to generate proper Excel files
  // For now, return CSV as fallback
  return generateCSV(projects);
}