// API Client for OC Pipeline
import { supabase } from './supabase';

class ApiClient {
  private getApiUrl(): string {
    return import.meta.env.VITE_API_URL || 'https://oc-pipeline.onrender.com';
  }

  // Authentication methods using Backend API
  async login(email: string, password: string) {
    const response = await fetch(`${this.getApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return {
      token: data.token || '',
      user: data.user,
    };
  }

  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${this.getApiUrl()}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password, 
        fullName: name 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    return {
      token: data.token || '',
      user: { email: data.email, id: data.userId },
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

  // Generic request method for API calls
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

    const API_BASE_URL = this.getApiUrl();

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

  // Dashboard
  async getDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(10);

    if (projectsError) throw projectsError;

    return {
      stats: {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter((p) => p.status === 'active').length || 0,
        completedProjects: projects?.filter((p) => p.status === 'completed').length || 0,
      },
      recentProjects: projects || [],
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
