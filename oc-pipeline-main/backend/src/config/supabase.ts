import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Extend ProcessEnv to include our custom environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    }
  }
}

// Lazy-loaded clients - only created when needed
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Get Supabase client for public operations (anon key)
 * Lazy-loads the client on first call
 */
export function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.\n" +
        "See backend/ENV_SETUP.md for instructions."
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

/**
 * Get Supabase admin client for privileged operations (service role key)
 * Lazy-loads the client on first call
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL is missing. Please set it in your .env file.\n" +
        "See backend/ENV_SETUP.md for instructions."
    );
  }

  // Use service role key if available, fallback to anon key (not recommended for production)
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key) {
    throw new Error(
      "Supabase API key is missing. Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your .env file.\n" +
        "See backend/ENV_SETUP.md for instructions."
    );
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, key);
  }

  return supabaseAdminClient;
}

// Legacy exports for backward compatibility (lazy-loaded via Proxy)
// These only call getSupabase()/getSupabaseAdmin() when actually accessed, not at module load time
// This ensures environment variables are loaded before the client is created

export const supabase = (() => {
  let client: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (!client) {
        client = getSupabase();
      }
      return (client as any)[prop];
    },
  });
})();

export const supabaseAdmin = (() => {
  let client: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (!client) {
        client = getSupabaseAdmin();
      }
      return (client as any)[prop];
    },
  });
})();

export default supabase;
