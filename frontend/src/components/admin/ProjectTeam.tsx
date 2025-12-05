/**
 * OC Pipeline - Project Team Component
 * Manage project members and their roles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Mail,
  Shield,
  AlertTriangle,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  UserMinus,
} from 'lucide-react';
import { PermissionGate, useProjectPermission } from '@/contexts/PermissionContext';

interface ProjectMember {
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
  project_role?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
}

interface ProjectRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface ProjectTeamProps {
  projectId: string;
  projectName?: string;
}

export function ProjectTeam({ projectId, projectName }: ProjectTeamProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role_id: '' });
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const canManageTeam = useProjectPermission(projectId, 'project', 'manage_project_team');

  useEffect(() => {
    if (projectId) {
      fetchMembers();
      fetchRoles();
    }
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch team members');

      const result = await response.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/roles`, {
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
      console.error('Error fetching roles:', err);
    }
  };

  const handleInvite = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(inviteForm),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to send invitation');
      }

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role_id: '' });
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedMember || !selectedRoleId) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/members/${selectedMember.user_id}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ role_id: selectedRoleId }),
        }
      );

      if (!response.ok) throw new Error('Failed to change role');

      setRoleDialogOpen(false);
      setSelectedMember(null);
      setSelectedRoleId('');
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!confirm(`Remove ${getMemberName(member)} from this project?`)) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/members/${member.user_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove member');

      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const openRoleDialog = (member: ProjectMember) => {
    setSelectedMember(member);
    setSelectedRoleId(member.role_id || '');
    setRoleDialogOpen(true);
  };

  const getInitials = (member: ProjectMember) => {
    if (member.user?.first_name && member.user?.last_name) {
      return `${member.user.first_name[0]}${member.user.last_name[0]}`.toUpperCase();
    }
    return member.user?.email?.[0]?.toUpperCase() || '?';
  };

  const getMemberName = (member: ProjectMember) => {
    if (member.user?.first_name && member.user?.last_name) {
      return `${member.user.first_name} ${member.user.last_name}`;
    }
    return member.user?.email || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'invited':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Invited
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-gray-500">
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.user?.email?.toLowerCase().includes(searchLower) ||
      member.user?.first_name?.toLowerCase().includes(searchLower) ||
      member.user?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Team</h1>
          <p className="text-gray-500 mt-1">
            {projectName ? `Manage team for ${projectName}` : 'Manage project team members'}
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {members.length} members on this project
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                {canManageTeam && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getMemberName(member)}</div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.project_role ? (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {member.project_role.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">{member.role}</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(member.added_at).toLocaleDateString()}
                  </TableCell>
                  {canManageTeam && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openRoleDialog(member)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          {member.status === 'invited' && (
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManageTeam ? 5 : 4}
                    className="text-center text-gray-500"
                  >
                    No team members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite someone to join this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Project Role</Label>
              <Select
                value={inviteForm.role_id}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({ ...prev, role_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div>
                        <div>{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteForm.email || !inviteForm.role_id}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              {selectedMember && `Change role for ${getMemberName(selectedMember)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>New Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div>
                        <div>{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={!selectedRoleId}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectTeam;

