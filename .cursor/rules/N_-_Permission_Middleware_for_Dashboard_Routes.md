# Permission Middleware Implementation

## Overview

Enterprise-grade permission middleware for role-based access control
(RBAC) enforcement on dashboard routes. Supports granular permission
checking, resource-level authorization, and audit logging.

## Core Middleware: `permissionMiddleware.ts`

    import { Request, Response, NextFunction } from 'express';
    import { createClient } from '@supabase/supabase-js';
    import { Logger } from './logger';

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const logger = new Logger('PermissionMiddleware');

    export interface AuthenticatedRequest extends Request {
      user?: {
        id: string;
        org_id: string;
        email: string;
        role_id: string;
        role_code: string;
        permissions: string[];
      };
      correlationId: string;
    }

    export interface PermissionCheckOptions {
      requiredPermissions?: string[];
      requiredRole?: string;
      resourceCheck?: (req: AuthenticatedRequest) => Promise<boolean>;
      allowedRoles?: string[];
    }

    /**
     * Main permission middleware factory
     * Validates user permissions against required permissions for a route
     */
    export const permissionMiddleware = (options: PermissionCheckOptions) => {
      return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = req.user;

          if (!user) {
            logger.warn('Unauthorized access attempt', {
              correlationId: req.correlationId,
              path: req.path,
              method: req.method,
            });
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Authentication required',
              correlationId: req.correlationId,
            });
          }

          // Check role-based access
          if (options.allowedRoles && !options.allowedRoles.includes(user.role_code)) {
            logger.warn('Forbidden: insufficient role', {
              correlationId: req.correlationId,
              userId: user.id,
              userRole: user.role_code,
              requiredRoles: options.allowedRoles,
              path: req.path,
            });
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient role privileges',
              correlationId: req.correlationId,
            });
          }

          // Check specific permissions
          if (options.requiredPermissions && options.requiredPermissions.length > 0) {
            const hasAllPermissions = options.requiredPermissions.every((perm) =>
              user.permissions.includes(perm)
            );

            if (!hasAllPermissions) {
              const missingPermissions = options.requiredPermissions.filter(
                (perm) => !user.permissions.includes(perm)
              );
              logger.warn('Forbidden: missing permissions', {
                correlationId: req.correlationId,
                userId: user.id,
                missingPermissions,
                path: req.path,
              });
              return res.status(403).json({
                error: 'Forbidden',
                message: 'Missing required permissions',
                missingPermissions,
                correlationId: req.correlationId,
              });
            }
          }

          // Check resource-level access (if provided)
          if (options.resourceCheck) {
            const hasResourceAccess = await options.resourceCheck(req);
            if (!hasResourceAccess) {
              logger.warn('Forbidden: resource access denied', {
                correlationId: req.correlationId,
                userId: user.id,
                path: req.path,
                resourceId: req.params.id,
              });
              return res.status(403).json({
                error: 'Forbidden',
                message: 'Access to this resource is denied',
                correlationId: req.correlationId,
              });
            }
          }

          // Log successful permission check
          logger.debug('Permission check passed', {
            correlationId: req.correlationId,
            userId: user.id,
            path: req.path,
            permissions: options.requiredPermissions,
          });

          next();
        } catch (error) {
          logger.error('Permission middleware error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
          });
          res.status(500).json({
            error: 'Internal Server Error',
            correlationId: req.correlationId,
          });
        }
      };
    };

    /**
     * Middleware to check if user has access to a specific project
     */
    export const projectAccessMiddleware = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { projectId } = req.params;
        const user = req.user!;

        if (!projectId) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Project ID is required',
            correlationId: req.correlationId,
          });
        }

        // Check if user's org owns the project
        const { data: project, error } = await supabase
          .from('projects')
          .select('id, org_id')
          .eq('id', projectId)
          .eq('org_id', user.org_id)
          .single();

        if (error || !project) {
          logger.warn('Project access denied', {
            correlationId: req.correlationId,
            userId: user.id,
            projectId,
            orgId: user.org_id,
          });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access to this project is denied',
            correlationId: req.correlationId,
          });
        }

        // Attach project to request for downstream use
        (req as any).project = project;
        next();
      } catch (error) {
        logger.error('Project access middleware error', {
          correlationId: req.correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
          error: 'Internal Server Error',
          correlationId: req.correlationId,
        });
      }
    };

    /**
     * Middleware to check if user has access to a specific organization
     */
    export const orgAccessMiddleware = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { orgId } = req.params;
        const user = req.user!;

        if (!orgId) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Organization ID is required',
            correlationId: req.correlationId,
          });
        }

        // Verify user belongs to the organization
        if (user.org_id !== orgId) {
          logger.warn('Organization access denied', {
            correlationId: req.correlationId,
            userId: user.id,
            requestedOrgId: orgId,
            userOrgId: user.org_id,
          });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access to this organization is denied',
            correlationId: req.correlationId,
          });
        }

        next();
      } catch (error) {
        logger.error('Organization access middleware error', {
          correlationId: req.correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
          error: 'Internal Server Error',
          correlationId: req.correlationId,
        });
      }
    };

    /**
     * Middleware to enforce data classification access
     */
    export const dataClassificationMiddleware = (requiredLevel: string) => {
      return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = req.user!;
          const classificationLevels = ['public', 'internal', 'confidential', 'restricted'];
          const userLevel = classificationLevels.indexOf(user.role_code.toLowerCase());
          const requiredIndex = classificationLevels.indexOf(requiredLevel.toLowerCase());

          if (userLevel < requiredIndex) {
            logger.warn('Data classification access denied', {
              correlationId: req.correlationId,
              userId: user.id,
              userLevel: user.role_code,
              requiredLevel,
              path: req.path,
            });
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient data classification level',
              correlationId: req.correlationId,
            });
          }

          next();
        } catch (error) {
          logger.error('Data classification middleware error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Internal Server Error',
            correlationId: req.correlationId,
          });
        }
      };
    };

    /**
     * Middleware to check time-based access restrictions
     */
    export const timeBasedAccessMiddleware = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const user = req.user!;

        // Fetch user's role with time-based restrictions
        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('access_start_date, access_end_date')
          .eq('user_id', user.id)
          .eq('role_id', user.role_id)
          .single();

        if (error) {
          logger.error('Failed to fetch user role restrictions', {
            correlationId: req.correlationId,
            error: error.message,
          });
          return res.status(500).json({
            error: 'Internal Server Error',
            correlationId: req.correlationId,
          });
        }

        const now = new Date();
        const startDate = userRole?.access_start_date
          ? new Date(userRole.access_start_date)
          : null;
        const endDate = userRole?.access_end_date
          ? new Date(userRole.access_end_date)
          : null;

        if (startDate && now < startDate) {
          logger.warn('Access not yet active', {
            correlationId: req.correlationId,
            userId: user.id,
            startDate,
          });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access has not yet been activated',
            correlationId: req.correlationId,
          });
        }

        if (endDate && now > endDate) {
          logger.warn('Access has expired', {
            correlationId: req.correlationId,
            userId: user.id,
            endDate,
          });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access has expired',
            correlationId: req.correlationId,
          });
        }

        next();
      } catch (error) {
        logger.error('Time-based access middleware error', {
          correlationId: req.correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
          error: 'Internal Server Error',
          correlationId: req.correlationId,
        });
      }
    };

    /**
     * Middleware to audit dashboard access
     */
    export const auditDashboardAccessMiddleware = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const user = req.user!;

        // Log dashboard access to audit table
        await supabase.from('audit_events').insert({
          org_id: user.org_id,
          user_id: user.id,
          action: 'DASHBOARD_ACCESS',
          resource_type: 'dashboard',
          resource_id: req.params.dashboardId || 'general',
          changes: {
            path: req.path,
            method: req.method,
            query: req.query,
          },
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          correlation_id: req.correlationId,
          created_at: new Date().toISOString(),
        });

        next();
      } catch (error) {
        logger.error('Audit middleware error', {
          correlationId: req.correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't block request on audit failure
        next();
      }
    };

## Permission Definitions

    // permissions.ts

    export const DASHBOARD_PERMISSIONS = {
      // Portfolio Dashboard
      VIEW_PORTFOLIO: 'dashboard:portfolio:view',
      EXPORT_PORTFOLIO: 'dashboard:portfolio:export',
      MANAGE_PORTFOLIO_FILTERS: 'dashboard:portfolio:manage_filters',

      // Preconstruction Dashboard
      VIEW_PRECONSTRUCTION: 'dashboard:preconstruction:view',
      MANAGE_PURSUITS: 'dashboard:preconstruction:manage_pursuits',
      VIEW_ESTIMATES: 'dashboard:preconstruction:view_estimates',

      // Cost Dashboard
      VIEW_COST: 'dashboard:cost:view',
      MANAGE_BUDGETS: 'dashboard:cost:manage_budgets',
      VIEW_FORECASTS: 'dashboard:cost:view_forecasts',
      APPROVE_CHANGE_ORDERS: 'dashboard:cost:approve_change_orders',

      // Schedule Dashboard
      VIEW_SCHEDULE: 'dashboard:schedule:view',
      MANAGE_SCHEDULE: 'dashboard:schedule:manage',
      VIEW_CRITICAL_PATH: 'dashboard:schedule:view_critical_path',

      // Risk Dashboard
      VIEW_RISK: 'dashboard:risk:view',
      MANAGE_RISKS: 'dashboard:risk:manage',

      // Quality Dashboard
      VIEW_QUALITY: 'dashboard:quality:view',
      MANAGE_DEFICIENCIES: 'dashboard:quality:manage_deficiencies',

      // Safety Dashboard
      VIEW_SAFETY: 'dashboard:safety:view',
      MANAGE_INCIDENTS: 'dashboard:safety:manage_incidents',
      VIEW_OSHA_METRICS: 'dashboard:safety:view_osha_metrics',

      // Staffing Dashboard
      VIEW_STAFFING: 'dashboard:staffing:view',
      MANAGE_RESOURCES: 'dashboard:staffing:manage_resources',

      // Closeout Dashboard
      VIEW_CLOSEOUT: 'dashboard:closeout:view',
      MANAGE_CLOSEOUT: 'dashboard:closeout:manage',

      // Communications Dashboard
      VIEW_COMMUNICATIONS: 'dashboard:communications:view',
      MANAGE_APPROVALS: 'dashboard:communications:manage_approvals',

      // Tasks Dashboard
      VIEW_TASKS: 'dashboard:tasks:view',
      MANAGE_TASKS: 'dashboard:tasks:manage',

      // Procurement Dashboard
      VIEW_PROCUREMENT: 'dashboard:procurement:view',
      MANAGE_VENDORS: 'dashboard:procurement:manage_vendors',

      // Finance Dashboard
      VIEW_FINANCE: 'dashboard:finance:view',
      MANAGE_PAYMENTS: 'dashboard:finance:manage_payments',

      // Admin Dashboard
      VIEW_ADMIN: 'dashboard:admin:view',
      MANAGE_USERS: 'dashboard:admin:manage_users',
      MANAGE_ROLES: 'dashboard:admin:manage_roles',
      MANAGE_AUDIT_LOGS: 'dashboard:admin:manage_audit_logs',
    } as const;

    export const ROLE_DASHBOARD_PERMISSIONS = {
      admin: Object.values(DASHBOARD_PERMISSIONS),
      executive: [
        DASHBOARD_PERMISSIONS.VIEW_PORTFOLIO,
        DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION,
        DASHBOARD_PERMISSIONS.VIEW_COST,
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_RISK,
        DASHBOARD_PERMISSIONS.VIEW_QUALITY,
        DASHBOARD_PERMISSIONS.VIEW_SAFETY,
        DASHBOARD_PERMISSIONS.VIEW_STAFFING,
        DASHBOARD_PERMISSIONS.VIEW_CLOSEOUT,
        DASHBOARD_PERMISSIONS.VIEW_COMMUNICATIONS,
        DASHBOARD_PERMISSIONS.VIEW_TASKS,
        DASHBOARD_PERMISSIONS.VIEW_PROCUREMENT,
        DASHBOARD_PERMISSIONS.VIEW_FINANCE,
        DASHBOARD_PERMISSIONS.EXPORT_PORTFOLIO,
      ],
      pm: [
        DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION,
        DASHBOARD_PERMISSIONS.VIEW_COST,
        DASHBOARD_PERMISSIONS.MANAGE_BUDGETS,
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.MANAGE_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_RISK,
        DASHBOARD_PERMISSIONS.MANAGE_RISKS,
        DASHBOARD_PERMISSIONS.VIEW_QUALITY,
        DASHBOARD_PERMISSIONS.MANAGE_DEFICIENCIES,
        DASHBOARD_PERMISSIONS.VIEW_SAFETY,
        DASHBOARD_PERMISSIONS.VIEW_STAFFING,
        DASHBOARD_PERMISSIONS.MANAGE_RESOURCES,
        DASHBOARD_PERMISSIONS.VIEW_COMMUNICATIONS,
        DASHBOARD_PERMISSIONS.VIEW_TASKS,
        DASHBOARD_PERMISSIONS.MANAGE_TASKS,
        DASHBOARD_PERMISSIONS.VIEW_PROCUREMENT,
      ],
      pe: [
        DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION,
        DASHBOARD_PERMISSIONS.MANAGE_PURSUITS,
        DASHBOARD_PERMISSIONS.VIEW_ESTIMATES,
        DASHBOARD_PERMISSIONS.VIEW_COST,
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_RISK,
      ],
      super: [
        DASHBOARD_PERMISSIONS.VIEW_PORTFOLIO,
        DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION,
        DASHBOARD_PERMISSIONS.VIEW_COST,
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_RISK,
        DASHBOARD_PERMISSIONS.VIEW_QUALITY,
        DASHBOARD_PERMISSIONS.VIEW_SAFETY,
        DASHBOARD_PERMISSIONS.VIEW_STAFFING,
        DASHBOARD_PERMISSIONS.VIEW_CLOSEOUT,
        DASHBOARD_PERMISSIONS.VIEW_COMMUNICATIONS,
        DASHBOARD_PERMISSIONS.VIEW_TASKS,
        DASHBOARD_PERMISSIONS.VIEW_PROCUREMENT,
        DASHBOARD_PERMISSIONS.VIEW_FINANCE,
      ],
      precon: [
        DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION,
        DASHBOARD_PERMISSIONS.MANAGE_PURSUITS,
        DASHBOARD_PERMISSIONS.VIEW_ESTIMATES,
      ],
      sub: [
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_SAFETY,
        DASHBOARD_PERMISSIONS.VIEW_TASKS,
      ],
      client: [
        DASHBOARD_PERMISSIONS.VIEW_SCHEDULE,
        DASHBOARD_PERMISSIONS.VIEW_COMMUNICATIONS,
      ],
    } as const;
