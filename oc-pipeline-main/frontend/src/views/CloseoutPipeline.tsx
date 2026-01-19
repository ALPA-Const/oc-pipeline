import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { PipelineMetrics } from '@/components/pipeline/PipelineMetrics';
import { usePipelineStore } from '@/stores/pipeline.database';
import { PipelineType } from '@/types/pipeline.types';
import { formatCurrency } from '@/utils/pipeline';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  BarChart3,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CloseoutPipeline() {
  const [showMetrics, setShowMetrics] = useState(false);
  const {
    projects,
    stages,
    fetchProjects,
    fetchMetrics,
    getFilteredProjects,
    getStalledProjects,
    getTotalPipelineValue,
    getWeightedPipelineValue,
    moveProject,
    isLoading,
    exportToCSV,
  } = usePipelineStore();

  useEffect(() => {
    fetchProjects(PipelineType.CLOSEOUT);
    fetchMetrics(PipelineType.CLOSEOUT);
  }, [fetchProjects, fetchMetrics]);

  const handleRefresh = async () => {
    toast.info('Refreshing pipeline data...');
    await fetchProjects(PipelineType.CLOSEOUT);
    await fetchMetrics(PipelineType.CLOSEOUT);
    toast.success('Pipeline data refreshed');
  };

  const handleExport = () => {
    const projects = getFilteredProjects();
    exportToCSV(projects, 'closeout_pipeline');
    toast.success('Pipeline exported to CSV');
  };

  const handleMoveProject = async (projectId: string, newStageId: string) => {
    await moveProject(projectId, newStageId);
    toast.success('Project moved successfully');
  };

  const filteredProjects = getFilteredProjects();
  const stalledProjects = getStalledProjects();
  const totalValue = getTotalPipelineValue();
  const weightedValue = getWeightedPipelineValue();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600" />
                  <h1 className="text-3xl font-bold text-slate-900">Closeout Pipeline</h1>
                </div>
                <p className="text-slate-600 mt-1">
                  Punch List → Final Inspection → Handover → Warranty → Complete
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant={showMetrics ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showMetrics ? 'Hide' : 'Show'} Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{filteredProjects.length}</p>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(totalValue, true)}
                </p>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Weighted Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(weightedValue, true)}
                </p>
                <div className="text-2xl text-purple-500">%</div>
              </div>
            </CardContent>
          </Card>

          <Card className={stalledProjects.length > 0 ? 'border-orange-300 bg-orange-50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Stalled Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600">{stalledProjects.length}</p>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              {stalledProjects.length > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Requires Attention
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        {showMetrics && (
          <div className="mb-6">
            <PipelineMetrics projects={projects} />
          </div>
        )}

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle>Project Closeout Stages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-slate-600">Loading closeout projects...</p>
                </div>
              </div>
            ) : (
              <KanbanBoard 
                projects={projects}
                stages={stages}
                onMoveProject={handleMoveProject}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}