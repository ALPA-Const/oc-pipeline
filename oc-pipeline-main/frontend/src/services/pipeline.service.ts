import { supabase } from '@/lib/supabase';
import type { PipelineProject, PipelineType, StageTransition, PipelineMetrics } from '@/types/pipeline.types';
import type { DatabaseProject, DatabaseStage, DatabaseTransition } from '@/lib/supabase';

export class PipelineService {
  // Convert database project to frontend format
  private mapDatabaseProject(dbProject: DatabaseProject): PipelineProject {
    return {
      id: dbProject.id,
      name: dbProject.name,
      stageId: dbProject.stage_id,
      pipelineType: dbProject.pipeline_type as PipelineType,
      value: dbProject.value,
      winProbability: dbProject.win_probability || undefined,
      agency: dbProject.agency || undefined,
      setAside: dbProject.set_aside || undefined,
      pm: dbProject.pm || undefined,
      priority: dbProject.priority || undefined,
      isStalled: dbProject.is_stalled || false,
      stalledReason: dbProject.stalled_reason || undefined,
      stalledAt: dbProject.stalled_at || undefined,
      enteredStageAt: dbProject.entered_stage_at,
      daysInStage: dbProject.days_in_stage || 0,
      tags: dbProject.tags || undefined,
      metadata: dbProject.metadata as Record<string, string | number | boolean>,
      createdBy: dbProject.created_by || '',
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
    };
  }

  // Fetch projects by pipeline type
  async fetchProjects(pipelineType: PipelineType): Promise<PipelineProject[]> {
    try {
      console.log(`🔍 Fetching projects for pipeline type: ${pipelineType}`);
      
      const { data, error } = await supabase
        .from('pipeline_projects')
        .select('*')
        .eq('pipeline_type', pipelineType);

      console.log('📊 Query result:', { 
        success: !error, 
        projectCount: data?.length || 0,
        error: error ? {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        } : null
      });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          console.error('🔒 RLS is blocking access! To fix:');
          console.error('1. Go to Supabase Dashboard → SQL Editor');
          console.error('2. Run: ALTER TABLE pipeline_projects DISABLE ROW LEVEL SECURITY;');
          console.error('3. Or create a policy: CREATE POLICY "allow_anon_read" ON pipeline_projects FOR SELECT USING (true);');
        }
        
        throw error;
      }

      console.log('✅ Successfully fetched projects:', data.map(p => ({
        id: p.id,
        name: p.name,
        stage: p.stage_id,
        value: p.value
      })));

      return data.map(this.mapDatabaseProject);
    } catch (error) {
      console.error('❌ Exception in fetchProjects:', error);
      throw error;
    }
  }

  // Fetch pipeline stages
  async fetchStages(pipelineType: PipelineType): Promise<DatabaseStage[]> {
    try {
      console.log(`🔍 Fetching stages for pipeline type: ${pipelineType}`);
      
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_type', pipelineType)
        .order('order');

      console.log('📊 Stages query result:', { 
        success: !error, 
        stageCount: data?.length || 0,
        error: error ? error.message : null
      });

      if (error) {
        console.error('❌ Error fetching stages:', error);
        throw error;
      }

      console.log('✅ Successfully fetched stages:', data.map(s => ({
        id: s.id,
        name: s.name,
        order: s.order
      })));

      return data;
    } catch (error) {
      console.error('❌ Exception in fetchStages:', error);
      throw error;
    }
  }

  // Move project to new stage using database function
  async moveProject(
    projectId: string,
    toStageId: string,
    userId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 Moving project ${projectId} to stage ${toStageId}`);
      
      const { data, error } = await supabase.rpc('move_project_to_stage', {
        p_project_id: projectId,
        p_to_stage_id: toStageId,
        p_user_id: userId,
        p_notes: notes,
      });

      if (error) {
        console.error('❌ Error moving project:', error);
        throw error;
      }

      console.log('✅ Project moved successfully');
      return data;
    } catch (error) {
      console.error('❌ Exception in moveProject:', error);
      throw error;
    }
  }

  // Flag project as stalled
  async flagProjectStalled(
    projectId: string,
    reason: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('flag_project_stalled', {
        p_project_id: projectId,
        p_reason: reason,
        p_user_id: userId,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error flagging project as stalled:', error);
      throw error;
    }
  }

  // Unflag stalled project
  async unflagProjectStalled(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('unflag_project_stalled', {
        p_project_id: projectId,
        p_user_id: userId,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error unflagging stalled project:', error);
      throw error;
    }
  }

  // Get pipeline metrics using database function
  async getPipelineMetrics(pipelineType: PipelineType): Promise<PipelineMetrics> {
    try {
      const { data, error } = await supabase.rpc('calculate_pipeline_metrics', {
        p_pipeline_type: pipelineType,
      });

      if (error) throw error;

      // Map database response to frontend format
      return {
        totalProjects: data.total_projects,
        totalValue: data.total_value,
        averageCycleTime: data.average_cycle_time,
        conversionRate: data.conversion_rate,
        bottlenecks: [],
        stageMetrics: [],
      };
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      throw error;
    }
  }

  // Get bottleneck analysis
  async getBottlenecks(pipelineType: PipelineType) {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_bottlenecks', {
        p_pipeline_type: pipelineType,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching bottlenecks:', error);
      throw error;
    }
  }

  // Get filtered projects using database function
  async getFilteredProjects(
    pipelineType: PipelineType,
    filters: {
      agencies?: string[];
      setAsides?: string[];
      pms?: string[];
      priorities?: string[];
      showStalledOnly?: boolean;
      minValue?: number;
      maxValue?: number;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PipelineProject[]> {
    try {
      const { data, error } = await supabase.rpc('get_filtered_projects', {
        p_pipeline_type: pipelineType,
        p_agencies: filters.agencies || null,
        p_set_asides: filters.setAsides || null,
        p_pms: filters.pms || null,
        p_priorities: filters.priorities || null,
        p_show_stalled_only: filters.showStalledOnly || false,
        p_min_value: filters.minValue || null,
        p_max_value: filters.maxValue || null,
        p_search: filters.search || null,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0,
      });

      if (error) throw error;

      return data.map(this.mapDatabaseProject);
    } catch (error) {
      console.error('Error fetching filtered projects:', error);
      throw error;
    }
  }

  // Create new project
  async createProject(project: Omit<PipelineProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<PipelineProject> {
    try {
      const { data, error } = await supabase
        .from('pipeline_projects')
        .insert({
          name: project.name,
          stage_id: project.stageId,
          pipeline_type: project.pipelineType,
          value: project.value,
          win_probability: project.winProbability,
          agency: project.agency,
          set_aside: project.setAside,
          pm: project.pm,
          priority: project.priority,
          is_stalled: project.isStalled,
          entered_stage_at: project.enteredStageAt,
          days_in_stage: project.daysInStage,
          tags: project.tags,
          metadata: project.metadata,
          created_by: project.createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Update project
  async updateProject(
    projectId: string,
    updates: Partial<PipelineProject>
  ): Promise<PipelineProject> {
    try {
      const dbUpdates: Partial<DatabaseProject> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.stageId !== undefined) dbUpdates.stage_id = updates.stageId;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.winProbability !== undefined) dbUpdates.win_probability = updates.winProbability;
      if (updates.agency !== undefined) dbUpdates.agency = updates.agency;
      if (updates.setAside !== undefined) dbUpdates.set_aside = updates.setAside;
      if (updates.pm !== undefined) dbUpdates.pm = updates.pm;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.isStalled !== undefined) dbUpdates.is_stalled = updates.isStalled;
      if (updates.stalledReason !== undefined) dbUpdates.stalled_reason = updates.stalledReason;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('pipeline_projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseProject(data);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Get project transitions
  async getProjectTransitions(projectId: string): Promise<StageTransition[]> {
    try {
      const { data, error } = await supabase
        .from('stage_transitions')
        .select('*')
        .eq('project_id', projectId)
        .order('transitioned_at', { ascending: false });

      if (error) throw error;

      return data.map((transition: DatabaseTransition) => ({
        id: transition.id,
        projectId: transition.project_id,
        fromStageId: transition.from_stage_id || '',
        toStageId: transition.to_stage_id,
        transitionedAt: transition.transitioned_at,
        transitionedBy: transition.transitioned_by || '',
        duration: transition.duration || 0,
        notes: transition.notes || undefined,
      }));
    } catch (error) {
      console.error('Error fetching project transitions:', error);
      throw error;
    }
  }

  // Export pipeline data
  async exportPipelineData(pipelineType: PipelineType): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('export_pipeline_to_json', {
        p_pipeline_type: pipelineType,
      });

      if (error) throw error;

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting pipeline data:', error);
      throw error;
    }
  }

  // Check data integrity
  async checkDataIntegrity() {
    try {
      const { data, error } = await supabase.rpc('check_data_integrity');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking data integrity:', error);
      throw error;
    }
  }
}

export const pipelineService = new PipelineService();