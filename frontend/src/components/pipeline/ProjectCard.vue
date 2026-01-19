<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineProject } from '@/types/pipeline.types';
import { usePipelineStore } from '@/stores/pipeline';

interface Props {
  project: PipelineProject;
  stageColor: string;
}

const props = defineProps<Props>();

const pipelineStore = usePipelineStore();

const formattedValue = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(props.project.value);
});

const healthStatus = computed(() => {
  if (props.project.isStalled) return 'critical';
  // Add more health logic here
  return 'healthy';
});

const handleClick = () => {
  pipelineStore.selectProject(props.project.id);
};
</script>

<template>
  <div 
    class="project-card" 
    :class="[
      `priority-${project.priority}`,
      { 'is-stalled': project.isStalled }
    ]"
    @click="handleClick"
  >
    <div class="card-header">
      <div 
        class="card-indicator" 
        :style="{ backgroundColor: stageColor }"
      ></div>
      <h3 class="card-title">{{ project.name }}</h3>
    </div>

    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item">
          <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formattedValue }}</span>
        </div>
        
        <div v-if="project.winProbability" class="meta-item">
          <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{{ project.winProbability }}%</span>
        </div>

        <div v-if="project.pm" class="meta-item">
          <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{{ project.pm }}</span>
        </div>
      </div>

      <div class="card-details">
        <span v-if="project.agency" class="detail-badge">{{ project.agency }}</span>
        <span v-if="project.priority" class="detail-badge priority">{{ project.priority }}</span>
      </div>

      <div class="card-footer">
        <span 
          class="days-in-stage"
          :class="{ 'is-warning': project.daysInStage > 30 }"
        >
          {{ project.daysInStage }} days
        </span>

        <div v-if="project.isStalled" class="stalled-badge">
          <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Stalled
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  cursor: grab;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin-bottom: 8px;
}

.project-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.project-card:active {
  cursor: grabbing;
}

.project-card.is-stalled {
  border-left-color: #F59E0B;
  background: #FEF3C7;
}

.priority-critical {
  border-left-color: #EF4444;
}

.priority-high {
  border-left-color: #F59E0B;
}

.priority-medium {
  border-left-color: #3B82F6;
}

.priority-low {
  border-left-color: #6B7280;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  padding-bottom: 8px;
}

.card-indicator {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-body {
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6B7280;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.detail-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #F3F4F6;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
}

.detail-badge.priority {
  background: #DBEAFE;
  color: #1E40AF;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #E5E7EB;
}

.days-in-stage {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

.days-in-stage.is-warning {
  color: #F59E0B;
}

.stalled-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #F59E0B;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-icon {
  width: 12px;
  height: 12px;
}
</style>