import { useEffect, useState } from 'react';
import { Download, Filter, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { PipelineMetrics } from '@/components/pipeline/PipelineMetrics';
import { usePipelineStore } from '@/stores/pipeline';
import { getStagesByType } from '@/config/pipeline-stages';
import { PipelineType } from '@/types/pipeline.types';

const PIPELINE_TABS: { type: PipelineType; label: string; description: string }[] = [
  {
    type: PipelineType.OPPORTUNITY,
    label: 'Opportunity',
    description: 'Lead gen → Award',
  },
  {
    type: PipelineType.PRECONSTRUCTION,
    label: 'Preconstruction',
    description: 'Planning → Ready to Build',
  },
  {
    type: PipelineType.EXECUTION,
    label: 'Execution',
    description: 'Mobilization → Substantial Completion',
  },
  {
    type: PipelineType.CLOSEOUT,
    label: 'Closeout',
    description: 'Inspection → Warranty',
  },
];

const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'] as const;
const SET_ASIDE_OPTIONS = ['None', 'Small Business', '8(a)', 'WOSB', 'HUBZone', 'SDVOSB'];

export function PipelineView() {
  const [activeType, setActiveType] = useState<PipelineType>(PipelineType.OPPORTUNITY);
  const [showFilters, setShowFilters] = useState(false);

  const {
    fetchProjects,
    fetchMetrics,
    moveProject,
    exportPipeline,
    filteredProjects,
    stalledProjects,
    filters,
    setFilters,
    clearFilters,
    isLoading,
  } = usePipelineStore();

  useEffect(() => {
    fetchProjects(activeType);
    fetchMetrics(activeType);
  }, [activeType, fetchProjects, fetchMetrics]);

  const stages = getStagesByType(activeType);

  const handleMoveProject = async (projectId: string, newStageId: string) => {
    await moveProject(projectId, newStageId);
  };

  const handleExport = () => {
    exportPipeline(activeType);
  };

  const hasActiveFilters =
    (filters.agency?.length ?? 0) > 0 ||
    (filters.priority?.length ?? 0) > 0 ||
    (filters.setAside?.length ?? 0) > 0 ||
    filters.showStalled;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Healthcare &amp; public sector construction projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stalledProjects.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {stalledProjects.length} Stalled
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Pipeline Type Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {PIPELINE_TABS.map(({ type, label, description }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeType === type
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="block">{label}</span>
            <span className="text-xs font-normal text-slate-400">{description}</span>
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Filter Projects</h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-7 w-7 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Priority</label>
                <Select
                  value={filters.priority?.[0] ?? ''}
                  onValueChange={(val) =>
                    setFilters({ ...filters, priority: val ? [val] : undefined })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Set-Aside Filter */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Set-Aside</label>
                <Select
                  value={filters.setAside?.[0] ?? ''}
                  onValueChange={(val) =>
                    setFilters({ ...filters, setAside: val ? [val] : undefined })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All set-asides" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All set-asides</SelectItem>
                    {SET_ASIDE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agency Filter */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Agency</label>
                <Input
                  placeholder="Filter by agency"
                  className="h-8 text-sm"
                  value={filters.agency?.[0] ?? ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      agency: e.target.value ? [e.target.value] : undefined,
                    })
                  }
                />
              </div>

              {/* Stalled Toggle */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600"
                    checked={!!filters.showStalled}
                    onChange={(e) =>
                      setFilters({ ...filters, showStalled: e.target.checked || undefined })
                    }
                  />
                  <span className="text-sm text-slate-700">Show stalled only</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <PipelineMetrics projects={filteredProjects} />

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading pipeline...</p>
          </div>
        </div>
      ) : (
        <KanbanBoard
          projects={filteredProjects}
          stages={stages}
          onMoveProject={handleMoveProject}
        />
      )}
    </div>
  );
}
