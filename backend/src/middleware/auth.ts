// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase';

// ---------- Types ----------

export interface AuthUser {
  id: string;
  org_id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// Type alias for Request with user
export type AuthRequest = Request;

// Extend Express.Request so TypeScript knows about req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ---------- Supabase Client ----------
// Uses lazy-loaded client from config/supabase.ts
// This ensures environment variables are loaded before client creation

// ---------- Role-Based Permission Mapping ----------
// Maps roles to permissions based on RBAC matrix
// TODO: Replace with database query from role_permissions table when available
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'view', 'create', 'edit', 'delete', 'approve', 'export', 'comment', 'assign',
    'close', 'reopen', 'archive', 'unarchive', 'change_status', 'change_budget',
    'change_schedule', 'view_budget', 'view_schedule', 'view_safety', 'view_quality',
    'manage_users', 'manage_roles', 'manage_org', 'view_audit'
  ],
  exec: [
    'view', 'approve', 'export', 'comment', 'change_budget', 'view_budget',
    'view_schedule', 'view_safety', 'view_quality', 'manage_org', 'view_audit'
  ],
  pm: [
    'view', 'create', 'edit', 'delete', 'approve', 'export', 'comment', 'assign',
    'close', 'reopen', 'archive', 'unarchive', 'change_status', 'change_budget',
    'change_schedule', 'view_budget', 'view_schedule', 'view_safety', 'view_audit'
  ],
  pe: [
    'view', 'create', 'edit', 'export', 'comment', 'assign', 'close', 'reopen',
    'change_status', 'view_budget', 'change_schedule', 'view_schedule', 'view_quality'
  ],
  super: [
    'view', 'create', 'edit', 'export', 'comment', 'assign', 'close', 'change_status',
    'view_budget', 'change_schedule', 'view_schedule', 'view_safety', 'view_quality'
  ],
  precon: [
    'view', 'create', 'edit', 'export', 'comment', 'change_status', 'view_budget', 'view_schedule'
  ],
  sub: [
    'view', 'comment', 'view_schedule', 'view_safety', 'view_quality'
  ],
  client: [
    'view', 'comment', 'view_schedule', 'view_quality'
  ],
  user: [
    'view', 'comment'
  ]
};

/**
 * Get permissions for a user based on their roles
 */
function getUserPermissions(roles: string[]): string[] {
  const permissions = new Set<string>();

  // Collect permissions from all user roles
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role.toLowerCase()] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }

  return Array.from(permissions);
}

// ---------- Authentication Middleware ----------

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No valid authentication token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // Validate JWT token with Supabase (using service role key for admin operations)
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Build our internal user object from Supabase user + metadata
    const orgId =
      (user.user_metadata as any)?.org_id ||
      (user.app_metadata as any)?.org_id ||
      'unknown';

    const roles: string[] =
      (user.user_metadata as any)?.roles ||
      (user.app_metadata as any)?.roles ||
      ['user'];

    // Get permissions based on user roles
    const permissions = getUserPermissions(roles);

    req.user = {
      id: user.id,
      org_id: orgId,
      email: user.email || '',
      roles,
      permissions,
    };

    // ---------- RLS Context (optional / TODO) ----------
    // The sprint guide suggests setting a per-request org context like:
    //
    // await supabase.rpc('set_config', {
    //   setting_name: 'app.current_org_id',
    //   setting_value: req.user.org_id,
    //   is_local: true,
    // });
    //
    // This REQUIRES:
    //   1) A Postgres function exposed as RPC that wraps set_config
    //   2) Proper RLS policies using current_setting('app.current_org_id')
    //
    // Until that function exists in your database, leave this commented out
    // to avoid runtime errors.

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AUTH MIDDLEWARE] Error during authentication:', err);

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Admin has all permissions
    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission '${permission}' required`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Log audit event (placeholder - implement full audit logging later)
 */
export async function logAuditEvent(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  beforeData: any = null,
  afterData: any = null
): Promise<void> {
  // TODO: Implement full audit logging
  console.log('[AUDIT]', { userId, entityType, entityId, action, beforeData, afterData });
}

// ========================================
// TEMPORARY MOCK AUTH FOR TESTING
// ========================================
// TODO: REMOVE THIS BEFORE PRODUCTION!
// This bypasses all authentication checks for testing purposes only.
// Added: 2025-12-03 for dashboard testing
// Remove by: Week 1 Tuesday (real auth implementation)

/**
 * Mock authentication middleware - TESTING ONLY
 * Bypasses JWT validation and creates a fake admin user
 * WARNING: NOT SECURE - DO NOT USE IN PRODUCTION
 */
export async function mockAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  console.warn('[AUTH] WARNING: Using MOCK authentication - NOT SECURE!');
  console.warn('[AUTH] This should ONLY be used for local testing');
  
  // Create a fake admin user
  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    org_id: '1',
    email: 'bill@oneillcontractors.com',
    roles: ['admin'],
    permissions: getUserPermissions(['admin']),
  };

  next();
}
