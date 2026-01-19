<script setup lang="ts">
import { computed } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import type { PipelineType } from '@/types/pipeline.types';

interface Props {
  type: PipelineType;
}

const props = defineProps<Props>();

const pipelineStore = usePipelineStore();

const formattedTotalValue = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(pipelineStore.totalPipelineValue);
});

const formattedWeightedValue = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(pipelineStore.weightedPipelineValue);
});

const stalledPercentage = computed(() => {
  if (pipelineStore.filteredProjects.length === 0) return 0;
  return Math.round((pipelineStore.stalledProjects.length / pipelineStore.filteredProjects.length) * 100);
});

const averageCycleTime = computed(() => {
  if (pipelineStore.filteredProjects.length === 0) return 0;
  
  const totalDays = pipelineStore.filteredProjects.reduce(
    (sum, p) => sum + p.daysInStage, 
    0
  );
  
  return Math.round(totalDays / pipelineStore.filteredProjects.length);
});
</script>

<template>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(59, 130, 246, 0.1);">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #3B82F6;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div class="metric-content">
        <h3 class="metric-label">Total Projects</h3>
        <p class="metric-value">{{ pipelineStore.filteredProjects.length }}</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(16, 185, 129, 0.1);">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #10B981;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="metric-content">
        <h3 class="metric-label">Total Value</h3>
        <p class="metric-value">{{ formattedTotalValue }}</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(139, 92, 246, 0.1);">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #8B5CF6;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div class="metric-content">
        <h3 class="metric-label">Weighted Value</h3>
        <p class="metric-value">{{ formattedWeightedValue }}</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(245, 158, 11, 0.1);">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #F59E0B;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="metric-content">
        <h3 class="metric-label">Avg Cycle Time</h3>
        <p class="metric-value">{{ averageCycleTime }}d</p>
      </div>
    </div>

    <div class="metric-card" :class="{ 'metric-warning': stalledPercentage > 20 }">
      <div class="metric-icon" style="background: rgba(239, 68, 68, 0.1);">
        <svg fill="currentColor" viewBox="0 0 20 20" style="color: #EF4444;">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="metric-content">
        <h3 class="metric-label">Stalled Projects</h3>
        <p class="metric-value">
          {{ pipelineStore.stalledProjects.length }} 
          <span class="metric-subtitle">({{ stalledPercentage }}%)</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.metric-card.metric-warning {
  border-left: 4px solid #F59E0B;
}

.metric-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.metric-icon svg {
  width: 24px;
  height: 24px;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.metric-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>