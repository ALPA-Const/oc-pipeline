export enum PipelineType {
  OPPORTUNITY = 'opportunity',
  PRECONSTRUCTION = 'preconstruction',
  EXECUTION = 'execution',
  CLOSEOUT = 'closeout',
}

export interface PipelineProject {
  id: string;
  name: string;
  stageId: string;
  pipelineType: PipelineType;
  value: number;
  winProbability?: number;
  agency?: string;
  setAside?: string;
  pm?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isStalled: boolean;
  stalledReason?: string;
  stalledAt?: string;
  enteredStageAt: string;
  daysInStage: number;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  pipelineType: PipelineType;
  color: string;
  order: number;
  averageDuration?: number;
  requiredFields?: string[];
  nextStages?: string[];
}

export interface StageTransition {
  id: string;
  projectId: string;
  fromStageId: string;
  toStageId: string;
  transitionedAt: string;
  transitionedBy?: string;
  duration?: number;
  notes?: string;
}

export interface PipelineMetrics {
  totalProjects: number;
  totalValue: number;
  averageCycleTime: number;
  conversionRate: number;
  bottlenecks: BottleneckAnalysis[];
  stageMetrics: StageMetrics[];
}

export interface BottleneckAnalysis {
  stageId: string;
  stageName: string;
  averageDuration: number;
  expectedDuration: number;
  variance: number;
  projectCount: number;
  stalledProjects: number;
}

export interface StageMetrics {
  stageId: string;
  stageName: string;
  projectCount: number;
  totalValue: number;
  averageDuration: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface PipelineFilters {
  agency?: string[];
  setAside?: string[];
  pm?: string[];
  priority?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
  showStalled?: boolean;
  tags?: string[];
}