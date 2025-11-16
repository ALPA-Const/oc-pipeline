// API Client for OC Pipeline
import { supabase } from './supabase';

/* ---------------------------------------------------
   TYPES
---------------------------------------------------- */

export interface DashboardData {
  kpis: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    budget: number;
    schedule: number;
    cost: number;
    quality: number;
    revenue: number;
    profit: number;
  };
  recentProjects: any[];
}

export interface Project {
  id: string;
  name: string;
  status: string;
  value: number;
  client: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ActionItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  project_id: string;
  event_type: string;
  description: string;
  timestamp: string;
  user_id: string;
  metadata?: Record<string, any>;
}

export interface ProjectFilters {
  status?: string;
  client?: string;
  dateRange?: { start: string; end: string };
}

/* ---------------------------------------------------
   UTILITIES
---------------------------------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  console.warn(
    '⚠ Warning: VITE_API_URL is not set. Backend API requests may fail.'
  );
}

function emptyDashboard(): DashboardData {
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

/* ---------------------------------------------------
   CLASS: API CLIENT
---------------------------------------------------- */

class ApiClient {
  /* -----------------------------
     AUTHENTICATION (Supabase Auth)
  ------------------------------ */

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);

    return {
      token: data.session?.access_token ?? '',
      user: data.user,
    };
  }

  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) throw new Error(error.message);

    return {
      token: data.session?.access_token ?? '',
      user: data.user,
    };
  }

  async loginWithGoogle() {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  /* -----------------------------
     SESSION TOKEN
  ------------------------------ */

  private async getSessionToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  /* -----------------------------
     GENERIC API REQUEST WRAPPER
  ------------------------------ */

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getSessionToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

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

  /* -----------------------------
     DASHBOARD (Backend API)
  ------------------------------ */

async getDashboard(): Promise<DashboardData> {
  try {
    const response = await this.request<any>('/api/dashboard');

    return {
      kpis: response.kpis ?? emptyDashboard().kpis,
      recentProjects: response.recentProjects ?? [],
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return emptyDashboard();
  }
}

  /* -----------------------------
     PROJECTS
  ------------------------------ */

  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Not authenticated');

    let query = supabase.from('projects').select('*');

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.client) query = query.eq('client', filters.client);

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    const { data: projects, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return projects ?? [];
  }

  async getProject(id: string): Promise<Project> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Project not found');

    return data;
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, created_by: auth.user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProject(id: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }

  /* -----------------------------
     ACTION ITEMS
  ------------------------------ */

  async getActionItems(projectId?: string): Promise<ActionItem[]> {
    let query = supabase.from('action_items').select('*');
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return data ?? [];
  }

  async createActionItem(actionItem: Omit<ActionItem, 'id' | 'created_at' | 'updated_at'>): Promise<ActionItem> {
    const { data, error } = await supabase
      .from('action_items')
      .insert([actionItem])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActionItem(id: string, updates: Partial<ActionItem>): Promise<ActionItem> {
    const { data, error } = await supabase
      .from('action_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActionItem(id: string): Promise<void> {
    const { error } = await supabase.from('action_items').delete().eq('id', id);
    if (error) throw error;
  }

  /* -----------------------------
     EVENTS
  ------------------------------ */

  async getEvents(projectId?: string): Promise<Event[]> {
    let query = supabase.from('events').select('*');
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) throw error;

    return data ?? [];
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/* ---------------------------------------------------
   EXPORTS
---------------------------------------------------- */

export const apiClient = new ApiClient();
export const api = apiClient;
