<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineStage } from '@/types/pipeline.types';

interface Props {
  stage: PipelineStage & {
    projects: any[];
    totalValue: number;
    projectCount: number;
  };
  isDragOver?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDragOver: false,
});

const formattedValue = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(props.stage.totalValue);
});
</script>

<template>
  <div 
    class="kanban-column" 
    :class="{ 'drag-over': isDragOver }"
  >
    <div class="column-header" :style="{ borderTopColor: stage.color }">
      <div class="header-content">
        <h3 class="column-title">{{ stage.name }}</h3>
        <span class="project-count">{{ stage.projectCount }}</span>
      </div>
      <div class="column-meta">
        <span class="total-value">{{ formattedValue }}</span>
        <span v-if="stage.averageDuration" class="avg-duration">
          Avg: {{ stage.averageDuration }}d
        </span>
      </div>
    </div>

    <div class="column-body">
      <slot></slot>
      
      <div v-if="stage.projects.length === 0" class="empty-column">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No projects</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  background: #F9FAFB;
  border-radius: 8px;
  height: 100%;
  transition: all 0.2s ease;
}

.kanban-column.drag-over {
  background: #DBEAFE;
  opacity: 0.8;
  transform: scale(1.02);
}

.column-header {
  padding: 12px;
  border-top: 4px solid;
  border-bottom: 1px solid #E5E7EB;
  background: white;
  border-radius: 8px 8px 0 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.column-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.project-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: #E5E7EB;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.column-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6B7280;
}

.total-value {
  font-weight: 600;
}

.avg-duration {
  font-style: italic;
}

.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-body::-webkit-scrollbar {
  width: 6px;
}

.column-body::-webkit-scrollbar-track {
  background: transparent;
}

.column-body::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.column-body::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #9CA3AF;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.empty-column p {
  font-size: 14px;
}
</style>