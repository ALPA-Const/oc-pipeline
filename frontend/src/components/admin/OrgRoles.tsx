/**
 * OC Pipeline - Organization Roles Component
 * Manage org-level roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Lock,
  AlertTriangle,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { PermissionGate } from '@/contexts/PermissionContext';

interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: 'org' | 'project';
  permissions: Record<string, '*' | string[]>;
  is_system_role: boolean;
  authority_level: number;
}

const PERMISSION_RESOURCES = [
  { key: 'org', label: 'Organization', permissions: [
    'read_org_profile', 'update_org_profile', 'manage_org_settings',
    'manage_org_users', 'view_org_users', 'manage_org_roles',
    'manage_org_departments', 'view_org_departments',
    'manage_org_cost_codes', 'view_org_cost_codes',
    'manage_org_templates', 'view_org_templates',
    'manage_org_integrations', 'view_org_integrations',
    'manage_org_subscription', 'view_org_billing', 'view_org_analytics',
  ]},
  { key: 'org_audit', label: 'Audit', permissions: [
    'view_audit_logs', 'export_audit_logs', 'configure_audit_retention',
  ]},
  { key: 'approval_thresholds', label: 'Approval Thresholds', permissions: [
    'configure_thresholds', 'view_thresholds',
  ]},
  { key: 'project', label: 'Projects', permissions: [
    'create_project', 'archive_project', 'view_project',
    'manage_project_settings', 'manage_project_team',
  ]},
];

export function OrgRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    authority_level: 50,
    permissions: {} as Record<string, '*' | string[]>,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/org/roles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch roles');

      const result = await response.json();
      if (result.success) {
        setRoles(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      authority_level: 50,
      permissions: {},
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    if (role.is_system_role) return;
    setEditingRole(role);
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description || '',
      authority_level: role.authority_level,
      permissions: role.permissions,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingRole
        ? `/api/v1/org/roles/${editingRole.id}`
        : '/api/v1/org/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save role');

      setIsDialogOpen(false);
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) return;
    if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return;

    try {
      const response = await fetch(`/api/v1/org/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete role');

      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const toggleResource = (resourceKey: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceKey)) {
        next.delete(resourceKey);
      } else {
        next.add(resourceKey);
      }
      return next;
    });
  };

  const togglePermission = (resource: string, permission: string) => {
    setFormData((prev) => {
      const resourcePerms = prev.permissions[resource];
      let newPerms: string[];

      if (!resourcePerms || resourcePerms === '*') {
        newPerms = [permission];
      } else if (resourcePerms.includes(permission)) {
        newPerms = resourcePerms.filter((p) => p !== permission);
      } else {
        newPerms = [...resourcePerms, permission];
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [resource]: newPerms.length > 0 ? newPerms : undefined,
        },
      };
    });
  };

  const toggleAllPermissions = (resource: string, permissions: string[]) => {
    setFormData((prev) => {
      const currentPerms = prev.permissions[resource];
      const hasAll =
        currentPerms === '*' ||
        (Array.isArray(currentPerms) &&
          permissions.every((p) => currentPerms.includes(p)));

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [resource]: hasAll ? undefined : permissions,
        },
      };
    });
  };

  const hasPermission = (resource: string, permission: string): boolean => {
    const perms = formData.permissions[resource];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(permission);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <PermissionGate
      resource="org"
      action="manage_org_roles"
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage roles.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-500 mt-1">
              Manage organization roles and their permissions
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Organization Roles
            </CardTitle>
            <CardDescription>
              {roles.length} roles configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-gray-500">
                          {role.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.scope === 'org' ? 'default' : 'secondary'}>
                        {role.scope}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.authority_level}</TableCell>
                    <TableCell>
                      {role.is_system_role ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          System
                        </Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!role.is_system_role && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </DialogTitle>
              <DialogDescription>
                Configure role details and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Role Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.replace(/\s+/g, '_'),
                      }))
                    }
                    placeholder="e.g., project_manager"
                    disabled={!!editingRole}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Project Manager"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what this role is for..."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="authority_level">Authority Level (0-100)</Label>
                <Input
                  id="authority_level"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.authority_level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      authority_level: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                />
                <p className="text-sm text-gray-500">
                  Higher authority can manage lower authority roles
                </p>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="border rounded-lg">
                  {PERMISSION_RESOURCES.map((resource) => (
                    <div key={resource.key} className="border-b last:border-b-0">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        onClick={() => toggleResource(resource.key)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedResources.has(resource.key) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{resource.label}</span>
                        </div>
                        <Checkbox
                          checked={resource.permissions.every((p) =>
                            hasPermission(resource.key, p)
                          )}
                          onCheckedChange={() =>
                            toggleAllPermissions(resource.key, resource.permissions)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </button>
                      {expandedResources.has(resource.key) && (
                        <div className="px-6 py-2 bg-gray-50 grid grid-cols-2 gap-2">
                          {resource.permissions.map((permission) => (
                            <label
                              key={permission}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={hasPermission(resource.key, permission)}
                                onCheckedChange={() =>
                                  togglePermission(resource.key, permission)
                                }
                              />
                              <span className="text-sm">
                                {permission.replace(/_/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}

export default OrgRoles;

