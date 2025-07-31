-- Life House Database Migration - July 30, 2025
-- Schema updates for roles, attendance, settings, and geolocation

-- Add new user roles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('Resident', 'CaseManager', 'Intake', 'Admin', 'Referrer', 'Auditor');
  END IF;
END$$;

-- Update users table to include avatar and enhanced fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);

-- Create attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  program_name VARCHAR(100) NOT NULL,
  attendance_date DATE NOT NULL,
  verified_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add lat/long columns to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id TEXT NOT NULL REFERENCES users(id),
  program_id TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
  staff_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  resident_id TEXT REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('check_in', 'appointment', 'meeting', 'goal_review', 'assessment', 'other')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create super admin table
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed super admin emails
INSERT INTO super_admins (email) VALUES 
('julius@lifehouse.org'),
('brittney@lifehouse.org'), 
('kairia@lifehouse.org')
ON CONFLICT (email) DO NOTHING;

-- Seed default properties with coordinates (Sacramento area)
INSERT INTO properties (name, address, city, state, zip_code, latitude, longitude, capacity, status) VALUES
('Main House', '8399 Folsom Blvd', 'Sacramento', 'CA', '95826', 38.5816, -121.4944, 12, 'Active'),
('Transitional Unit A', '123 Example St', 'Sacramento', 'CA', '95825', 38.5900, -121.5000, 8, 'Active'),
('Transitional Unit B', '456 Sample Ave', 'Sacramento', 'CA', '95824', 38.5700, -121.4800, 6, 'Active')
ON CONFLICT (address, city) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('smtp_host', 'smtp.gmail.com', 'SMTP server host'),
('smtp_port', '587', 'SMTP server port'),
('email_notifications', 'true', 'Enable email notifications'),
('maintenance_mode', 'false', 'System maintenance mode'),
('max_file_size', '10485760', 'Maximum file upload size in bytes')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

CREATE TYPE resource_category AS ENUM ('food', 'shelter', 'health', 'legal', 'education', 'employment', 'other');
CREATE TYPE resource_status AS ENUM ('active', 'inactive', 'pending');

CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "resource_category" NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"eligibility" text,
	"benefit_amount" numeric,
	"geo" jsonb,
	"url" varchar,
	"contact" jsonb,
	"address" text,
	"phone" varchar,
	"website" varchar,
	"hours" jsonb,
	"languages" jsonb,
	"status" "resource_status" DEFAULT 'active',
	"tags" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add hours column if it doesn't exist (for existing databases)
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "hours" jsonb;

-- Create reports table for storing generated reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  parameters JSONB,
  file_path VARCHAR(500),
  file_size INTEGER,
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  frequency VARCHAR(50),
  template_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default report templates
INSERT INTO report_templates (type, name, description, category, frequency, template_config) VALUES
('stop-touchpoint', 'STOP TouchPoint Report', 'Monthly compliance report tracking resident interactions and services', 'compliance', 'Monthly', '{"fields": ["resident_id", "touchpoint_date", "interaction_type", "case_manager", "notes"], "groupBy": "month"}'),
('resident-progress', 'Resident Progress Report', 'Individual and aggregate progress tracking across all stages', 'outcomes', 'Quarterly', '{"fields": ["resident_id", "stage", "progress_percentage", "goals_completed", "savings"], "groupBy": "stage"}'),
('housing-occupancy', 'Housing Occupancy Report', 'Property utilization, vacancy rates, and bed availability', 'operations', 'Weekly', '{"fields": ["property_id", "capacity", "occupied", "vacancy_rate", "waitlist"], "groupBy": "property"}'),
('attendance-compliance', 'Attendance Compliance Report', 'Program attendance rates and compliance tracking', 'compliance', 'Monthly', '{"fields": ["resident_id", "program_id", "attendance_rate", "sessions_attended", "sessions_total"], "groupBy": "program"}'),
('financial-summary', 'Financial Summary Report', 'Donation tracking, resident fees, and financial overview', 'financial', 'Monthly', '{"fields": ["donation_total", "fees_collected", "expenses", "savings_total"], "groupBy": "month"}')
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);

-- Fix any missing foreign key constraints
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS savings_amount DECIMAL(10,2) DEFAULT 0.00;