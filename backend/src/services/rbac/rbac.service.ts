/**
 * OC Pipeline - RBAC Service
 * Dual-scope permission management for organization and project levels
 */

import { supabase } from '../../config/supabase';
import { ROLES, hasPermission, mergeRolePermissions } from '../../config/rbac-config';
import type { RolePermissions } from '../../config/rbac-config';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface OrgRole {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string | null;
  scope: 'org' | 'project';
  permissions: RolePermissions;
  is_system_role: boolean;
  authority_level: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRole {
  id: string;
  org_id: string;
  project_id: string | null;
  code: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
  is_system_role: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_id: string | null;
  role: string;
  status: 'invited' | 'active' | 'inactive' | 'removed';
  invited_by: string | null;
  invited_at: string | null;
  added_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  project_role?: ProjectRole;
}

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role_id: string;
  invited_by: string;
  token: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id: string;
  target_user_id?: string;
  target_role_id?: string;
  target_project_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
}

// ============================================================
// ORGANIZATION ROLE FUNCTIONS
// ============================================================

/**
 * Get all org-level roles for a user
 */
export async function getUserOrgRoles(
  userId: string,
  orgId: string
): Promise<OrgRole[]> {
  const { data, error } = await supabase
    .from('org_user_roles')
    .select(`
      role_id,
      org_roles (
        id, org_id, code, name, description, scope,
        permissions, is_system_role, authority_level,
        created_at, updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .or('expires_at.is.null,expires_at.gt.now()');

  if (error) {
    console.error('Error fetching user org roles:', error);
    throw new Error('Failed to fetch user organization roles');
  }

  return (data || [])
    .map((item: { org_roles: OrgRole | OrgRole[] | null }) => {
      const role = item.org_roles;
      return Array.isArray(role) ? role[0] : role;
    })
    .filter((role): role is OrgRole => role !== null);
}

/**
 * Get all project-level roles for a user on a specific project
 */
export async function getUserProjectRoles(
  userId: string,
  projectId: string
): Promise<ProjectRole[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      role_id,
      project_roles (
        id, org_id, project_id, code, name, description,
        permissions, is_system_role, is_template,
        created_at, updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user project roles:', error);
    throw new Error('Failed to fetch user project roles');
  }

  return (data || [])
    .map((item: { project_roles: ProjectRole | ProjectRole[] | null }) => {
      const role = item.project_roles;
      return Array.isArray(role) ? role[0] : role;
    })
    .filter((role): role is ProjectRole => role !== null);
}

/**
 * Check if user has specific org-level permission
 */
export async function checkOrgPermission(
  userId: string,
  orgId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const roles = await getUserOrgRoles(userId, orgId);

  for (const role of roles) {
    const perms = role.permissions[resource];
    if (!perms) continue;
    if (perms === '*') return true;
    if (Array.isArray(perms) && perms.includes(action)) return true;
  }

  return false;
}

/**
 * Check if user has specific project-level permission
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // First get the project's org_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Error fetching project:', projectError);
    return false;
  }

  // Check org-level permissions first (org admins can access projects)
  const hasOrgPermission = await checkOrgPermission(
    userId,
    project.org_id,
    resource,
    action
  );
  if (hasOrgPermission) return true;

  // Check project-level permissions
  const roles = await getUserProjectRoles(userId, projectId);

  for (const role of roles) {
    const perms = role.permissions[resource];
    if (!perms) continue;
    if (perms === '*') return true;
    if (Array.isArray(perms) && perms.includes(action)) return true;
  }

  return false;
}

// ============================================================
// ROLE ASSIGNMENT FUNCTIONS
// ============================================================

/**
 * Assign an org-level role to a user
 */
export async function assignOrgRole(
  userId: string,
  orgId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: string
): Promise<void> {
  const { error } = await supabase
    .from('org_user_roles')
    .upsert({
      org_id: orgId,
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      expires_at: expiresAt || null,
    }, {
      onConflict: 'org_id,user_id,role_id',
    });

  if (error) {
    console.error('Error assigning org role:', error);
    throw new Error('Failed to assign organization role');
  }

  // Log the action
  await logRoleAction(orgId, assignedBy, {
    action: 'assign_org_role',
    entity_type: 'org_user_roles',
    entity_id: roleId,
    target_user_id: userId,
    target_role_id: roleId,
    new_value: { role_id: roleId, expires_at: expiresAt },
  });
}

/**
 * Assign a project-level role to a user
 */
export async function assignProjectRole(
  userId: string,
  projectId: string,
  roleId: string,
  assignedBy: string
): Promise<void> {
  // Get project's org_id first
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  const { error } = await supabase
    .from('project_members')
    .upsert({
      project_id: projectId,
      user_id: userId,
      role_id: roleId,
      role: 'member', // legacy field
      status: 'active',
      added_by: assignedBy,
      added_at: new Date().toISOString(),
    }, {
      onConflict: 'project_id,user_id',
    });

  if (error) {
    console.error('Error assigning project role:', error);
    throw new Error('Failed to assign project role');
  }

  // Log the action
  await logRoleAction(project.org_id, assignedBy, {
    action: 'assign_project_role',
    entity_type: 'project_members',
    entity_id: roleId,
    target_user_id: userId,
    target_role_id: roleId,
    target_project_id: projectId,
    new_value: { role_id: roleId, project_id: projectId },
  });
}

/**
 * Remove an org-level role from a user
 */
export async function removeOrgRole(
  userId: string,
  orgId: string,
  roleId: string,
  removedBy: string
): Promise<void> {
  // First check if it's a system role - OrgOwner cannot be fully removed
  const { data: role } = await supabase
    .from('org_roles')
    .select('code, is_system_role')
    .eq('id', roleId)
    .single();

  if (role?.code === 'OrgOwner') {
    // Check if this is the last OrgOwner
    const { count } = await supabase
      .from('org_user_roles')
      .select('id', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('role_id', roleId);

    if (count && count <= 1) {
      throw new Error('Cannot remove the last Organization Owner');
    }
  }

  const { error } = await supabase
    .from('org_user_roles')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) {
    console.error('Error removing org role:', error);
    throw new Error('Failed to remove organization role');
  }

  // Log the action
  await logRoleAction(orgId, removedBy, {
    action: 'remove_org_role',
    entity_type: 'org_user_roles',
    entity_id: roleId,
    target_user_id: userId,
    target_role_id: roleId,
    old_value: { role_id: roleId },
  });
}

/**
 * Remove a project-level role from a user
 */
export async function removeProjectRole(
  userId: string,
  projectId: string,
  roleId: string,
  removedBy: string
): Promise<void> {
  // Get project's org_id
  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single();

  if (!project) {
    throw new Error('Project not found');
  }

  const { error } = await supabase
    .from('project_members')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing project role:', error);
    throw new Error('Failed to remove project role');
  }

  // Log the action
  await logRoleAction(project.org_id, removedBy, {
    action: 'remove_project_role',
    entity_type: 'project_members',
    entity_id: roleId,
    target_user_id: userId,
    target_role_id: roleId,
    target_project_id: projectId,
    old_value: { role_id: roleId, project_id: projectId },
  });
}

// ============================================================
// PROJECT MEMBER FUNCTIONS
// ============================================================

/**
 * Get all members of a project with their roles
 */
export async function getProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      id, project_id, user_id, role_id, role, status,
      invited_by, invited_at, added_at,
      users:user_id (
        id, email, first_name, last_name, avatar_url
      ),
      project_roles:role_id (
        id, org_id, project_id, code, name, description,
        permissions, is_system_role, is_template
      )
    `)
    .eq('project_id', projectId)
    .neq('status', 'removed');

  if (error) {
    console.error('Error fetching project members:', error);
    throw new Error('Failed to fetch project members');
  }

  return (data || []).map((item) => ({
    ...item,
    user: Array.isArray(item.users) ? item.users[0] : item.users,
    project_role: Array.isArray(item.project_roles) ? item.project_roles[0] : item.project_roles,
  }));
}

/**
 * Invite a user to a project by email
 */
export async function inviteToProject(
  projectId: string,
  email: string,
  roleId: string,
  invitedBy: string,
  message?: string
): Promise<{ invitation_token?: string; member_id?: string }> {
  // Get project and org info
  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single();

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if user already exists in the org
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('org_id', project.org_id)
    .single();

  if (existingUser) {
    // User exists - add directly to project
    await assignProjectRole(existingUser.id, projectId, roleId, invitedBy);
    return { member_id: existingUser.id };
  }

  // User doesn't exist - create invitation
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Create project member with invited status
  const { data: member, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: null, // Will be set when invitation is accepted
      role_id: roleId,
      role: 'invited',
      status: 'invited',
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      invitation_token: token,
      invitation_expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project invitation:', error);
    throw new Error('Failed to create project invitation');
  }

  // Log the action
  await logRoleAction(project.org_id, invitedBy, {
    action: 'invite_to_project',
    entity_type: 'project_members',
    entity_id: member.id,
    target_project_id: projectId,
    new_value: { email, role_id: roleId, status: 'invited' },
  });

  return { invitation_token: token };
}

// ============================================================
// ORG INVITATION FUNCTIONS
// ============================================================

/**
 * Invite a user to the organization
 */
export async function inviteToOrg(
  orgId: string,
  email: string,
  roleId: string,
  invitedBy: string,
  message?: string
): Promise<Invitation> {
  // Check if user already exists in the org
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('org_id', orgId)
    .single();

  if (existingUser) {
    throw new Error('User already exists in this organization');
  }

  // Check for pending invitation
  const { data: existingInvite } = await supabase
    .from('org_invitations')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    throw new Error('Pending invitation already exists for this email');
  }

  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from('org_invitations')
    .insert({
      org_id: orgId,
      email,
      role_id: roleId,
      invited_by: invitedBy,
      token,
      message,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating org invitation:', error);
    throw new Error('Failed to create organization invitation');
  }

  // Log the action
  await logRoleAction(orgId, invitedBy, {
    action: 'invite_to_org',
    entity_type: 'org_invitations',
    entity_id: data.id,
    new_value: { email, role_id: roleId },
  });

  return data;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a secure invitation token
 */
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Log a role-related action to the audit log
 */
async function logRoleAction(
  orgId: string,
  performedBy: string,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await supabase.from('role_audit_log').insert({
      org_id: orgId,
      performed_by: performedBy,
      ...entry,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw on audit log failures, just log them
    console.error('Failed to log role action:', error);
  }
}

/**
 * Get all available roles for an organization
 */
export async function getOrgRoles(orgId: string): Promise<OrgRole[]> {
  const { data, error } = await supabase
    .from('org_roles')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('authority_level', { ascending: false });

  if (error) {
    console.error('Error fetching org roles:', error);
    throw new Error('Failed to fetch organization roles');
  }

  return data || [];
}

/**
 * Get all project role templates for an organization
 */
export async function getProjectRoleTemplates(orgId: string): Promise<ProjectRole[]> {
  const { data, error } = await supabase
    .from('project_roles')
    .select('*')
    .eq('org_id', orgId)
    .is('project_id', null)
    .eq('is_template', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching project role templates:', error);
    throw new Error('Failed to fetch project role templates');
  }

  return data || [];
}

/**
 * Create a custom org role
 */
export async function createOrgRole(
  orgId: string,
  role: Partial<OrgRole>,
  createdBy: string
): Promise<OrgRole> {
  const { data, error } = await supabase
    .from('org_roles')
    .insert({
      org_id: orgId,
      code: role.code,
      name: role.name,
      description: role.description,
      scope: role.scope || 'org',
      permissions: role.permissions || {},
      is_system_role: false,
      authority_level: role.authority_level || 50,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating org role:', error);
    throw new Error('Failed to create organization role');
  }

  await logRoleAction(orgId, createdBy, {
    action: 'create_org_role',
    entity_type: 'org_roles',
    entity_id: data.id,
    new_value: data,
  });

  return data;
}

/**
 * Update an org role
 */
export async function updateOrgRole(
  orgId: string,
  roleId: string,
  updates: Partial<OrgRole>,
  updatedBy: string
): Promise<OrgRole> {
  // Check if it's a system role
  const { data: existing } = await supabase
    .from('org_roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (existing?.is_system_role) {
    throw new Error('Cannot modify system roles');
  }

  const { data, error } = await supabase
    .from('org_roles')
    .update({
      name: updates.name,
      description: updates.description,
      permissions: updates.permissions,
      authority_level: updates.authority_level,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roleId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    console.error('Error updating org role:', error);
    throw new Error('Failed to update organization role');
  }

  await logRoleAction(orgId, updatedBy, {
    action: 'update_org_role',
    entity_type: 'org_roles',
    entity_id: roleId,
    old_value: existing,
    new_value: data,
  });

  return data;
}

/**
 * Delete an org role (soft delete)
 */
export async function deleteOrgRole(
  orgId: string,
  roleId: string,
  deletedBy: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('org_roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (existing?.is_system_role) {
    throw new Error('Cannot delete system roles');
  }

  const { error } = await supabase
    .from('org_roles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', roleId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error deleting org role:', error);
    throw new Error('Failed to delete organization role');
  }

  await logRoleAction(orgId, deletedBy, {
    action: 'delete_org_role',
    entity_type: 'org_roles',
    entity_id: roleId,
    old_value: existing,
  });
}

