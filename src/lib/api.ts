// src/lib/api.ts
import { supabase } from "./supabase";
import type { DashboardData, Project } from "./database.types";

/**
 * Central API Client for OC Pipeline
 * Handles authentication, project CRUD, and dashboard analytics.
 */
class ApiClient {
  /**
   * Safely get backend API URL
   */
  private getApiUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL;
    const finalUrl =
      apiUrl && apiUrl.trim().length > 0 ? apiUrl.trim() : "http://localhost:4000";
    if (import.meta.env.DEV) console.log("🔗 API URL:", finalUrl);
    return finalUrl;
  }

  // ---------------------------------------------------
  // 🔐 AUTHENTICATION
  // ---------------------------------------------------

  async login(email: string, password: string) {
    const response = await fetch(`${this.getApiUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await this.safeJson(response);
    if (!response.ok) throw new Error(data.error || "Login failed");

    return {
      token: data.token || "",
      user: data.user,
    };
  }

  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${this.getApiUrl()}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name }),
    });

    const data = await this.safeJson(response);
    if (!response.ok) throw new Error(data.error || "Signup failed");

    return {
      token: data.token || "",
      user: { email: data.email, id: data.userId },
    };
  }

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  // ---------------------------------------------------
  // 🧩 HELPERS
  // ---------------------------------------------------

  private async getSessionToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  private async safeJson(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  private async requireAuth() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error("Not authenticated");
    return user;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getSessionToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${this.getApiUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await this.safeJson(response);
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data as T;
  }

  // ---------------------------------------------------
  // 📊 DASHBOARD
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // 📁 PROJECTS
  // ---------------------------------------------------

  async getProjects(filters?: { status?: string }): Promise<Project[]> {
    const user = await this.requireAuth();

    let query = supabase.from("projects").select("*");
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Project[]) || [];
  }

  async getProject(id: string): Promise<Project> {
    await this.requireAuth();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Project;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const user = await this.requireAuth();

    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const user = await this.requireAuth();

    const { data, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  }

  async deleteProject(id: string): Promise<void> {
    await this.requireAuth();

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  }
}

// ✅ Export a single shared instance
export const apiClient = new ApiClient();