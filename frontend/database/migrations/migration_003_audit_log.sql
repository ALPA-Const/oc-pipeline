-- Migration 003: Audit Log and QA Tables
-- Purpose: Track KPI calculations and data quality checks
-- Date: 2025-10-29

BEGIN;

-- ============================================================================
-- KPI Audit Log Table
-- ============================================================================
-- Stores nightly snapshots of KPI calculations for historical tracking

CREATE TABLE IF NOT EXISTS kpi_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  window_type TEXT NOT NULL,
  params JSONB NOT NULL,
  filters JSONB,
  as_of TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL,
  samples INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS kpi_audit_log_metric_idx ON kpi_audit_log(metric_name);
CREATE INDEX IF NOT EXISTS kpi_audit_log_as_of_idx ON kpi_audit_log(as_of DESC);
CREATE INDEX IF NOT EXISTS kpi_audit_log_created_idx ON kpi_audit_log(created_at DESC);

-- ============================================================================
-- Data Quality Audit Table
-- ============================================================================
-- Stores results of nightly QA checks

CREATE TABLE IF NOT EXISTS qa_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'anomaly', 'validation', 'consistency'
  severity TEXT NOT NULL, -- 'critical', 'warning', 'info'
  status TEXT NOT NULL, -- 'pass', 'fail'
  details JSONB,
  affected_records INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS qa_audit_log_check_idx ON qa_audit_log(check_name);
CREATE INDEX IF NOT EXISTS qa_audit_log_severity_idx ON qa_audit_log(severity);
CREATE INDEX IF NOT EXISTS qa_audit_log_created_idx ON qa_audit_log(created_at DESC);

-- ============================================================================
-- Event Tracking Table
-- ============================================================================
-- Stores user interaction events for telemetry

CREATE TABLE IF NOT EXISTS dashboard_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS dashboard_events_name_idx ON dashboard_events(event_name);
CREATE INDEX IF NOT EXISTS dashboard_events_user_idx ON dashboard_events(user_id);
CREATE INDEX IF NOT EXISTS dashboard_events_created_idx ON dashboard_events(created_at DESC);

-- ============================================================================
-- Metrics Health Check View
-- ============================================================================
-- Provides quick health status of metrics system

CREATE OR REPLACE VIEW metrics_health AS
SELECT
  (SELECT MAX(created_at) FROM qa_audit_log) as last_qa_run,
  (SELECT MAX(created_at) FROM kpi_audit_log) as last_audit_run,
  (SELECT COUNT(*) FROM qa_audit_log WHERE status = 'fail' AND created_at > NOW() - INTERVAL '24 hours') as anomalies_detected,
  CASE
    WHEN (SELECT COUNT(*) FROM qa_audit_log WHERE severity = 'critical' AND status = 'fail' AND created_at > NOW() - INTERVAL '24 hours') > 0 THEN 'error'
    WHEN (SELECT COUNT(*) FROM qa_audit_log WHERE severity = 'warning' AND status = 'fail' AND created_at > NOW() - INTERVAL '24 hours') > 0 THEN 'warning'
    ELSE 'healthy'
  END as status;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on audit tables
ALTER TABLE kpi_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_events ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read, service role to write
CREATE POLICY "allow_authenticated_read_kpi_audit" ON kpi_audit_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_service_role_all_kpi_audit" ON kpi_audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_read_qa_audit" ON qa_audit_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_service_role_all_qa_audit" ON qa_audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_users_read_own_events" ON dashboard_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_users_insert_own_events" ON dashboard_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_service_role_all_events" ON dashboard_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to log KPI calculation
CREATE OR REPLACE FUNCTION log_kpi_calculation(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_window_type TEXT,
  p_params JSONB,
  p_filters JSONB DEFAULT NULL,
  p_source TEXT DEFAULT 'pipeline_projects',
  p_samples INTEGER DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO kpi_audit_log (
    metric_name,
    metric_value,
    window_type,
    params,
    filters,
    as_of,
    source,
    samples,
    reason
  ) VALUES (
    p_metric_name,
    p_metric_value,
    p_window_type,
    p_params,
    p_filters,
    NOW(),
    p_source,
    p_samples,
    p_reason
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to log QA check
CREATE OR REPLACE FUNCTION log_qa_check(
  p_check_name TEXT,
  p_check_type TEXT,
  p_severity TEXT,
  p_status TEXT,
  p_details JSONB DEFAULT NULL,
  p_affected_records INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO qa_audit_log (
    check_name,
    check_type,
    severity,
    status,
    details,
    affected_records
  ) VALUES (
    p_check_name,
    p_check_type,
    p_severity,
    p_status,
    p_details,
    p_affected_records
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Insert sample KPI audit log entry
INSERT INTO kpi_audit_log (
  metric_name,
  metric_value,
  window_type,
  params,
  as_of,
  source,
  samples
) VALUES (
  'awarded_ytd',
  45000000,
  'fiscal_ytd',
  '{"fiscal_year": 2026, "include_loi": false}'::jsonb,
  NOW(),
  'pipeline_projects',
  12
);

-- Insert sample QA audit log entry
INSERT INTO qa_audit_log (
  check_name,
  check_type,
  severity,
  status,
  details
) VALUES (
  'velocity_null_check',
  'anomaly',
  'warning',
  'pass',
  '{"submitted_count": 45, "velocity_samples": 12}'::jsonb
);

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify tables created
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('kpi_audit_log', 'qa_audit_log', 'dashboard_events');

-- Verify RLS enabled
SELECT 'RLS enabled:' as status;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('kpi_audit_log', 'qa_audit_log', 'dashboard_events');

-- Verify policies created
SELECT 'Policies created:' as status;
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('kpi_audit_log', 'qa_audit_log', 'dashboard_events');

-- Check metrics health view
SELECT 'Metrics health:' as status;
SELECT * FROM metrics_health;