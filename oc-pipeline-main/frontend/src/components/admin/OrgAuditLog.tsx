/**
 * OC Pipeline - Organization Audit Log Component
 * View and filter audit logs for role-related changes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  FileText,
  Download,
  Filter,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
} from 'lucide-react';
import { PermissionGate } from '@/contexts/PermissionContext';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  target_user_id: string | null;
  target_role_id: string | null;
  target_project_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  performer: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  target_user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  assign_org_role: <UserPlus className="h-4 w-4 text-green-500" />,
  remove_org_role: <UserMinus className="h-4 w-4 text-red-500" />,
  assign_project_role: <UserPlus className="h-4 w-4 text-blue-500" />,
  remove_project_role: <UserMinus className="h-4 w-4 text-orange-500" />,
  create_org_role: <Shield className="h-4 w-4 text-purple-500" />,
  update_org_role: <Settings className="h-4 w-4 text-yellow-500" />,
  delete_org_role: <Shield className="h-4 w-4 text-red-500" />,
  invite_to_org: <UserPlus className="h-4 w-4 text-blue-500" />,
  invite_to_project: <UserPlus className="h-4 w-4 text-green-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  assign_org_role: 'Assigned Organization Role',
  remove_org_role: 'Removed Organization Role',
  assign_project_role: 'Assigned Project Role',
  remove_project_role: 'Removed Project Role',
  create_org_role: 'Created Role',
  update_org_role: 'Updated Role',
  delete_org_role: 'Deleted Role',
  invite_to_org: 'Invited to Organization',
  invite_to_project: 'Invited to Project',
};

export function OrgAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.offset, filters]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/v1/org/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const result = await response.json();
      if (result.success) {
        setLogs(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.pagination.total,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000', // Export all
        offset: '0',
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/v1/org/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export audit logs');

      const result = await response.json();

      // Convert to CSV
      const headers = [
        'Timestamp',
        'Action',
        'Performed By',
        'Target User',
        'Entity Type',
        'IP Address',
      ];
      const rows = result.data.map((log: AuditLogEntry) => [
        new Date(log.created_at).toISOString(),
        ACTION_LABELS[log.action] || log.action,
        log.performer?.email || 'Unknown',
        log.target_user?.email || '-',
        log.entity_type,
        log.ip_address || '-',
      ]);

      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  const getPerformerName = (log: AuditLogEntry) => {
    if (!log.performer) return 'System';
    if (log.performer.first_name && log.performer.last_name) {
      return `${log.performer.first_name} ${log.performer.last_name}`;
    }
    return log.performer.email;
  };

  const getTargetName = (log: AuditLogEntry) => {
    if (!log.target_user) return '-';
    if (log.target_user.first_name && log.target_user.last_name) {
      return `${log.target_user.first_name} ${log.target_user.last_name}`;
    }
    return log.target_user.email;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <PermissionGate
      resource="org_audit"
      action="view_audit_logs"
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view audit logs.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-500 mt-1">
              Track role and permission changes in your organization
            </p>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Audit Logs</SheetTitle>
                  <SheetDescription>
                    Narrow down the audit log results
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="grid gap-2">
                    <Label>Action Type</Label>
                    <Select
                      value={filters.action}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, action: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All actions</SelectItem>
                        <SelectItem value="assign_org_role">Assign Org Role</SelectItem>
                        <SelectItem value="remove_org_role">Remove Org Role</SelectItem>
                        <SelectItem value="assign_project_role">Assign Project Role</SelectItem>
                        <SelectItem value="remove_project_role">Remove Project Role</SelectItem>
                        <SelectItem value="create_org_role">Create Role</SelectItem>
                        <SelectItem value="update_org_role">Update Role</SelectItem>
                        <SelectItem value="delete_org_role">Delete Role</SelectItem>
                        <SelectItem value="invite_to_org">Invite to Org</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Entity Type</Label>
                    <Select
                      value={filters.entity_type}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, entity_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="org_user_roles">Org User Roles</SelectItem>
                        <SelectItem value="org_roles">Org Roles</SelectItem>
                        <SelectItem value="project_members">Project Members</SelectItem>
                        <SelectItem value="org_invitations">Invitations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({
                        action: '',
                        entity_type: '',
                        start_date: '',
                        end_date: '',
                      })
                    }
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <PermissionGate resource="org_audit" action="export_audit_logs">
              <Button variant="outline" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </PermissionGate>
          </div>
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
              <FileText className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              {pagination.total} total entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ACTION_ICONS[log.action] || (
                          <Settings className="h-4 w-4 text-gray-400" />
                        )}
                        <span>{ACTION_LABELS[log.action] || log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPerformerName(log)}</TableCell>
                    <TableCell>{getTargetName(log)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Sheet */}
        <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Audit Log Details</SheetTitle>
              <SheetDescription>
                Full details of this audit entry
              </SheetDescription>
            </SheetHeader>
            {selectedLog && (
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-gray-500">Action</Label>
                  <p className="font-medium">
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Timestamp</Label>
                  <p>{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Performed By</Label>
                  <p>{getPerformerName(selectedLog)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Target User</Label>
                  <p>{getTargetName(selectedLog)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Entity Type</Label>
                  <p>{selectedLog.entity_type}</p>
                </div>
                <div>
                  <Label className="text-gray-500">IP Address</Label>
                  <p>{selectedLog.ip_address || 'Not recorded'}</p>
                </div>
                {selectedLog.old_value && (
                  <div>
                    <Label className="text-gray-500">Previous Value</Label>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.new_value && (
                  <div>
                    <Label className="text-gray-500">New Value</Label>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PermissionGate>
  );
}

export default OrgAuditLog;

