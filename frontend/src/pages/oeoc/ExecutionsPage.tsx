// =====================================================
// OEOC Executions Page
// Gantt-style timeline view of workflow runs
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  StopCircle,
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { WorkflowRun, StepRun } from '@/types/oeoc.types';

export function ExecutionsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [steps, setSteps] = useState<StepRun[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadRuns = async () => {
    try {
      const data = await oeocService.runs.getActive();
      setRuns(data);
      if (data.length > 0 && !selectedRun) {
        setSelectedRun(data[0]);
        loadSteps(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSteps = async (runId: string) => {
    try {
      const data = await oeocService.steps.getByRun(runId);
      setSteps(data);
    } catch (error) {
      console.error('Failed to load steps:', error);
    }
  };

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRun) {
      loadSteps(selectedRun.id);
    }
  }, [selectedRun]);

  const handleCancel = async (runId: string) => {
    try {
      await oeocService.runs.cancel(runId);
      loadRuns();
    } catch (error) {
      console.error('Failed to cancel run:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in_progress': return 'bg-amber-500';
      case 'assigned': return 'bg-blue-500';
      case 'waiting': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getStepWidth = (step: StepRun, totalSteps: number) => {
    return `${100 / totalSteps}%`;
  };

  const filteredRuns = runs.filter((run) =>
    statusFilter === 'all' || run.status === statusFilter
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
          <h1 className="text-3xl font-bold tracking-tight">Live Executions</h1>
          <p className="text-muted-foreground">Real-time workflow execution timeline</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadRuns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active executions</p>
            <p className="text-sm">Trigger a workflow to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Run List */}
          <div className="space-y-3">
            <h2 className="font-semibold">Active Runs</h2>
            {filteredRuns.map((run) => (
              <Card
                key={run.id}
                className={`cursor-pointer transition-colors ${
                  selectedRun?.id === run.id ? 'border-primary' : 'hover:border-muted-foreground'
                }`}
                onClick={() => setSelectedRun(run)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{run.workflow?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.started_at
                          ? new Date(run.started_at).toLocaleTimeString()
                          : 'Pending'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {run.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline View */}
          <div className="lg:col-span-2">
            {selectedRun ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedRun.workflow?.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Run ID: {selectedRun.id.slice(0, 8)}...
                      </p>
                    </div>
                    {['pending', 'assigned', 'in_progress', 'waiting'].includes(selectedRun.status) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(selectedRun.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Gantt Timeline */}
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Step Progress ({steps.filter((s) => s.status === 'completed').length}/{steps.length})
                    </div>

                    {/* Progress Bar */}
                    <div className="flex h-8 rounded-lg overflow-hidden border">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`${getStatusColor(step.status)} flex items-center justify-center text-xs text-white font-medium transition-all ${
                            step.status === 'in_progress' ? 'animate-pulse' : ''
                          }`}
                          style={{ width: getStepWidth(step, steps.length) }}
                          title={`${step.step_name}: ${step.status}`}
                        >
                          {step.step_number}
                        </div>
                      ))}
                    </div>

                    {/* Step Details */}
                    <div className="space-y-2 mt-6">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${getStatusColor(step.status)} flex items-center justify-center text-white text-sm font-medium`}>
                              {step.step_number}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{step.step_name}</p>
                              {step.agent && (
                                <p className="text-xs text-muted-foreground">
                                  Agent: {step.agent.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                            {step.status === 'in_progress' && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                            {step.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                            <Badge variant="outline" className="text-xs capitalize">
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a run to view timeline
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionsPage;
