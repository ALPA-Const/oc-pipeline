import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getDashboardData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch all necessary data in parallel
    const [projectsResult, actionItemsResult, eventsResult] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('action_items').select('*'),
      supabase.from('events').select('*'),
    ]);

    if (projectsResult.error || actionItemsResult.error || eventsResult.error) {
      res.status(400).json({ error: 'Failed to fetch dashboard data' });
      return;
    }

    const projects = projectsResult.data || [];
    const actionItems = actionItemsResult.data || [];
    const events = eventsResult.data || [];

    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p: any) => p.status === 'active').length,
      totalActionItems: actionItems.length,
      pendingActionItems: actionItems.filter((a: any) => a.status === 'pending').length,
      completedActionItems: actionItems.filter((a: any) => a.status === 'completed').length,
      upcomingEvents: events.filter((e: any) => new Date(e.date) > new Date()).length,
    };

    res.json({
      stats,
      recentProjects: projects.slice(0, 5),
      recentActionItems: actionItems.slice(0, 10),
      upcomingEvents: events
        .filter((e: any) => new Date(e.date) > new Date())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};