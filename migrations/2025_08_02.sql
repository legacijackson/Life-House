-- Add Client role to role enum
ALTER TYPE role ADD VALUE IF NOT EXISTS 'Client';

-- Add program_status enum
DO $$ BEGIN
  CREATE TYPE program_status AS ENUM (
    'inquiry','applicant','active_client','active_resident',
    'discharged','inactive','waitlist'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add housing_status enum
DO $$ BEGIN
  CREATE TYPE housing_status AS ENUM (
    'not_needed','requested','pending_assignment','assigned','exited'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add new fields to client_profiles
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS program_status program_status DEFAULT 'active_client',
  ADD COLUMN IF NOT EXISTS housing_status housing_status DEFAULT 'not_needed',
  ADD COLUMN IF NOT EXISTS housing_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS housing_assigned_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS converted_to_resident_at TIMESTAMP;

-- Create housing_waitlist table
CREATE TABLE IF NOT EXISTS housing_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR NOT NULL REFERENCES users(id),
  request_date TIMESTAMP DEFAULT now(),
  priority_level TEXT DEFAULT 'standard',
  housing_need_reason TEXT,
  preferred_location TEXT,
  accommodation_needs TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS housing_waitlist_participant_idx ON housing_waitlist(participant_id);
CREATE INDEX IF NOT EXISTS housing_waitlist_status_idx ON housing_waitlist(status);

-- Housing checklist type enum
DO $$ BEGIN
  CREATE TYPE housing_checklist_type AS ENUM ('move_in', 'move_out', 'room_inspection');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Housing checklists table
CREATE TABLE IF NOT EXISTS housing_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL REFERENCES users(id),
  type housing_checklist_type NOT NULL,
  property_id VARCHAR,
  room_assignment VARCHAR,
  completed_at TIMESTAMP,
  completed_by VARCHAR REFERENCES users(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS housing_checklists_client_idx ON housing_checklists(client_id);
CREATE INDEX IF NOT EXISTS housing_checklists_type_idx ON housing_checklists(type);

-- House rules table
CREATE TABLE IF NOT EXISTS house_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_rules_property_idx ON house_rules(property_id);
CREATE INDEX IF NOT EXISTS house_rules_active_idx ON house_rules(is_active);

-- Housing notices table
CREATE TABLE IF NOT EXISTS housing_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR,
  room_assignment VARCHAR,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR DEFAULT 'normal',
  expires_at TIMESTAMP,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS housing_notices_property_idx ON housing_notices(property_id);
CREATE INDEX IF NOT EXISTS housing_notices_expires_idx ON housing_notices(expires_at);

-- Admin users: seed only if not exist
INSERT INTO users (id, role, name, email, first_name, last_name, password_hash, is_admin, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'CaseManager', 'Julius', 'julius@lifehousereentry.com', 'Julius', '', '$2a$10$placeholder_julius', true, now(), now()),
  (gen_random_uuid(), 'CaseManager', 'Kai', 'kai@lifehousereentry.com', 'Kai', '', '$2a$10$placeholder_kai', true, now(), now()),
  (gen_random_uuid(), 'CaseManager', 'Brittney', 'brittney@lifehousereentry.com', 'Brittney', '', '$2a$10$placeholder_brittney', true, now(), now())
ON CONFLICT (email) DO NOTHING;
