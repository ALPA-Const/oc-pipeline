-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 007: ATLAS Agentic System (15 tables)
-- ============================================================

-- ============================================================
-- 1. AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Module
    module VARCHAR(100),

    -- Type
    agent_type VARCHAR(50) DEFAULT 'specialist', -- master, specialist

    -- Status
    status VARCHAR(50) DEFAULT 'dormant', -- dormant, initializing, active, paused, error, terminated

    -- Version
    version VARCHAR(20) DEFAULT '1.0.0',

    -- Configuration
    config JSONB DEFAULT '{}',

    -- Capabilities
    capabilities JSONB DEFAULT '[]',

    -- Metrics
    tasks_processed INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,

    -- Timestamps
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. AGENT_TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Task
    task_type VARCHAR(100) NOT NULL, -- analyze, generate, validate, predict, recommend, automate, notify, coordinate

    -- Priority
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

    -- Payload
    payload JSONB NOT NULL,

    -- Context
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    entity_type VARCHAR(100),
    entity_id UUID,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Result
    result JSONB,
    error TEXT,

    -- Metrics
    processing_time_ms INTEGER,
    tokens_used INTEGER,

    -- Retry
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Requester
    requested_by UUID REFERENCES users(id),

    -- Timeout
    timeout_at TIMESTAMPTZ
);

-- ============================================================
-- 3. AGENT_MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    from_agent_id UUID REFERENCES agents(id),
    to_agent_id UUID REFERENCES agents(id),

    -- Message
    message_type VARCHAR(50) NOT NULL, -- request, response, notification, broadcast
    subject VARCHAR(255),
    content JSONB NOT NULL,

    -- Context
    conversation_id UUID,
    correlation_id UUID,

    -- Status
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, processed

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- ============================================================
-- 4. AGENT_MEMORY
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Memory
    memory_type VARCHAR(50) NOT NULL, -- short_term, long_term, episodic, semantic
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,

    -- Context
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),

    -- Metadata
    importance DECIMAL(3, 2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    UNIQUE(agent_id, memory_type, key)
);

-- ============================================================
-- 5. AGENT_METRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type VARCHAR(20) DEFAULT 'hourly', -- hourly, daily, weekly

    -- Task metrics
    tasks_received INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,

    -- Performance
    avg_response_time_ms INTEGER,
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,

    -- Resource usage
    tokens_used INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,

    -- Quality
    success_rate DECIMAL(5, 2),
    user_satisfaction DECIMAL(3, 2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. KNOWLEDGE_GRAPH_NODES
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Node
    node_type VARCHAR(100) NOT NULL, -- project, person, organization, document, task, risk, cost_item
    label VARCHAR(255) NOT NULL,

    -- Properties
    properties JSONB DEFAULT '{}',

    -- Source
    source_entity_type VARCHAR(100),
    source_entity_id UUID,

    -- Embeddings (for similarity search)
    embedding VECTOR(1536), -- OpenAI embedding dimension

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. KNOWLEDGE_GRAPH_EDGES
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Nodes
    from_node_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,

    -- Relationship
    relationship VARCHAR(100) NOT NULL, -- MANAGES, WORKS_ON, SUPPLIES, DEPENDS_ON, IMPACTS, REFERENCES, MITIGATES

    -- Properties
    properties JSONB DEFAULT '{}',

    -- Weight
    weight DECIMAL(5, 3) DEFAULT 1.0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(from_node_id, to_node_id, relationship)
);

-- ============================================================
-- 8. SYSTEM_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(100),

    -- Payload
    payload JSONB NOT NULL,

    -- Context
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),

    -- Entity
    entity_type VARCHAR(100),
    entity_id UUID,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ
);

-- ============================================================
-- 9. EVENT_SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Event filter
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(100),

    -- Conditions
    filter_conditions JSONB DEFAULT '{}',

    -- Handler
    handler_type VARCHAR(50) DEFAULT 'task', -- task, webhook, function
    handler_config JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Priority
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, event_type, event_source)
);

-- ============================================================
-- 10. COORDINATION_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coordination_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Initiator
    initiator_agent_id UUID NOT NULL REFERENCES agents(id),

    -- Participants
    participant_agent_ids JSONB NOT NULL,

    -- Purpose
    purpose VARCHAR(255) NOT NULL,
    description TEXT,

    -- Context
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, failed, cancelled

    -- Results
    results JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 11. MODULE_OWNERSHIP
-- ============================================================
CREATE TABLE IF NOT EXISTS module_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module VARCHAR(100) NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES agents(id),

    -- Capabilities for this module
    capabilities JSONB DEFAULT '[]',

    -- Priority (for fallback)
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. EVOLUTION_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Version
    from_version VARCHAR(20),
    to_version VARCHAR(20) NOT NULL,

    -- Changes
    changes JSONB NOT NULL,

    -- Reason
    reason TEXT,

    -- Triggered by
    triggered_by VARCHAR(50), -- manual, auto, performance, feedback

    -- Metrics before/after
    metrics_before JSONB,
    metrics_after JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SAFETY_BOUNDARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

    -- Boundary
    boundary_type VARCHAR(100) NOT NULL, -- rate_limit, cost_threshold, approval_required, restricted_tables, restricted_operations

    -- Configuration
    config JSONB NOT NULL,

    -- Scope
    scope VARCHAR(50) DEFAULT 'global', -- global, org, project
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. AGENT_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Log
    level VARCHAR(20) NOT NULL, -- debug, info, warn, error
    message TEXT NOT NULL,

    -- Context
    task_id UUID REFERENCES agent_tasks(id),
    correlation_id UUID,

    -- Details
    details JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. AGENT_CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Config
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,

    -- Environment
    environment VARCHAR(50) DEFAULT 'production',

    -- Version
    version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, config_key, environment)
);

-- ============================================================
-- AUDIT LOG (Immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What happened
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,

    -- Who did it
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    org_id UUID REFERENCES organizations(id),

    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Changes
    old_values JSONB,
    new_values JSONB,

    -- Timestamp (immutable)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions for audit logs (monthly)
CREATE TABLE IF NOT EXISTS audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_04 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_05 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_06 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_07 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_module ON agents(module);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from ON agent_messages(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_to ON agent_messages(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kg_nodes_updated_at BEFORE UPDATE ON knowledge_graph_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_boundaries_updated_at BEFORE UPDATE ON safety_boundaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PREVENT AUDIT LOG MODIFICATIONS (Immutable)
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_audit_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

