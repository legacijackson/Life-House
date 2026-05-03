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

-- Admin users: seed only if not exist
INSERT INTO users (id, role, name, email, first_name, last_name, password_hash, is_admin, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'CaseManager', 'Julius', 'julius@lifehousereentry.com', 'Julius', '', '$2a$10$placeholder_julius', true, now(), now()),
  (gen_random_uuid(), 'CaseManager', 'Kai', 'kai@lifehousereentry.com', 'Kai', '', '$2a$10$placeholder_kai', true, now(), now()),
  (gen_random_uuid(), 'CaseManager', 'Brittney', 'brittney@lifehousereentry.com', 'Brittney', '', '$2a$10$placeholder_brittney', true, now(), now())
ON CONFLICT (email) DO NOTHING;
