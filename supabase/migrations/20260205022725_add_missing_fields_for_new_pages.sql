/*
  # Add Missing Fields for New Pages

  ## Overview
  This migration adds missing fields and a standalone tasks table to support
  the new management pages.

  ## Changes Made

  ### 1. Add site_id to incidents table
  - Allows tracking which site an incident occurred at
  - Optional field (can be null for non-site incidents)

  ### 2. Add site_id, asset_type, and description to assets table
  - `site_id`: Links assets to specific sites
  - `asset_type`: Categorizes assets (e.g., "Vacuum Cleaner", "Floor Polisher")
  - `description`: Additional details about the asset

  ### 3. Update assets status enum
  - Add 'available' and 'in_use' statuses
  - Keep existing statuses for backward compatibility

  ### 4. Update incidents status enum
  - Add 'investigating' status
  - Keep existing statuses for backward compatibility

  ### 5. Create standalone tasks table
  - General-purpose tasks that may or may not be tied to jobs
  - Fields: title, description, status, assigned_to, job_id (optional)

  ### 6. Update jobs table
  - Add title field for better job identification

  ## Security
  - RLS remains enabled on all tables
  - New fields are nullable to maintain backward compatibility
*/

-- Add site_id to incidents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'site_id'
  ) THEN
    ALTER TABLE incidents ADD COLUMN site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_incidents_site_id ON incidents(site_id);
  END IF;
END $$;

-- Add fields to assets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'site_id'
  ) THEN
    ALTER TABLE assets ADD COLUMN site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_assets_site_id ON assets(site_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'asset_type'
  ) THEN
    ALTER TABLE assets ADD COLUMN asset_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'description'
  ) THEN
    ALTER TABLE assets ADD COLUMN description text;
  END IF;
END $$;

-- Update assets status constraint to include new values
DO $$
BEGIN
  ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;
  ALTER TABLE assets ADD CONSTRAINT assets_status_check 
    CHECK (status IN ('operational', 'maintenance', 'retired', 'lost', 'available', 'in_use'));
END $$;

-- Update incidents status constraint to include new values
DO $$
BEGIN
  ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check;
  ALTER TABLE incidents ADD CONSTRAINT incidents_status_check 
    CHECK (status IN ('open', 'in_progress', 'investigating', 'resolved', 'closed'));
END $$;

-- Create standalone tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Add title to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'title'
  ) THEN
    ALTER TABLE jobs ADD COLUMN title text;
  END IF;
END $$;
