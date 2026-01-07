// =====================================================
// OEOC Workflows Page
// Workflow templates and active runs
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ListChecks,
  RefreshCw,
  Play,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { Workflow, WorkflowRun, StepRun } from '@/types/oeoc.types';

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [runSteps, setRunSteps] = useState<Record<string, StepRun[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [wfData, runsData] = await Promise.all([
        oeocService.workflows.getAll(),
        oeocService.runs.getActive(),
      ]);
      setWorkflows(wfData);
      setRuns(runsData);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async (workflowId: string) => {
    setTriggering(workflowId);
    try {
      await oeocService.runs.trigger(workflowId);
      loadData();
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
    } finally {
      setTriggering(null);
    }
  };

  const handleExpandRun = async (runId: string) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      return;
    }
    setExpandedRun(runId);
    if (!runSteps[runId]) {
      try {
        const steps = await oeocService.steps.getByRun(runId);
        setRunSteps((prev) => ({ ...prev, [runId]: steps }));
      } catch (error) {
        console.error('Failed to load steps:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredWorkflows = workflows.filter((wf) =>
    wf.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Automation templates and active runs</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workflow Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{wf.title}</CardTitle>
                  <Badge variant={wf.is_active ? 'default' : 'secondary'}>
                    {wf.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{wf.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-4 w-4" />
                      {wf.definition?.steps?.length || 0} steps
                    </span>
                    {wf.estimated_duration_minutes && (
                      <span className="flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        ~{wf.estimated_duration_minutes} min
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTrigger(wf.id)}
                    disabled={triggering === wf.id || !wf.is_active}
                  >
                    {triggering === wf.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Runs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Runs ({runs.length})</h2>
        {runs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active workflow runs</p>
              <p className="text-sm">Trigger a workflow template to start</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="py-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleExpandRun(run.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedRun === run.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="w-2 h-8 bg-amber-500 rounded animate-pulse" />
                      <div>
                        <p className="font-medium">{run.workflow?.title || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {run.started_at
                            ? `Started ${new Date(run.started_at).toLocaleString()}`
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {run.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Expanded Steps */}
                  {expandedRun === run.id && runSteps[run.id] && (
                    <div className="mt-4 ml-8 space-y-2 border-l-2 pl-4">
                      {runSteps[run.id].map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(step.status)}
                            <span className="text-sm">{step.step_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowsPage;
