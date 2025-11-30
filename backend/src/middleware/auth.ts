/**
 * OC Pipeline - Authentication Middleware
 * JWT validation, RBAC permission checks
 */

import { Request, Response, NextFunction } from "express";

// Extend Express Request type
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
 * Authenticate user via JWT token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No valid authentication token provided",
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // TODO: Validate JWT token with Supabase
    // For now, stub implementation

    // Mock user for development
    req.user = {
      id: "mock-user-id",
      org_id: "mock-org-id",
      email: "user@example.com",
      roles: ["admin"],
      permissions: ["view", "create", "edit", "delete", "approve"],
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
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
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    // Admin has all permissions
    if (req.user.roles.includes("admin")) {
      next();
      return;
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Permission '${permission}' required`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Check if user has required role
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    if (!req.user.roles.includes(role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Role '${role}' required`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Check if user is project member
 */
export function requireProjectAccess(projectIdParam: string = "projectId") {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    const projectId = req.params[projectIdParam];

    // TODO: Check project membership in database
    // For now, allow access

    next();
  };
}
