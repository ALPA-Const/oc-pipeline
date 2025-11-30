-- Events Table: Immutable Audit Trail
-- All system events are logged here for compliance and debugging

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'exec', 'pm', 'pe', 'super', 'precon', 'sub', 'client', 'system')),
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'archived', 'unarchived',
    'status_changed', 'assigned', 'unassigned', 'commented',
    'approved', 'rejected', 'exported', 'imported',
    'viewed', 'downloaded', 'uploaded'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'project', 'action_item', 'user', 'document',
    'budget', 'schedule', 'safety_incident', 'quality_defect',
    'change_order', 'rfi', 'submittal'
  )),
  entity_id UUID NOT NULL,
  project_id UUID,
  changes JSONB,
  metadata JSONB,
  pii_redacted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_actor_id ON events(actor_id);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX idx_events_project_id ON events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_events_action ON events(action);

-- Composite indexes for common queries
CREATE INDEX idx_events_org_timestamp ON events(org_id, timestamp DESC);
CREATE INDEX idx_events_project_timestamp ON events(project_id, timestamp DESC) WHERE project_id IS NOT NULL;
CREATE INDEX idx_events_actor_timestamp ON events(actor_id, timestamp DESC);

-- Trigger to prevent updates (immutable)
CREATE OR REPLACE FUNCTION prevent_event_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_event_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_update();

-- Trigger to prevent deletes (immutable)
CREATE OR REPLACE FUNCTION prevent_event_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_event_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_delete();

-- Function to log events (used by application)
CREATE OR REPLACE FUNCTION log_event(
  p_org_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (
    org_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    project_id,
    changes,
    metadata
  ) VALUES (
    p_org_id,
    p_actor_id,
    p_actor_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_project_id,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Partitioning strategy for events (by month)
-- This helps with performance and data retention
CREATE TABLE IF NOT EXISTS events_y2025m01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS events_y2025m02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS events_y2025m03 PARTITION OF events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Add more partitions as needed

COMMENT ON TABLE events IS 'Immutable audit trail for all system events';
COMMENT ON COLUMN events.pii_redacted IS 'Flag indicating if PII has been redacted for compliance';
COMMENT ON FUNCTION log_event IS 'Helper function to log events with validation';
COMMENT ON TRIGGER trigger_prevent_event_update ON events IS 'Prevents updates to maintain immutability';
COMMENT ON TRIGGER trigger_prevent_event_delete ON events IS 'Prevents deletes to maintain audit trail';