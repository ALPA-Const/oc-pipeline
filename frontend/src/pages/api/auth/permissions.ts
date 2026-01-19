/**
 * Permission Probe Endpoint
 * GET /api/auth/permissions
 * 
 * Returns the current user's role, permissions, and restrictions
 * Used for frontend authorization checks
 */

import { errorHandler } from '@/lib/error-handler';
import { ErrorCode } from '@/types/error.types';

// Mock user database (replace with actual Supabase query)
const mockUsers: Record<string, { role: string; org_id: string }> = {
  'usr_admin_001': { role: 'admin', org_id: 'org_11111111-1111-1111-1111-111111111111' },
  'usr_pm_001': { role: 'pm', org_id: 'org_11111111-1111-1111-1111-111111111111' },
  'usr_pe_001': { role: 'pe', org_id: 'org_11111111-1111-1111-1111-111111111111' },
  'usr_sub_001': { role: 'sub', org_id: 'org_11111111-1111-1111-1111-111111111111' },
  'usr_client_001': { role: 'client', org_id: 'org_11111111-1111-1111-1111-111111111111' },
};

// RBAC permission matrix
const rolePermissions: Record<string, string[]> = {
  admin: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'comment', 'assign', 'close', 'reopen', 'archive', 'unarchive', 'change_status', 'change_budget', 'change_schedule', 'view_budget', 'view_schedule', 'view_safety', 'view_quality', 'manage_users', 'manage_roles', 'manage_org'],
  exec: ['view', 'export', 'comment', 'view_budget', 'view_schedule', 'view_safety', 'view_quality', 'manage_org'],
  pm: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'comment', 'assign', 'close', 'reopen', 'archive', 'unarchive', 'change_status', 'change_budget', 'change_schedule', 'view_budget', 'view_schedule', 'view_safety'],
  pe: ['view', 'create', 'edit', 'export', 'comment', 'assign', 'close', 'reopen', 'change_status', 'view_budget', 'view_schedule', 'view_safety', 'view_quality'],
  super: ['view', 'create', 'edit', 'export', 'comment', 'assign', 'close', 'reopen', 'change_status', 'view_budget', 'view_schedule', 'view_safety', 'view_quality'],
  precon: ['view', 'create', 'edit', 'export', 'comment', 'view_budget', 'view_schedule'],
  sub: ['view', 'comment', 'view_schedule', 'view_safety', 'view_quality'],
  client: ['view', 'comment', 'view_schedule', 'view_quality'],
};

const roleRestrictions: Record<string, string[]> = {
  admin: [],
  exec: ['no_field_operations'],
  pm: ['no_user_management'],
  pe: ['no_user_management', 'no_budget_changes'],
  super: ['no_user_management', 'no_budget_changes'],
  precon: ['no_user_management', 'no_budget_changes', 'no_field_operations'],
  sub: ['read_only_assigned_projects', 'no_budget_access'],
  client: ['read_only_assigned_projects', 'no_budget_access', 'no_safety_access'],
};

interface PermissionsResponse {
  role: string;
  permissions: string[];
  restrictions: string[];
  org_id: string;
  user_id: string;
  trace_id: string;
}

/**
 * Get user permissions
 * This is a mock implementation - replace with actual Supabase query
 */
export async function getPermissions(userId: string): Promise<PermissionsResponse> {
  const traceId = errorHandler.generateTraceId();

  // Mock authentication check
  if (!userId) {
    throw errorHandler.createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      401,
      traceId
    );
  }

  // Get user from mock database
  const user = mockUsers[userId];
  if (!user) {
    throw errorHandler.createErrorResponse(
      ErrorCode.NOT_FOUND,
      'User not found',
      404,
      traceId
    );
  }

  // Get permissions for user's role
  const permissions = rolePermissions[user.role] || [];
  const restrictions = roleRestrictions[user.role] || [];

  return {
    role: user.role,
    permissions,
    restrictions,
    org_id: user.org_id,
    user_id: userId,
    trace_id: traceId,
  };
}

/**
 * Express/Vite handler
 * In production, this would be a proper API route
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    // Extract user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '') || 'usr_admin_001'; // Mock default

    const permissions = await getPermissions(userId);

    return new Response(JSON.stringify(permissions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const envelope = errorHandler.handleError(error);
    return new Response(JSON.stringify(envelope), {
      status: envelope.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}