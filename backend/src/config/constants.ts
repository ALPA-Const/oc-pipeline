// Roles in the system
export const ROLES = [
  'admin',
  'exec',
  'pm',
  'pe',
  'super',
  'precon',
  'sub',
  'client'
] as const;

export type Role = typeof ROLES[number];

// Permissions available in the system
export const PERMISSIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'export',
  'comment',
  'assign',
  'close',
  'reopen',
  'archive',
  'unarchive',
  'change_status',
  'change_budget',
  'change_schedule',
  'view_budget',
  'view_schedule',
  'view_safety',
  'view_quality',
  'manage_users',
  'manage_roles',
  'manage_org'
] as const;

export type Permission = typeof PERMISSIONS[number];

// Agent states for tracking
export const AGENT_STATES = {
  DORMANT: 'DORMANT',
  INITIALIZING: 'INITIALIZING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
  TERMINATED: 'TERMINATED'
} as const;

export type AgentState = typeof AGENT_STATES[keyof typeof AGENT_STATES];

// Module names in the system
export const MODULE_NAMES = [
  'projects',
  'tasks',
  'documents',
  'safety',
  'quality',
  'schedule',
  'budget',
  'resources',
  'communications',
  'risks',
  'issues',
  'procurement',
  'stakeholders',
  'reports',
  'dashboard',
  'settings'
] as const;

export type ModuleName = typeof MODULE_NAMES[number];
