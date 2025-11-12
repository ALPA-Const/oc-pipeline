// API Client for OC Pipeline
import { supabase } from './supabase';

class ApiClient {
  // Authentication methods using Supabase Auth
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      token: data.session?.access_token || '',
      user: data.user,
    };
  }

  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      token: data.session?.access_token || '',
      user: data.user,
    };
  }

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // Helper method to get current session token
  private async getSessionToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Generic request method for API calls (uses Supabase session token)
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getSessionToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Dashboard - Fixed to return kpis instead of stats
async getDashboard(): Promise<DashboardData> {
  try {
    // Call backend API which handles auth and RLS
    const response = await this.request<any>('/api/dashboard');
    
    // Ensure the response has the correct structure
    return {
      kpis: response.kpis || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        budget: 0,
        schedule: 0,
        cost: 0,
        quality: 0,
        revenue: 0,
        profit: 0,
      },
      recentProjects: response.recentProjects || [],
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    // Return empty dashboard instead of throwing
    return {
      kpis: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        budget: 0,
        schedule: 0,
        cost: 0,
        quality: 0,
        revenue: 0,
        profit: 0,
      },
      recentProjects: [],
    };
  }
}

    // Try to fetch projects, but handle gracefully if table doesn't exist
    let projects: any[] = [];
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(10);
      
      if (!error) {
        projects = data || [];
      }
    } catch (err) {
      console.warn('Projects table may not exist yet:', err);
    }

    // Calculate KPIs in the format the frontend expects
    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);

    // Return data in the exact format Dashboard.tsx expects
    return {
      kpis: {
        budget: {
          value: totalValue,
          change: 0,
          trend: 'neutral' as const
        },
        schedule: {
          value: activeProjects.length,
          change: 0,
          trend: 'neutral' as const
        },
        cost: {
          value: 0,
          change: 0,
          trend: 'neutral' as const
        },
        quality: {
          value: 0,
          change: 0,
          trend: 'neutral' as const
        }
      },
      projects: projects,
      recentProjects: projects.slice(0, 5),
      notifications: [],
      lastUpdated: new Date().toISOString()
    };
  }

  // Projects
  async getProjects(filters?: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase.from('projects').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  async getProject(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createProject(project: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProject(id: string, updates: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProject(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;
  }
}

export const apiClient = new ApiClient();