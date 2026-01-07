/**
 * OC Pipeline - RBAC Configuration
 * Dual-scope permission system for organization and project levels
 *
 * This configuration defines:
 * - All permissions organized by resource
 * - All roles with scope (org | project) and allowed permissions
 * - Helper functions for permission checking
 */

// ============================================================
// PERMISSION DEFINITIONS
// ============================================================

export const PERMISSIONS = {
  // Organization-level permissions
  org: [
    'read_org_profile',
    'update_org_profile',
    'manage_org_settings',
    'manage_org_users',
    'view_org_users',
    'manage_org_roles',
    'manage_org_departments',
    'view_org_departments',
    'manage_org_cost_codes',
    'view_org_cost_codes',
    'manage_org_templates',
    'view_org_templates',
    'manage_org_integrations',
    'view_org_integrations',
    'manage_org_subscription',
    'view_org_billing',
    'view_org_analytics',
  ] as const,

  // Organization audit permissions
  org_audit: [
    'view_audit_logs',
    'export_audit_logs',
    'configure_audit_retention',
  ] as const,

  // Approval threshold permissions
  approval_thresholds: [
    'configure_thresholds',
    'view_thresholds',
  ] as const,

  // Project-level permissions
  project: [
    'create_project',
    'archive_project',
    'view_project',
    'manage_project_settings',
    'manage_project_team',
  ] as const,

  // Project documents
  project_docs: [
    'view',
    'upload',
    'update',
    'delete',
  ] as const,

  // Project RFIs
  project_rfis: [
    'view',
    'create',
    'respond',
    'update',
    'delete',
  ] as const,

  // Project submittals
  project_submittals: [
    'view',
    'create',
    'review',
    'approve',
    'update',
    'delete',
  ] as const,

  // Project change orders
  project_change_orders: [
    'view',
    'create',
    'price',
    'negotiate',
    'approve_internal',
    'submit_to_client',
  ] as const,

  // Project estimates
  project_estimates: [
    'view_summary',
    'view_detailed',
    'create',
    'update',
    'delete',
    'lock_final',
  ] as const,

  // Project schedule
  project_schedule: [
    'view',
    'create',
    'update',
    'publish',
    'comment',
  ] as const,

  // Project logs
  project_logs: [
    'view',
    'create',
    'update',
    'delete',
  ] as const,

  // Project financials
  project_financials: [
    'view_budgets',
    'view_costs',
    'manage_budgets',
    'manage_costs',
    'manage_invoices',
    'manage_payments',
  ] as const,

  // Project bids
  project_bids: [
    'view',
    'invite_subs',
    'upload_sub_bid',
    'level_bids',
    'award_scope',
  ] as const,

  // Project tasks
  project_tasks: [
    'view',
    'create',
    'update',
    'delete',
    'close',
  ] as const,

  // Project closeout
  project_closeout: [
    'view',
    'create_punchlist',
    'update_punchlist',
    'close_item',
    'generate_closeout_docs',
    'approve_final',
  ] as const,

  // Project safety
  project_safety: [
    'view',
    'create_incident',
    'create_inspection',
    'update',
    'delete',
    'approve_safety_plan',
  ] as const,

  // Project AI features
  project_ai: [
    'run_ai_analysis',
    'view_ai_insights',
    'configure_ai_prompts',
  ] as const,
} as const;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ResourceType = keyof typeof PERMISSIONS;
export type PermissionAction<R extends ResourceType> = typeof PERMISSIONS[R][number];

export type RoleScope = 'org' | 'project';

export interface RolePermissions {
  [resource: string]: '*' | string[];
}

export interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  scope: RoleScope;
  authorityLevel: number;
  isSystemRole: boolean;
  permissions: RolePermissions;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

export const ROLES: Record<string, RoleDefinition> = {
  // ============ Organization-Level Roles ============

  OrgOwner: {
    code: 'OrgOwner',
    name: 'Organization Owner',
    description: 'Full control of organization and all settings',
    scope: 'org',
    authorityLevel: 100,
    isSystemRole: true,
    permissions: {
      org: '*',
      org_audit: '*',
      approval_thresholds: '*',
      project: '*',
      project_docs: '*',
      project_rfis: '*',
      project_submittals: '*',
      project_change_orders: '*',
      project_estimates: '*',
      project_schedule: '*',
      project_logs: '*',
      project_financials: '*',
      project_bids: '*',
      project_tasks: '*',
      project_closeout: '*',
      project_safety: '*',
      project_ai: '*',
    },
  },

  OrgAdmin: {
    code: 'OrgAdmin',
    name: 'Organization Admin',
    description: 'Administer org, users, cost library, templates, projects',
    scope: 'org',
    authorityLevel: 90,
    isSystemRole: true,
    permissions: {
      org: [
        'read_org_profile',
        'update_org_profile',
        'manage_org_settings',
        'manage_org_users',
        'view_org_users',
        'manage_org_roles',
        'manage_org_departments',
        'view_org_departments',
        'manage_org_cost_codes',
        'view_org_cost_codes',
        'manage_org_templates',
        'view_org_templates',
        'manage_org_integrations',
        'view_org_integrations',
        'view_org_subscription',
        'view_org_billing',
        'view_org_analytics',
      ],
      org_audit: ['view_audit_logs', 'export_audit_logs'],
      approval_thresholds: ['configure_thresholds', 'view_thresholds'],
      project: [
        'create_project',
        'archive_project',
        'view_project',
        'manage_project_settings',
        'manage_project_team',
      ],
    },
  },

  OrgPowerUser: {
    code: 'OrgPowerUser',
    name: 'Organization Power User',
    description: 'Cross-project power user (Precon Exec) with read plus analytics',
    scope: 'org',
    authorityLevel: 70,
    isSystemRole: true,
    permissions: {
      org: [
        'read_org_profile',
        'view_org_users',
        'view_org_departments',
        'view_org_cost_codes',
        'view_org_templates',
        'view_org_integrations',
        'view_org_analytics',
      ],
      org_audit: ['view_audit_logs'],
      project: ['view_project'],
    },
  },

  OrgUser: {
    code: 'OrgUser',
    name: 'Organization User',
    description: 'Basic company member',
    scope: 'org',
    authorityLevel: 50,
    isSystemRole: true,
    permissions: {
      org: ['read_org_profile'],
      project: ['view_project'],
    },
  },

  OrgViewer: {
    code: 'OrgViewer',
    name: 'Organization Viewer',
    description: 'Read-only org dashboards',
    scope: 'org',
    authorityLevel: 10,
    isSystemRole: true,
    permissions: {
      org: ['read_org_profile', 'view_org_analytics'],
    },
  },

  // ============ Project-Level Roles ============

  ProjectAdmin: {
    code: 'ProjectAdmin',
    name: 'Project Admin',
    description: 'Full control over a single project',
    scope: 'project',
    authorityLevel: 100,
    isSystemRole: true,
    permissions: {
      project: ['view_project', 'manage_project_settings', 'manage_project_team'],
      project_docs: '*',
      project_rfis: '*',
      project_submittals: '*',
      project_change_orders: '*',
      project_estimates: '*',
      project_schedule: '*',
      project_logs: '*',
      project_financials: '*',
      project_bids: '*',
      project_tasks: '*',
      project_closeout: '*',
      project_safety: '*',
      project_ai: '*',
    },
  },

  ProjectMember: {
    code: 'ProjectMember',
    name: 'Project Member',
    description: 'Internal team member (PM, PE, Superintendent, Estimator)',
    scope: 'project',
    authorityLevel: 70,
    isSystemRole: true,
    permissions: {
      project: ['view_project'],
      project_docs: ['view', 'upload', 'update'],
      project_rfis: ['view', 'create', 'respond', 'update'],
      project_submittals: ['view', 'create', 'review', 'update'],
      project_change_orders: ['view', 'create', 'price'],
      project_estimates: ['view_summary', 'create', 'update'],
      project_schedule: ['view', 'create', 'update', 'comment'],
      project_logs: ['view', 'create', 'update'],
      project_bids: ['view', 'invite_subs', 'upload_sub_bid'],
      project_tasks: ['view', 'create', 'update', 'close'],
      project_closeout: ['view', 'create_punchlist', 'update_punchlist', 'close_item'],
      project_safety: ['view', 'create_incident', 'create_inspection', 'update'],
      project_ai: ['run_ai_analysis', 'view_ai_insights'],
    },
  },

  Subcontractor: {
    code: 'Subcontractor',
    name: 'Subcontractor',
    description: 'External trade partner restricted to their participation',
    scope: 'project',
    authorityLevel: 30,
    isSystemRole: true,
    permissions: {
      project: ['view_project'],
      project_docs: ['view', 'upload'],
      project_bids: ['view', 'upload_sub_bid'],
      project_rfis: ['view', 'respond'],
      project_submittals: ['view', 'create'],
      project_tasks: ['view', 'update'],
      project_closeout: ['view', 'update_punchlist'],
    },
  },

  Client: {
    code: 'Client',
    name: 'Client',
    description: 'Owner/COR/KO/Owner Rep with controlled visibility',
    scope: 'project',
    authorityLevel: 50,
    isSystemRole: true,
    permissions: {
      project: ['view_project'],
      project_docs: ['view'],
      project_rfis: ['view', 'respond'],
      project_submittals: ['view', 'review'],
      project_change_orders: ['view', 'negotiate'],
      project_schedule: ['view'],
      project_logs: ['view'],
      project_tasks: ['view'],
      project_closeout: ['view', 'approve_final'],
      project_ai: ['view_ai_insights'],
    },
  },

  Consultant: {
    code: 'Consultant',
    name: 'Consultant',
    description: 'Third-party consultants (scheduler, commissioning, cost)',
    scope: 'project',
    authorityLevel: 40,
    isSystemRole: true,
    permissions: {
      project: ['view_project'],
      project_docs: ['view', 'upload'],
      project_schedule: ['view', 'create', 'update', 'comment'],
      project_logs: ['view', 'create', 'update'],
      project_tasks: ['view', 'create', 'update'],
      project_ai: ['run_ai_analysis', 'view_ai_insights'],
    },
  },
};

// ============================================================
// DEFAULT DEPARTMENTS
// ============================================================

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'PRECON', name: 'Preconstruction', description: 'Estimating, bidding, and proposal development' },
  { id: 'OPS', name: 'Operations', description: 'Project execution and field operations' },
  { id: 'DESIGN', name: 'Design', description: 'Design-build and engineering' },
  { id: 'SAFETY', name: 'Safety & Quality', description: 'Safety management and quality control' },
  { id: 'FIN', name: 'Finance & Accounting', description: 'Financial management and accounting' },
  { id: 'IT', name: 'IT & Systems', description: 'Information technology and systems' },
  { id: 'BD', name: 'Business Development', description: 'Business development and client relations' },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a role has a specific permission on a resource
 */
export function hasPermission(
  roleCode: string,
  resource: string,
  action: string
): boolean {
  const role = ROLES[roleCode];
  if (!role) return false;

  const resourcePermissions = role.permissions[resource];
  if (!resourcePermissions) return false;
  if (resourcePermissions === '*') return true;
  if (Array.isArray(resourcePermissions)) {
    return resourcePermissions.includes(action);
  }
  return false;
}

/**
 * Check if a role is organization-scoped
 */
export function isOrgRole(roleCode: string): boolean {
  const role = ROLES[roleCode];
  return role?.scope === 'org';
}

/**
 * Check if a role is project-scoped
 */
export function isProjectRole(roleCode: string): boolean {
  const role = ROLES[roleCode];
  return role?.scope === 'project';
}

/**
 * Get all org-scoped roles
 */
export function getOrgRoles(): RoleDefinition[] {
  return Object.values(ROLES).filter(role => role.scope === 'org');
}

/**
 * Get all project-scoped roles
 */
export function getProjectRoles(): RoleDefinition[] {
  return Object.values(ROLES).filter(role => role.scope === 'project');
}

/**
 * Get all system roles (cannot be deleted)
 */
export function getSystemRoles(): RoleDefinition[] {
  return Object.values(ROLES).filter(role => role.isSystemRole);
}

/**
 * Get a role definition by code
 */
export function getRoleByCode(roleCode: string): RoleDefinition | undefined {
  return ROLES[roleCode];
}

/**
 * Get all permissions for a specific resource
 */
export function getResourcePermissions(resource: ResourceType): readonly string[] {
  return PERMISSIONS[resource] || [];
}

/**
 * Check if permission object represents wildcard access
 */
export function isWildcardPermission(permissions: '*' | string[]): permissions is '*' {
  return permissions === '*';
}

/**
 * Get flattened list of all permissions for a role
 */
export function getFlattenedPermissions(roleCode: string): Array<{ resource: string; action: string }> {
  const role = ROLES[roleCode];
  if (!role) return [];

  const result: Array<{ resource: string; action: string }> = [];

  for (const [resource, permissions] of Object.entries(role.permissions)) {
    if (permissions === '*') {
      const resourcePerms = PERMISSIONS[resource as ResourceType];
      if (resourcePerms) {
        for (const action of resourcePerms) {
          result.push({ resource, action });
        }
      }
    } else if (Array.isArray(permissions)) {
      for (const action of permissions) {
        result.push({ resource, action });
      }
    }
  }

  return result;
}

/**
 * Merge multiple role permissions into a single permission set
 */
export function mergeRolePermissions(roleCodes: string[]): RolePermissions {
  const merged: RolePermissions = {};

  for (const roleCode of roleCodes) {
    const role = ROLES[roleCode];
    if (!role) continue;

    for (const [resource, permissions] of Object.entries(role.permissions)) {
      if (permissions === '*' || merged[resource] === '*') {
        merged[resource] = '*';
      } else if (Array.isArray(permissions)) {
        if (!merged[resource]) {
          merged[resource] = [...permissions];
        } else if (Array.isArray(merged[resource])) {
          const existing = merged[resource] as string[];
          merged[resource] = [...new Set([...existing, ...permissions])];
        }
      }
    }
  }

  return merged;
}

/**
 * Check if a user with given roles has permission
 */
export function hasPermissionWithRoles(
  roleCodes: string[],
  resource: string,
  action: string
): boolean {
  return roleCodes.some(roleCode => hasPermission(roleCode, resource, action));
}

export type PermissionsConfig = typeof PERMISSIONS;
export type RolesConfig = typeof ROLES;

