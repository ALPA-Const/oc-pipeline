-- ============================================================
-- SECTION 6: SEARCH, ALERTS & AI INTELLIGENCE TABLES
-- ============================================================

-- Saved Searches
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Owner
    user_id UUID NOT NULL,
    
    -- Search definition
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Query parameters (stored as JSONB for flexibility)
    filters JSONB NOT NULL,
    /* Example filters:
    {
        "keywords": ["construction", "renovation"],
        "naics_codes": ["236220", "237310"],
        "set_asides": ["SDVOSB", "8(a)"],
        "agencies": ["uuid1", "uuid2"],
        "states": ["IL", "CA"],
        "value_min": 100000,
        "value_max": 5000000,
        "posted_after": "2024-01-01",
        "deadline_after": "2024-06-01"
    }
    */
    
    -- Alert settings
    alert_enabled BOOLEAN DEFAULT FALSE,
    alert_frequency VARCHAR(20) DEFAULT 'daily',  -- immediate, daily, weekly
    last_alert_sent_at TIMESTAMPTZ,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search Alerts (notifications for new matches)
CREATE TABLE search_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
    
    -- Matching opportunities
    opportunity_ids UUID[] NOT NULL,
    opportunity_count INT NOT NULL,
    
    -- Delivery
    sent_at TIMESTAMPTZ,
    delivery_method VARCHAR(20) DEFAULT 'email',
    delivery_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis Results
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What was analyzed
    entity_type VARCHAR(50) NOT NULL,        -- opportunity, pursuit, document
    entity_id UUID NOT NULL,
    
    -- Analysis type
    analysis_type VARCHAR(100) NOT NULL,     -- risk_assessment, win_probability, incumbent_match, etc.
    
    -- Results
    result JSONB NOT NULL,
    /* Example result for risk_assessment:
    {
        "overall_score": 72,
        "risk_factors": [
            {"factor": "tight_deadline", "severity": "high", "description": "..."},
            {"factor": "incumbent_advantage", "severity": "medium", "description": "..."}
        ],
        "recommendations": ["..."]
    }
    */
    
    -- Confidence & transparency
    confidence_score DECIMAL(3,2),
    explanation TEXT,                        -- Human-readable explanation
    
    -- Model info (for auditability)
    model_used VARCHAR(100),
    model_version VARCHAR(50),
    
    -- Human review
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source analysis
    analysis_id UUID REFERENCES ai_analyses(id) ON DELETE CASCADE,
    
    -- Or direct link
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Recommendation
    recommendation_type VARCHAR(100),        -- pursue, avoid, investigate, team_with
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium',
    urgency VARCHAR(20),                     -- immediate, soon, whenever
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',    -- pending, accepted, rejected, completed
    actioned_by UUID,
    actioned_at TIMESTAMPTZ,
    action_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_ai_analyses_entity ON ai_analyses(entity_type, entity_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_ai_recommendations_entity ON ai_recommendations(entity_type, entity_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
