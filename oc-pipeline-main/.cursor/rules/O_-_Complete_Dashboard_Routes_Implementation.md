# Dashboard Routes: dashboard.routes.ts

    import { Router, Response } from 'express';
    import { createClient } from '@supabase/supabase-js';
    import {
      AuthenticatedRequest,
      permissionMiddleware,
      projectAccessMiddleware,
      orgAccessMiddleware,
      auditDashboardAccessMiddleware,
      timeBasedAccessMiddleware,
    } from '../middleware/permissionMiddleware';
    import { DASHBOARD_PERMISSIONS } from '../config/permissions';
    import { Logger } from '../services/logger';
    import { validateQueryParams, validateDateRange } from '../middleware/validation';

    const router = Router();
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const logger = new Logger('DashboardRoutes');

    // ============================================================================
    // PORTFOLIO DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/portfolio
     * Fetch portfolio dashboard data (all projects overview)
     */
    router.get(
      '/portfolio',
      timeBasedAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_PORTFOLIO],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const user = req.user!;
          const { startDate, endDate, status, type } = req.query;

          // Validate date range if provided
          if (startDate || endDate) {
            validateDateRange(startDate as string, endDate as string);
          }

          // Fetch portfolio metrics
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select(
              `
              id,
              name,
              status,
              project_type,
              start_date,
              end_date,
              budget,
              org_id,
              budgets(total_budget, total_spent),
              schedules(baseline_duration, actual_duration),
              risks(id)
            `
            )
            .eq('org_id', user.org_id)
            .gte('created_at', startDate || '2000-01-01')
            .lte('created_at', endDate || new Date().toISOString());

          if (projectsError) throw projectsError;

          // Calculate portfolio metrics
          const metrics = {
            totalProjects: projects?.length || 0,
            activeProjects: projects?.filter((p) => p.status === 'active').length || 0,
            completedProjects: projects?.filter((p) => p.status === 'completed').length || 0,
            totalBudget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
            totalSpent: projects?.reduce(
              (sum, p) => sum + (p.budgets?.[0]?.total_spent || 0),
              0
            ) || 0,
            averageScheduleVariance:
              projects?.reduce((sum, p) => {
                const baseline = p.schedules?.[0]?.baseline_duration || 0;
                const actual = p.schedules?.[0]?.actual_duration || 0;
                return sum + (baseline > 0 ? ((actual - baseline) / baseline) * 100 : 0);
              }, 0) / (projects?.length || 1) || 0,
            totalRisks: projects?.reduce((sum, p) => sum + (p.risks?.length || 0), 0) || 0,
          };

          logger.info('Portfolio dashboard fetched', {
            correlationId: req.correlationId,
            userId: user.id,
            projectCount: metrics.totalProjects,
          });

          res.json({
            success: true,
            data: {
              metrics,
              projects: projects || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Portfolio dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch portfolio dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    /**
     * GET /api/v1/dashboards/portfolio/export
     * Export portfolio dashboard data
     */
    router.get(
      '/portfolio/export',
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.EXPORT_PORTFOLIO],
      }),
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const user = req.user!;
          const { format = 'csv' } = req.query;

          // Fetch all portfolio data
          const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .eq('org_id', user.org_id);

          if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(projects || []);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="portfolio.csv"');
            res.send(csv);
          } else if (format === 'json') {
            res.json(projects);
          }

          logger.info('Portfolio export generated', {
            correlationId: req.correlationId,
            userId: user.id,
            format,
          });
        } catch (error) {
          logger.error('Portfolio export error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to export portfolio',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // PRECONSTRUCTION DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/preconstruction
     * Fetch preconstruction dashboard (pursuits, estimates, bids)
     */
    router.get(
      '/preconstruction',
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_PRECONSTRUCTION],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const user = req.user!;
          const { stage, status } = req.query;

          // Fetch pursuits with related data
          const { data: pursuits, error } = await supabase
            .from('pursuits')
            .select(
              `
              id,
              name,
              stage,
              status,
              estimated_value,
              probability,
              created_at,
              estimates(id, status),
              bids(id, status)
            `
            )
            .eq('org_id', user.org_id)
            .eq('stage', stage || 'all');

          if (error) throw error;

          // Calculate pipeline metrics
          const metrics = {
            totalPursuits: pursuits?.length || 0,
            pursuitsByStage: groupBy(pursuits || [], 'stage'),
            totalPipelineValue: pursuits?.reduce((sum, p) => sum + (p.estimated_value || 0), 0) || 0,
            weightedPipelineValue:
              pursuits?.reduce((sum, p) => sum + (p.estimated_value || 0) * (p.probability || 0), 0) || 0,
            estimatesInProgress: pursuits?.filter((p) => p.estimates?.some((e) => e.status === 'in_progress')).length || 0,
            bidsSubmitted: pursuits?.filter((p) => p.bids?.some((b) => b.status === 'submitted')).length || 0,
          };

          logger.info('Preconstruction dashboard fetched', {
            correlationId: req.correlationId,
            userId: user.id,
            pursuitCount: metrics.totalPursuits,
          });

          res.json({
            success: true,
            data: {
              metrics,
              pursuits: pursuits || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Preconstruction dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch preconstruction dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // COST DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/cost/:projectId
     * Fetch cost dashboard for a specific project
     */
    router.get(
      '/cost/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_COST],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;
          const user = req.user!;

          // Fetch budget and cost data
          const { data: budget, error: budgetError } = await supabase
            .from('budgets')
            .select(
              `
              id,
              total_budget,
              total_spent,
              total_committed,
              cost_codes(id, code, description, budget, spent),
              change_orders(id, status, amount),
              forecasts(id, forecast_amount, confidence_level)
            `
            )
            .eq('project_id', projectId)
            .single();

          if (budgetError) throw budgetError;

          // Calculate cost metrics
          const metrics = {
            totalBudget: budget?.total_budget || 0,
            totalSpent: budget?.total_spent || 0,
            totalCommitted: budget?.total_committed || 0,
            budgetVariance: ((budget?.total_spent || 0) - (budget?.total_budget || 0)) / (budget?.total_budget || 1),
            burnRate: calculateBurnRate(budget?.total_spent || 0, budget?.total_budget || 0),
            forecastAtCompletion: budget?.forecasts?.[0]?.forecast_amount || budget?.total_budget || 0,
            changeOrderCount: budget?.change_orders?.length || 0,
            changeOrderValue: budget?.change_orders?.reduce((sum, co) => sum + (co.amount || 0), 0) || 0,
          };

          logger.info('Cost dashboard fetched', {
            correlationId: req.correlationId,
            userId: user.id,
            projectId,
          });

          res.json({
            success: true,
            data: {
              metrics,
              budget,
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Cost dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch cost dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // SCHEDULE DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/schedule/:projectId
     * Fetch schedule dashboard with Gantt data
     */
    router.get(
      '/schedule/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_SCHEDULE],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;

          // Fetch schedule tasks and milestones
          const { data: tasks, error: tasksError } = await supabase
            .from('schedule_tasks')
            .select(
              `
              id,
              name,
              start_date,
              end_date,
              duration,
              progress,
              status,
              dependencies:task_dependencies(predecessor_id),
              milestones(id, name, due_date)
            `
            )
            .eq('project_id', projectId)
            .order('start_date', { ascending: true });

          if (tasksError) throw tasksError;

          // Calculate schedule metrics
          const metrics = {
            totalTasks: tasks?.length || 0,
            completedTasks: tasks?.filter((t) => t.status === 'completed').length || 0,
            inProgressTasks: tasks?.filter((t) => t.status === 'in_progress').length || 0,
            atRiskTasks: tasks?.filter((t) => t.status === 'at_risk').length || 0,
            schedulePerformanceIndex: calculateSPI(tasks || []),
            criticalPathDuration: calculateCriticalPath(tasks || []),
          };

          logger.info('Schedule dashboard fetched', {
            correlationId: req.correlationId,
            projectId,
            taskCount: metrics.totalTasks,
          });

          res.json({
            success: true,
            data: {
              metrics,
              tasks: tasks || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Schedule dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch schedule dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // RISK DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/risk/:projectId
     * Fetch risk dashboard with heat map data
     */
    router.get(
      '/risk/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_RISK],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;

          // Fetch risk register
          const { data: risks, error } = await supabase
            .from('risk_register')
            .select(
              `
              id,
              description,
              category,
              probability,
              impact,
              status,
              owner,
              mitigations(id, description, status)
            `
            )
            .eq('project_id', projectId);

          if (error) throw error;

          // Calculate risk metrics
          const metrics = {
            totalRisks: risks?.length || 0,
            activeRisks: risks?.filter((r) => r.status === 'active').length || 0,
            mitigatedRisks: risks?.filter((r) => r.status === 'mitigated').length || 0,
            riskScore: calculateRiskScore(risks || []),
            highPriorityRisks: risks?.filter((r) => (r.probability * r.impact) > 0.6).length || 0,
          };

          logger.info('Risk dashboard fetched', {
            correlationId: req.correlationId,
            projectId,
            riskCount: metrics.totalRisks,
          });

          res.json({
            success: true,
            data: {
              metrics,
              risks: risks || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Risk dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch risk dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // QUALITY DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/quality/:projectId
     * Fetch quality dashboard with deficiency tracking
     */
    router.get(
      '/quality/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_QUALITY],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;

          // Fetch deficiencies
          const { data: deficiencies, error } = await supabase
            .from('quality_deficiencies')
            .select(
              `
              id,
              description,
              severity,
              status,
              created_at,
              resolved_at,
              corrective_actions(id, status)
            `
            )
            .eq('project_id', projectId);

          if (error) throw error;

          // Calculate quality metrics
          const metrics = {
            totalDeficiencies: deficiencies?.length || 0,
            openDeficiencies: deficiencies?.filter((d) => d.status === 'open').length || 0,
            resolvedDeficiencies: deficiencies?.filter((d) => d.status === 'resolved').length || 0,
            criticalDeficiencies: deficiencies?.filter((d) => d.severity === 'critical').length || 0,
            averageResolutionTime: calculateAvgResolutionTime(deficiencies || []),
          };

          logger.info('Quality dashboard fetched', {
            correlationId: req.correlationId,
            projectId,
            deficiencyCount: metrics.totalDeficiencies,
          });

          res.json({
            success: true,
            data: {
              metrics,
              deficiencies: deficiencies || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Quality dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch quality dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // SAFETY DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/safety/:projectId
     * Fetch safety dashboard with OSHA metrics
     */
    router.get(
      '/safety/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_SAFETY],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;

          // Fetch safety incidents
          const { data: incidents, error } = await supabase
            .from('safety_incidents')
            .select(
              `
              id,
              description,
              severity,
              incident_date,
              status,
              osha_reportable
            `
            )
            .eq('project_id', projectId);

          if (error) throw error;

          // Calculate safety metrics
          const metrics = {
            totalIncidents: incidents?.length || 0,
            oshaReportableIncidents: incidents?.filter((i) => i.osha_reportable).length || 0,
            criticalIncidents: incidents?.filter((i) => i.severity === 'critical').length || 0,
            daysWithoutIncident: calculateDaysSinceLastIncident(incidents || []),
            trir: calculateTRIR(incidents || []),
            dart: calculateDART(incidents || []),
          };

          logger.info('Safety dashboard fetched', {
            correlationId: req.correlationId,
            projectId,
            incidentCount: metrics.totalIncidents,
          });

          res.json({
            success: true,
            data: {
              metrics,
              incidents: incidents || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Safety dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch safety dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // STAFFING DASHBOARD ROUTES
    // ============================================================================

    /**
     * GET /api/v1/dashboards/staffing/:projectId
     * Fetch staffing and resource utilization dashboard
     */
    router.get(
      '/staffing/:projectId',
      projectAccessMiddleware,
      permissionMiddleware({
        requiredPermissions: [DASHBOARD_PERMISSIONS.VIEW_STAFFING],
      }),
      auditDashboardAccessMiddleware,
      async (req: AuthenticatedRequest, res: Response) => {
        try {
          const { projectId } = req.params;

          // Fetch resource allocations
          const { data: resources, error } = await supabase
            .from('resource_allocations')
            .select(
              `
              id,
              resource_id,
              allocated_hours,
              utilized_hours,
              start_date,
              end_date,
              resources(id, name, role, certifications)
            `
            )
            .eq('project_id', projectId);

          if (error) throw error;

          // Calculate staffing metrics
          const metrics = {
            totalAllocatedHours: resources?.reduce((sum, r) => sum + (r.allocated_hours || 0), 0) || 0,
            totalUtilizedHours: resources?.reduce((sum, r) => sum + (r.utilized_hours || 0), 0) || 0,
            utilizationRate:
              (resources?.reduce((sum, r) => sum + (r.utilized_hours || 0), 0) || 0) /
              (resources?.reduce((sum, r) => sum + (r.allocated_hours || 0), 0) || 1),
            totalResources: resources?.length || 0,
          };

          logger.info('Staffing dashboard fetched', {
            correlationId: req.correlationId,
            projectId,
            resourceCount: metrics.totalResources,
          });

          res.json({
            success: true,
            data: {
              metrics,
              resources: resources || [],
            },
            correlationId: req.correlationId,
          });
        } catch (error) {
          logger.error('Staffing dashboard error', {
            correlationId: req.correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          res.status(500).json({
            error: 'Failed to fetch staffing dashboard',
            correlationId: req.correlationId,
          });
        }
      }
    );

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
      return array.reduce(
        (result, item) => {
          const groupKey = String(item[key]);
          if (!result[groupKey]) result[groupKey] = [];
          result[groupKey].push(item);
          return result;
        },
        {} as Record<string, T[]>
      );
    }

    function calculateBurnRate(spent: number, budget: number): number {
      return budget > 0 ? spent / budget : 0;
    }

    function calculateSPI(tasks: any[]): number {
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      return tasks.length > 0 ? completedTasks / tasks.length : 0;
    }

    function calculateCriticalPath(tasks: any[]): number {
      // Simplified: sum of all task durations (real implementation would trace dependencies)
      return tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    }

    function calculateRiskScore(risks: any[]): number {
      return risks.reduce((sum, r) => sum + (r.probability * r.impact), 0) / (risks.length || 1);
    }

    function calculateAvgResolutionTime(deficiencies: any[]): number {
      const resolved = deficiencies.filter((d) => d.resolved_at);
      if (resolved.length === 0) return 0;
      const totalTime = resolved.reduce((sum, d) => {
        const created = new Date(d.created_at).getTime();
        const resolved = new Date(d.resolved_at).getTime();
        return sum + (resolved - created);
      }, 0);
      return totalTime / resolved.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    function calculateDaysSinceLastIncident(incidents: any[]): number {
      if (incidents.length === 0) return 0;
      const lastIncident = new Date(
        Math.max(...incidents.map((i) => new Date(i.incident_date).getTime()))
      );
      const now = new Date();
      return Math.floor((now.getTime() - lastIncident.getTime()) / (1000 * 60 * 60 * 24));
    }

    function calculateTRIR(incidents: any[]): number {
      // Total Recordable Incident Rate = (# of recordable incidents / # of hours worked) * 200,000
      return (incidents.filter((i) => i.osha_reportable).length / 2000) * 200000;
    }

    function calculateDART(incidents: any[]): number {
      // Days Away, Restricted, or Transferred
      return incidents.filter((i) => i.osha_reportable && i.severity !== 'minor').length;
    }

    function convertToCSV(data: any[]): string {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => JSON.stringify(row[header] || '')).join(',')
        ),
      ];
      return csv.join('\n');
    }

    export default router;
