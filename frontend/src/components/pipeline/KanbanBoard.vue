<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { getStagesByType } from '@/config/pipeline-stages';
import type { PipelineType, PipelineProject } from '@/types/pipeline.types';
import KanbanColumn from './KanbanColumn.vue';
import ProjectCard from './ProjectCard.vue';

interface Props {
  type: PipelineType;
}

const props = defineProps<Props>();

const pipelineStore = usePipelineStore();
const draggedProject = ref<PipelineProject | null>(null);
const dragOverStageId = ref<string | null>(null);

const stages = computed(() => getStagesByType(props.type));

const stagesWithProjects = computed(() => {
  return stages.value.map(stage => ({
    ...stage,
    projects: pipelineStore.projectsByStage[stage.id] || [],
    totalValue: (pipelineStore.projectsByStage[stage.id] || [])
      .reduce((sum, p) => sum + p.value, 0),
    projectCount: (pipelineStore.projectsByStage[stage.id] || []).length,
  }));
});

const handleDragStart = (project: PipelineProject) => {
  draggedProject.value = project;
};

const handleDragOver = (event: DragEvent, stageId: string) => {
  event.preventDefault();
  dragOverStageId.value = stageId;
};

const handleDragLeave = () => {
  dragOverStageId.value = null;
};

const handleDrop = async (event: DragEvent, toStageId: string) => {
  event.preventDefault();
  dragOverStageId.value = null;

  if (!draggedProject.value) return;

  const success = await pipelineStore.moveProject(
    draggedProject.value.id,
    toStageId
  );

  draggedProject.value = null;
};

const handleDragEnd = () => {
  draggedProject.value = null;
  dragOverStageId.value = null;
};

onMounted(() => {
  pipelineStore.fetchProjects(props.type);
});
</script>

<template>
  <div class="kanban-board">
    <div v-if="pipelineStore.isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading pipeline...</p>
    </div>

    <div v-else class="kanban-columns">
      <KanbanColumn
        v-for="stage in stagesWithProjects"
        :key="stage.id"
        :stage="stage"
        :is-drag-over="dragOverStageId === stage.id"
        @dragover="handleDragOver($event, stage.id)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, stage.id)"
      >
        <ProjectCard
          v-for="project in stage.projects"
          :key="project.id"
          :project="project"
          :stage-color="stage.color"
          draggable="true"
          @dragstart="handleDragStart(project)"
          @dragend="handleDragEnd"
        />
      </KanbanColumn>
    </div>
  </div>
</template>

<style scoped>
.kanban-board {
  position: relative;
  height: calc(100vh - 200px);
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16px;
}

.kanban-columns {
  display: flex;
  gap: 12px;
  min-width: min-content;
  height: 100%;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>