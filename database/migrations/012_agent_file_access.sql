-- ============================================================
-- OC PIPELINE - Agent File Access
-- Migration 012: Agent File Access and Permissions
-- ============================================================

-- ============================================================
-- 1. AGENT_FILE_ACCESS
-- Track which agents have accessed which files
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_file_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent and File references
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    
    -- Access details
    access_type VARCHAR(50) NOT NULL, -- read, write, analyze, extract, generate
    access_reason TEXT, -- Why the agent accessed this file
    
    -- Context
    task_id UUID REFERENCES agent_tasks(id),
    project_id UUID REFERENCES projects(id),
    org_id UUID REFERENCES organizations(id),
    
    -- Access metadata
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER, -- How long the access took
    
    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata about what was done
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. AGENT_FILE_PERMISSIONS
-- Define which agents can access which file types
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_file_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent reference
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- File filters
    file_pattern VARCHAR(255), -- e.g., "*.pdf", "drawings/*", "specifications/*.docx"
    mime_type_pattern VARCHAR(100), -- e.g., "application/pdf", "image/*"
    folder_id UUID REFERENCES folders(id), -- Specific folder access
    
    -- Permissions
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_analyze BOOLEAN DEFAULT true, -- Can extract information
    
    -- Scope
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. AGENT_FILE_OPERATIONS
-- Track file operations performed by agents (creates, updates, deletes)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_file_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent and file references
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL, -- create, update, delete, move, copy
    
    -- Context
    task_id UUID REFERENCES agent_tasks(id),
    project_id UUID REFERENCES projects(id),
    org_id UUID REFERENCES organizations(id),
    
    -- File details (stored for audit even if file is deleted)
    file_name VARCHAR(255),
    file_path TEXT,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    
    -- Changes made
    changes JSONB, -- What was changed
    
    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamps
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Agent file access indexes
CREATE INDEX idx_agent_file_access_agent ON agent_file_access(agent_id);
CREATE INDEX idx_agent_file_access_file ON agent_file_access(file_id);
CREATE INDEX idx_agent_file_access_task ON agent_file_access(task_id);
CREATE INDEX idx_agent_file_access_time ON agent_file_access(accessed_at DESC);
CREATE INDEX idx_agent_file_access_org ON agent_file_access(org_id);
CREATE INDEX idx_agent_file_access_project ON agent_file_access(project_id);

-- Agent file permissions indexes
CREATE INDEX idx_agent_file_permissions_agent ON agent_file_permissions(agent_id);
CREATE INDEX idx_agent_file_permissions_folder ON agent_file_permissions(folder_id);
CREATE INDEX idx_agent_file_permissions_active ON agent_file_permissions(is_active) WHERE is_active = true;
CREATE INDEX idx_agent_file_permissions_org ON agent_file_permissions(org_id);
CREATE INDEX idx_agent_file_permissions_project ON agent_file_permissions(project_id);

-- Agent file operations indexes
CREATE INDEX idx_agent_file_operations_agent ON agent_file_operations(agent_id);
CREATE INDEX idx_agent_file_operations_file ON agent_file_operations(file_id);
CREATE INDEX idx_agent_file_operations_task ON agent_file_operations(task_id);
CREATE INDEX idx_agent_file_operations_time ON agent_file_operations(performed_at DESC);
CREATE INDEX idx_agent_file_operations_org ON agent_file_operations(org_id);
CREATE INDEX idx_agent_file_operations_project ON agent_file_operations(project_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at timestamp for agent_file_permissions
CREATE OR REPLACE FUNCTION update_agent_file_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_file_permissions_timestamp
    BEFORE UPDATE ON agent_file_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_file_permissions_timestamp();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE agent_file_access IS 'Tracks all file access by AI agents for audit and monitoring';
COMMENT ON TABLE agent_file_permissions IS 'Defines which agents can access which files and file types';
COMMENT ON TABLE agent_file_operations IS 'Records all file operations (create, update, delete) performed by agents';

COMMENT ON COLUMN agent_file_access.access_type IS 'Type of access: read, write, analyze, extract, generate';
COMMENT ON COLUMN agent_file_access.access_reason IS 'Human-readable reason for the access';
COMMENT ON COLUMN agent_file_permissions.file_pattern IS 'Glob pattern for matching file names, e.g., *.pdf';
COMMENT ON COLUMN agent_file_permissions.mime_type_pattern IS 'Pattern for matching MIME types, e.g., application/pdf or image/*';
