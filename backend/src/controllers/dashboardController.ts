import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getDashboardData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch projects data
    const projectsResult = await supabase.from('projects').select('*');

    if (projectsResult.error) {
      res.status(400).json({ error: 'Failed to fetch dashboard data' });
      return;
    }

    const projects = projectsResult.data || [];

    // Calculate KPIs in the format frontend expects
    const activeProjects = projects.filter((p: any) => p.status === 'active');
    const totalValue = projects.reduce((sum: number, p: any) => sum + (p.value || 0), 0);

    const kpis = {
      budget: {
        value: totalValue,
        change: 0,
        trend: 'neutral'
      },
      schedule: {
        value: activeProjects.length,
        change: 0,
        trend: 'neutral'
      },
      cost: {
        value: 0,
        change: 0,
        trend: 'neutral'
      },
      quality: {
        value: 0,
        change: 0,
        trend: 'neutral'
      }
    };

    // Return data in the format frontend expects
    res.json({
      kpis,
      projects,
      recentProjects: projects.slice(0, 5),
      notifications: [],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};