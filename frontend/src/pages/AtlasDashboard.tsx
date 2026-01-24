import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Activity,
  Clock,
  AlertCircle,
  Bot,
  Eye,
} from 'lucide-react';

interface Agent {
  id: string;
  agent_code: string;
  name: string;
  description?: string;
  module?: string;
  agent_type: string;
  status: string;
  tasks_processed: number;
  success_rate: number;
  last_active_at?: string;
}

/**
 * ATLAS Dashboard
 * Command center for AI agent orchestration and file access management
 */
const AtlasDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when backend is fully implemented
      // const response = await api.get('/atlas/agents');
      // setAgents(response.data.data);
      
      // Placeholder data for demonstration until API is implemented
      const placeholderAgents: Agent[] = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          agent_code: 'ATLAS-001',
          name: 'Document Analyzer',
          description: 'Analyzes construction documents and specifications',
          module: 'preconstruction',
          agent_type: 'specialist',
          status: 'active',
          tasks_processed: 1247,
          success_rate: 98.5,
          last_active_at: new Date().toISOString(),
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          agent_code: 'ATLAS-002',
          name: 'Specification Extractor',
          description: 'Extracts key information from specification documents',
          module: 'preconstruction',
          agent_type: 'specialist',
          status: 'active',
          tasks_processed: 892,
          success_rate: 96.2,
          last_active_at: new Date().toISOString(),
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          agent_code: 'ATLAS-003',
          name: 'Drawing Analyzer',
          description: 'Analyzes architectural and engineering drawings',
          module: 'preconstruction',
          agent_type: 'specialist',
          status: 'active',
          tasks_processed: 634,
          success_rate: 94.8,
          last_active_at: new Date().toISOString(),
        },
      ];

      setAgents(placeholderAgents);
    } catch (err) {
      console.error('Error loading agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      dormant: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ATLAS Command Center</h1>
        <p className="text-muted-foreground">
          AI Agent Orchestration and File Access Management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + a.tasks_processed, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0
                ? Math.round(
                    agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>
            Manage and monitor AI agents in the ATLAS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tasks Processed</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.agent_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.module || 'General'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.tasks_processed.toLocaleString()}</TableCell>
                    <TableCell>{agent.success_rate.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(agent.last_active_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/atlas/agents/${agent.id}/files`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Files
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AtlasDashboard;
