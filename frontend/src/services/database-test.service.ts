import { supabase } from '@/lib/supabase';
import { pipelineService } from './pipeline.service';
import { PipelineType } from '@/types/pipeline.types';

interface IntegrityCheck {
  check_name: string;
  status: string;
  message: string;
  affected_records: number;
}

interface ProjectCount {
  pipeline_type: string;
}

interface StageCount {
  pipeline_type: string;
}

export class DatabaseTestService {
  // Test database connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
      }

      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, message: `Connection error: ${error}` };
    }
  }

  // Test data integrity
  async testDataIntegrity(): Promise<{ success: boolean; results: IntegrityCheck[] }> {
    try {
      const results = await pipelineService.checkDataIntegrity();
      const failedChecks = results.filter((check: IntegrityCheck) => check.status === 'FAIL');
      
      return {
        success: failedChecks.length === 0,
        results
      };
    } catch (error) {
      return {
        success: false,
        results: [{ check_name: 'Connection Test', status: 'FAIL', message: `Error: ${error}`, affected_records: 0 }]
      };
    }
  }

  // Test project operations
  async testProjectOperations(): Promise<{ success: boolean; results: string[] }> {
    const results: string[] = [];
    
    try {
      // Test fetch projects
      const projects = await pipelineService.fetchProjects(PipelineType.OPPORTUNITY);
      results.push(`✅ Fetch projects: ${projects.length} projects found`);

      if (projects.length > 0) {
        const testProject = projects[0];
        
        // Test project update
        const updated = await pipelineService.updateProject(testProject.id, {
          metadata: { test: 'database_test', timestamp: new Date().toISOString() }
        });
        results.push(`✅ Update project: ${updated.name} updated successfully`);

        // Test project transitions
        const transitions = await pipelineService.getProjectTransitions(testProject.id);
        results.push(`✅ Fetch transitions: ${transitions.length} transitions found`);
      }

      // Test metrics
      const metrics = await pipelineService.getPipelineMetrics(PipelineType.OPPORTUNITY);
      results.push(`✅ Fetch metrics: Total projects: ${metrics.totalProjects}, Total value: $${metrics.totalValue}`);

      // Test bottlenecks
      const bottlenecks = await pipelineService.getBottlenecks(PipelineType.OPPORTUNITY);
      results.push(`✅ Fetch bottlenecks: ${bottlenecks.length} bottlenecks analyzed`);

      return { success: true, results };
    } catch (error) {
      results.push(`❌ Error: ${error}`);
      return { success: false, results };
    }
  }

  // Test database functions
  async testDatabaseFunctions(): Promise<{ success: boolean; results: string[] }> {
    const results: string[] = [];
    
    try {
      // Test move project function (using first opportunity project)
      const { data: projects, error: projectError } = await supabase
        .from('pipeline_projects')
        .select('id, stage_id')
        .eq('pipeline_type', 'opportunity')
        .limit(1);

      if (projectError) throw projectError;

      if (projects && projects.length > 0) {
        const testProject = projects[0];
        
        // Get available stages for opportunity pipeline
        const { data: stages, error: stageError } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('pipeline_type', 'opportunity')
          .neq('id', testProject.stage_id)
          .limit(1);

        if (stageError) throw stageError;

        if (stages && stages.length > 0) {
          const success = await pipelineService.moveProject(
            testProject.id,
            stages[0].id,
            'user0001-0000-0000-0000-000000000001',
            'Database function test'
          );
          
          if (success) {
            results.push('✅ Move project function: Working correctly');
            
            // Move back to original stage
            await pipelineService.moveProject(
              testProject.id,
              testProject.stage_id,
              'user0001-0000-0000-0000-000000000001',
              'Reverting test move'
            );
          } else {
            results.push('❌ Move project function: Failed');
          }
        }
      }

      // Test stalled project functions
      const { data: stalledProjects } = await supabase
        .from('pipeline_projects')
        .select('id')
        .eq('is_stalled', false)
        .limit(1);

      if (stalledProjects && stalledProjects.length > 0) {
        const testProjectId = stalledProjects[0].id;
        
        // Flag as stalled
        const flagged = await pipelineService.flagProjectStalled(
          testProjectId,
          'Database function test',
          'user0001-0000-0000-0000-000000000001'
        );
        
        if (flagged) {
          results.push('✅ Flag stalled function: Working correctly');
          
          // Unflag
          const unflagged = await pipelineService.unflagProjectStalled(
            testProjectId,
            'user0001-0000-0000-0000-000000000001'
          );
          
          if (unflagged) {
            results.push('✅ Unflag stalled function: Working correctly');
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      results.push(`❌ Function test error: ${error}`);
      return { success: false, results };
    }
  }

  // Run all tests
  async runAllTests(): Promise<{
    connection: { success: boolean; message: string };
    integrity: { success: boolean; results: IntegrityCheck[] };
    operations: { success: boolean; results: string[] };
    functions: { success: boolean; results: string[] };
  }> {
    const [connection, integrity, operations, functions] = await Promise.all([
      this.testConnection(),
      this.testDataIntegrity(),
      this.testProjectOperations(),
      this.testDatabaseFunctions()
    ]);

    return { connection, integrity, operations, functions };
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    metrics: unknown;
    projectCounts: Record<string, number>;
    stageCounts: Record<string, number>;
    timestamp: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('calculate_pipeline_metrics', {
        p_pipeline_type: 'opportunity'
      });

      if (error) throw error;

      const { data: projectCounts } = await supabase
        .from('pipeline_projects')
        .select('pipeline_type')
        .then(result => ({
          data: result.data?.reduce((acc: Record<string, number>, project: ProjectCount) => {
            acc[project.pipeline_type] = (acc[project.pipeline_type] || 0) + 1;
            return acc;
          }, {})
        }));

      const { data: stageCounts } = await supabase
        .from('pipeline_stages')
        .select('pipeline_type')
        .then(result => ({
          data: result.data?.reduce((acc: Record<string, number>, stage: StageCount) => {
            acc[stage.pipeline_type] = (acc[stage.pipeline_type] || 0) + 1;
            return acc;
          }, {})
        }));

      return {
        metrics: data,
        projectCounts: projectCounts || {},
        stageCounts: stageCounts || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }
}

export const databaseTestService = new DatabaseTestService();