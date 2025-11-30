# Pipeline Management Module - Implementation Plan

## MVP Implementation (8 files maximum)

This is a production-grade Pipeline Management Module for ALPA Construction's Executive Construction Platform. 

### Core Files to Create:
1. **src/types/pipeline.ts** - TypeScript definitions for all pipeline entities
2. **src/config/pipeline-stages.ts** - Stage definitions for all 4 pipeline types
3. **src/stores/pipeline.ts** - Zustand store for state management
4. **src/components/KanbanBoard.tsx** - Main Kanban board component
5. **src/components/ProjectCard.tsx** - Individual project card component
6. **src/components/PipelineMetrics.tsx** - Metrics dashboard component
7. **src/pages/PipelineView.tsx** - Main pipeline view page
8. **src/utils/pipeline.ts** - Utility functions for calculations

### Features to Implement:
- ✅ 4 Pipeline Types: Opportunity, Preconstruction, Execution, Closeout
- ✅ Drag-and-drop Kanban interface
- ✅ Project health indicators and stalled project tracking
- ✅ Advanced filtering (agency, set-aside, PM, priority, value range)
- ✅ Analytics dashboard with metrics
- ✅ CSV export functionality
- ✅ Real-time project tracking
- ✅ Stage transition validation
- ✅ Responsive design with accessibility

### Tech Stack:
- React 18 + TypeScript
- Zustand for state management
- shadcn/ui components
- @dnd-kit for drag-and-drop
- Recharts for analytics
- Tailwind CSS for styling

### Business Requirements:
- Healthcare & public sector focus
- $8M-$120M project value ranges
- ALPA Construction specific workflows
- Stage-specific validation rules
- Win probability calculations
- Bottleneck analysis