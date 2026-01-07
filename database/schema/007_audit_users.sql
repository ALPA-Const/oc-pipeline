-- ============================================================
-- SECTION 7: AUDIT, ACTIVITY & USER TABLES
-- ============================================================

-- Activity Log (all user actions)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID,
    user_email VARCHAR(200),
    
    -- Action
    action VARCHAR(100) NOT NULL,            -- create, update, delete, view, import, export
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    
    -- Details
    description TEXT,
    changes JSONB,                           -- {field: {old: x, new: y}}
    
    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Display preferences
    default_pipeline_view VARCHAR(20) DEFAULT 'kanban',  -- kanban, table, list
    default_opportunity_sort VARCHAR(50) DEFAULT 'posted_date_desc',
    items_per_page INT DEFAULT 25,
    
    -- Notification preferences
    email_alerts BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(20) DEFAULT 'daily',
    
    -- Dashboard preferences
    dashboard_widgets JSONB,
    
    -- Feature flags
    features JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Watchlist (opportunities being watched but not pursued)
CREATE TABLE user_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, opportunity_id)
);

-- Tags (user-defined)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    
    -- Scope
    user_id UUID,                            -- NULL = org-wide
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name, user_id)
);

-- Entity Tags (polymorphic)
CREATE TABLE entity_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(tag_id, entity_type, entity_id)
);

-- Comments (on any entity)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What it's on
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Threading
    parent_comment_id UUID REFERENCES comments(id),
    
    -- Author
    user_id UUID NOT NULL,
    
    -- Edit tracking
    edited_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);

-- ============================================================
-- SECTION 8: VIEWS FOR COMMON QUERIES
-- ============================================================

-- Opportunity detail view with agency info
CREATE VIEW v_opportunity_details AS
SELECT 
    o.*,
    a.name as agency_name,
    a.abbreviation as agency_abbrev,
    sa.name as sub_agency_name,
    ps.name as pursuit_stage,
    ps.key as pursuit_stage_key,
    p.id as pursuit_id,
    p.win_probability,
    p.priority as pursuit_priority
FROM opportunities o
LEFT JOIN agencies a ON o.agency_id = a.id
LEFT JOIN agencies sa ON o.sub_agency_id = sa.id
LEFT JOIN pursuits p ON p.opportunity_id = o.id AND p.is_archived = FALSE
LEFT JOIN pipeline_stages ps ON p.stage_id = ps.id;

-- Pursuit pipeline view
CREATE VIEW v_pursuit_pipeline AS
SELECT 
    p.*,
    o.title as opportunity_title,
    o.solicitation_number,
    o.naics_code,
    o.set_aside_type,
    o.response_deadline as opportunity_deadline,
    o.estimated_value_low,
    o.estimated_value_high,
    a.name as agency_name,
    ps.name as stage_name,
    ps.key as stage_key,
    ps.color as stage_color,
    ps.sequence as stage_sequence
FROM pursuits p
LEFT JOIN opportunities o ON p.opportunity_id = o.id
LEFT JOIN agencies a ON o.agency_id = a.id
JOIN pipeline_stages ps ON p.stage_id = ps.id
WHERE p.is_archived = FALSE;
