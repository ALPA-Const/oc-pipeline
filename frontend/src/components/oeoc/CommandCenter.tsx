// =====================================================
// OEOC Command Center - Main Dashboard
// The "Glass House" for AI Swarm Management
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Bot, 
  Brain, 
  CheckCircle2, 
  Clock,
  PlayCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { OEOCDashboardStats, Orchestrator, WorkflowRun } from '@/types/oeoc.types';

export function CommandCenter() {
  const [stats, setStats] = useState<OEOCDashboardStats | null>(null);
  const [orchestrators, setOrchestrators] = useState<Orchestrator[]>([]);
  const [activeRuns, setActiveRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, orchData, runsData] = await Promise.all([
        oeocService.dashboard.getStats(),
        oeocService.orchestrators.getAll(),
        oeocService.runs.getActive(),
      ]);
      setStats(statsData);
      setOrchestrators(orchData);
      setActiveRuns(runsData);
    } catch (error) {
      console.error('Failed to load OEOC data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadData();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle': return <Badge className="bg-green-500 hover:bg-green-600">Idle</Badge>;
      case 'busy': return <Badge className="bg-amber-500 hover:bg-amber-600">Busy</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'offline': return <Badge variant="secondary">Offline</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">O'Neill Elite Orchestration Console</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orchestrators</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orchestrators.total || 0}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-green-600">{stats?.orchestrators.idle} idle</span>
              <span className="text-xs text-amber-600">{stats?.orchestrators.busy} busy</span>
              <span className="text-xs text-red-600">{stats?.orchestrators.error} error</span>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.agents.total || 0}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-green-600">{stats?.agents.idle} idle</span>
              <span className="text-xs text-amber-600">{stats?.agents.active} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.runs.active || 0}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-blue-600">{stats?.runs.pending} pending</span>
              <span className="text-xs text-green-600">{stats?.runs.completed_today} done today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.alerts || 0) > 0 ? 'text-red-600' : ''}`}>
              {stats?.alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.runs.failed_today || 0} failed today
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Orchestrators Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Orchestrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {orchestrators.map((orch) => (
              <div
                key={orch.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(orch.status)}`} />
                  <div>
                    <p className="font-medium text-sm">{orch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {orch.current_run_count}/{orch.max_concurrent_runs} runs
                    </p>
                  </div>
                </div>
                {getStatusBadge(orch.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Active Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Live Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active workflow runs</p>
              <p className="text-sm">Trigger a workflow to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-amber-500 rounded animate-pulse" />
                    <div>
                      <p className="font-medium">{run.workflow?.title || 'Unknown Workflow'}</p>
                      <p className="text-sm text-muted-foreground">
                        Started {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'pending'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="capitalize">{run.status.replace('_', ' ')}</Badge>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommandCenter;
