// =====================================================
// OEOC Service - O'Neill Elite Orchestration Console
// Federal-Grade AI Swarm Management Service
// =====================================================

import { supabase } from '@/lib/supabase';
import type {
  Orchestrator,
  OrchestratorStatus,
  Agent,
  AgentStatus,
  Workflow,
  WorkflowRun,
  RunStatus,
  StepRun,
  StepStatus,
  Prompt,
  PromptVersion,
  AuditLogEntry,
  OEOCDashboardStats,
} from '@/types/oeoc.types';

// =====================================================
// ORCHESTRATORS
// =====================================================

export const orchestratorService = {
  // Get all orchestrators
  async getAll(): Promise<Orchestrator[]> {
    const { data, error } = await supabase
      .from('orchestrators')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },


  // Get single orchestrator by ID
  async getById(id: string): Promise<Orchestrator | null> {
    const { data, error } = await supabase
      .from('orchestrators')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update orchestrator status
  async updateStatus(id: string, status: OrchestratorStatus): Promise<Orchestrator> {
    const { data, error } = await supabase
      .from('orchestrators')
      .update({ status, last_heartbeat: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update heartbeat
  async heartbeat(id: string): Promise<void> {
    const { error } = await supabase
      .from('orchestrators')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },
};


// =====================================================
// AGENTS
// =====================================================

export const agentService = {
  // Get all agents with orchestrator
  async getAll(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*, orchestrator:orchestrators(*)')
      .is('deleted_at', null)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get agents by orchestrator
  async getByOrchestrator(orchestratorId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('orchestrator_id', orchestratorId)
      .is('deleted_at', null)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Update agent status
  async updateStatus(id: string, status: AgentStatus): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({ status, last_heartbeat: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Toggle agent enabled/disabled
  async toggle(id: string, enabled: boolean): Promise<Agent> {
    const status: AgentStatus = enabled ? 'idle' : 'disabled';
    return this.updateStatus(id, status);
  },
};


// =====================================================
// WORKFLOWS
// =====================================================

export const workflowService = {
  // Get all workflows
  async getAll(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .is('deleted_at', null)
      .order('title');
    
    if (error) throw error;
    return data || [];
  },

  // Get single workflow
  async getById(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create workflow
  async create(workflow: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};


// =====================================================
// WORKFLOW RUNS
// =====================================================

export const workflowRunService = {
  // Get all active runs
  async getActive(): Promise<WorkflowRun[]> {
    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*, workflow:workflows(*), orchestrator:orchestrators(*)')
      .in('status', ['pending', 'assigned', 'in_progress', 'waiting'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get run with steps
  async getWithSteps(id: string): Promise<WorkflowRun | null> {
    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*, workflow:workflows(*), step_runs(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Trigger a new workflow run
  async trigger(workflowId: string, inputs: Record<string, unknown> = {}): Promise<WorkflowRun> {
    const { data, error } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        status: 'pending',
        trigger_source: 'manual',
        inputs,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit entry
    await auditService.log('workflow_runs', data.id, 'trigger', { workflow_id: workflowId });
    
    return data;
  },


  // Update run status
  async updateStatus(id: string, status: RunStatus): Promise<WorkflowRun> {
    const updates: Partial<WorkflowRun> = { status };
    
    if (status === 'in_progress' || status === 'assigned') {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('workflow_runs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Cancel a run
  async cancel(id: string): Promise<WorkflowRun> {
    const result = await this.updateStatus(id, 'cancelled');
    await auditService.log('workflow_runs', id, 'update', { status: 'cancelled' });
    return result;
  },
};


// =====================================================
// STEP RUNS
// =====================================================

export const stepRunService = {
  // Get steps for a run
  async getByRun(runId: string): Promise<StepRun[]> {
    const { data, error } = await supabase
      .from('step_runs')
      .select('*, agent:agents(*)')
      .eq('run_id', runId)
      .order('step_number');
    
    if (error) throw error;
    return data || [];
  },

  // Update step status
  async updateStatus(id: string, status: StepStatus, output?: Record<string, unknown>): Promise<StepRun> {
    const updates: Partial<StepRun> = { status };
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
    if (output) {
      updates.output = output;
    }
    
    const { data, error } = await supabase
      .from('step_runs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};


// =====================================================
// PROMPTS
// =====================================================

export const promptService = {
  // Get all prompts with current version
  async getAll(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*, current_version:prompt_versions(*)')
      .is('deleted_at', null)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get prompt by slug with all versions
  async getBySlug(slug: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*, versions:prompt_versions(*)')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new version
  async createVersion(promptId: string, content: string, variables: string[], changeNotes?: string): Promise<PromptVersion> {
    // Get current max version
    const { data: versions } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1);
    
    const nextVersion = (versions?.[0]?.version_number || 0) + 1;


    // Insert new version
    const { data: newVersion, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: promptId,
        version_number: nextVersion,
        content,
        variables,
        change_notes: changeNotes,
      })
      .select()
      .single();
    
    if (versionError) throw versionError;

    // Update prompt to point to new version
    const { error: updateError } = await supabase
      .from('prompts')
      .update({ current_version_id: newVersion.id })
      .eq('id', promptId);
    
    if (updateError) throw updateError;

    // Log audit
    await auditService.log('prompt_versions', newVersion.id, 'create', { prompt_id: promptId, version: nextVersion });

    return newVersion;
  },

  // Rollback to specific version
  async rollback(promptId: string, versionId: string): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .update({ current_version_id: versionId })
      .eq('id', promptId)
      .select()
      .single();
    
    if (error) throw error;

    await auditService.log('prompts', promptId, 'update', { rollback_to: versionId });
    return data;
  },
};


// =====================================================
// AUDIT LOG
// =====================================================

export const auditService = {
  // Log an action
  async log(entityType: string, entityId: string, action: string, changes: Record<string, unknown> = {}): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes,
        timestamp: new Date().toISOString(),
      });
    
    if (error) console.error('Audit log error:', error);
  },

  // Get audit entries for entity
  async getByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Search audit log
  async search(filters: { entityType?: string; action?: string; limit?: number }): Promise<AuditLogEntry[]> {
    let query = supabase.from('audit_log').select('*');
    
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.action) query = query.eq('action', filters.action);
    
    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(filters.limit || 100);
    
    if (error) throw error;
    return data || [];
  },
};


// =====================================================
// DASHBOARD STATS
// =====================================================

export const dashboardService = {
  async getStats(): Promise<OEOCDashboardStats> {
    // Get orchestrator counts
    const { data: orchestrators } = await supabase
      .from('orchestrators')
      .select('status')
      .is('deleted_at', null);
    
    // Get agent counts
    const { data: agents } = await supabase
      .from('agents')
      .select('status')
      .is('deleted_at', null);
    
    // Get run counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: runs } = await supabase
      .from('workflow_runs')
      .select('status, completed_at');
    
    const orchStats = {
      total: orchestrators?.length || 0,
      idle: orchestrators?.filter(o => o.status === 'idle').length || 0,
      busy: orchestrators?.filter(o => o.status === 'busy').length || 0,
      error: orchestrators?.filter(o => o.status === 'error').length || 0,
      offline: orchestrators?.filter(o => o.status === 'offline').length || 0,
    };


    const agentStats = {
      total: agents?.length || 0,
      active: agents?.filter(a => a.status === 'busy').length || 0,
      idle: agents?.filter(a => a.status === 'idle').length || 0,
      error: agents?.filter(a => a.status === 'error' || a.status === 'disabled').length || 0,
    };

    const runStats = {
      active: runs?.filter(r => ['in_progress', 'assigned'].includes(r.status)).length || 0,
      pending: runs?.filter(r => r.status === 'pending').length || 0,
      completed_today: runs?.filter(r => 
        r.status === 'completed' && 
        r.completed_at && 
        new Date(r.completed_at) >= today
      ).length || 0,
      failed_today: runs?.filter(r => 
        r.status === 'failed' && 
        r.completed_at && 
        new Date(r.completed_at) >= today
      ).length || 0,
    };

    return {
      orchestrators: orchStats,
      agents: agentStats,
      runs: runStats,
      alerts: orchStats.error + agentStats.error + runStats.failed_today,
    };
  },
};

// Export all services
export const oeocService = {
  orchestrators: orchestratorService,
  agents: agentService,
  workflows: workflowService,
  runs: workflowRunService,
  steps: stepRunService,
  prompts: promptService,
  audit: auditService,
  dashboard: dashboardService,
};

