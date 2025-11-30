import type { PipelineProject } from '@/types/pipeline.types';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, TrendingUp, User, Clock } from 'lucide-react';

interface Props {
  project: PipelineProject;
  stageColor: string;
  onDragStart?: (project: PipelineProject) => void;
  onDragEnd?: () => void;
}

export function ProjectCard({ project, stageColor, onDragStart, onDragEnd }: Props) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(project.value);

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(project);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-blue-500';
      case 'low': return 'border-gray-400';
      default: return 'border-gray-300';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-l-4 ${getPriorityColor(project.priority)} ${
        project.isStalled ? 'bg-orange-50' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          />
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
            {project.name}
          </h3>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="font-medium">{formattedValue}</span>
          </div>

          {project.winProbability && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{project.winProbability}%</span>
            </div>
          )}

          {project.pm && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{project.pm}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-3 space-y-2">
        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {project.agency && (
            <Badge variant="secondary" className="text-xs">
              {project.agency}
            </Badge>
          )}
          {project.priority && (
            <Badge variant="outline" className="text-xs">
              {project.priority}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className={`flex items-center gap-1 text-xs font-medium ${
            project.daysInStage > 30 ? 'text-orange-600' : 'text-slate-600'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{project.daysInStage} days</span>
          </div>

          {project.isStalled && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>Stalled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}