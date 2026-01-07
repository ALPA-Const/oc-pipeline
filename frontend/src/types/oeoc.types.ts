// =====================================================
// OEOC Types - O'Neill Elite Orchestration Console
// Federal-Grade AI Swarm Management Types
// =====================================================

// Enum Types
export type OrchestratorStatus = 'idle' | 'busy' | 'error' | 'offline';
export type AgentType = 'agentic' | 'worker';
export type AgentStatus = 'idle' | 'busy' | 'error' | 'disabled' | 'offline';
export type RunStatus = 'pending' | 'assigned' | 'in_progress' | 'waiting' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'assigned' | 'in_progress' | 'waiting' | 'completed' | 'failed' | 'skipped';
export type AuditAction = 'create' | 'update' | 'delete' | 'trigger' | 'complete' | 'fail' | 'retry' | 'approve' | 'reject';

// Orchestrator - The 5 "Brains"
export interface Orchestrator {
  id: string;
  name: string;
  description?: string;
  status: OrchestratorStatus;
  last_heartbeat?: string;
  config: Record<string, unknown>;
  max_concurrent_runs: number;
  current_run_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}


// Agent - AI Workers in the Swarm
export interface Agent {
  id: string;
  orchestrator_id?: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capability_tags: string[];
  last_heartbeat?: string;
  current_step_id?: string;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Joined data
  orchestrator?: Orchestrator;
}

// Workflow - The Checklist Templates
export interface Workflow {
  id: string;
  title: string;
  description?: string;
  version: number;
  definition: WorkflowDefinition;
  trigger_type: 'manual' | 'scheduled' | 'event';
  is_active: boolean;
  estimated_duration_minutes?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}


// Workflow Definition Structure
export interface WorkflowDefinition {
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  type: 'task' | 'approval' | 'decision' | 'parallel';
  agent_tags?: string[];
  timeout_minutes?: number;
  retry_config?: {
    max_retries: number;
    backoff_seconds: number;
  };
}

// Workflow Run - Active Execution
export interface WorkflowRun {
  id: string;
  workflow_id: string;
  orchestrator_id?: string;
  status: RunStatus;
  trigger_source: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  workflow?: Workflow;
  orchestrator?: Orchestrator;
  step_runs?: StepRun[];
}


// Step Run - Individual Step Execution
export interface StepRun {
  id: string;
  run_id: string;
  agent_id?: string;
  step_number: number;
  step_name: string;
  status: StepStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  agent?: Agent;
}

// Prompt - Master Prompt Registry
export interface Prompt {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  current_version_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Joined data
  current_version?: PromptVersion;
  versions?: PromptVersion[];
}


// Prompt Version - Immutable Version History
export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content: string;
  variables: string[];
  change_notes?: string;
  created_by?: string;
  created_at: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  user_id?: string;
  user_email?: string;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// Dashboard Stats
export interface OEOCDashboardStats {
  orchestrators: {
    total: number;
    idle: number;
    busy: number;
    error: number;
    offline: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
  runs: {
    active: number;
    pending: number;
    completed_today: number;
    failed_today: number;
  };
  alerts: number;
}

