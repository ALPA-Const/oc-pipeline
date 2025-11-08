import { useState, useMemo } from 'react';
import type { PipelineProject, PipelineStage } from '@/types/pipeline.types';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: PipelineProject[];
  stages: PipelineStage[];
  onMoveProject: (projectId: string, newStageId: string) => Promise<void>;
}

export function KanbanBoard({ projects, stages, onMoveProject }: Props) {
  const [draggedProject, setDraggedProject] = useState<PipelineProject | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const stagesWithProjects = useMemo(() => {
    return stages.map(stage => {
      const stageProjects = projects.filter(p => p.stageId === stage.id);
      return {
        ...stage,
        projects: stageProjects,
        totalValue: stageProjects.reduce((sum, p) => sum + p.value, 0),
        projectCount: stageProjects.length,
      };
    });
  }, [stages, projects]);

  const handleDragStart = (project: PipelineProject) => {
    setDraggedProject(project);
  };

  const handleDragOver = (event: React.DragEvent, stageId: string) => {
    event.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (event: React.DragEvent, toStageId: string) => {
    event.preventDefault();
    setDragOverStageId(null);

    if (!draggedProject || draggedProject.stageId === toStageId) {
      setDraggedProject(null);
      return;
    }

    await onMoveProject(draggedProject.id, toStageId);
    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverStageId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)]">
      {stagesWithProjects.map(stage => (
        <div
          key={stage.id}
          className={`flex-shrink-0 w-80 bg-slate-50 rounded-lg transition-all ${
            dragOverStageId === stage.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, stage.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-slate-200 bg-white rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                {stage.projectCount}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              {formatCurrency(stage.totalValue)}
            </div>
          </div>

          {/* Column Content */}
          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
            {stage.projects.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No projects</p>
              </div>
            ) : (
              stage.projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stageColor={stage.color}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}