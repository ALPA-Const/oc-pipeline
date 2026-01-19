-- Migration 004: Pipeline Administration - Projects Table
-- Purpose: Create canonical projects table for admin module
-- Date: 2025-01-15

-- ============================================================================
-- Drop existing objects if they exist
-- ============================================================================

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- Create projects table
-- ============================================================================

CREATE TABLE projects (
  -- Core identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no TEXT,
  name TEXT NOT NULL,

  -- Classification
  agency TEXT,
  status TEXT NOT NULL DEFAULT 'Bidding',
  set_aside TEXT,
  manager TEXT,
  flagged BOOLEAN DEFAULT false,

  -- Dates
  due_date DATE,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,

  -- Financial
  value NUMERIC(14,2),

  -- Location
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  -- Extended fields from Project Data module
  solicitation_number TEXT,
  naics_code TEXT,
  address TEXT,
  zip_code TEXT,
  project_status TEXT,
  precon_poc TEXT,
  site_visit_datetime TIMESTAMPTZ,
  rfi_due_datetime TIMESTAMPTZ,
  bid_due_datetime TIMESTAMPTZ,
  magnitude_range TEXT,
  pop_days INTEGER,
  dta BOOLEAN DEFAULT false,
  bid_doc_assistance BOOLEAN DEFAULT false,
  jv BOOLEAN DEFAULT false,
  poc TEXT,
  source_link TEXT,
  attachments TEXT,
  notes TEXT,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('Bidding', 'Submitted', 'Awarded', 'Lost', 'In Progress', 'Pre-Solicitation')),
  CONSTRAINT valid_coordinates CHECK (
    (lat IS NULL AND lng IS NULL) OR 
    (lat IS NOT NULL AND lng IS NOT NULL AND lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180)
  ),
  CONSTRAINT valid_value CHECK (value IS NULL OR value >= 0)
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Single column indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_agency ON projects(agency);
CREATE INDEX idx_projects_set_aside ON projects(set_aside);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_value ON projects(value);
CREATE INDEX idx_projects_manager ON projects(manager);
CREATE INDEX idx_projects_flagged ON projects(flagged) WHERE flagged = true;
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_projects_status_due_date ON projects(status, due_date);
CREATE INDEX idx_projects_agency_status ON projects(agency, status);

-- Full-text search index on name
CREATE INDEX idx_projects_name_search ON projects USING gin(to_tsvector('english', name));

-- Spatial index for location queries
CREATE INDEX idx_projects_location ON projects USING gist(
  ll_to_earth(lat, lng)
) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ============================================================================
-- Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all projects
CREATE POLICY "allow_read_projects" ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow Admin, Precon, PM roles to insert
CREATE POLICY "allow_insert_projects" ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('Admin', 'Precon', 'PM')
  );

-- Policy: Allow Admin, Precon, PM roles to update
CREATE POLICY "allow_update_projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('Admin', 'Precon', 'PM')
  );

-- Policy: Allow only Admin role to delete
CREATE POLICY "allow_delete_projects" ON projects
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'Admin'
  );

-- ============================================================================
-- Create helper functions
-- ============================================================================

-- Function to get active projects count
CREATE OR REPLACE FUNCTION get_active_projects_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM projects
    WHERE status IN ('Bidding', 'In Progress', 'Submitted')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get total pipeline value
CREATE OR REPLACE FUNCTION get_total_pipeline_value()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(value), 0)
    FROM projects
    WHERE status IN ('Bidding', 'Submitted', 'In Progress')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE projects IS 'Canonical projects table for Pipeline Administration Module';
COMMENT ON COLUMN projects.job_no IS 'Internal tracking number (optional)';
COMMENT ON COLUMN projects.name IS 'Bid Title - primary project name';
COMMENT ON COLUMN projects.status IS 'Current pipeline status: Bidding, Submitted, Awarded, Lost, In Progress, Pre-Solicitation';
COMMENT ON COLUMN projects.set_aside IS 'Set-aside type: SDVOSB, 8(a), HUBZone, etc.';
COMMENT ON COLUMN projects.manager IS 'Project Manager or PM assigned';
COMMENT ON COLUMN projects.flagged IS 'Flag for attention/priority';
COMMENT ON COLUMN projects.due_date IS 'Bid due date (date part only)';
COMMENT ON COLUMN projects.due_at IS 'Bid due date/time (full timestamp)';
COMMENT ON COLUMN projects.value IS 'Project value in USD';
COMMENT ON COLUMN projects.lat IS 'Latitude coordinate (must pair with lng)';
COMMENT ON COLUMN projects.lng IS 'Longitude coordinate (must pair with lat)';