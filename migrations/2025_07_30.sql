
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

-- Add geolocation to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

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
