<script setup lang="ts">
import { onMounted } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { PipelineType } from '@/types/pipeline.types';
import PipelineMetrics from '@/components/pipeline/PipelineMetrics.vue';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';

const pipelineStore = usePipelineStore();

onMounted(() => {
  pipelineStore.fetchProjects(PipelineType.OPPORTUNITY);
  pipelineStore.fetchMetrics(PipelineType.OPPORTUNITY);
});
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1 class="page-title">Opportunity Pipeline</h1>
        <p class="page-description">
          Lead generation → Qualification → Bidding → Contract award
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="pipelineStore.exportPipeline(PipelineType.OPPORTUNITY)">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
        <button class="btn btn-primary">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Opportunity
        </button>
      </div>
    </header>

    <PipelineMetrics :type="PipelineType.OPPORTUNITY" />
    <KanbanBoard :type="PipelineType.OPPORTUNITY" />
  </div>
</template>

<style scoped>
.page-container {
  padding: 16px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.page-description {
  font-size: 14px;
  color: #6B7280;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
}

.btn-secondary {
  background: #F3F4F6;
  color: #374151;
}

.btn-secondary:hover {
  background: #E5E7EB;
}

.icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
</template>

<Editor.write>
<path>src/views/PreconstructionPipeline.vue</path>
<content>
<script setup lang="ts">
import { onMounted } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { PipelineType } from '@/types/pipeline.types';
import PipelineMetrics from '@/components/pipeline/PipelineMetrics.vue';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';

const pipelineStore = usePipelineStore();

onMounted(() => {
  pipelineStore.fetchProjects(PipelineType.PRECONSTRUCTION);
  pipelineStore.fetchMetrics(PipelineType.PRECONSTRUCTION);
});
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div>
        <h1 class="page-title">Preconstruction Pipeline</h1>
        <p class="page-description">
          Design review → Estimating → Value engineering → GMP development → Contract execution
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="pipelineStore.exportPipeline(PipelineType.PRECONSTRUCTION)">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Reports
        </button>
        <button class="btn btn-primary">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Start Preconstruction
        </button>
      </div>
    </header>

    <PipelineMetrics :type="PipelineType.PRECONSTRUCTION" />
    <KanbanBoard :type="PipelineType.PRECONSTRUCTION" />
  </div>
</template>

<style scoped>
.page-container {
  padding: 16px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.page-description {
  font-size: 14px;
  color: #6B7280;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
}

.btn-secondary {
  background: #F3F4F6;
  color: #374151;
}

.btn-secondary:hover {
  background: #E5E7EB;
}

.icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
</template>

<Editor.write>
<path>src/App.tsx</path>
<content>
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OpportunityPipeline from './views/OpportunityPipeline.vue';
import PreconstructionPipeline from './views/PreconstructionPipeline.vue';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pipeline/opportunity" element={<OpportunityPipeline />} />
          <Route path="/pipeline/preconstruction" element={<PreconstructionPipeline />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;