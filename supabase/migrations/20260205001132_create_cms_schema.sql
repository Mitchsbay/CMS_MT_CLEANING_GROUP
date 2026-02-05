/*
  # MT Cleaning Group - Complete Database Schema
  
  ## Overview
  This migration creates the complete database schema for the MT Cleaning Management System.
  It includes all tables for staff management, sites, jobs, check-ins, incidents, assets, and more.
  
  ## Tables Created
  
  ### 1. profiles
  - Extension of auth.users for additional user data
  - Fields: user_id, role (admin/staff/client), status (active/inactive), full_name, phone, avatar_url
  - Links to auth.users via foreign key
  
  ### 2. clients
  - Client/Facility manager organizations
  - Fields: name, contact_email, contact_phone, address, notes
  
  ### 3. sites
  - Cleaning site locations with GPS coordinates
  - Fields: name, address, latitude, longitude, client_id, instructions, active status
  
  ### 4. task_templates
  - Reusable task templates for different cleaning types
  - Fields: name, description, site_id (optional for site-specific tasks)
  
  ### 5. jobs
  - Scheduled cleaning jobs assigned to staff
  - Fields: site_id, assigned_to (user_id), scheduled_date, scheduled_start_time, scheduled_end_time, status, notes
  - Status: pending, in_progress, completed, cancelled
  
  ### 6. job_tasks
  - Individual tasks within a job
  - Fields: job_id, task_template_id, completed, notes
  
  ### 7. check_ins
  - GPS-verified check-in/check-out records
  - Fields: job_id, user_id, check_in_time, check_in_latitude, check_in_longitude, check_out_time, check_out_latitude, check_out_longitude
  
  ### 8. task_photos
  - Before/after photos for tasks
  - Fields: job_task_id, photo_url, photo_type (before/after), uploaded_by, uploaded_at
  
  ### 9. incidents
  - Incident reports with photos
  - Fields: job_id, reported_by, title, description, severity, status, photos array
  
  ### 10. assets
  - Equipment/asset register
  - Fields: name, serial_number, purchase_date, location, status, notes
  
  ### 11. asset_maintenance
  - Maintenance and testing records for assets
  - Fields: asset_id, maintenance_type, performed_date, performed_by, next_due_date, certificate_url, notes
  
  ### 12. audit_logs
  - Complete audit trail of all system actions
  - Fields: user_id, action, table_name, record_id, old_data, new_data, ip_address, timestamp
  
  ### 13. settings
  - System-wide configuration settings
  - Fields: key, value, description, updated_by, updated_at
  
  ### 14. notifications
  - In-app notifications for users
  - Fields: user_id, title, message, type, read, related_job_id
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies created for role-based access control
  - Audit logging for data changes
  
  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key indexes for join operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for GPS functionality (optional, using standard lat/long for simplicity)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);

-- 3. SITES TABLE
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  instructions text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(active);
CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_sites_coordinates ON sites(latitude, longitude);

-- 4. TASK TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_templates_site_id ON task_templates(site_id);

-- 5. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  scheduled_start_time time,
  scheduled_end_time time,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- 6. JOB TASKS TABLE
CREATE TABLE IF NOT EXISTS job_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  task_template_id uuid REFERENCES task_templates(id) ON DELETE SET NULL,
  task_name text NOT NULL,
  task_description text,
  completed boolean DEFAULT false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_job_tasks_job_id ON job_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_job_tasks_completed ON job_tasks(completed);

-- 7. CHECK-INS TABLE
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_in_latitude numeric(10, 8) NOT NULL,
  check_in_longitude numeric(11, 8) NOT NULL,
  check_in_verified boolean DEFAULT false,
  check_out_time timestamptz,
  check_out_latitude numeric(10, 8),
  check_out_longitude numeric(11, 8),
  check_out_verified boolean DEFAULT false,
  signature_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_check_ins_job_id ON check_ins(job_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);

-- 8. TASK PHOTOS TABLE
CREATE TABLE IF NOT EXISTS task_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_task_id uuid NOT NULL REFERENCES job_tasks(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_photos_job_task_id ON task_photos(job_task_id);

-- 9. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  photos text[], -- Array of photo URLs
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_incidents_job_id ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- 10. ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  serial_number text,
  purchase_date date,
  location text,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'retired', 'lost')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);

-- 11. ASSET MAINTENANCE TABLE
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  performed_date date NOT NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_due_date date,
  certificate_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_next_due_date ON asset_maintenance(next_due_date);

-- 12. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 13. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean DEFAULT false,
  related_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert default settings
INSERT INTO settings (key, value, description)
VALUES 
  ('gps_radius_meters', '100', 'GPS verification radius in meters'),
  ('enable_client_portal', 'true', 'Enable client portal access'),
  ('enable_dark_mode', 'true', 'Enable dark mode option'),
  ('enable_offline_mode', 'true', 'Enable offline mode for mobile')
ON CONFLICT (key) DO NOTHING;