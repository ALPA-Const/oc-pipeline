// Placeholder for Supabase generated types
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pipeline_projects: {
        Row: {
          id: string
          name: string
          pipeline_type: string
          stage_id: string
          value: number
          created_at: string
          updated_at: string
          [key: string]: unknown
        }
        Insert: {
          id?: string
          name: string
          pipeline_type: string
          stage_id: string
          value: number
          created_at?: string
          updated_at?: string
          [key: string]: unknown
        }
        Update: {
          id?: string
          name?: string
          pipeline_type?: string
          stage_id?: string
          value?: number
          created_at?: string
          updated_at?: string
          [key: string]: unknown
        }
      }
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
  }
}