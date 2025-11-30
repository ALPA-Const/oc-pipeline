import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PipelineProject, PipelineStage } from '@/types/pipeline.types';
import { formatCurrency } from '@/utils/pipeline';
import { DollarSign, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: PipelineProject;
  stage?: PipelineStage;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all',
        isDragging && 'opacity-50 scale-105'
      )}
    >
      <Card className={cn(
        'hover:shadow-md transition-shadow',
        project.isStalled && 'border-orange-300 bg-orange-50'
      )}>
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2 flex-1">
              {project.name}
            </h4>
            {project.priority && (
              <Badge 
                variant="outline" 
                className={cn('text-xs', priorityColors[project.priority])}
              >
                {project.priority}
              </Badge>
            )}
          </div>

          {/* Value */}
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-3 w-3 text-gray-500" />
            <span className="font-semibold text-gray-900">
              {formatCurrency(project.value, true)}
            </span>
            {project.winProbability && (
              <span className="text-xs text-gray-500 ml-1">
                ({project.winProbability}%)
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-gray-600">
            {project.agency && (
              <div className="truncate">
                <span className="font-medium">Agency:</span> {project.agency}
              </div>
            )}
            {project.pm && (
              <div className="truncate">
                <span className="font-medium">PM:</span> {project.pm}
              </div>
            )}
            {project.setAside && (
              <Badge variant="secondary" className="text-xs">
                {project.setAside}
              </Badge>
            )}
          </div>

          {/* Days in Stage */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{project.daysInStage} days</span>
            </div>
            {project.isStalled && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span className="font-medium">Stalled</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}