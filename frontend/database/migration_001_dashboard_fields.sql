-- Migration: Add Dashboard Fields to Pipeline Projects
-- Date: 2025-10-27
-- Description: Adds fields for business intelligence dashboard including bid tracking, geographic data, and analytics

BEGIN;

-- Add new columns to pipeline_projects table
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS web_link TEXT;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS solicitation_number VARCHAR(100);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS site_visit_datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS bid_due_datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS rfi_due_datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS naics_code VARCHAR(20);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS period_of_performance VARCHAR(100);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS submitted_amount DECIMAL(15,2);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS awarded_amount DECIMAL(15,2);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS winning_bid_amount DECIMAL(15,2);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS winning_contractor VARCHAR(255);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS loss_reason VARCHAR(100);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS is_joint_venture BOOLEAN DEFAULT false;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS is_presolicitation BOOLEAN DEFAULT false;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS expected_award_date DATE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS award_date DATE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS submission_date DATE;
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS project_city VARCHAR(100);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS project_state VARCHAR(50);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS project_latitude DECIMAL(10,8);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS project_longitude DECIMAL(11,8);
ALTER TABLE pipeline_projects ADD COLUMN IF NOT EXISTS capacity_percentage DECIMAL(5,2);

-- Create annual_targets table
CREATE TABLE IF NOT EXISTS annual_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    target_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert 2026 target
INSERT INTO annual_targets (year, target_amount) 
VALUES (2026, 30000000)
ON CONFLICT (year) DO UPDATE SET target_amount = EXCLUDED.target_amount;

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    projects_lost_to_them INTEGER DEFAULT 0,
    total_value_lost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample competitors
INSERT INTO competitors (name, projects_lost_to_them, total_value_lost) VALUES
('Turner Construction', 0, 0),
('Skanska USA', 0, 0),
('Hensel Phelps', 0, 0),
('McCarthy Building Companies', 0, 0),
('Mortenson Construction', 0, 0)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_bid_due ON pipeline_projects(bid_due_datetime);
CREATE INDEX IF NOT EXISTS idx_projects_submission_date ON pipeline_projects(submission_date);
CREATE INDEX IF NOT EXISTS idx_projects_award_date ON pipeline_projects(award_date);
CREATE INDEX IF NOT EXISTS idx_projects_location ON pipeline_projects(project_state, project_city);
CREATE INDEX IF NOT EXISTS idx_projects_naics ON pipeline_projects(naics_code);
CREATE INDEX IF NOT EXISTS idx_projects_joint_venture ON pipeline_projects(is_joint_venture);
CREATE INDEX IF NOT EXISTS idx_projects_presolicitation ON pipeline_projects(is_presolicitation);

COMMIT;

-- Sample data with realistic ALPA Construction projects
BEGIN;

-- Clear existing opportunity projects
DELETE FROM pipeline_projects WHERE pipeline_type = 'opportunity';

-- Insert "Currently Bidding" projects (urgent, moderate, and plenty of time)
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability,
    agency, set_aside, pm, priority, status, is_stalled, entered_stage_at, days_in_stage,
    tags, created_by, web_link, solicitation_number, site_visit_datetime, bid_due_datetime,
    rfi_due_datetime, naics_code, period_of_performance, project_city, project_state,
    project_latitude, project_longitude, capacity_percentage
) VALUES
-- URGENT: <7 days
(
    'proj-bid-001', 'County Mental Health Crisis Center', 'ALPA-2026-001',
    '50-bed crisis stabilization center with 24/7 emergency services',
    'opp_proposal', 'opportunity', 12500000, 75,
    'County Mental Health Services', 'small_business', 'sarah.johnson', 'critical', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '18 days', 18,
    ARRAY['mental_health', 'crisis_center', 'urgent'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/12345', 'MHS-2026-001',
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '10 hours',
    CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '14 hours',
    CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '12 hours',
    '236220', '24 months',
    'Sacramento', 'California', 38.5816, -121.4944, 41.67
),
(
    'proj-bid-002', 'State Veterans Hospital Renovation', 'ALPA-2026-002',
    'Complete renovation of 200-bed veterans hospital including new surgical wing',
    'opp_proposal', 'opportunity', 28000000, 65,
    'State Veterans Affairs', 'veteran_owned', 'mike.davis', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '25 days', 25,
    ARRAY['veterans', 'hospital', 'renovation'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/23456', 'VA-2026-002',
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '9 hours',
    CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '16 hours',
    CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '10 hours',
    '236220', '36 months',
    'Phoenix', 'Arizona', 33.4484, -112.0740, 93.33
),

-- MODERATE: 7-14 days
(
    'proj-bid-003', 'City Public Health Laboratory', 'ALPA-2026-003',
    'New 25,000 sq ft public health laboratory with BSL-2 and BSL-3 facilities',
    'opp_proposal', 'opportunity', 18500000, 80,
    'City Health Department', 'minority_owned', 'sarah.johnson', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '12 days', 12,
    ARRAY['laboratory', 'public_health', 'bsl'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/34567', 'CHD-2026-003',
    CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '13 hours',
    CURRENT_TIMESTAMP + INTERVAL '10 days' + INTERVAL '15 hours',
    CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '12 hours',
    '236220', '18 months',
    'Seattle', 'Washington', 47.6062, -122.3321, 61.67
),
(
    'proj-bid-004', 'Regional Behavioral Health Campus', 'ALPA-2026-004',
    '120-bed behavioral health campus with outpatient services and residential treatment',
    'opp_proposal', 'opportunity', 35000000, 70,
    'Regional Health Authority', 'woman_owned', 'lisa.wilson', 'critical', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '8 days', 8,
    ARRAY['behavioral_health', 'campus', 'residential'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/45678', 'RHA-2026-004',
    CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '10 hours',
    CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '14 hours',
    CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '10 hours',
    '236220', '30 months',
    'Denver', 'Colorado', 39.7392, -104.9903, 116.67
),

-- PLENTY OF TIME: >14 days
(
    'proj-bid-005', 'University Medical Center Emergency Department', 'ALPA-2026-005',
    'Expansion and modernization of 40-bed emergency department with trauma center',
    'opp_proposal', 'opportunity', 22000000, 85,
    'State University System', 'disadvantaged', 'john.smith', 'medium', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '5 days', 5,
    ARRAY['emergency', 'trauma', 'university'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/56789', 'SUS-2026-005',
    CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '9 hours',
    CURRENT_TIMESTAMP + INTERVAL '21 days' + INTERVAL '16 hours',
    CURRENT_TIMESTAMP + INTERVAL '15 days' + INTERVAL '12 hours',
    '236220', '24 months',
    'Austin', 'Texas', 30.2672, -97.7431, 73.33
),
(
    'proj-bid-006', 'Community Health Center Network', 'ALPA-2026-006',
    'Three new community health centers serving underserved populations',
    'opp_proposal', 'opportunity', 15000000, 90,
    'Federal Health Resources', 'small_business', 'sarah.johnson', 'medium', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '3 days', 3,
    ARRAY['community_health', 'network', 'underserved'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/67890', 'FHR-2026-006',
    CURRENT_TIMESTAMP + INTERVAL '15 days' + INTERVAL '10 hours',
    CURRENT_TIMESTAMP + INTERVAL '28 days' + INTERVAL '14 hours',
    CURRENT_TIMESTAMP + INTERVAL '20 days' + INTERVAL '12 hours',
    '236220', '20 months',
    'Atlanta', 'Georgia', 33.7490, -84.3880, 50.00
),

-- "Bids Submitted" projects
(
    'proj-sub-001', 'State Psychiatric Hospital Modernization', 'ALPA-2026-007',
    'Complete modernization of 150-bed psychiatric hospital with new treatment facilities',
    'opp_negotiation', 'opportunity', 32000000, 75,
    'State Mental Health Department', 'none', 'mike.davis', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '14 days', 14,
    ARRAY['psychiatric', 'modernization', 'treatment'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/78901', 'SMHD-2026-007',
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '14 days',
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    '236220', '28 months',
    'Boston', 'Massachusetts', 42.3601, -71.0589, 106.67
),

-- Add submitted_amount and expected_award_date for submitted projects
UPDATE pipeline_projects SET 
    submitted_amount = 31500000,
    submission_date = CURRENT_TIMESTAMP - INTERVAL '14 days',
    expected_award_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'proj-sub-001';

(
    'proj-sub-002', 'Children's Hospital Oncology Wing', 'ALPA-2026-008',
    'New 60-bed pediatric oncology wing with specialized treatment rooms',
    'opp_negotiation', 'opportunity', 25000000, 80,
    'Children's Hospital Network', 'woman_owned', 'lisa.wilson', 'critical', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '21 days', 21,
    ARRAY['pediatric', 'oncology', 'specialized'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/89012', 'CHN-2026-008',
    CURRENT_TIMESTAMP - INTERVAL '35 days',
    CURRENT_TIMESTAMP - INTERVAL '21 days',
    CURRENT_TIMESTAMP - INTERVAL '28 days',
    '236220', '26 months',
    'Chicago', 'Illinois', 41.8781, -87.6298, 83.33
);

UPDATE pipeline_projects SET 
    submitted_amount = 24200000,
    submission_date = CURRENT_TIMESTAMP - INTERVAL '21 days',
    expected_award_date = CURRENT_DATE + INTERVAL '21 days'
WHERE id = 'proj-sub-002';

(
    'proj-sub-003', 'Rural Health Clinic Expansion', 'ALPA-2026-009',
    'Expansion of rural health clinic to serve 5 counties with telehealth capabilities',
    'opp_negotiation', 'opportunity', 9500000, 85,
    'Rural Health Authority', 'disadvantaged', 'john.smith', 'medium', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '7 days', 7,
    ARRAY['rural', 'telehealth', 'expansion'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/90123', 'RHA-2026-009',
    CURRENT_TIMESTAMP - INTERVAL '18 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP - INTERVAL '12 days',
    '236220', '16 months',
    'Billings', 'Montana', 45.7833, -108.5007, 31.67
);

UPDATE pipeline_projects SET 
    submitted_amount = 9200000,
    submission_date = CURRENT_TIMESTAMP - INTERVAL '7 days',
    expected_award_date = CURRENT_DATE + INTERVAL '45 days'
WHERE id = 'proj-sub-003';

-- "Projects Awarded" projects
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability,
    agency, set_aside, pm, priority, status, is_stalled, entered_stage_at, days_in_stage,
    tags, created_by, web_link, solicitation_number, naics_code, period_of_performance,
    project_city, project_state, project_latitude, project_longitude, capacity_percentage,
    awarded_amount, award_date, start_date, completion_date, contract_type, submitted_amount
) VALUES
(
    'proj-awd-001', 'Metro General Hospital ICU Expansion', 'ALPA-2026-010',
    '40-bed ICU expansion with advanced monitoring and life support systems',
    'opp_award', 'opportunity', 22000000, 100,
    'Metro Health System', 'none', 'sarah.johnson', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '10 days', 10,
    ARRAY['icu', 'expansion', 'monitoring'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/01234', 'MHS-2026-010',
    '236220', '22 months',
    'Portland', 'Oregon', 45.5152, -122.6784, 73.33,
    21800000, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '22 months', 'GMP', 21500000
),
(
    'proj-awd-002', 'State Rehabilitation Hospital', 'ALPA-2026-011',
    'New 120-bed rehabilitation hospital with therapy facilities and aquatic center',
    'opp_award', 'opportunity', 35000000, 100,
    'State Rehabilitation Services', 'veteran_owned', 'mike.davis', 'medium', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '5 days', 5,
    ARRAY['rehabilitation', 'therapy', 'aquatic'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/12340', 'SRS-2026-011',
    '236220', '30 months',
    'Minneapolis', 'Minnesota', 44.9778, -93.2650, 116.67,
    34500000, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 months', 'Fixed Price', 34200000
);

-- "Projects Lost" projects
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability,
    agency, set_aside, pm, priority, status, is_stalled, entered_stage_at, days_in_stage,
    tags, created_by, web_link, solicitation_number, naics_code, period_of_performance,
    project_city, project_state, project_latitude, project_longitude,
    submitted_amount, winning_bid_amount, winning_contractor, loss_reason, lessons_learned
) VALUES
(
    'proj-lost-001', 'City Emergency Operations Center', 'ALPA-2026-012',
    'New emergency operations center with command and control systems',
    'opp_lost', 'opportunity', 18000000, 0,
    'City Emergency Management', 'small_business', 'john.smith', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '15 days', 15,
    ARRAY['emergency', 'operations', 'command'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/23401', 'CEM-2026-012',
    '236220', '18 months',
    'Miami', 'Florida', 25.7617, -80.1918,
    17500000, 16800000, 'Turner Construction', 'Price',
    'We were $700K higher. Need to improve cost estimation for specialized command centers.'
),
(
    'proj-lost-002', 'County Correctional Health Facility', 'ALPA-2026-013',
    'New 80-bed correctional health facility with mental health services',
    'opp_lost', 'opportunity', 24000000, 0,
    'County Sheriff Department', 'minority_owned', 'lisa.wilson', 'medium', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '20 days', 20,
    ARRAY['correctional', 'mental_health', 'security'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/34012', 'CSD-2026-013',
    '236220', '24 months',
    'Las Vegas', 'Nevada', 36.1699, -115.1398,
    23200000, 22500000, 'Skanska USA', 'Experience',
    'Competitor had more correctional healthcare experience. Need to build portfolio in this sector.'
);

-- "Pre-Solicitation" projects
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability,
    agency, set_aside, pm, priority, status, is_stalled, entered_stage_at, days_in_stage,
    tags, created_by, web_link, naics_code, period_of_performance,
    project_city, project_state, project_latitude, project_longitude, is_presolicitation
) VALUES
(
    'proj-pre-001', 'State Cancer Research Institute', 'ALPA-2026-014',
    'New 100,000 sq ft cancer research institute with advanced laboratories',
    'opp_lead_gen', 'opportunity', 45000000, 60,
    'State University Research', 'none', 'sarah.johnson', 'high', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '5 days', 5,
    ARRAY['research', 'cancer', 'laboratory'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/45123', '236220', '36 months',
    'San Diego', 'California', 32.7157, -117.1611, true
);

-- "Joint Venture" projects
INSERT INTO pipeline_projects (
    id, name, project_number, description, stage_id, pipeline_type, value, win_probability,
    agency, set_aside, pm, priority, status, is_stalled, entered_stage_at, days_in_stage,
    tags, created_by, web_link, solicitation_number, bid_due_datetime, naics_code,
    period_of_performance, project_city, project_state, project_latitude, project_longitude,
    is_joint_venture, capacity_percentage
) VALUES
(
    'proj-jv-001', 'Federal Medical Center Complex', 'ALPA-2026-015',
    'Large federal medical center with hospital, clinics, and research facilities',
    'opp_proposal', 'opportunity', 85000000, 70,
    'Federal Health Administration', 'veteran_owned', 'mike.davis', 'critical', 'active', false,
    CURRENT_TIMESTAMP - INTERVAL '12 days', 12,
    ARRAY['federal', 'medical_center', 'complex'],
    'user0001-0000-0000-0000-000000000001',
    'https://sam.gov/opp/56234', 'FHA-2026-015',
    CURRENT_TIMESTAMP + INTERVAL '18 days' + INTERVAL '14 hours',
    '236220', '48 months',
    'Washington', 'District of Columbia', 38.9072, -77.0369, true, 283.33
);

COMMIT;