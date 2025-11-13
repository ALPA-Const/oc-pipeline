/**
 * Supabase client with OAuth support and debug logging
 * Handles authentication, database operations, and real-time subscriptions
 */
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('=== SUPABASE DEBUG INFO ===');
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey.length);
console.log('All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
console.log('===========================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ MISSING SUPABASE CREDENTIALS!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
  throw new Error(
    'Missing Supabase environment variables. Check your .env.local file.'
  );
}

// Create Supabase client with OAuth support
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error);
  } else {
    console.log('✅ Supabase connected successfully');
    console.log('Current session:', data.session ? 'Active' : 'None');
  }
});

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

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

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Get the current authenticated user
 */
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

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign in with Microsoft/Azure OAuth
 */
export async function signInWithMicrosoft() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Microsoft:', error);
    throw error;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}

// ============================================================================
// DATABASE QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch all projects for the current user
 */
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data as DatabaseProject[];
}

/**
 * Fetch a single project by ID
 */
export async function fetchProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }

  return data as DatabaseProject;
}

/**
 * Create a new project
 */
export async function createProject(project: Partial<DatabaseProject>) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data as DatabaseProject;
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, updates: Partial<DatabaseProject>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data as DatabaseProject;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Fetch all stages
 */
export async function fetchStages() {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching stages:', error);
    throw error;
  }

  return data as DatabaseStage[];
}

/**
 * Subscribe to real-time project updates
 */
export function subscribeToProjects(callback: (payload: any) => void) {
  const subscription = supabase
    .from('projects')
    .on('*', (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
}
