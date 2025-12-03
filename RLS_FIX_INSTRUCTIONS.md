# How to Fix Row Level Security (RLS) Issues

If you see "Loading projects from database..." but no projects appear, and the console shows RLS-related errors, follow these steps:

## Option 1: Disable RLS (Quick Fix for Development)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste and run this SQL:

```sql
-- Disable RLS on all pipeline tables
ALTER TABLE pipeline_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions DISABLE ROW LEVEL SECURITY;
```

5. Click "Run" or press Ctrl+Enter

## Option 2: Create Policies (Recommended for Production)

If you want to keep RLS enabled but allow anonymous reads:

```sql
-- Enable RLS
ALTER TABLE pipeline_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous reads
CREATE POLICY "allow_anon_read_projects" 
ON pipeline_projects FOR SELECT 
USING (true);

CREATE POLICY "allow_anon_read_stages" 
ON pipeline_stages FOR SELECT 
USING (true);

CREATE POLICY "allow_anon_read_transitions" 
ON stage_transitions FOR SELECT 
USING (true);

-- Optional: Allow authenticated users to insert/update
CREATE POLICY "allow_auth_insert_projects" 
ON pipeline_projects FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "allow_auth_update_projects" 
ON pipeline_projects FOR UPDATE 
TO authenticated 
USING (true);
```

## Verify the Fix

After running the SQL, refresh your application. You should see:

1. In the browser console:
   - ✅ Supabase client initialized successfully
   - ✅ Supabase connection successful!
   - 📊 Found X projects in database
   - ✅ Successfully fetched projects

2. In the UI:
   - Project cards appearing in Kanban columns
   - Metrics showing correct project counts
   - No "Loading..." message stuck

## Debugging Console Logs

The application now includes detailed logging:

- **🔧 Configuration Check**: Verifies environment variables are set
- **🔍 Query Logs**: Shows what queries are being sent
- **📊 Result Logs**: Shows query results and counts
- **❌ Error Logs**: Shows detailed error information
- **🔒 RLS Warnings**: Specifically identifies RLS issues

Check your browser's Developer Console (F12) to see these logs.

## Common Issues

### Issue: "Missing Supabase environment variables"
**Solution**: Check that `.env.local` exists with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: "PGRST301" or "RLS" in error message
**Solution**: Run the RLS fix SQL above

### Issue: "Found 0 projects in database"
**Solution**: Check that you've run the `database/setup.sql` script to insert sample data

### Issue: Projects exist but don't appear in Kanban
**Solution**: Verify stage IDs match between database and config file (already fixed in latest version)