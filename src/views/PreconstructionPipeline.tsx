import { useEffect } from 'react';
import { usePipelineStore } from '@/stores/pipeline';
import { PipelineType } from '@/types/pipeline.types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { PipelineMetrics } from '@/components/PipelineMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

export default function PreconstructionPipeline() {
  const {
    fetchProjects,
    fetchMetrics,
    exportPipeline,
    isLoading,
  } = usePipelineStore();

  useEffect(() => {
    fetchProjects(PipelineType.PRECONSTRUCTION);
    fetchMetrics(PipelineType.PRECONSTRUCTION);
  }, [fetchProjects, fetchMetrics]);

  const handleRefresh = async () => {
    await fetchProjects(PipelineType.PRECONSTRUCTION);
    await fetchMetrics(PipelineType.PRECONSTRUCTION);
  };

  const handleExport = () => {
    exportPipeline(PipelineType.PRECONSTRUCTION);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preconstruction Pipeline</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage design, estimating, and preconstruction activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="board" className="h-full flex flex-col">
          <div className="bg-white border-b px-6">
            <TabsList>
              <TabsTrigger value="board">Board View</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="board" className="h-full m-0 p-6">
              <KanbanBoard type={PipelineType.PRECONSTRUCTION} />
            </TabsContent>

            <TabsContent value="metrics" className="h-full m-0 p-6 overflow-auto">
              <PipelineMetrics />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}