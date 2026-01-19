import { useMemo } from 'react';
import { PipelineStage, PipelineProject } from '@/types/pipeline.types';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: PipelineStage;
  projects: PipelineProject[];
  onDrop: (projectId: string, targetStageId: string) => void;
  onCardClick: (project: PipelineProject) => void;
}

export default function KanbanColumn({
  stage,
  projects,
  onDrop,
  onCardClick,
}: KanbanColumnProps) {
  const totalValue = useMemo(() => {
    return projects.reduce((sum, project) => sum + (project.value || 0), 0);
  }, [projects]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'ring-2', 'ring-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId) {
      onDrop(projectId, stage.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col bg-gray-50 rounded-lg p-4 min-h-[600px] transition-colors'
      )}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="text-sm text-gray-600">{projects.length}</span>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .kanban-column-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .kanban-column-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .kanban-column-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .kanban-column-scroll::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `
      }} />

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 kanban-column-scroll">
        {projects.map((project) => (
          <div key={project.id} onClick={() => onCardClick(project)}>
            <ProjectCard
              project={project}
              stageColor={stage.color}
              onDragStart={(proj) => {
                const event = new DragEvent('dragstart');
                event.dataTransfer?.setData('projectId', proj.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}