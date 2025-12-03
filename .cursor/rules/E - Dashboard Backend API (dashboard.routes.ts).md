# **dashboard.routes.ts - Backend API** {#dashboard.routes.ts---backend-api}

    import { Router } from 'express';
    import { authenticate, requirePermission } from '../middleware/auth';
    import { supabase } from '../config/supabase';

    const router = Router();

    /**
     * GET /api/v1/dashboard/metrics
     * Fetch hero metrics (active projects, pipeline value, budget at risk, win rate, CUI docs)
     */
    router.get('/metrics', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const orgId = req.user.org_id;

        // Get active projects count
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, estimated_budget, status')
          .eq('org_id', orgId)
          .in('status', ['planning', 'active']);

        if (projectsError) throw projectsError;

        // Get CUI documents count
        const { data: cuiDocs, error: cuiError } = await supabase
          .from('documents')
          .select('id, is_cui')
          .eq('org_id', orgId)
          .eq('is_cui', true);

        if (cuiError) throw cuiError;

        // Calculate metrics
        const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
        const pipelineValue = projects?.reduce((sum, p) => sum + (p.estimated_budget || 0), 0) || 0;
        const budgetAtRisk = pipelineValue * 0.15; // Placeholder: 15% at risk
        const winRate = 68; // Placeholder: would come from pursuits data
        const cuiDocumentsSecured = cuiDocs?.length || 0;

        // Calculate trends (simplified - would compare with previous period)
        const trends = {
          activeProjects: 2,
          pipelineValue: 8,
          budgetAtRisk: -12,
          winRate: 5,
        };

        res.json({
          success: true,
          data: {
            activeProjects,
            pipelineValue,
            budgetAtRisk,
            winRate,
            cuiDocumentsSecured,
            trends,
          },
        });
      } catch (error) {
        console.error('Dashboard metrics error:', error);
        res.status(500).json({
          success: false,
          error: { code: 'METRICS_ERROR', message: 'Failed to fetch metrics' },
        });
      }
    });

    /**
     * GET /api/v1/dashboard/projects
     * Fetch user's projects for left column
     */
    router.get('/projects', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const orgId = req.user.org_id;

        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            location,
            estimated_budget,
            status,
            created_at,
            project_members!inner(user_id)
          `)
          .eq('org_id', orgId)
          .eq('project_members.user_id', userId)
          .limit(20);

        if (error) throw error;

        // Enrich with progress and risks
        const enrichedProjects = projects?.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location,
          value: p.estimated_budget || 0,
          progress: calculateProgress(p.status),
          status: p.status,
          risks: Math.floor(Math.random() * 5), // Placeholder
          lastUpdated: new Date(p.created_at).toLocaleDateString(),
        })) || [];

        res.json({
          success: true,
          data: enrichedProjects,
        });
      } catch (error) {
        console.error('Dashboard projects error:', error);
        res.status(500).json({
          success: false,
          error: { code: 'PROJECTS_ERROR', message: 'Failed to fetch projects' },
        });
      }
    });

    /**
     * GET /api/v1/dashboard/alerts
     * Fetch alerts and notifications
     */
    router.get('/alerts', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const orgId = req.user.org_id;

        const { data: alerts, error } = await supabase
          .from('system_events')
          .select('id, title, description, severity, created_at, read')
          .eq('org_id', orgId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const formattedAlerts = alerts?.map((a: any) => ({
          id: a.id,
          title: a.title,
          message: a.description,
          severity: a.severity || 'info',
          timestamp: formatTime(a.created_at),
          read: a.read || false,
        })) || [];

        res.json({
          success: true,
          data: formattedAlerts,
        });
      } catch (error) {
        console.error('Dashboard alerts error:', error);
        res.status(500).json({
          success: false,
          error: { code: 'ALERTS_ERROR', message: 'Failed to fetch alerts' },
        });
      }
    });

    /**
     * GET /api/v1/dashboard/cui-status
     * Fetch CMMC Level 2 CUI compliance status
     */
    router.get('/cui-status', authenticate, async (req, res) => {
      try {
        const orgId = req.user.org_id;

        // Get total CUI documents
        const { data: totalDocs, error: totalError } = await supabase
          .from('documents')
          .select('id')
          .eq('org_id', orgId)
          .eq('is_cui', true);

        if (totalError) throw totalError;

        // Get secured CUI documents (properly classified and stored)
        const { data: securedDocs, error: securedError } = await supabase
          .from('documents')
          .select('id')
          .eq('org_id', orgId)
          .eq('is_cui', true)
          .eq('is_classified', true)
          .eq('watermarked', true)
          .eq('external_sharing_blocked', true);

        if (securedError) throw securedError;

        // Get pending classification
        const { data: pendingDocs, error: pendingError } = await supabase
          .from('documents')
          .select('id')
          .eq('org_id', orgId)
          .eq('is_cui', true)
          .eq('is_classified', false);

        if (pendingError) throw pendingError;

        const total = totalDocs?.length || 0;
        const secured = securedDocs?.length || 0;
        const pending = pendingDocs?.length || 0;
        const complianceScore = total > 0 ? Math.round((secured / total) * 100) : 100;

        res.json({
          success: true,
          data: {
            totalDocuments: total,
            securedDocuments: secured,
            pendingClassification: pending,
            complianceScore,
            lastAudit: 'Nov 28, 2025',
            nextAudit: 'Feb 28, 2026',
          },
        });
      } catch (error) {
        console.error('CUI status error:', error);
        res.status(500).json({
          success: false,
          error: { code: 'CUI_ERROR', message: 'Failed to fetch CUI status' },
        });
      }
    });

    /**
     * POST /api/v1/dashboard/alerts/:id/read
     * Mark alert as read
     */
    router.post('/alerts/:id/read', authenticate, async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
          .from('system_events')
          .update({ read: true })
          .eq('id', id)
          .eq('user_id', userId)
          .select();

        if (error) throw error;

        res.json({ success: true, data: data?.[0] });
      } catch (error) {
        console.error('Mark alert read error:', error);
        res.status(500).json({
          success: false,
          error: { code: 'ALERT_UPDATE_ERROR', message: 'Failed to update alert' },
        });
      }
    });

    // Helper functions
    function calculateProgress(status: string): number {
      const progressMap: { [key: string]: number } = {
        planning: 10,
        preconstruction: 25,
        procurement: 40,
        construction: 70,
        testing: 90,
        completed: 100,
      };
      return progressMap[status] || 0;
    }

    function formatTime(timestamp: string): string {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    }

    export default router;

## **Installation & Setup** {#installation-setup}

    # 1. Install required dependencies
    npm install recharts lucide-react

    # 2. Add dashboard route to main router (backend/src/routes/index.ts)
    import dashboardRoutes from './dashboard.routes';
    router.use('/dashboard', dashboardRoutes);

    # 3. Add Dashboard component to frontend routing (frontend/src/App.tsx)
    import Dashboard from '@/pages/Dashboard';

    # 4. Update layout to include dashboard
    <Route path="/dashboard" element={<Dashboard />} />

    # 5. Make dashboard the default landing page after login
    <Route path="/" element={<Navigate to="/dashboard" />} />

## **Environment Variables**

    # .env.local
    VITE_API_URL=http://localhost:3000/api/v1
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
