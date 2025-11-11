// src/lib/database.types.ts

// ---------------------------------------------
// Project Type
// ---------------------------------------------
export type Project = {
  id: string;
  name: string;
  status: "active" | "completed" | "on-hold" | "archived";
  type?: string;
  value?: number;
  deadline?: string;
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
  created_at?: string;
};

// ---------------------------------------------
// KPIData Type — represents the key dashboard metrics
// ---------------------------------------------
export type TrendType = "up" | "down" | "neutral";

export type KPIData = {
  // Core KPIs
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;

  // Financial metrics
  budget: number;
  revenue: number;
  profit: number;

  // Optional KPI deltas (changes and trends)
  budget_change?: number;
  budget_trend?: TrendType;

  revenue_change?: number;
  revenue_trend?: TrendType;

  profit_change?: number;
  profit_trend?: TrendType;

  // Optional project health metrics
  schedule?: number;
  cost?: number;
  quality?: number;
};

// ---------------------------------------------
// DashboardData — represents the full dashboard dataset
// ---------------------------------------------
export type DashboardData = {
  kpis: KPIData;
  recentProjects: Project[];
};

// ---------------------------------------------
// Supabase Database Schema Example
// ---------------------------------------------
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Project>;
      };
    };
  };
}