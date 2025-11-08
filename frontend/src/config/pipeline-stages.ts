import { PipelineStage, PipelineType } from '@/types/pipeline.types';

export const opportunityStages: PipelineStage[] = [
  {
    id: 'opp_lead_gen',
    name: 'Lead Generation',
    description: 'Initial opportunity identification',
    pipelineType: PipelineType.OPPORTUNITY,
    color: '#94A3B8',
    order: 0,
    averageDuration: 7,
    nextStages: ['opp_proposal'],
  },
  {
    id: 'opp_proposal',
    name: 'Proposal',
    description: 'Preparing and submitting proposal',
    pipelineType: PipelineType.OPPORTUNITY,
    color: '#3B82F6',
    order: 1,
    averageDuration: 14,
    nextStages: ['opp_negotiation', 'opp_lost'],
  },
  {
    id: 'opp_negotiation',
    name: 'Negotiation',
    description: 'Contract negotiation phase',
    pipelineType: PipelineType.OPPORTUNITY,
    color: '#F59E0B',
    order: 2,
    averageDuration: 21,
    nextStages: ['opp_award', 'opp_lost'],
  },
  {
    id: 'opp_award',
    name: 'Award',
    description: 'Contract awarded',
    pipelineType: PipelineType.OPPORTUNITY,
    color: '#10B981',
    order: 3,
  },
  {
    id: 'opp_lost',
    name: 'Lost',
    description: 'Opportunity lost',
    pipelineType: PipelineType.OPPORTUNITY,
    color: '#EF4444',
    order: 4,
  },
];

export const preconstructionStages: PipelineStage[] = [
  {
    id: 'pre_planning',
    name: 'Planning',
    description: 'Project planning and design',
    pipelineType: PipelineType.PRECONSTRUCTION,
    color: '#3B82F6',
    order: 0,
    averageDuration: 30,
    nextStages: ['pre_design'],
  },
  {
    id: 'pre_design',
    name: 'Design',
    description: 'Detailed design phase',
    pipelineType: PipelineType.PRECONSTRUCTION,
    color: '#8B5CF6',
    order: 1,
    averageDuration: 45,
    nextStages: ['pre_permitting'],
  },
  {
    id: 'pre_permitting',
    name: 'Permitting',
    description: 'Obtaining necessary permits',
    pipelineType: PipelineType.PRECONSTRUCTION,
    color: '#F59E0B',
    order: 2,
    averageDuration: 60,
    nextStages: ['pre_ready'],
  },
  {
    id: 'pre_ready',
    name: 'Ready to Build',
    description: 'Ready for construction',
    pipelineType: PipelineType.PRECONSTRUCTION,
    color: '#10B981',
    order: 3,
  },
];

export const executionStages: PipelineStage[] = [
  {
    id: 'exec_mobilization',
    name: 'Mobilization',
    description: 'Site setup and mobilization',
    pipelineType: PipelineType.EXECUTION,
    color: '#3B82F6',
    order: 0,
    averageDuration: 14,
    nextStages: ['exec_construction'],
  },
  {
    id: 'exec_construction',
    name: 'Construction',
    description: 'Active construction phase',
    pipelineType: PipelineType.EXECUTION,
    color: '#F59E0B',
    order: 1,
    averageDuration: 180,
    nextStages: ['exec_punchlist'],
  },
  {
    id: 'exec_punchlist',
    name: 'Punch List',
    description: 'Final items completion',
    pipelineType: PipelineType.EXECUTION,
    color: '#8B5CF6',
    order: 2,
    averageDuration: 30,
    nextStages: ['exec_substantial'],
  },
  {
    id: 'exec_substantial',
    name: 'Substantial Completion',
    description: 'Project substantially complete',
    pipelineType: PipelineType.EXECUTION,
    color: '#10B981',
    order: 3,
  },
];

export const closeoutStages: PipelineStage[] = [
  {
    id: 'close_final_inspection',
    name: 'Final Inspection',
    description: 'Final walkthrough and inspection',
    pipelineType: PipelineType.CLOSEOUT,
    color: '#3B82F6',
    order: 0,
    averageDuration: 7,
    nextStages: ['close_documentation'],
  },
  {
    id: 'close_documentation',
    name: 'Documentation',
    description: 'Final documentation and closeout',
    pipelineType: PipelineType.CLOSEOUT,
    color: '#F59E0B',
    order: 1,
    averageDuration: 14,
    nextStages: ['close_warranty'],
  },
  {
    id: 'close_warranty',
    name: 'Warranty Period',
    description: 'Under warranty',
    pipelineType: PipelineType.CLOSEOUT,
    color: '#8B5CF6',
    order: 2,
    averageDuration: 365,
    nextStages: ['close_complete'],
  },
  {
    id: 'close_complete',
    name: 'Complete',
    description: 'Project fully closed out',
    pipelineType: PipelineType.CLOSEOUT,
    color: '#10B981',
    order: 3,
  },
];

export const allStages: PipelineStage[] = [
  ...opportunityStages,
  ...preconstructionStages,
  ...executionStages,
  ...closeoutStages,
];

export function getStagesByType(type: PipelineType): PipelineStage[] {
  switch (type) {
    case PipelineType.OPPORTUNITY:
      return opportunityStages;
    case PipelineType.PRECONSTRUCTION:
      return preconstructionStages;
    case PipelineType.EXECUTION:
      return executionStages;
    case PipelineType.CLOSEOUT:
      return closeoutStages;
    default:
      return [];
  }
}

export function getStageById(stageId: string): PipelineStage | undefined {
  return allStages.find((stage) => stage.id === stageId);
}

export function getStageColor(stageId: string): string {
  return getStageById(stageId)?.color || '#94A3B8';
}

export function getStageName(stageId: string): string {
  return getStageById(stageId)?.name || stageId;
}