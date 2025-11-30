# Database Setup Guide

## Phase 1: Database Foundation Implementation

This guide will help you set up the complete PostgreSQL database using your provided SQL script.

### Option 1: Supabase Setup (Recommended)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for project to be ready

2. **Run Database Script**
   - Go to SQL Editor in Supabase dashboard
   - Copy your complete PostgreSQL script into `database/setup.sql`
   - Run the entire script to create all tables, functions, views, and seed data

3. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Update with your Supabase project URL and anon key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Verify Setup**
   ```sql
   -- Run these queries in Supabase SQL editor to verify:
   SELECT * FROM check_data_integrity();
   SELECT COUNT(*) as project_count FROM pipeline_projects;
   SELECT COUNT(*) as stage_count FROM pipeline_stages;
   SELECT pipeline_type, COUNT(*) as count FROM pipeline_projects GROUP BY pipeline_type;
   ```

### Option 2: Direct PostgreSQL Setup

1. **Create PostgreSQL Database**
   ```bash
   createdb pipeline_management
   ```

2. **Run Setup Script**
   ```bash
   psql -d pipeline_management -f database/setup.sql
   ```

3. **Configure Environment**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/pipeline_management
   ```

### Database Features Included

✅ **11 Tables**: Complete schema for pipeline management
✅ **25+ Functions**: Business logic for project operations  
✅ **10+ Views**: Optimized queries for reporting
✅ **Triggers**: Automatic audit logging and data integrity
✅ **Seed Data**: 17 sample projects with realistic ALPA data
✅ **Indexes**: Performance optimized for large datasets
✅ **RLS Policies**: Ready for multi-tenant security

### API Integration

The frontend now includes:

- **Supabase Client**: `src/lib/supabase.ts`
- **Pipeline Service**: `src/services/pipeline.service.ts` 
- **Database Store**: `src/stores/pipeline.database.ts`
- **Type Mappings**: Database to frontend type conversions

### Usage

1. **Switch to Database Store**
   ```typescript
   // In your components, import the database store instead of mock store
   import { usePipelineStore } from '@/stores/pipeline.database';
   ```

2. **Database Operations**
   ```typescript
   // All operations now use real database functions
   await moveProject(projectId, stageId, notes);
   await flagProjectStalled(projectId, reason);
   await exportPipeline(pipelineType);
   ```

3. **Data Integrity**
   ```typescript
   // Check database health
   await checkDatabaseIntegrity();
   ```

### Next Steps

After database setup:
1. Update components to use database store
2. Test all CRUD operations
3. Verify data integrity
4. Set up real-time subscriptions (optional)
5. Configure Row Level Security for multi-user access

Your complete database foundation is now ready for production use!