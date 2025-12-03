# Backend Endpoints for Real Analytics Data

## 1. Dashboard Analytics Routes

    // backend/src/routes/dashboard.routes.ts
    import { Router, Request, Response } from 'express';
    import { authenticate } from '../middleware/auth';
    import { requirePermission } from '../middleware/permissions';
    import { DashboardController } from '../controllers/dashboard.controller';

    const router = Router();
    const dashboardController = new DashboardController();

    // Metrics endpoints
    router.get(
      '/metrics',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getMetrics(req, res)
    );

    router.get(
      '/metrics/budget',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getBudgetMetrics(req, res)
    );

    router.get(
      '/metrics/schedule',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getScheduleMetrics(req, res)
    );

    router.get(
      '/metrics/risk',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getRiskMetrics(req, res)
    );

    // Analytics endpoints
    router.get(
      '/analytics/budget-trend',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getBudgetTrend(req, res)
    );

    router.get(
      '/analytics/project-performance',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getProjectPerformance(req, res)
    );

    router.get(
      '/analytics/win-loss',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getWinLossAnalytics(req, res)
    );

    // Alerts endpoint
    router.get(
      '/alerts',
      authenticate,
      requirePermission('view_dashboard'),
      (req, res) => dashboardController.getAlerts(req, res)
    );

    // Projects endpoint
    router.get(
      '/projects',
      authenticate,
      requirePermission('view_projects'),
      (req, res) => dashboardController.getProjects(req, res)
    );

    export default router;

## 2. Dashboard Controller

    // backend/src/controllers/dashboard.controller.ts
    import { Request, Response } from 'express';
    import { supabase } from '../config/supabase';
    import { calculateVariance, formatCurrency } from '../utils/calculations';

    export class DashboardController {
      async getMetrics(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          // Get budget metrics
          const budgetResult = await supabase
            .from('budgets')
            .select('budget_amount, spent_amount')
            .eq('org_id', orgId)
            .eq('status', 'active');

          // Get schedule metrics
          const scheduleResult = await supabase
            .from('schedules')
            .select('baseline_duration, actual_duration, status')
            .eq('org_id', orgId);

          // Get risk metrics
          const riskResult = await supabase
            .from('risks')
            .select('probability, impact, status')
            .eq('org_id', orgId)
            .eq('status', 'active');

          // Get project count
          const projectResult = await supabase
            .from('projects')
            .select('id')
            .eq('org_id', orgId);

          const budgets = budgetResult.data || [];
          const schedules = scheduleResult.data || [];
          const risks = riskResult.data || [];
          const projects = projectResult.data || [];

          // Calculate aggregates
          const totalBudget = budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0);
          const totalSpent = budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0);
          const budgetVariance = calculateVariance(totalBudget, totalSpent);

          const onTimeProjects = schedules.filter(
            (s) => !s.actual_duration || s.actual_duration <= s.baseline_duration
          ).length;
          const scheduleAdherence = schedules.length > 0
            ? (onTimeProjects / schedules.length) * 100
            : 0;

          const activeRisks = risks.filter((r) => r.status === 'active').length;
          const avgRiskScore = risks.length > 0
            ? risks.reduce((sum, r) => sum + (r.probability * r.impact), 0) / risks.length
            : 0;

          res.json({
            success: true,
            data: {
              budget: {
                total: formatCurrency(totalBudget),
                spent: formatCurrency(totalSpent),
                variance: budgetVariance,
                percentSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
              },
              schedule: {
                onTimePercentage: scheduleAdherence,
                totalProjects: projects.length,
                atRiskProjects: schedules.filter((s) => s.actual_duration > s.baseline_duration).length,
              },
              risk: {
                activeRisks,
                averageScore: avgRiskScore,
                highRisks: risks.filter((r) => r.probability * r.impact > 15).length,
              },
              projects: {
                total: projects.length,
                active: projects.length, // Adjust based on actual status field
              },
            },
          });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getBudgetMetrics(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;
          const { projectId } = req.query;

          let query = supabase
            .from('budgets')
            .select('id, project_id, budget_amount, spent_amount, forecasted_amount, status')
            .eq('org_id', orgId);

          if (projectId) {
            query = query.eq('project_id', projectId);
          }

          const result = await query;
          const budgets = result.data || [];

          const metrics = {
            totalBudget: budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0),
            totalSpent: budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0),
            totalForecasted: budgets.reduce((sum, b) => sum + (b.forecasted_amount || 0), 0),
            byProject: budgets.map((b) => ({
              projectId: b.project_id,
              budget: b.budget_amount,
              spent: b.spent_amount,
              forecasted: b.forecasted_amount,
              variance: calculateVariance(b.budget_amount, b.spent_amount),
              percentSpent: b.budget_amount > 0 ? (b.spent_amount / b.budget_amount) * 100 : 0,
            })),
          };

          res.json({ success: true, data: metrics });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getScheduleMetrics(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          const result = await supabase
            .from('schedules')
            .select(
              'id, project_id, baseline_duration, actual_duration, status, start_date, end_date'
            )
            .eq('org_id', orgId);

          const schedules = result.data || [];

          const metrics = {
            totalProjects: schedules.length,
            onTimeProjects: schedules.filter(
              (s) => !s.actual_duration || s.actual_duration <= s.baseline_duration
            ).length,
            delayedProjects: schedules.filter(
              (s) => s.actual_duration && s.actual_duration > s.baseline_duration
            ).length,
            scheduleAdherence: schedules.length > 0
              ? (schedules.filter(
                (s) => !s.actual_duration || s.actual_duration <= s.baseline_duration
              ).length / schedules.length) * 100
              : 0,
            byProject: schedules.map((s) => ({
              projectId: s.project_id,
              baseline: s.baseline_duration,
              actual: s.actual_duration,
              variance: s.actual_duration ? s.actual_duration - s.baseline_duration : 0,
              status: s.status,
            })),
          };

          res.json({ success: true, data: metrics });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getRiskMetrics(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          const result = await supabase
            .from('risks')
            .select('id, project_id, probability, impact, status, mitigation_status')
            .eq('org_id', orgId);

          const risks = result.data || [];

          const activeRisks = risks.filter((r) => r.status === 'active');
          const mitigatedRisks = risks.filter((r) => r.mitigation_status === 'mitigated');

          const metrics = {
            totalRisks: risks.length,
            activeRisks: activeRisks.length,
            mitigatedRisks: mitigatedRisks.length,
            highRisks: activeRisks.filter((r) => r.probability * r.impact > 15).length,
            mediumRisks: activeRisks.filter(
              (r) => r.probability * r.impact > 8 && r.probability * r.impact <= 15
            ).length,
            lowRisks: activeRisks.filter((r) => r.probability * r.impact <= 8).length,
            averageRiskScore: activeRisks.length > 0
              ? activeRisks.reduce((sum, r) => sum + r.probability * r.impact, 0) / activeRisks.length
              : 0,
          };

          res.json({ success: true, data: metrics });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getBudgetTrend(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;
          const { months = 12 } = req.query;

          const result = await supabase
            .from('budget_history')
            .select('month, budget_amount, spent_amount, forecasted_amount')
            .eq('org_id', orgId)
            .order('month', { ascending: true })
            .limit(parseInt(months as string));

          const history = result.data || [];

          const trendData = history.map((h) => ({
            month: new Date(h.month).toLocaleDateString('en-US', { month: 'short' }),
            budget: h.budget_amount,
            actual: h.spent_amount,
            forecast: h.forecasted_amount,
          }));

          res.json({ success: true, data: trendData });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getProjectPerformance(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          const result = await supabase
            .from('projects')
            .select(
              `
              id,
              name,
              status,
              budgets(budget_amount, spent_amount),
              schedules(baseline_duration, actual_duration),
              risks(id, status)
            `
            )
            .eq('org_id', orgId);

          const projects = result.data || [];

          const performanceData = projects.map((p) => {
            const budget = p.budgets?.[0];
            const schedule = p.schedules?.[0];
            const risks = p.risks || [];

            return {
              id: p.id,
              name: p.name,
              status: p.status,
              budgetHealth:
                budget && budget.budget_amount > 0
                  ? ((budget.spent_amount / budget.budget_amount) * 100).toFixed(1)
                  : 'N/A',
              scheduleHealth:
                schedule && schedule.baseline_duration > 0
                  ? ((schedule.actual_duration / schedule.baseline_duration) * 100).toFixed(1)
                  : 'N/A',
              activeRisks: risks.filter((r) => r.status === 'active').length,
              overallHealth: calculateProjectHealth(budget, schedule, risks),
            };
          });

          res.json({ success: true, data: performanceData });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getWinLossAnalytics(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          const result = await supabase
            .from('pursuits')
            .select('id, status, estimated_value, sector')
            .eq('org_id', orgId);

          const pursuits = result.data || [];

          const won = pursuits.filter((p) => p.status === 'won');
          const lost = pursuits.filter((p) => p.status === 'lost');

          const analytics = {
            totalPursuits: pursuits.length,
            won: won.length,
            lost: lost.length,
            winRate: pursuits.length > 0 ? (won.length / pursuits.length) * 100 : 0,
            totalWonValue: won.reduce((sum, p) => sum + (p.estimated_value || 0), 0),
            totalLostValue: lost.reduce((sum, p) => sum + (p.estimated_value || 0), 0),
            bySector: pursuits.reduce((acc, p) => {
              const sector = p.sector || 'Other';
              if (!acc[sector]) {
                acc[sector] = { total: 0, won: 0, lost: 0 };
              }
              acc[sector].total++;
              if (p.status === 'won') acc[sector].won++;
              if (p.status === 'lost') acc[sector].lost++;
              return acc;
            }, {}),
          };

          res.json({ success: true, data: analytics });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getAlerts(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;

          const result = await supabase
            .from('system_events')
            .select('id, event_type, severity, message, created_at, project_id')
            .eq('org_id', orgId)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })
            .limit(10);

          const alerts = result.data || [];

          res.json({
            success: true,
            data: alerts.map((a) => ({
              id: a.id,
              type: a.event_type,
              severity: a.severity,
              message: a.message,
              timestamp: a.created_at,
              projectId: a.project_id,
            })),
          });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }

      async getProjects(req: Request, res: Response) {
        try {
          const orgId = req.user?.org_id;
          const { status, limit = 10, offset = 0 } = req.query;

          let query = supabase
            .from('projects')
            .select(
              `
              id,
              name,
              status,
              project_type,
              start_date,
              end_date,
              budgets(budget_amount, spent_amount),
              schedules(baseline_duration, actual_duration)
            `
            )
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

          if (status) {
            query = query.eq('status', status);
          }

          const result = await query.range(
            parseInt(offset as string),
            parseInt(offset as string) + parseInt(limit as string) - 1
          );

          const projects = result.data || [];

          const enrichedProjects = projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            type: p.project_type,
            startDate: p.start_date,
            endDate: p.end_date,
            budget: p.budgets?.[0]?.budget_amount || 0,
            spent: p.budgets?.[0]?.spent_amount || 0,
            schedule: p.schedules?.[0]?.baseline_duration || 0,
          }));

          res.json({ success: true, data: enrichedProjects });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // Helper function
    function calculateProjectHealth(budget: any, schedule: any, risks: any[]): string {
      let score = 100;

      if (budget && budget.budget_amount > 0) {
        const spent = (budget.spent_amount / budget.budget_amount) * 100;
        if (spent > 100) score -= 20;
        else if (spent > 90) score -= 10;
      }

      if (schedule && schedule.baseline_duration > 0) {
        const actual = (schedule.actual_duration / schedule.baseline_duration) * 100;
        if (actual > 110) score -= 20;
        else if (actual > 100) score -= 10;
      }

      const activeRisks = risks.filter((r) => r.status === 'active').length;
      if (activeRisks > 5) score -= 15;
      else if (activeRisks > 2) score -= 10;

      if (score >= 80) return 'Healthy';
      if (score >= 60) return 'At Risk';
      return 'Critical';
    }

## 3. Utility Functions

    // backend/src/utils/calculations.ts
    export function calculateVariance(budget: number, actual: number): string {
      if (budget === 0) return '0%';
      const variance = ((actual - budget) / budget) * 100;
      return variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`;
    }

    export function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    export function calculateTrendPercentage(current: number, previous: number): number {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    }

## 4. React Query Integration

    // frontend/src/hooks/useDashboardMetrics.ts
    import { useQuery } from '@tanstack/react-query';

    const API_BASE = '/api/v1/dashboard';

    export const useDashboardMetrics = () => {
      return useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
          const response = await fetch(`${API_BASE}/metrics`);
          if (!response.ok) throw new Error('Failed to fetch metrics');
          return response.json();
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 300000, // 5 minutes
      });
    };

    export const useBudgetTrend = (months = 12) => {
      return useQuery({
        queryKey: ['budget-trend', months],
        queryFn: async () => {
          const response = await fetch(`${API_BASE}/analytics/budget-trend?months=${months}`);
          if (!response.ok) throw new Error('Failed to fetch budget trend');
          return response.json();
        },
        staleTime: 300000, // 5 minutes
      });
    };

    export const useProjectPerformance = () => {
      return useQuery({
        queryKey: ['project-performance'],
        queryFn: async () => {
          const response = await fetch(`${API_BASE}/analytics/project-performance`);
          if (!response.ok) throw new Error('Failed to fetch project performance');
          return response.json();
        },
        staleTime: 300000, // 5 minutes
      });
    };

    export const useAlerts = () => {
      return useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
          const response = await fetch(`${API_BASE}/alerts`);
          if (!response.ok) throw new Error('Failed to fetch alerts');
          return response.json();
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 120000, // 2 minutes
      });
    };

    export const useDashboardProjects = (status?: string) => {
      return useQuery({
        queryKey: ['dashboard-projects', status],
        queryFn: async () => {
          const url = new URL(`${API_BASE}/projects`, window.location.origin);
          if (status) url.searchParams.append('status', status);
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error('Failed to fetch projects');
          return response.json();
        },
        staleTime: 60000, // 1 minute
      });
    };
