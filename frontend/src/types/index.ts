// Core Types for OC Pipeline Dashboard

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'estimator' | 'project_manager' | 'executive';
  company: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'draft' | 'approved' | 'completed';
  value: number;
  deadline: string;
  progress: number;
  client?: string;
  location?: string;
}

export interface KPIData {
  budget: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  schedule: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  cost: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  quality: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export interface DashboardData {
  kpis: KPIData;
  projects: Project[];
  recentProjects: Project[];
  notifications: Notification[];
  lastUpdated: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
