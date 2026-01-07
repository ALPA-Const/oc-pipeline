/**
 * OC Pipeline - RBAC Middleware
 * Dual-scope permission checking for organization and project levels
 */

import { Request, Response, NextFunction } from 'express';
import {
  checkOrgPermission,
  checkProjectPermission,
} from '../services/rbac/rbac.service';

// Extend Express Request type for user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        org_id: string;
        email: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

/**
 * Middleware to require organization-level permission
 * @param resource - The resource type (e.g., 'org', 'project')
 * @param action - The action being performed (e.g., 'manage_org_users', 'view_project')
 */
export function requireOrgPermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const { id: userId, org_id: orgId } = req.user;

      if (!orgId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Organization context required',
          },
        });
        return;
      }

      const hasPermission = await checkOrgPermission(userId, orgId, resource, action);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Permission denied: ${resource}.${action}`,
            required_permission: `${resource}:${action}`,
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions',
        },
      });
    }
  };
}

/**
 * Middleware to require project-level permission
 * Reads projectId from req.params by default
 * @param resource - The resource type (e.g., 'project_docs', 'project_rfis')
 * @param action - The action being performed (e.g., 'view', 'create')
 * @param projectIdParam - The name of the param containing project ID (default: 'projectId')
 */
export function requireProjectPermission(
  resource: string,
  action: string,
  projectIdParam: string = 'projectId'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const { id: userId } = req.user;
      const projectId = req.params[projectIdParam] || req.body?.project_id;

      if (!projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Project ID required',
          },
        });
        return;
      }

      const hasPermission = await checkProjectPermission(userId, projectId, resource, action);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Permission denied: ${resource}.${action}`,
            required_permission: `${resource}:${action}`,
            project_id: projectId,
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify project permissions',
        },
      });
    }
  };
}

/**
 * Middleware to require either org-level OR project-level permission
 * Useful for endpoints that can be accessed at either scope
 * @param resource - The resource type
 * @param action - The action being performed
 * @param projectIdParam - The name of the param containing project ID (default: 'projectId')
 */
export function requireAnyPermission(
  resource: string,
  action: string,
  projectIdParam: string = 'projectId'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const { id: userId, org_id: orgId } = req.user;
      const projectId = req.params[projectIdParam] || req.body?.project_id;

      // Check org-level permission first
      if (orgId) {
        const hasOrgPermission = await checkOrgPermission(userId, orgId, resource, action);
        if (hasOrgPermission) {
          next();
          return;
        }
      }

      // Check project-level permission if projectId is available
      if (projectId) {
        const hasProjectPermission = await checkProjectPermission(
          userId,
          projectId,
          resource,
          action
        );
        if (hasProjectPermission) {
          next();
          return;
        }
      }

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied: ${resource}.${action}`,
          required_permission: `${resource}:${action}`,
        },
      });
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions',
        },
      });
    }
  };
}

/**
 * Middleware to require multiple permissions (AND logic)
 * All specified permissions must be granted
 */
export function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>,
  scope: 'org' | 'project' = 'org',
  projectIdParam: string = 'projectId'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const { id: userId, org_id: orgId } = req.user;
      const projectId = req.params[projectIdParam];

      for (const { resource, action } of permissions) {
        let hasPermission = false;

        if (scope === 'org' && orgId) {
          hasPermission = await checkOrgPermission(userId, orgId, resource, action);
        } else if (scope === 'project' && projectId) {
          hasPermission = await checkProjectPermission(userId, projectId, resource, action);
        }

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Permission denied: ${resource}.${action}`,
              required_permission: `${resource}:${action}`,
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions',
        },
      });
    }
  };
}

/**
 * Middleware to require at least one of multiple permissions (OR logic)
 */
export function requireAnyOfPermissions(
  permissions: Array<{ resource: string; action: string; scope?: 'org' | 'project' }>,
  projectIdParam: string = 'projectId'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const { id: userId, org_id: orgId } = req.user;
      const projectId = req.params[projectIdParam];

      for (const { resource, action, scope } of permissions) {
        let hasPermission = false;

        if ((scope === 'org' || !scope) && orgId) {
          hasPermission = await checkOrgPermission(userId, orgId, resource, action);
        }

        if (!hasPermission && (scope === 'project' || !scope) && projectId) {
          hasPermission = await checkProjectPermission(userId, projectId, resource, action);
        }

        if (hasPermission) {
          next();
          return;
        }
      }

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          required_any_of: permissions.map(p => `${p.resource}:${p.action}`),
        },
      });
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions',
        },
      });
    }
  };
}

/**
 * Middleware to ensure user is a member of the project
 * Lighter check than full permission verification
 */
export function requireProjectMembership(projectIdParam: string = 'projectId') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const projectId = req.params[projectIdParam];
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Project ID required',
          },
        });
        return;
      }

      // Simple check - can they view the project?
      const hasAccess = await checkProjectPermission(
        req.user.id,
        projectId,
        'project',
        'view_project'
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not a member of this project',
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Project membership check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify project membership',
        },
      });
    }
  };
}

/**
 * Middleware to ensure user is an org admin or higher
 */
export function requireOrgAdmin() {
  return requireOrgPermission('org', 'manage_org_settings');
}

/**
 * Middleware to ensure user is org owner
 */
export function requireOrgOwner() {
  return requireOrgPermission('org', 'manage_org_subscription');
}

/**
 * Middleware to ensure user can manage users
 */
export function requireUserManagement() {
  return requireOrgPermission('org', 'manage_org_users');
}

/**
 * Middleware to ensure user can manage roles
 */
export function requireRoleManagement() {
  return requireOrgPermission('org', 'manage_org_roles');
}

/**
 * Middleware to ensure user can view audit logs
 */
export function requireAuditAccess() {
  return requireOrgPermission('org_audit', 'view_audit_logs');
}

