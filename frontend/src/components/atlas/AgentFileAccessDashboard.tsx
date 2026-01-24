import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import agentFileAccessService, {
  AgentFileAccess,
  AgentFilePermission,
  AgentFileOperation,
  FileAccessStats,
} from '@/services/agent-file-access.service';
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';

interface AgentFileAccessDashboardProps {
  agentId: string;
  agentName?: string;
}

const AgentFileAccessDashboard: React.FC<AgentFileAccessDashboardProps> = ({
  agentId,
  agentName = 'Agent',
}) => {
  const [accessHistory, setAccessHistory] = useState<AgentFileAccess[]>([]);
  const [permissions, setPermissions] = useState<AgentFilePermission[]>([]);
  const [operations, setOperations] = useState<AgentFileOperation[]>([]);
  const [stats, setStats] = useState<FileAccessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('access');
  const [filterAccessType, setFilterAccessType] = useState<string>('');
  const [filterOperation, setFilterOperation] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [accessData, permissionsData, operationsData, statsData] = await Promise.all([
        agentFileAccessService.getAgentFileAccess(agentId, { limit: 100 }),
        agentFileAccessService.getAgentPermissions(agentId),
        agentFileAccessService.getAgentFileOperations(agentId, { limit: 100 }),
        agentFileAccessService.getAgentFileAccessStats(agentId),
      ]);

      setAccessHistory(accessData);
      setPermissions(permissionsData);
      setOperations(operationsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading agent file access data:', err);
      setError('Failed to load file access data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAccessTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-orange-100 text-orange-800',
      analyze: 'bg-purple-100 text-purple-800',
      extract: 'bg-green-100 text-green-800',
      generate: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'read':
        return <Eye className="h-4 w-4" />;
      case 'write':
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredAccessHistory = filterAccessType
    ? accessHistory.filter((a) => a.access_type === filterAccessType)
    : accessHistory;

  const filteredOperations = filterOperation
    ? operations.filter((o) => o.operation_type === filterOperation)
    : operations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading file access data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {agentName} - File Access Dashboard
        </h2>
        <p className="text-muted-foreground">
          Monitor and manage file access for this AI agent
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_accesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_files}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_accesses > 0
                  ? Math.round((stats.successful_accesses / stats.total_accesses) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_duration_ms ? `${Math.round(stats.avg_duration_ms)}ms` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="access">Access History</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File Access History</CardTitle>
                  <CardDescription>Recent file accesses by this agent</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterAccessType} onValueChange={setFilterAccessType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="analyze">Analyze</SelectItem>
                      <SelectItem value="extract">Extract</SelectItem>
                      <SelectItem value="generate">Generate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadData}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Access Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No access history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccessHistory.map((access) => (
                      <TableRow key={access.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{access.file_name}</div>
                              {access.mime_type && (
                                <div className="text-xs text-muted-foreground">
                                  {access.mime_type}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAccessTypeBadge(access.access_type)}>
                            {access.access_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(access.accessed_at)}</TableCell>
                        <TableCell>{access.duration_ms ? `${access.duration_ms}ms` : '-'}</TableCell>
                        <TableCell>
                          {access.success ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {access.access_reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File Permissions</CardTitle>
                  <CardDescription>Manage file access permissions for this agent</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadData}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pattern/Folder</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No permissions configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {perm.file_pattern && (
                                <div className="font-medium">{perm.file_pattern}</div>
                              )}
                              {perm.mime_type_pattern && (
                                <div className="text-xs text-muted-foreground">
                                  {perm.mime_type_pattern}
                                </div>
                              )}
                              {perm.folder_name && (
                                <div className="text-xs text-muted-foreground">
                                  Folder: {perm.folder_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {perm.can_read && <Badge variant="outline">Read</Badge>}
                            {perm.can_write && <Badge variant="outline">Write</Badge>}
                            {perm.can_delete && <Badge variant="outline">Delete</Badge>}
                            {perm.can_analyze && <Badge variant="outline">Analyze</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {perm.project_id ? 'Project' : perm.org_id ? 'Organization' : 'Global'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {perm.granted_by_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {perm.expires_at ? formatDate(perm.expires_at) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={perm.is_active ? 'default' : 'secondary'}>
                            {perm.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File Operations</CardTitle>
                  <CardDescription>File operations performed by this agent</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterOperation} onValueChange={setFilterOperation}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Operations</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="move">Move</SelectItem>
                      <SelectItem value="copy">Copy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadData}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No operations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOperations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOperationIcon(op.operation_type)}
                            <Badge variant="outline">{op.operation_type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {op.file_name || op.current_file_name || 'Unknown'}
                            </div>
                            {op.mime_type && (
                              <div className="text-xs text-muted-foreground">{op.mime_type}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(op.performed_at)}</TableCell>
                        <TableCell>{op.size_bytes ? formatBytes(op.size_bytes) : '-'}</TableCell>
                        <TableCell>
                          {op.success ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentFileAccessDashboard;
