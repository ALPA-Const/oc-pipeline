// =====================================================
// OC PIPELINE - APP ROUTES CONFIGURATION
// Federal-Grade Construction Management SaaS
// Next.js App Router Structure
// =====================================================

/**
 * Route Definitions for Estimating Module
 * 
 * /estimating                    - Dashboard
 * /estimating/list               - All Estimates List
 * /estimating/new                - Create New Estimate
 * /estimating/[id]               - View Estimate Detail
 * /estimating/[id]/edit          - Edit Estimate
 * /estimating/[id]/line-items    - Line Items List
 * /estimating/[id]/line-items/new - Add Line Item
 * /estimating/[id]/line-items/[lineItemId]/edit - Edit Line Item
 * /estimating/[id]/markups       - Markups List
 * /estimating/[id]/markups/new   - Add Markup
 * /estimating/[id]/markups/[markupId]/edit - Edit Markup
 * /estimating/[id]/subcontractors - Subcontractor Quotes
 * /estimating/[id]/subcontractors/new - Add Quote
 * /estimating/[id]/subcontractors/[quoteId]/edit - Edit Quote
 * /estimating/[id]/export        - Export Options
 * /estimating/[id]/versions      - Version History
 * /estimating/templates          - Estimate Templates
 * /estimating/catalogs           - Cost Catalogs
 */

// =====================================================
// ROUTE CONSTANTS
// =====================================================

export const ROUTES = {
  // Main Module Routes
  ESTIMATING: {
    DASHBOARD: '/estimating',
    LIST: '/estimating/list',
    NEW: '/estimating/new',
    DETAIL: (id: string) => `/estimating/${id}`,
    EDIT: (id: string) => `/estimating/${id}/edit`,
    EXPORT: (id: string) => `/estimating/${id}/export`,
    VERSIONS: (id: string) => `/estimating/${id}/versions`,
    DUPLICATE: (id: string) => `/estimating/new?duplicate=${id}`,
    // AI Agentic Analysis Routes
    AI_DASHBOARD: (id: string) => `/estimating/${id}/ai`,
    AI_TAKEOFF: (id: string) => `/estimating/${id}/ai?tab=drawings`,
    AI_PRICING: (id: string) => `/estimating/${id}/ai?tab=pricing`,
    AI_RISK: (id: string) => `/estimating/${id}/ai?tab=risk`,
  },

  // Line Items
  LINE_ITEMS: {
    LIST: (estimateId: string) => `/estimating/${estimateId}/line-items`,
    NEW: (estimateId: string) => `/estimating/${estimateId}/line-items/new`,
    EDIT: (estimateId: string, lineItemId: string) =>
      `/estimating/${estimateId}/line-items/${lineItemId}/edit`,
  },

  // Markups
  MARKUPS: {
    LIST: (estimateId: string) => `/estimating/${estimateId}/markups`,
    NEW: (estimateId: string) => `/estimating/${estimateId}/markups/new`,
    EDIT: (estimateId: string, markupId: string) =>
      `/estimating/${estimateId}/markups/${markupId}/edit`,
  },

  // Subcontractor Quotes
  SUBCONTRACTORS: {
    LIST: (estimateId: string) => `/estimating/${estimateId}/subcontractors`,
    NEW: (estimateId: string) => `/estimating/${estimateId}/subcontractors/new`,
    EDIT: (estimateId: string, quoteId: string) =>
      `/estimating/${estimateId}/subcontractors/${quoteId}/edit`,
  },

  // Templates & Catalogs
  TEMPLATES: '/estimating/templates',
  CATALOGS: '/estimating/catalogs',

  // Other Modules (for navigation)
  PURSUITS: '/pursuits',
  PROJECTS: '/projects',
  PROPOSALS: '/proposals',
  CONTRACTS: '/contracts',
  DASHBOARD: '/',
} as const;

// =====================================================
// NAVIGATION CONFIG
// =====================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

export const ESTIMATING_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.ESTIMATING.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'All Estimates',
    href: ROUTES.ESTIMATING.LIST,
    icon: 'FileText',
  },
  {
    label: 'Templates',
    href: ROUTES.TEMPLATES,
    icon: 'Copy',
  },
  {
    label: 'Cost Catalogs',
    href: ROUTES.CATALOGS,
    icon: 'Database',
  },
];

export const MAIN_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'Home',
  },
  {
    label: 'Pursuits',
    href: ROUTES.PURSUITS,
    icon: 'Target',
  },
  {
    label: 'Estimating',
    href: ROUTES.ESTIMATING.DASHBOARD,
    icon: 'Calculator',
    children: ESTIMATING_NAV,
  },
  {
    label: 'Proposals',
    href: ROUTES.PROPOSALS,
    icon: 'FileEdit',
  },
  {
    label: 'Contracts',
    href: ROUTES.CONTRACTS,
    icon: 'FileCheck',
  },
];

// =====================================================
// BREADCRUMB HELPERS
// =====================================================

export interface Breadcrumb {
  label: string;
  href?: string;
}

export function getEstimateBreadcrumbs(
  estimateNumber?: string,
  estimateName?: string,
  section?: string
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Estimating', href: ROUTES.ESTIMATING.DASHBOARD },
  ];

  if (estimateNumber) {
    breadcrumbs.push({
      label: estimateNumber,
      href: section ? undefined : undefined, // Current page doesn't get href
    });

    if (section) {
      breadcrumbs.push({ label: section });
    }
  }

  return breadcrumbs;
}

// =====================================================
// PAGE METADATA
// =====================================================

export interface PageMeta {
  title: string;
  description: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  'estimating.dashboard': {
    title: 'Estimating Dashboard | OC Pipeline',
    description: 'Federal-grade construction cost estimating dashboard',
  },
  'estimating.list': {
    title: 'All Estimates | OC Pipeline',
    description: 'View and manage all construction estimates',
  },
  'estimating.new': {
    title: 'New Estimate | OC Pipeline',
    description: 'Create a new construction cost estimate',
  },
  'estimating.detail': {
    title: 'Estimate Detail | OC Pipeline',
    description: 'View estimate details and line items',
  },
  'estimating.edit': {
    title: 'Edit Estimate | OC Pipeline',
    description: 'Edit construction estimate details',
  },
  'estimating.ai': {
    title: 'AI Analysis | OC Pipeline',
    description: 'AI-powered cost estimating with market intelligence and risk analysis',
  },
  'estimating.ai.drawings': {
    title: 'AI Takeoff | OC Pipeline',
    description: 'AI-powered drawing analysis and quantity takeoff',
  },
  'estimating.ai.pricing': {
    title: 'Pricing Intelligence | OC Pipeline',
    description: 'Real-time market data and geographic cost factors',
  },
  'estimating.ai.risk': {
    title: 'Risk Auditor | OC Pipeline',
    description: 'AI-powered risk analysis and deviation flagging',
  },
};

// =====================================================
// URL HELPERS
// =====================================================

/**
 * Parse estimate ID from URL
 */
export function parseEstimateId(url: string): string | null {
  const match = url.match(/\/estimating\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Check if current route is within estimating module
 */
export function isEstimatingRoute(pathname: string): boolean {
  return pathname.startsWith('/estimating');
}

/**
 * Get active nav item based on current path
 */
export function getActiveNavItem(pathname: string): NavItem | undefined {
  const findActive = (items: NavItem[]): NavItem | undefined => {
    for (const item of items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return item;
      }
      if (item.children) {
        const child = findActive(item.children);
        if (child) return child;
      }
    }
    return undefined;
  };

  return findActive(MAIN_NAV);
}

// =====================================================
// QUERY STRING HELPERS
// =====================================================

export interface EstimateListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Build query string for estimate list
 */
export function buildEstimateListQuery(params: EstimateListParams): string {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 1) {
    searchParams.set('page', params.page.toString());
  }
  if (params.limit && params.limit !== 25) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.status) {
    searchParams.set('status', params.status);
  }
  if (params.type) {
    searchParams.set('type', params.type);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }
  if (params.direction) {
    searchParams.set('direction', params.direction);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Parse query string to params
 */
export function parseEstimateListQuery(searchParams: URLSearchParams): EstimateListParams {
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '25', 10),
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    search: searchParams.get('search') || undefined,
    sort: searchParams.get('sort') || undefined,
    direction: (searchParams.get('direction') as 'asc' | 'desc') || undefined,
  };
}
