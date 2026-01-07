/**
 * OC Pipeline - Organization Routes
 * Org-scoped API endpoints for profile, settings, users, roles, and audit logs
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  requireOrgPermission,
  requireOrgAdmin,
  requireUserManagement,
  requireRoleManagement,
  requireAuditAccess,
} from '../../middleware/rbac';
import {
  getOrgRoles,
  createOrgRole,
  updateOrgRole,
  deleteOrgRole,
  assignOrgRole,
  removeOrgRole,
  inviteToOrg,
} from '../../services/rbac/rbac.service';
import { supabase } from '../../config/supabase';

const router = Router();

// ============================================================
// ORGANIZATION PROFILE
// ============================================================

/**
 * GET /api/v1/org/profile
 * Get current organization profile
 */
router.get(
  '/profile',
  authenticate,
  requireOrgPermission('org', 'read_org_profile'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, settings, subscription_tier, subscription_status, max_users, max_projects, created_at')
        .eq('id', orgId)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching org profile:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch organization profile' },
      });
    }
  }
);

/**
 * PUT /api/v1/org/profile
 * Update organization profile
 */
router.put(
  '/profile',
  authenticate,
  requireOrgPermission('org', 'update_org_profile'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const { name, logo_url, settings } = req.body;

      const { data, error } = await supabase
        .from('organizations')
        .update({
          name,
          logo_url,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error updating org profile:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update organization profile' },
      });
    }
  }
);

// ============================================================
// ORGANIZATION SETTINGS
// ============================================================

/**
 * GET /api/v1/org/settings
 * Get organization settings
 */
router.get(
  '/settings',
  authenticate,
  requireOrgAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;

      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: data?.settings || {},
      });
    } catch (error) {
      console.error('Error fetching org settings:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch organization settings' },
      });
    }
  }
);

/**
 * PUT /api/v1/org/settings
 * Update organization settings
 */
router.put(
  '/settings',
  authenticate,
  requireOrgPermission('org', 'manage_org_settings'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const { settings } = req.body;

      const { data, error } = await supabase
        .from('organizations')
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select('settings')
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: data?.settings,
      });
    } catch (error) {
      console.error('Error updating org settings:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update organization settings' },
      });
    }
  }
);

// ============================================================
// ORGANIZATION USERS
// ============================================================

/**
 * GET /api/v1/org/users
 * List all users in the organization
 */
router.get(
  '/users',
  authenticate,
  requireOrgPermission('org', 'view_org_users'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, display_name, avatar_url,
          phone, title, department, status, email_verified, mfa_enabled,
          last_login_at, created_at,
          org_user_roles (
            role_id,
            assigned_at,
            expires_at,
            org_roles (
              id, code, name, authority_level
            )
          )
        `)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching org users:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch organization users' },
      });
    }
  }
);

/**
 * POST /api/v1/org/users/invite
 * Invite a new user to the organization
 */
router.post(
  '/users/invite',
  authenticate,
  requireUserManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const { email, role_id, message } = req.body;

      if (!email || !role_id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Email and role_id are required' },
        });
        return;
      }

      const invitation = await inviteToOrg(orgId, email, role_id, userId, message);

      res.status(201).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      const message = error instanceof Error ? error.message : 'Failed to send invitation';
      res.status(400).json({
        success: false,
        error: { code: 'INVITATION_ERROR', message },
      });
    }
  }
);

/**
 * PUT /api/v1/org/users/:userId/role
 * Update a user's organization role
 */
router.put(
  '/users/:userId/role',
  authenticate,
  requireUserManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const performedBy = req.user!.id;
      const { userId } = req.params;
      const { role_id, expires_at } = req.body;

      if (!role_id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'role_id is required' },
        });
        return;
      }

      await assignOrgRole(userId, orgId, role_id, performedBy, expires_at);

      res.json({
        success: true,
        message: 'Role assigned successfully',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      const message = error instanceof Error ? error.message : 'Failed to update user role';
      res.status(400).json({
        success: false,
        error: { code: 'ROLE_ERROR', message },
      });
    }
  }
);

/**
 * DELETE /api/v1/org/users/:userId/role/:roleId
 * Remove a role from a user
 */
router.delete(
  '/users/:userId/role/:roleId',
  authenticate,
  requireUserManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const performedBy = req.user!.id;
      const { userId, roleId } = req.params;

      await removeOrgRole(userId, orgId, roleId, performedBy);

      res.json({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error) {
      console.error('Error removing user role:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove user role';
      res.status(400).json({
        success: false,
        error: { code: 'ROLE_ERROR', message },
      });
    }
  }
);

// ============================================================
// ORGANIZATION ROLES
// ============================================================

/**
 * GET /api/v1/org/roles
 * List all roles in the organization
 */
router.get(
  '/roles',
  authenticate,
  requireOrgPermission('org', 'view_org_users'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;

      const roles = await getOrgRoles(orgId);

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      console.error('Error fetching org roles:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch organization roles' },
      });
    }
  }
);

/**
 * POST /api/v1/org/roles
 * Create a new custom role
 */
router.post(
  '/roles',
  authenticate,
  requireRoleManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const createdBy = req.user!.id;
      const { code, name, description, permissions, authority_level } = req.body;

      if (!code || !name) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'code and name are required' },
        });
        return;
      }

      const role = await createOrgRole(
        orgId,
        { code, name, description, permissions, authority_level },
        createdBy
      );

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      console.error('Error creating role:', error);
      const message = error instanceof Error ? error.message : 'Failed to create role';
      res.status(400).json({
        success: false,
        error: { code: 'ROLE_ERROR', message },
      });
    }
  }
);

/**
 * PUT /api/v1/org/roles/:roleId
 * Update a custom role
 */
router.put(
  '/roles/:roleId',
  authenticate,
  requireRoleManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const updatedBy = req.user!.id;
      const { roleId } = req.params;
      const { name, description, permissions, authority_level } = req.body;

      const role = await updateOrgRole(
        orgId,
        roleId,
        { name, description, permissions, authority_level },
        updatedBy
      );

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      const message = error instanceof Error ? error.message : 'Failed to update role';
      res.status(400).json({
        success: false,
        error: { code: 'ROLE_ERROR', message },
      });
    }
  }
);

/**
 * DELETE /api/v1/org/roles/:roleId
 * Delete a custom role (soft delete)
 */
router.delete(
  '/roles/:roleId',
  authenticate,
  requireRoleManagement(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const deletedBy = req.user!.id;
      const { roleId } = req.params;

      await deleteOrgRole(orgId, roleId, deletedBy);

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      res.status(400).json({
        success: false,
        error: { code: 'ROLE_ERROR', message },
      });
    }
  }
);

// ============================================================
// DEPARTMENTS
// ============================================================

/**
 * GET /api/v1/org/departments
 * List all departments
 */
router.get(
  '/departments',
  authenticate,
  requireOrgPermission('org', 'view_org_departments'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch departments' },
      });
    }
  }
);

// ============================================================
// AUDIT LOGS
// ============================================================

/**
 * GET /api/v1/org/audit-logs
 * Get organization audit logs with filtering
 */
router.get(
  '/audit-logs',
  authenticate,
  requireAuditAccess(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const {
        action,
        entity_type,
        target_user_id,
        performed_by,
        start_date,
        end_date,
        limit = '50',
        offset = '0',
      } = req.query;

      let query = supabase
        .from('role_audit_log')
        .select(`
          *,
          performer:performed_by (id, email, first_name, last_name),
          target_user:target_user_id (id, email, first_name, last_name)
        `, { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (action) query = query.eq('action', action);
      if (entity_type) query = query.eq('entity_type', entity_type);
      if (target_user_id) query = query.eq('target_user_id', target_user_id);
      if (performed_by) query = query.eq('performed_by', performed_by);
      if (start_date) query = query.gte('created_at', start_date);
      if (end_date) query = query.lte('created_at', end_date);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit logs' },
      });
    }
  }
);

// ============================================================
// PROJECTS (Org-level view)
// ============================================================

/**
 * GET /api/v1/org/projects
 * List all projects in the organization
 */
router.get(
  '/projects',
  authenticate,
  requireOrgPermission('project', 'view_project'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.org_id;
      const { status, phase, limit = '50', offset = '0' } = req.query;

      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (status) query = query.eq('status', status);
      if (phase) query = query.eq('phase', phase);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      console.error('Error fetching org projects:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch projects' },
      });
    }
  }
);

export default router;

