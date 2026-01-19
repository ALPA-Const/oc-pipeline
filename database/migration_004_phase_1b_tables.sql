-- Migration 004: Phase 1B Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  package_number VARCHAR(50),
  description TEXT,
  scope TEXT,
  status VARCHAR(50) DEFAULT 'Draft',
  package_type VARCHAR(50),
  estimated_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL,
  project_id UUID NOT NULL,
  estimate_number VARCHAR(50),
  estimate_version INT DEFAULT 1,
  description TEXT,
  labor_cost DECIMAL(15, 2),
  material_cost DECIMAL(15, 2),
  equipment_cost DECIMAL(15, 2),
  subcontractor_cost DECIMAL(15, 2),
  general_conditions DECIMAL(15, 2),
  overhead DECIMAL(15, 2),
  profit_margin DECIMAL(5, 2),
  total_cost DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'Draft',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  package_id UUID,
  estimate_id UUID,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),
  file_path VARCHAR(500),
  file_size INT,
  file_url VARCHAR(500),
  description TEXT,
  uploaded_by UUID,
  version INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  package_id UUID,
  activity_name VARCHAR(255) NOT NULL,
  activity_number VARCHAR(50),
  description TEXT,
  activity_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Not Started',
  priority VARCHAR(50) DEFAULT 'Medium',
  assigned_to UUID,
  start_date DATE,
  end_date DATE,
  due_date DATE,
  completion_percentage INT DEFAULT 0,
  estimated_hours DECIMAL(8, 2),
  actual_hours DECIMAL(8, 2),
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  package_id UUID,
  activity_id UUID,
  comment_text TEXT NOT NULL,
  commented_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  file_size INT,
  uploaded_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packages_project_id ON packages(project_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_estimates_package_id ON estimates(package_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_comments_project_id ON comments(project_id);
