import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PipelineType, PipelineProject } from '@/types/pipeline.types';
import { getStagesByType } from '@/config/pipeline-stages';
import { usePipelineStore } from '@/stores/pipeline';
import { ProjectCard } from './ProjectCard';
import { formatCurrency } from '@/utils/pipeline';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  type: PipelineType;
}

export function KanbanBoard({ type }: KanbanBoardProps) {
  const { projectsByStage, moveProject, selectProject } = usePipelineStore();
  const [activeProject, setActiveProject] = useState<PipelineProject | null>(null);
  
  const stages = getStagesByType(type);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allProjects: PipelineProject[] = Object.values(projectsByStage).flat() as PipelineProject[];
    const project = allProjects.find((p: PipelineProject) => p.id === String(active.id));
    setActiveProject(project || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const projectId = String(active.id);
    const newStageId = String(over.id);
    
    // Find the project's current stage
    const allProjects: PipelineProject[] = Object.values(projectsByStage).flat() as PipelineProject[];
    const project = allProjects.find((p: PipelineProject) => p.id === projectId);
    
    if (!project || project.stageId === newStageId) return;
    
    // Move the project
    moveProject(projectId, newStageId);
    setActiveProject(null);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-6">
          {stages.map((stage) => {
            const stageProjects = projectsByStage[stage.id] || [];
            const totalValue = stageProjects.reduce((sum: number, p: PipelineProject) => sum + p.value, 0);
            
            return (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {stageProjects.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatCurrency(totalValue, true)}</span>
                      {stage.averageDuration && (
                        <span>Avg: {stage.averageDuration}d</span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stage.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <SortableContext
                      items={stageProjects.map((p: PipelineProject) => p.id)}
                      strategy={verticalListSortingStrategy}
                      id={stage.id}
                    >
                      <ScrollArea className="h-full">
                        <div 
                          className={cn(
                            "min-h-32 p-2 rounded-lg border-2 border-dashed border-gray-200 transition-colors",
                            "hover:border-gray-300"
                          )}
                          data-stage-id={stage.id}
                        >
                          {stageProjects.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                              No projects
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {stageProjects.map((project: PipelineProject) => (
                                <ProjectCard
                                  key={project.id}
                                  project={project}
                                  stage={stage}
                                  onClick={() => selectProject(project.id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </SortableContext>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        
        <DragOverlay>
          {activeProject && (
            <div className="rotate-3 scale-105">
              <ProjectCard
                project={activeProject}
                stage={stages.find(s => s.id === activeProject.stageId)!}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}