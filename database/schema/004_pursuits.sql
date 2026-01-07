-- ============================================================
-- SECTION 4: PURSUIT PIPELINE TABLES
-- ============================================================

-- Pipeline Stage Configuration (config-driven)
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Ordering
    sequence INT NOT NULL,
    
    -- Stage type
    stage_type VARCHAR(50),                  -- discovery, capture, bid, award, execution
    
    -- Visual
    color VARCHAR(20) DEFAULT '#6B7280',
    icon VARCHAR(50),
    
    -- Behavior
    is_terminal BOOLEAN DEFAULT FALSE,       -- Won, Lost, No-Bid
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Active
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default pipeline stages
INSERT INTO pipeline_stages (name, key, sequence, stage_type, color, is_terminal) VALUES
('Identified', 'identified', 1, 'discovery', '#94A3B8', FALSE),
('Tracking', 'tracking', 2, 'discovery', '#60A5FA', FALSE),
('Capture', 'capture', 3, 'capture', '#A78BFA', FALSE),
('Proposal', 'proposal', 4, 'bid', '#F59E0B', FALSE),
('Submitted', 'submitted', 5, 'bid', '#10B981', FALSE),
('Won', 'won', 6, 'award', '#22C55E', TRUE),
('Lost', 'lost', 7, 'award', '#EF4444', TRUE),
('No-Bid', 'no_bid', 8, 'discovery', '#6B7280', TRUE),
('Not Interested', 'not_interested', 9, 'discovery', '#374151', TRUE);

-- Pursuits (opportunities being actively pursued)
CREATE TABLE pursuits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Linkage
    opportunity_id UUID REFERENCES opportunities(id),
    
    -- Can also be manual entry (no linked opportunity)
    manual_entry BOOLEAN DEFAULT FALSE,
    
    -- Override fields (if different from opportunity)
    title TEXT,
    description TEXT,
    estimated_value DECIMAL(15,2),
    response_deadline TIMESTAMPTZ,
    
    -- Pipeline state
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Win probability (AI-assisted or manual)
    win_probability INT CHECK (win_probability >= 0 AND win_probability <= 100),
    probability_source VARCHAR(20) DEFAULT 'manual',  -- manual, ai_calculated
    probability_confidence VARCHAR(20),               -- high, medium, low
    
    -- Ownership
    owner_id UUID,                           -- Primary owner
    capture_manager_id UUID,
    proposal_manager_id UUID,
    
    -- Decision
    go_no_go_decision VARCHAR(20),           -- pending, go, no_go, conditional
    go_no_go_date TIMESTAMPTZ,
    go_no_go_notes TEXT,
    
    -- Bid details
    bid_amount DECIMAL(15,2),
    bid_submitted_at TIMESTAMPTZ,
    
    -- Outcome
    outcome VARCHAR(20),                     -- won, lost, cancelled, withdrawn
    outcome_date TIMESTAMPTZ,
    outcome_notes TEXT,
    award_amount DECIMAL(15,2),
    
    -- Flags
    priority VARCHAR(20) DEFAULT 'medium',   -- low, medium, high, critical
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Pursuit Stage History (audit trail)
CREATE TABLE pursuit_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    
    from_stage_id UUID REFERENCES pipeline_stages(id),
    to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    
    changed_by UUID,
    change_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pursuit Tasks
CREATE TABLE pursuit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- Assignment
    assigned_to UUID,
    
    -- Dates
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',    -- pending, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Ordering
    sequence INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Pursuit Team Members
CREATE TABLE pursuit_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    role VARCHAR(100),                       -- Capture Manager, Proposal Lead, SME, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(pursuit_id, user_id)
);

-- Indexes
CREATE INDEX idx_pursuits_opportunity ON pursuits(opportunity_id);
CREATE INDEX idx_pursuits_stage ON pursuits(stage_id);
CREATE INDEX idx_pursuits_owner ON pursuits(owner_id);
CREATE INDEX idx_pursuits_priority ON pursuits(priority);
CREATE INDEX idx_pursuits_archived ON pursuits(is_archived);
CREATE INDEX idx_pursuit_tasks_pursuit ON pursuit_tasks(pursuit_id);
CREATE INDEX idx_pursuit_tasks_assigned ON pursuit_tasks(assigned_to);
