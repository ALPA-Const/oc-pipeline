import { PipelineProject, PipelineStage, StageTransition } from '@/types/pipeline.types';

/**
 * Calculate health score for a project based on various factors
 */
export function calculateProjectHealth(
  project: PipelineProject,
  stage: PipelineStage
): 'healthy' | 'at-risk' | 'critical' {
  if (project.isStalled) return 'critical';

  if (!stage.averageDuration) return 'healthy';

  const ratio = project.daysInStage / stage.averageDuration;

  if (ratio > 1.5) return 'critical';
  if (ratio > 1.2) return 'at-risk';
  return 'healthy';
}

/**
 * Format currency for display
 */
export function formatCurrency(
  value: number,
  compact: boolean = false
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}

/**
 * Format date relative to now (e.g., "3 days ago")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Calculate expected completion date based on remaining stages
 */
export function calculateExpectedCompletion(
  currentStageId: string,
  stages: PipelineStage[]
): Date | null {
  const currentIndex = stages.findIndex(s => s.id === currentStageId);
  if (currentIndex === -1) return null;

  const remainingStages = stages.slice(currentIndex + 1);
  const totalDays = remainingStages.reduce(
    (sum, stage) => sum + (stage.averageDuration || 0),
    0
  );

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + totalDays);
  return completionDate;
}

/**
 * Calculate win probability based on stage and historical data
 */
export function calculateWinProbability(
  stageId: string,
  baseWinRate: number = 50
): number {
  const stageProbabilities: Record<string, number> = {
    lead: 30,
    qualified: 50,
    bidding: 70,
    awarded: 100,
    lost: 0,
  };

  return stageProbabilities[stageId] || baseWinRate;
}

/**
 * Group projects by a specific field
 */
export function groupProjectsBy<K extends keyof PipelineProject>(
  projects: PipelineProject[],
  field: K
): Record<string, PipelineProject[]> {
  return projects.reduce((acc, project) => {
    const key = String(project[field] || 'Unknown');
    if (!acc[key]) acc[key] = [];
    acc[key].push(project);
    return acc;
  }, {} as Record<string, PipelineProject[]>);
}

/**
 * Sort projects by priority
 */
export function sortByPriority(projects: PipelineProject[]): PipelineProject[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...projects].sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    return aPriority - bPriority;
  });
}

/**
 * Filter stalled projects
 */
export function filterStalledProjects(
  projects: PipelineProject[],
  stages: PipelineStage[]
): PipelineProject[] {
  return projects.filter(project => {
    const stage = stages.find(s => s.id === project.stageId);
    if (!stage || !stage.averageDuration) return false;
    return project.daysInStage > stage.averageDuration * 1.5;
  });
}

/**
 * Calculate pipeline velocity (projects moved per week)
 */
export function calculateVelocity(
  transitions: StageTransition[],
  weeks: number = 4
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));

  const recentTransitions = transitions.filter(t => 
    new Date(t.transitionedAt) >= cutoffDate
  );

  return recentTransitions.length / weeks;
}

/**
 * Calculate weighted pipeline value
 */
export function calculateWeightedValue(projects: PipelineProject[]): number {
  return projects.reduce((sum, project) => {
    const probability = project.winProbability || 100;
    return sum + (project.value * probability / 100);
  }, 0);
}

/**
 * Get stage color by ID
 */
export function getStageColor(stageId: string, stages: PipelineStage[]): string {
  const stage = stages.find(s => s.id === stageId);
  return stage?.color || '#94A3B8';
}

/**
 * Validate stage transition
 */
export function canTransitionToStage(
  fromStageId: string,
  toStageId: string,
  stages: PipelineStage[]
): { valid: boolean; reason?: string } {
  const fromStage = stages.find(s => s.id === fromStageId);
  
  if (!fromStage) {
    return { valid: false, reason: 'Current stage not found' };
  }

  if (!fromStage.nextStages) {
    return { valid: true }; // No restrictions
  }

  if (!fromStage.nextStages.includes(toStageId)) {
    return { 
      valid: false, 
      reason: `Cannot move from ${fromStage.name} to this stage` 
    };
  }

  return { valid: true };
}