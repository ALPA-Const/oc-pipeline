/**
 * Supabase Client Configuration
 * Centralized client for database operations
 */

import { createClient } from '@supabase/supabase-js';

// Database types (to be generated from Supabase)
export interface DatabaseProject {
  id: string;
  job_no?: string;
  name: string;
  agency?: string;
  status: string;
  set_aside?: string;
  manager?: string;
  flagged: boolean;
  due_date?: string;
  due_at?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  value?: number;
  lat?: number;
  lng?: number;
  solicitation_number?: string;
  naics_code?: string;
  address?: string;
  zip_code?: string;
  project_status?: string;
  precon_poc?: string;
  site_visit_datetime?: string;
  rfi_due_datetime?: string;
  bid_due_datetime?: string;
  magnitude_range?: string;
  pop_days?: number;
  dta?: boolean;
  bid_doc_assistance?: boolean;
  jv?: boolean;
  poc?: string;
  source_link?: string;
  attachments?: string;
  notes?: string;
  // Pipeline fields
  stage_id?: string;
  pipeline_type?: string;
  win_probability?: number;
  pm?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_stalled?: boolean;
  stalled_reason?: string;
  stalled_at?: string;
  entered_stage_at?: string;
  days_in_stage?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_by?: string;
}

export interface DatabaseStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  pipeline_type: string;
}

export interface DatabaseTransition {
  id: string;
  project_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  transitioned_at: string;
  transitioned_by?: string;
  duration?: number;
  notes?: string;
}

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Helper function to get current user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}