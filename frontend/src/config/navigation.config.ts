// ============================================================
// OC PIPELINE - NAVIGATION CONFIGURATION v2
// Header-Based Group Navigation (Procore-Style)
// ============================================================

import {
  Building2,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShoppingCart,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Bot,
  Package,
  HelpCircle,
  Send,
  ClipboardList,
  TrendingUp,
  FileCheck,
  BarChart3,
  Calculator,
  Flag,
  Layers,
  FolderOpen,
  Briefcase,
  PenTool,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

export interface SubPageConfig {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  rolesAllowed?: string[];
}

export interface ModuleConfig {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  rolesAllowed?: string[];
  description?: string;
  subPages?: SubPageConfig[];
}

export interface GroupConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  rolesAllowed: string[];
  modules: ModuleConfig[];
}


// ============================================================
// GROUP CONFIGURATION
// Header-based navigation groups
// ============================================================

export const NAVIGATION_GROUPS: GroupConfig[] = [
  // ----------------------------------------------------------
  // PROJECT OPERATIONS
  // ----------------------------------------------------------
  {
    key: 'project-operations',
    label: 'Project Operations',
    icon: Building2,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'preconstruction',
        label: 'Preconstruction',
        path: '/preconstruction',
        icon: Building2,
        description: 'Pursuits, bids, and pre-award activities',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: Building2 },
          { key: 'pursuits', label: 'Pursuits', path: '/pursuits', icon: Flag },
          { key: 'bid-packages', label: 'Bid Packages', path: '/bid-packages', icon: Package },
          { key: 'go-no-go', label: 'Go / No-Go', path: '/go-no-go', icon: CheckCircle2 },
        ],
      },
      {
        key: 'submittals',
        label: 'Submittals',
        path: '/submittals',
        icon: Send,
        description: 'Submittal tracking and approvals',
      },
      {
        key: 'rfis',
        label: 'RFIs',
        path: '/rfis',
        icon: HelpCircle,
        description: 'Requests for information',
      },
      {
        key: 'drawings',
        label: 'Drawings',
        path: '/drawings',
        icon: Layers,
        description: 'Drawing sets and revisions',
      },
      {
        key: 'resources',
        label: 'Resources',
        path: '/resources',
        icon: Users,
        description: 'Team and resource management',
      },
      {
        key: 'communications',
        label: 'Communications',
        path: '/communications',
        icon: MessageSquare,
        description: 'Project communications',
      },
    ],
  },


  // ----------------------------------------------------------
  // PLANNING & LOGISTICS
  // ----------------------------------------------------------
  {
    key: 'planning-logistics',
    label: 'Planning & Logistics',
    icon: Calendar,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'schedule',
        label: 'Schedule',
        path: '/schedule',
        icon: Calendar,
        description: 'Project scheduling and milestones',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: Calendar },
          { key: 'gantt', label: 'Gantt Chart', path: '/gantt', icon: BarChart3 },
          { key: 'milestones', label: 'Milestones', path: '/milestones', icon: Flag },
          { key: 'lookahead', label: 'Lookahead', path: '/lookahead', icon: TrendingUp },
        ],
      },
      {
        key: 'procurement',
        label: 'Procurement',
        path: '/procurement',
        icon: ShoppingCart,
        description: 'Procurement and vendor management',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: ShoppingCart },
          { key: 'vendors', label: 'Vendors', path: '/vendors', icon: Briefcase },
          { key: 'purchase-orders', label: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
        ],
      },
      {
        key: 'resource-planning',
        label: 'Resources',
        path: '/resources',
        icon: Users,
        description: 'Workforce and equipment planning',
      },
    ],
  },

  // ----------------------------------------------------------
  // QUALITY, SAFETY & RISK
  // ----------------------------------------------------------
  {
    key: 'quality-safety-risk',
    label: 'Quality, Safety & Risk',
    icon: Shield,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'quality',
        label: 'Quality',
        path: '/quality',
        icon: CheckCircle2,
        description: 'Quality control and inspections',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: CheckCircle2 },
          { key: 'inspections', label: 'Inspections', path: '/inspections', icon: ClipboardList },
          { key: 'punch-list', label: 'Punch List', path: '/punch-list', icon: FileCheck },
        ],
      },
      {
        key: 'safety',
        label: 'Safety',
        path: '/safety',
        icon: Shield,
        description: 'Safety management and incidents',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: Shield },
          { key: 'incidents', label: 'Incidents', path: '/incidents', icon: AlertTriangle },
          { key: 'observations', label: 'Observations', path: '/observations', icon: FileText },
        ],
      },
      {
        key: 'risk',
        label: 'Risk',
        path: '/risk',
        icon: AlertTriangle,
        description: 'Risk identification and mitigation',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: AlertTriangle },
          { key: 'register', label: 'Risk Register', path: '/register', icon: ClipboardList },
          { key: 'mitigation', label: 'Mitigation Plans', path: '/mitigation', icon: Shield },
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // FIELD OPERATIONS
  // ----------------------------------------------------------
  {
    key: 'field-operations',
    label: 'Field Operations',
    icon: ClipboardList,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'daily-logs',
        label: 'Daily Logs',
        path: '/field/daily-logs',
        icon: FileText,
        description: 'Daily project logs',
      },
      {
        key: 'field-reporting',
        label: 'Field Reporting',
        path: '/field/reporting',
        icon: BarChart3,
        description: 'Field activity reporting',
      },
      {
        key: 'observations',
        label: 'Observations',
        path: '/field/observations',
        icon: AlertTriangle,
        description: 'Quality and safety observations',
      },
      {
        key: 'photos',
        label: 'Photos',
        path: '/field/photos',
        icon: Layers,
        description: 'Project photo documentation',
      },
      {
        key: 'punchlist',
        label: 'Punchlist',
        path: '/field/punchlist',
        icon: CheckCircle2,
        description: 'Punchlist item tracking',
      },
      {
        key: 'inspections',
        label: 'Inspections',
        path: '/field/inspections',
        icon: ClipboardList,
        description: 'Project inspections',
      },
    ],
  },


  // ----------------------------------------------------------
  // ESTIMATING & QUANTIFICATION
  // ----------------------------------------------------------
  {
    key: 'estimating-quantification',
    label: 'Estimating & Quantification',
    icon: Calculator,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'takeoff',
        label: 'Takeoff Intelligence',
        path: '/takeoff',
        icon: Bot,
        description: 'AI-powered material takeoffs',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: Bot },
          { key: 'new-takeoff', label: 'New Takeoff', path: '/new', icon: PenTool },
          { key: 'history', label: 'History', path: '/history', icon: FileText },
        ],
      },
      {
        key: 'estimating',
        label: 'Estimating',
        path: '/estimating',
        icon: Calculator,
        description: 'AI agentic estimating system',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: Calculator },
          { key: 'new-estimate', label: 'New Estimate', path: '/new', icon: PenTool },
          { key: 'estimates', label: 'All Estimates', path: '/list', icon: FileText },
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // COMMERCIAL & FINANCIAL MANAGEMENT
  // ----------------------------------------------------------
  {
    key: 'financials',
    label: 'Financials',
    icon: DollarSign,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'budget',
        label: 'Budget',
        path: '/budget',
        icon: BarChart3,
        description: 'Project budgets and tracking',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: BarChart3 },
          { key: 'line-items', label: 'Line Items', path: '/line-items', icon: ClipboardList },
          { key: 'forecasting', label: 'Forecasting', path: '/forecasting', icon: TrendingUp },
        ],
      },
      {
        key: 'financials',
        label: 'Financials',
        path: '/financial',
        icon: DollarSign,
        description: 'Financial management and reporting',
        subPages: [
          { key: 'overview', label: 'Overview', path: '', icon: DollarSign },
          { key: 'invoices', label: 'Invoices', path: '/invoices', icon: FileText },
          { key: 'payments', label: 'Payments', path: '/payments', icon: ClipboardList },
        ],
      },
      {
        key: 'change-orders',
        label: 'Change Orders',
        path: '/change-orders',
        icon: FileCheck,
        description: 'Change order management',
      },
    ],
  },


  // ----------------------------------------------------------
  // CONTRACT ADMINISTRATION
  // ----------------------------------------------------------
  {
    key: 'contract-administration',
    label: 'Contract Administration',
    icon: FileText,
    rolesAllowed: ['*'],
    modules: [
      {
        key: 'loi',
        label: 'Letter of Intent',
        path: '/contracts/loi',
        icon: FileText,
        description: 'Letter of Intent management',
      },
      {
        key: 'repository',
        label: 'Contract Repository (e-sign)',
        path: '/contracts/repository',
        icon: FolderOpen,
        description: 'Digital contract storage and signatures',
      },
      {
        key: 'commitments',
        label: 'Commitments',
        path: '/contracts/commitments',
        icon: Briefcase,
        description: 'Project commitments tracking',
      },
      {
        key: 'compliance',
        label: 'Compliance Checklists',
        path: '/contracts/compliance',
        icon: CheckCircle2,
        description: 'Compliance verification',
      },
      {
        key: 'correspondence',
        label: 'Correspondence',
        path: '/contracts/correspondence',
        icon: MessageSquare,
        description: 'Project correspondence logs',
      },
    ],
  },
];

// ============================================================
// ADMIN GROUP (STANDALONE - Role Restricted)
// ============================================================

export const ADMIN_GROUP: GroupConfig = {
  key: 'admin',
  label: 'Admin',
  icon: Settings,
  rolesAllowed: ['Admin'],
  modules: [
    {
      key: 'administration',
      label: 'Administration',
      path: '/admin',
      icon: Settings,
      description: 'System administration',
      subPages: [
        { key: 'overview', label: 'Overview', path: '', icon: Settings },
        { key: 'users', label: 'Users', path: '/users', icon: Users },
        { key: 'roles', label: 'Roles & Permissions', path: '/roles', icon: Shield },
        { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ],
};


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Filter groups by user roles
 */
export function filterGroupsByRole(roles: string[]): GroupConfig[] {
  return NAVIGATION_GROUPS.filter(group =>
    group.rolesAllowed.includes('*') ||
    roles.some(role => group.rolesAllowed.includes(role))
  );
}

/**
 * Filter modules within a group by user roles
 */
export function filterModulesByRole(modules: ModuleConfig[], roles: string[]): ModuleConfig[] {
  return modules.filter(mod =>
    !mod.rolesAllowed ||
    mod.rolesAllowed.includes('*') ||
    roles.some(role => mod.rolesAllowed?.includes(role))
  );
}

/**
 * Check if user has access to admin
 */
export function hasAdminAccess(roles: string[]): boolean {
  return roles.some(role => ADMIN_GROUP.rolesAllowed.includes(role));
}

/**
 * Find group by module path
 */
export function findGroupByPath(path: string): GroupConfig | null {
  for (const group of NAVIGATION_GROUPS) {
    const module = group.modules.find(m => path.startsWith(m.path));
    if (module) return group;
  }
  // Check admin
  if (path.startsWith('/admin')) return ADMIN_GROUP;
  return null;
}

/**
 * Find module by path
 */
export function findModuleByPath(path: string): ModuleConfig | null {
  for (const group of [...NAVIGATION_GROUPS, ADMIN_GROUP]) {
    const module = group.modules.find(m => path.startsWith(m.path));
    if (module) return module;
  }
  return null;
}

/**
 * Find subpage by path
 */
export function findSubPageByPath(module: ModuleConfig, path: string): SubPageConfig | null {
  if (!module.subPages) return null;
  const relativePath = path.replace(module.path, '');
  return module.subPages.find(sub =>
    relativePath === sub.path ||
    (sub.path === '' && relativePath === '')
  ) || null;
}

/**
 * Get all groups including admin if permitted
 */
export function getAllGroups(roles: string[]): GroupConfig[] {
  const groups = filterGroupsByRole(roles);
  if (hasAdminAccess(roles)) {
    groups.push(ADMIN_GROUP);
  }
  return groups;
}
