// API Client for OC Pipeline
import { supabase } from './supabase';

class ApiClient {
  // Authentication methods now use Supabase Auth
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

    // For now, these endpoints will use Supabase Functions or direct database queries
    // If you have a separate backend API, update the base URL accordingly
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

  // Dashboard - Using Supabase direct queries
  async getDashboard() {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Query dashboard data from Supabase
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(10);

    if (error) throw new Error(error.message);

    return {
      projects: projects || [],
      stats: {
        total_projects: projects?.length || 0,
        active_projects: projects?.filter((p) => p.status === 'active').length || 0,
      },
    };
  }

  // Projects - Using Supabase direct queries
  async getProjects(params?: { limit?: number; offset?: number; status?: string }) {
    const { limit = 50, offset = 0, status } = params || {};

    let query = supabase.from('projects').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return {
      projects: data || [],
      total: count || 0,
    };
  }

  async getProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }
}

export const apiClient = new ApiClient();