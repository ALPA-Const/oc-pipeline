/**
 * OC Pipeline - Permission Context
 * Provides permission checking hooks and components for frontend RBAC
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ============================================================
// TYPES
// ============================================================

export interface OrgRole {
  id: string;
  code: string;
  name: string;
  permissions: Record<string, '*' | string[]>;
  authority_level: number;
}

export interface ProjectRole {
  id: string;
  code: string;
  name: string;
  permissions: Record<string, '*' | string[]>;
  project_id: string | null;
}

interface PermissionContextType {
  // State
  orgRoles: OrgRole[];
  projectRoles: Map<string, ProjectRole[]>;
  isLoading: boolean;
  error: string | null;

  // Permission checking
  hasOrgPermission: (resource: string, action: string) => boolean;
  hasProjectPermission: (projectId: string, resource: string, action: string) => boolean;
  hasAnyPermission: (resource: string, action: string, projectId?: string) => boolean;

  // Role checking
  hasOrgRole: (roleCode: string) => boolean;
  hasProjectRole: (projectId: string, roleCode: string) => boolean;
  isOrgAdmin: () => boolean;
  isOrgOwner: () => boolean;
  isProjectAdmin: (projectId: string) => boolean;

  // Data fetching
  refreshOrgRoles: () => Promise<void>;
  refreshProjectRoles: (projectId: string) => Promise<void>;
  getCurrentUserRoles: () => {
    orgRoles: OrgRole[];
    projectRoles: Map<string, ProjectRole[]>;
  };
}

// ============================================================
// CONTEXT
// ============================================================

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

interface PermissionProviderProps {
  children: ReactNode;
  userId?: string;
  orgId?: string;
}

export function PermissionProvider({
  children,
  userId,
  orgId,
}: PermissionProviderProps) {
  const [orgRoles, setOrgRoles] = useState<OrgRole[]>([]);
  const [projectRoles, setProjectRoles] = useState<Map<string, ProjectRole[]>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch org roles on mount
  useEffect(() => {
    if (userId && orgId) {
      fetchOrgRoles();
    } else {
      setIsLoading(false);
    }
  }, [userId, orgId]);

  /**
   * Fetch user's org-level roles
   */
  const fetchOrgRoles = useCallback(async () => {
    if (!userId || !orgId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/v1/org/roles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const result = await response.json();

      // Filter to only user's assigned roles - this would come from a user-specific endpoint
      // For now, store all available roles
      if (result.success && result.data) {
        setOrgRoles(result.data);
      }
    } catch (err) {
      console.error('Error fetching org roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  }, [userId, orgId]);

  /**
   * Fetch user's project-level roles
   */
  const fetchProjectRoles = useCallback(
    async (projectId: string) => {
      if (!userId || !projectId) return;

      try {
        const response = await fetch(`/api/v1/projects/${projectId}/roles`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch project roles');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setProjectRoles((prev) => {
            const updated = new Map(prev);
            updated.set(projectId, result.data);
            return updated;
          });
        }
      } catch (err) {
        console.error('Error fetching project roles:', err);
      }
    },
    [userId]
  );

  /**
   * Check if permission grants access for a resource/action
   */
  const checkPermission = useCallback(
    (
      permissions: Record<string, '*' | string[]>,
      resource: string,
      action: string
    ): boolean => {
      const resourcePerms = permissions[resource];
      if (!resourcePerms) return false;
      if (resourcePerms === '*') return true;
      if (Array.isArray(resourcePerms)) {
        return resourcePerms.includes(action);
      }
      return false;
    },
    []
  );

  /**
   * Check if user has org-level permission
   */
  const hasOrgPermission = useCallback(
    (resource: string, action: string): boolean => {
      return orgRoles.some((role) =>
        checkPermission(role.permissions, resource, action)
      );
    },
    [orgRoles, checkPermission]
  );

  /**
   * Check if user has project-level permission
   */
  const hasProjectPermission = useCallback(
    (projectId: string, resource: string, action: string): boolean => {
      // First check org-level permissions (org admins can access projects)
      if (hasOrgPermission(resource, action)) return true;

      // Then check project-specific roles
      const roles = projectRoles.get(projectId) || [];
      return roles.some((role) =>
        checkPermission(role.permissions, resource, action)
      );
    },
    [projectRoles, hasOrgPermission, checkPermission]
  );

  /**
   * Check if user has permission at either scope
   */
  const hasAnyPermission = useCallback(
    (resource: string, action: string, projectId?: string): boolean => {
      if (hasOrgPermission(resource, action)) return true;
      if (projectId && hasProjectPermission(projectId, resource, action)) {
        return true;
      }
      return false;
    },
    [hasOrgPermission, hasProjectPermission]
  );

  /**
   * Check if user has specific org role
   */
  const hasOrgRole = useCallback(
    (roleCode: string): boolean => {
      return orgRoles.some((role) => role.code === roleCode);
    },
    [orgRoles]
  );

  /**
   * Check if user has specific project role
   */
  const hasProjectRole = useCallback(
    (projectId: string, roleCode: string): boolean => {
      const roles = projectRoles.get(projectId) || [];
      return roles.some((role) => role.code === roleCode);
    },
    [projectRoles]
  );

  /**
   * Check if user is org admin or higher
   */
  const isOrgAdmin = useCallback((): boolean => {
    return hasOrgRole('OrgAdmin') || hasOrgRole('OrgOwner');
  }, [hasOrgRole]);

  /**
   * Check if user is org owner
   */
  const isOrgOwner = useCallback((): boolean => {
    return hasOrgRole('OrgOwner');
  }, [hasOrgRole]);

  /**
   * Check if user is project admin
   */
  const isProjectAdmin = useCallback(
    (projectId: string): boolean => {
      // Org admins are implicitly project admins
      if (isOrgAdmin()) return true;
      return hasProjectRole(projectId, 'ProjectAdmin');
    },
    [isOrgAdmin, hasProjectRole]
  );

  /**
   * Refresh org roles
   */
  const refreshOrgRoles = useCallback(async () => {
    await fetchOrgRoles();
  }, [fetchOrgRoles]);

  /**
   * Refresh project roles
   */
  const refreshProjectRoles = useCallback(
    async (projectId: string) => {
      await fetchProjectRoles(projectId);
    },
    [fetchProjectRoles]
  );

  /**
   * Get current user's roles
   */
  const getCurrentUserRoles = useCallback(() => {
    return { orgRoles, projectRoles };
  }, [orgRoles, projectRoles]);

  const value = useMemo(
    () => ({
      orgRoles,
      projectRoles,
      isLoading,
      error,
      hasOrgPermission,
      hasProjectPermission,
      hasAnyPermission,
      hasOrgRole,
      hasProjectRole,
      isOrgAdmin,
      isOrgOwner,
      isProjectAdmin,
      refreshOrgRoles,
      refreshProjectRoles,
      getCurrentUserRoles,
    }),
    [
      orgRoles,
      projectRoles,
      isLoading,
      error,
      hasOrgPermission,
      hasProjectPermission,
      hasAnyPermission,
      hasOrgRole,
      hasProjectRole,
      isOrgAdmin,
      isOrgOwner,
      isProjectAdmin,
      refreshOrgRoles,
      refreshProjectRoles,
      getCurrentUserRoles,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to access permission context
 */
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

/**
 * Hook to check org-level permission
 */
export function useOrgPermission(resource: string, action: string): boolean {
  const { hasOrgPermission, isLoading } = usePermissions();

  if (isLoading) return false;
  return hasOrgPermission(resource, action);
}

/**
 * Hook to check project-level permission
 */
export function useProjectPermission(
  projectId: string | undefined,
  resource: string,
  action: string
): boolean {
  const { hasProjectPermission, isLoading } = usePermissions();

  if (isLoading || !projectId) return false;
  return hasProjectPermission(projectId, resource, action);
}

/**
 * Hook to get current user's roles
 */
export function useCurrentUserRoles() {
  const { getCurrentUserRoles, isLoading } = usePermissions();

  return {
    ...getCurrentUserRoles(),
    isLoading,
  };
}

// ============================================================
// COMPONENTS
// ============================================================

interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action: string;
  projectId?: string;
  fallback?: ReactNode;
  requireAll?: boolean;
  permissions?: Array<{ resource: string; action: string }>;
}

/**
 * Component to conditionally render based on permissions
 */
export function PermissionGate({
  children,
  resource,
  action,
  projectId,
  fallback = null,
  requireAll = false,
  permissions,
}: PermissionGateProps) {
  const { hasOrgPermission, hasProjectPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const checkResults = permissions.map(({ resource: r, action: a }) => {
      if (projectId) {
        return hasProjectPermission(projectId, r, a);
      }
      return hasOrgPermission(r, a);
    });

    const hasAccess = requireAll
      ? checkResults.every(Boolean)
      : checkResults.some(Boolean);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Check single permission
  let hasAccess = false;
  if (projectId) {
    hasAccess = hasProjectPermission(projectId, resource, action);
  } else {
    hasAccess = hasOrgPermission(resource, action);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to show content only to org admins
 */
export function OrgAdminGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isOrgAdmin, isLoading } = usePermissions();

  if (isLoading) return null;
  return isOrgAdmin() ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to show content only to org owners
 */
export function OrgOwnerGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isOrgOwner, isLoading } = usePermissions();

  if (isLoading) return null;
  return isOrgOwner() ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to show content only to project admins
 */
export function ProjectAdminGate({
  children,
  projectId,
  fallback = null,
}: {
  children: ReactNode;
  projectId: string;
  fallback?: ReactNode;
}) {
  const { isProjectAdmin, isLoading } = usePermissions();

  if (isLoading) return null;
  return isProjectAdmin(projectId) ? <>{children}</> : <>{fallback}</>;
}

// Export types
export type { PermissionContextType };

