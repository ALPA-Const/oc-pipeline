-- =====================================================================
-- ALPA CONSTRUCTION PIPELINE MANAGEMENT DATABASE
-- Complete PostgreSQL Schema with Functions, Views, and Seed Data
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- ENUMS
-- =====================================================================

CREATE TYPE pipeline_type_enum AS ENUM ('opportunity', 'preconstruction', 'execution', 'closeout');
CREATE TYPE priority_enum AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE project_status_enum AS ENUM ('active', 'on_hold', 'cancelled', 'completed');
CREATE TYPE set_aside_type_enum AS ENUM ('none', 'small_business', 'minority_owned', 'woman_owned', 'veteran_owned', 'disadvantaged');
CREATE TYPE user_role_enum AS ENUM ('admin', 'manager', 'user', 'viewer');
CREATE TYPE notification_type_enum AS ENUM ('project_moved', 'project_stalled', 'deadline_approaching', 'system_alert');
CREATE TYPE audit_action_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- =====================================================================
-- TABLES
-- =====================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role_enum NOT NULL DEFAULT 'user',
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Pipeline stages
CREATE TABLE pipeline_stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pipeline_type pipeline_type_enum NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    "order" INTEGER NOT NULL,
    average_duration INTEGER, -- Days
    required_fields TEXT[],
    next_stages TEXT[],
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline projects
CREATE TABLE pipeline_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    project_number VARCHAR(50) UNIQUE,
    description TEXT,
    stage_id VARCHAR(50) NOT NULL REFERENCES pipeline_stages(id),
    pipeline_type pipeline_type_enum NOT NULL,
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    win_probability INTEGER CHECK (win_probability >= 0 AND win_probability <= 100),
    agency VARCHAR(100),
    set_aside set_aside_type_enum DEFAULT 'none',
    pm VARCHAR(100),
    client_contact VARCHAR(255),
    priority priority_enum DEFAULT 'medium',
    status project_status_enum NOT NULL DEFAULT 'active',
    is_stalled BOOLEAN NOT NULL DEFAULT false,
    stalled_reason TEXT,
    stalled_at TIMESTAMP WITH TIME ZONE,
    entered_stage_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    days_in_stage INTEGER NOT NULL DEFAULT 0,
    estimated_start_date DATE,
    estimated_completion_date DATE,
    actual_start_date DATE,
    actual_completion_date DATE,
    tags TEXT[],
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stage transitions
CREATE TABLE stage_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pipeline_projects(id) ON DELETE CASCADE,
    from_stage_id VARCHAR(50) NOT NULL REFERENCES pipeline_stages(id),
    to_stage_id VARCHAR(50) NOT NULL REFERENCES pipeline_stages(id),
    transitioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transitioned_by UUID REFERENCES users(id),
    duration INTEGER, -- Days in previous stage
    notes TEXT,
    automated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action audit_action_enum NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pipeline_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_id UUID REFERENCES comments(id)
);

-- Attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pipeline_projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Project metrics
CREATE TABLE project_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES pipeline_projects(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID REFERENCES users(id),
    notes TEXT
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline views (saved filters/views)
CREATE TABLE pipeline_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pipeline_type pipeline_type_enum NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    sort_order JSONB NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Performance indexes
CREATE INDEX idx_pipeline_projects_stage_id ON pipeline_projects(stage_id);
CREATE INDEX idx_pipeline_projects_pipeline_type ON pipeline_projects(pipeline_type);
CREATE INDEX idx_pipeline_projects_status ON pipeline_projects(status);
CREATE INDEX idx_pipeline_projects_is_stalled ON pipeline_projects(is_stalled);
CREATE INDEX idx_pipeline_projects_agency ON pipeline_projects(agency);
CREATE INDEX idx_pipeline_projects_pm ON pipeline_projects(pm);
CREATE INDEX idx_pipeline_projects_priority ON pipeline_projects(priority);
CREATE INDEX idx_pipeline_projects_created_at ON pipeline_projects(created_at);
CREATE INDEX idx_pipeline_projects_value ON pipeline_projects(value);

-- Full-text search indexes
CREATE INDEX idx_pipeline_projects_name_trgm ON pipeline_projects USING gin (name gin_trgm_ops);
CREATE INDEX idx_pipeline_projects_description_trgm ON pipeline_projects USING gin (description gin_trgm_ops);

-- Other indexes
CREATE INDEX idx_stage_transitions_project_id ON stage_transitions(project_id);
CREATE INDEX idx_stage_transitions_transitioned_at ON stage_transitions(transitioned_at);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_attachments_project_id ON attachments(project_id);
CREATE INDEX idx_project_metrics_project_id ON project_metrics(project_id);

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

-- Function to update days_in_stage
CREATE OR REPLACE FUNCTION update_days_in_stage()
RETURNS VOID AS $$
BEGIN
    UPDATE pipeline_projects 
    SET days_in_stage = EXTRACT(DAY FROM CURRENT_TIMESTAMP - entered_stage_at)::INTEGER
    WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to move project to new stage
CREATE OR REPLACE FUNCTION move_project_to_stage(
    p_project_id UUID,
    p_to_stage_id VARCHAR(50),
    p_user_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_from_stage_id VARCHAR(50);
    v_pipeline_type pipeline_type_enum;
    v_duration INTEGER;
BEGIN
    -- Get current stage and pipeline type
    SELECT stage_id, pipeline_type, days_in_stage 
    INTO v_from_stage_id, v_pipeline_type, v_duration
    FROM pipeline_projects 
    WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Validate stage belongs to same pipeline type
    IF NOT EXISTS (
        SELECT 1 FROM pipeline_stages 
        WHERE id = p_to_stage_id AND pipeline_type = v_pipeline_type
    ) THEN
        RAISE EXCEPTION 'Invalid stage for pipeline type';
    END IF;
    
    -- Update project
    UPDATE pipeline_projects 
    SET 
        stage_id = p_to_stage_id,
        entered_stage_at = CURRENT_TIMESTAMP,
        days_in_stage = 0,
        is_stalled = false,
        stalled_reason = NULL,
        stalled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_project_id;
    
    -- Record transition
    INSERT INTO stage_transitions (
        project_id, from_stage_id, to_stage_id, 
        transitioned_by, duration, notes
    ) VALUES (
        p_project_id, v_from_stage_id, p_to_stage_id,
        p_user_id, v_duration, p_notes
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to flag project as stalled
CREATE OR REPLACE FUNCTION flag_project_stalled(
    p_project_id UUID,
    p_reason TEXT,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pipeline_projects 
    SET 
        is_stalled = true,
        stalled_reason = p_reason,
        stalled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_project_id AND NOT is_stalled;
    
    IF FOUND THEN
        -- Create notification for project manager
        INSERT INTO notifications (user_id, type, title, message, metadata)
        SELECT 
            u.id,
            'project_stalled',
            'Project Flagged as Stalled',
            'Project "' || p.name || '" has been flagged as stalled: ' || p_reason,
            jsonb_build_object('project_id', p_project_id, 'flagged_by', p_user_id)
        FROM pipeline_projects p
        JOIN users u ON u.email = p.pm || '@alpa.com'
        WHERE p.id = p_project_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to unflag stalled project
CREATE OR REPLACE FUNCTION unflag_project_stalled(
    p_project_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pipeline_projects 
    SET 
        is_stalled = false,
        stalled_reason = NULL,
        stalled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_project_id AND is_stalled;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pipeline metrics
CREATE OR REPLACE FUNCTION calculate_pipeline_metrics(
    p_pipeline_type pipeline_type_enum
) RETURNS TABLE (
    total_projects BIGINT,
    total_value DECIMAL,
    average_cycle_time DECIMAL,
    conversion_rate DECIMAL,
    stalled_count BIGINT,
    completed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_projects,
        COALESCE(SUM(p.value), 0) as total_value,
        COALESCE(AVG(p.days_in_stage), 0) as average_cycle_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE p.status = 'completed')::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
        END as conversion_rate,
        COUNT(*) FILTER (WHERE p.is_stalled)::BIGINT as stalled_count,
        COUNT(*) FILTER (WHERE p.status = 'completed')::BIGINT as completed_count
    FROM pipeline_projects p
    WHERE p.pipeline_type = p_pipeline_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get pipeline bottlenecks
CREATE OR REPLACE FUNCTION get_pipeline_bottlenecks(
    p_pipeline_type pipeline_type_enum
) RETURNS TABLE (
    stage_id VARCHAR,
    stage_name VARCHAR,
    project_count BIGINT,
    average_duration DECIMAL,
    expected_duration INTEGER,
    variance_percentage DECIMAL,
    stalled_projects BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as stage_id,
        s.name as stage_name,
        COUNT(p.id)::BIGINT as project_count,
        COALESCE(AVG(p.days_in_stage), 0) as average_duration,
        COALESCE(s.average_duration, 0) as expected_duration,
        CASE 
            WHEN s.average_duration > 0 THEN 
                ((AVG(p.days_in_stage) - s.average_duration) / s.average_duration) * 100
            ELSE 0 
        END as variance_percentage,
        COUNT(p.id) FILTER (WHERE p.is_stalled)::BIGINT as stalled_projects
    FROM pipeline_stages s
    LEFT JOIN pipeline_projects p ON s.id = p.stage_id AND p.status = 'active'
    WHERE s.pipeline_type = p_pipeline_type
    GROUP BY s.id, s.name, s.average_duration, s."order"
    ORDER BY s."order";
END;
$$ LANGUAGE plpgsql;

-- Function to get filtered projects
CREATE OR REPLACE FUNCTION get_filtered_projects(
    p_pipeline_type pipeline_type_enum,
    p_agencies TEXT[] DEFAULT NULL,
    p_set_asides TEXT[] DEFAULT NULL,
    p_pms TEXT[] DEFAULT NULL,
    p_priorities TEXT[] DEFAULT NULL,
    p_show_stalled_only BOOLEAN DEFAULT false,
    p_min_value DECIMAL DEFAULT NULL,
    p_max_value DECIMAL DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS SETOF pipeline_projects AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM pipeline_projects p
    WHERE 
        p.pipeline_type = p_pipeline_type
        AND (p_agencies IS NULL OR p.agency = ANY(p_agencies))
        AND (p_set_asides IS NULL OR p.set_aside::TEXT = ANY(p_set_asides))
        AND (p_pms IS NULL OR p.pm = ANY(p_pms))
        AND (p_priorities IS NULL OR p.priority::TEXT = ANY(p_priorities))
        AND (NOT p_show_stalled_only OR p.is_stalled)
        AND (p_min_value IS NULL OR p.value >= p_min_value)
        AND (p_max_value IS NULL OR p.value <= p_max_value)
        AND (p_search IS NULL OR 
             p.name ILIKE '%' || p_search || '%' OR 
             p.description ILIKE '%' || p_search || '%' OR
             p.agency ILIKE '%' || p_search || '%')
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to export pipeline data
CREATE OR REPLACE FUNCTION export_pipeline_to_json(
    p_pipeline_type pipeline_type_enum
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'pipeline_type', p_pipeline_type,
        'exported_at', CURRENT_TIMESTAMP,
        'projects', (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'stage_id', p.stage_id,
                    'stage_name', s.name,
                    'value', p.value,
                    'agency', p.agency,
                    'pm', p.pm,
                    'priority', p.priority,
                    'is_stalled', p.is_stalled,
                    'days_in_stage', p.days_in_stage,
                    'created_at', p.created_at
                )
            )
            FROM pipeline_projects p
            JOIN pipeline_stages s ON p.stage_id = s.id
            WHERE p.pipeline_type = p_pipeline_type
        ),
        'stages', (
            SELECT json_agg(
                json_build_object(
                    'id', s.id,
                    'name', s.name,
                    'order', s."order",
                    'color', s.color
                )
            )
            FROM pipeline_stages s
            WHERE s.pipeline_type = p_pipeline_type
            ORDER BY s."order"
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check data integrity
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    message TEXT,
    affected_records INTEGER
) AS $$
BEGIN
    -- Check for orphaned projects
    RETURN QUERY
    SELECT 
        'Orphaned Projects'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Projects with invalid stage_id'::TEXT,
        COUNT(*)::INTEGER
    FROM pipeline_projects p
    LEFT JOIN pipeline_stages s ON p.stage_id = s.id
    WHERE s.id IS NULL;
    
    -- Check for projects with mismatched pipeline types
    RETURN QUERY
    SELECT 
        'Pipeline Type Mismatch'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Projects with stage from different pipeline type'::TEXT,
        COUNT(*)::INTEGER
    FROM pipeline_projects p
    JOIN pipeline_stages s ON p.stage_id = s.id
    WHERE p.pipeline_type != s.pipeline_type;
    
    -- Check for negative values
    RETURN QUERY
    SELECT 
        'Negative Project Values'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::TEXT,
        'Projects with negative values'::TEXT,
        COUNT(*)::INTEGER
    FROM pipeline_projects
    WHERE value < 0;
    
    -- Check for stalled projects without reason
    RETURN QUERY
    SELECT 
        'Stalled Without Reason'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::TEXT,
        'Stalled projects missing stalled_reason'::TEXT,
        COUNT(*)::INTEGER
    FROM pipeline_projects
    WHERE is_stalled AND (stalled_reason IS NULL OR stalled_reason = '');
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id::TEXT, TG_OP::audit_action_enum, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id::TEXT, TG_OP::audit_action_enum, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id::TEXT, TG_OP::audit_action_enum, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_pipeline_projects
    AFTER INSERT OR UPDATE OR DELETE ON pipeline_projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stage_transitions
    AFTER INSERT OR UPDATE OR DELETE ON stage_transitions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create updated_at triggers
CREATE TRIGGER update_pipeline_projects_updated_at
    BEFORE UPDATE ON pipeline_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Insert default users
INSERT INTO users (id, email, first_name, last_name, role, department) VALUES
('user0001-0000-0000-0000-000000000001', 'admin@alpa.com', 'System', 'Admin', 'admin', 'IT'),
('user0002-0000-0000-0000-000000000002', 'john.smith@alpa.com', 'John', 'Smith', 'manager', 'Construction'),
('user0003-0000-0000-0000-000000000003', 'sarah.johnson@alpa.com', 'Sarah', 'Johnson', 'manager', 'Preconstruction'),
('user0004-0000-0000-0000-000000000004', 'mike.davis@alpa.com', 'Mike', 'Davis', 'user', 'Business Development'),
('user0005-0000-0000-0000-000000000005', 'lisa.wilson@alpa.com', 'Lisa', 'Wilson', 'user', 'Project Management');

-- Insert pipeline stages
INSERT INTO pipeline_stages (id, name, description, pipeline_type, color, "order", average_duration, next_stages) VALUES
-- Opportunity Pipeline
('opp_lead_gen', 'Lead Generation', 'Initial lead identification and qualification', 'opportunity', '#3B82F6', 1, 7, ARRAY['opp_qualification']),
('opp_qualification', 'Qualification', 'Detailed opportunity assessment', 'opportunity', '#8B5CF6', 2, 14, ARRAY['opp_proposal']),
('opp_proposal', 'Proposal Development', 'Bid preparation and submission', 'opportunity', '#F59E0B', 3, 21, ARRAY['opp_negotiation', 'opp_lost']),
('opp_negotiation', 'Negotiation', 'Contract terms negotiation', 'opportunity', '#10B981', 4, 14, ARRAY['opp_award', 'opp_lost']),
('opp_award', 'Contract Award', 'Contract signed and awarded', 'opportunity', '#059669', 5, 7, ARRAY[]),
('opp_lost', 'Lost/No Bid', 'Opportunity not pursued or lost', 'opportunity', '#EF4444', 6, 0, ARRAY[]),

-- Preconstruction Pipeline  
('pre_design_review', 'Design Review', 'Architectural and engineering review', 'preconstruction', '#3B82F6', 1, 14, ARRAY['pre_estimating']),
('pre_estimating', 'Estimating', 'Detailed cost estimation', 'preconstruction', '#8B5CF6', 2, 21, ARRAY['pre_value_eng']),
('pre_value_eng', 'Value Engineering', 'Cost optimization and alternatives', 'preconstruction', '#F59E0B', 3, 14, ARRAY['pre_gmp_dev']),
('pre_gmp_dev', 'GMP Development', 'Guaranteed Maximum Price development', 'preconstruction', '#10B981', 4, 21, ARRAY['pre_contract_exec']),
('pre_contract_exec', 'Contract Execution', 'Final contract preparation and signing', 'preconstruction', '#059669', 5, 14, ARRAY[]),

-- Execution Pipeline
('exe_mobilization', 'Mobilization', 'Site setup and project kickoff', 'execution', '#3B82F6', 1, 14, ARRAY['exe_foundation']),
('exe_foundation', 'Foundation', 'Foundation and underground work', 'execution', '#8B5CF6', 2, 45, ARRAY['exe_structure']),
('exe_structure', 'Structure', 'Structural construction phase', 'execution', '#F59E0B', 3, 90, ARRAY['exe_mep']),
('exe_mep', 'MEP Installation', 'Mechanical, electrical, plumbing', 'execution', '#10B981', 4, 60, ARRAY['exe_finishes']),
('exe_finishes', 'Finishes', 'Interior and exterior finishes', 'execution', '#059669', 5, 45, ARRAY['exe_commissioning']),
('exe_commissioning', 'Commissioning', 'Systems testing and commissioning', 'execution', '#DC2626', 6, 21, ARRAY[]),

-- Closeout Pipeline
('close_punch_list', 'Punch List', 'Final inspections and corrections', 'closeout', '#3B82F6', 1, 14, ARRAY['close_final_inspect']),
('close_final_inspect', 'Final Inspection', 'Official final inspections', 'closeout', '#8B5CF6', 2, 7, ARRAY['close_handover']),
('close_handover', 'Handover', 'Project handover to client', 'closeout', '#F59E0B', 3, 7, ARRAY['close_warranty']),
('close_warranty', 'Warranty Period', 'Post-completion warranty support', 'closeout', '#10B981', 4, 365, ARRAY['close_complete']),
('close_complete', 'Project Complete', 'Project fully completed', 'closeout', '#059669', 5, 0, ARRAY[]);

-- Insert sample projects
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability, 
    agency, set_aside, pm, priority, entered_stage_at, days_in_stage, tags, created_by
) VALUES
-- Opportunity Projects
('proj0001-0000-0000-0000-000000000001', 'Regional Medical Center Expansion', 'ALPA-2024-001', 'New 150-bed patient tower with emergency department expansion', 'opp_qualification', 'opportunity', 45000000, 75, 'State Health Authority', 'none', 'john.smith', 'high', CURRENT_TIMESTAMP - INTERVAL '12 days', 12, ARRAY['healthcare', 'expansion'], 'user0004-0000-0000-0000-000000000004'),
('proj0002-0000-0000-0000-000000000002', 'Downtown Behavioral Health Facility', 'ALPA-2024-002', '80-bed inpatient behavioral health facility with outpatient services', 'opp_proposal', 'opportunity', 32000000, 60, 'City Health Department', 'minority_owned', 'sarah.johnson', 'critical', CURRENT_TIMESTAMP - INTERVAL '18 days', 18, ARRAY['behavioral_health', 'new_construction'], 'user0004-0000-0000-0000-000000000004'),
('proj0003-0000-0000-0000-000000000003', 'University Hospital Renovation', 'ALPA-2024-003', 'Complete renovation of existing 200-bed hospital', 'opp_negotiation', 'opportunity', 28000000, 85, 'State University System', 'small_business', 'mike.davis', 'medium', CURRENT_TIMESTAMP - INTERVAL '8 days', 8, ARRAY['renovation', 'university'], 'user0004-0000-0000-0000-000000000004'),
('proj0004-0000-0000-0000-000000000004', 'Pediatric Surgery Center', 'ALPA-2024-004', 'Specialized pediatric surgery center with 6 operating rooms', 'opp_lead_gen', 'opportunity', 18000000, 40, 'Children\'s Hospital Network', 'woman_owned', 'lisa.wilson', 'medium', CURRENT_TIMESTAMP - INTERVAL '5 days', 5, ARRAY['pediatric', 'surgery'], 'user0004-0000-0000-0000-000000000004'),
('proj0005-0000-0000-0000-000000000005', 'Rural Health Clinic', 'ALPA-2024-005', 'New rural health clinic serving 3 counties', 'opp_award', 'opportunity', 8500000, 95, 'Rural Health Authority', 'disadvantaged', 'john.smith', 'low', CURRENT_TIMESTAMP - INTERVAL '3 days', 3, ARRAY['rural', 'clinic'], 'user0004-0000-0000-0000-000000000004'),

-- Preconstruction Projects  
('proj0006-0000-0000-0000-000000000006', 'Metro General Hospital ICU', 'ALPA-2024-006', '40-bed ICU expansion with advanced monitoring systems', 'pre_estimating', 'preconstruction', 22000000, NULL, 'Metro Health System', 'none', 'sarah.johnson', 'high', CURRENT_TIMESTAMP - INTERVAL '15 days', 15, ARRAY['icu', 'expansion'], 'user0003-0000-0000-0000-000000000003'),
('proj0007-0000-0000-0000-000000000007', 'Rehabilitation Hospital', 'ALPA-2024-007', 'New 120-bed rehabilitation hospital with therapy facilities', 'pre_design_review', 'preconstruction', 35000000, NULL, 'State Rehabilitation Services', 'veteran_owned', 'mike.davis', 'medium', CURRENT_TIMESTAMP - INTERVAL '10 days', 10, ARRAY['rehabilitation', 'new_construction'], 'user0003-0000-0000-0000-000000000003'),
('proj0008-0000-0000-0000-000000000008', 'Cancer Treatment Center', 'ALPA-2024-008', 'Comprehensive cancer treatment facility with radiation therapy', 'pre_value_eng', 'preconstruction', 42000000, NULL, 'Regional Cancer Institute', 'minority_owned', 'john.smith', 'critical', CURRENT_TIMESTAMP - INTERVAL '20 days', 20, ARRAY['cancer', 'treatment'], 'user0003-0000-0000-0000-000000000003'),

-- Execution Projects
('proj0009-0000-0000-0000-000000000009', 'Community Hospital Modernization', 'ALPA-2024-009', 'Modernization of 180-bed community hospital', 'exe_structure', 'execution', 38000000, NULL, 'Community Health Network', 'small_business', 'lisa.wilson', 'high', CURRENT_TIMESTAMP - INTERVAL '45 days', 45, ARRAY['modernization', 'community'], 'user0002-0000-0000-0000-000000000002'),
('proj0010-0000-0000-0000-000000000010', 'Psychiatric Emergency Services', 'ALPA-2024-010', 'New psychiatric emergency department and crisis center', 'exe_mep', 'execution', 15000000, NULL, 'County Mental Health', 'woman_owned', 'sarah.johnson', 'medium', CURRENT_TIMESTAMP - INTERVAL '30 days', 30, ARRAY['psychiatric', 'emergency'], 'user0002-0000-0000-0000-000000000002'),

-- Closeout Projects
('proj0011-0000-0000-0000-000000000011', 'Cardiac Surgery Pavilion', 'ALPA-2024-011', 'New cardiac surgery pavilion with 8 operating rooms', 'close_punch_list', 'closeout', 52000000, NULL, 'Heart Institute', 'none', 'john.smith', 'high', CURRENT_TIMESTAMP - INTERVAL '8 days', 8, ARRAY['cardiac', 'surgery'], 'user0002-0000-0000-0000-000000000002'),
('proj0012-0000-0000-0000-000000000012', 'Outpatient Surgery Center', 'ALPA-2024-012', 'Multi-specialty outpatient surgery center', 'close_warranty', 'closeout', 25000000, NULL, 'Surgical Associates', 'disadvantaged', 'mike.davis', 'low', CURRENT_TIMESTAMP - INTERVAL '120 days', 120, ARRAY['outpatient', 'surgery'], 'user0002-0000-0000-0000-000000000002');

-- Mark some projects as stalled for testing
UPDATE pipeline_projects 
SET is_stalled = true, 
    stalled_reason = 'Waiting for permit approval', 
    stalled_at = CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE id = 'proj0002-0000-0000-0000-000000000002';

UPDATE pipeline_projects 
SET is_stalled = true, 
    stalled_reason = 'Design changes requested by client', 
    stalled_at = CURRENT_TIMESTAMP - INTERVAL '12 days'
WHERE id = 'proj0008-0000-0000-0000-000000000008';

-- Insert some sample transitions
INSERT INTO stage_transitions (project_id, from_stage_id, to_stage_id, transitioned_by, duration, notes) VALUES
('proj0001-0000-0000-0000-000000000001', 'opp_lead_gen', 'opp_qualification', 'user0004-0000-0000-0000-000000000004', 7, 'Initial qualification meeting completed'),
('proj0003-0000-0000-0000-000000000003', 'opp_proposal', 'opp_negotiation', 'user0004-0000-0000-0000-000000000004', 21, 'Proposal submitted and accepted for negotiation'),
('proj0005-0000-0000-0000-000000000005', 'opp_negotiation', 'opp_award', 'user0004-0000-0000-0000-000000000004', 14, 'Contract successfully negotiated and signed');

-- Insert system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('company_name', 'ALPA Construction', 'Company name for branding', true),
('default_currency', 'USD', 'Default currency for project values', true),
('stalled_threshold_days', '30', 'Days after which projects are considered stalled', false),
('notification_email_enabled', 'true', 'Enable email notifications', false);

-- Update days_in_stage for all projects
SELECT update_days_in_stage();

-- Final verification
SELECT 'Database setup completed successfully!' as status;
SELECT 'Total projects: ' || COUNT(*) as project_count FROM pipeline_projects;
SELECT 'Total stages: ' || COUNT(*) as stage_count FROM pipeline_stages;
SELECT pipeline_type, COUNT(*) as count FROM pipeline_projects GROUP BY pipeline_type;