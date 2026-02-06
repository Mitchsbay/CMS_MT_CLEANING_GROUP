/*
  MT Cleaning Group - Authoritative Database Schema
  This file is the SINGLE SOURCE OF TRUTH for the database schema.
  Run this in the Supabase SQL Editor to set up the entire database.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES TABLE (Extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'client')) DEFAULT 'client',
  status text NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Added user_id for better RLS
  name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  contact_phone text,
  address text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SITES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  instructions text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- JOBS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  scheduled_date date NOT NULL,
  scheduled_start_time time,
  scheduled_end_time time,
  status text NOT NULL CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TASKS TABLE (Standalone tasks)
-- =============================================================================
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

-- =============================================================================
-- CHECK_INS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_in_lat numeric(10, 8),
  check_in_lng numeric(11, 8),
  check_out_time timestamptz,
  check_out_lat numeric(10, 8),
  check_out_lng numeric(11, 8),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- INCIDENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  photos text[],
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ASSETS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  serial_number text,
  asset_type text,
  description text,
  purchase_date date,
  location text,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'retired', 'lost', 'available', 'in_use')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- JOB_PHOTOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
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

-- =============================================================================
-- SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(active);
CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_check_ins_job_id ON check_ins(job_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_job_id ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_incidents_site_id ON incidents(site_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_site_id ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if current user is an active admin (server-authoritative)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.status = 'active'
  );
$$;


-- Function to check if current user is active
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
  );
$$;

-- Function to check if current user is an active staff member
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'staff'
      AND p.status = 'active'
  );
$$;

-- Function to check if current user is an active client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'
      AND p.status = 'active'
  );
$$;

-- Function to handle new user signup - SINGLE SOURCE OF TRUTH
-- IMPORTANT: Do NOT trust user-provided metadata for authorization (no role/status from metadata).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status, full_name, phone)
  VALUES (
    new.id,
    'client',
    'active',
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  RETURN new;
END;
$$;


-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- NOTE: We DROP + recreate key policies so this file can be re-run safely.

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.is_active())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Column-level privileges to prevent role/status escalation from the client
REVOKE INSERT ON public.profiles FROM anon, authenticated;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

-- CLIENTS
DROP POLICY IF EXISTS "Admins can manage all clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own record" ON clients;

CREATE POLICY "Admins can manage all clients" ON clients
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Clients can view own record" ON clients
  FOR SELECT TO authenticated
  USING (
    public.is_client()
    AND (
      user_id = auth.uid()
      OR lower(contact_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- SITES
DROP POLICY IF EXISTS "Admins can manage all sites" ON sites;
DROP POLICY IF EXISTS "Staff can view sites for assigned jobs" ON sites;

CREATE POLICY "Admins can manage all sites" ON sites
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can view sites for assigned jobs" ON sites
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    AND id IN (SELECT site_id FROM jobs WHERE assigned_to = auth.uid())
  );

CREATE POLICY "Clients can view their sites" ON sites
  FOR SELECT TO authenticated
  USING (
    public.is_client()
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = sites.client_id
        AND (
          c.user_id = auth.uid()
          OR lower(c.contact_email) = lower(auth.jwt() ->> 'email')
        )
    )
  );

-- JOBS
DROP POLICY IF EXISTS "Admins can manage all jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can view assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can update assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Clients can view jobs at their sites" ON jobs;

CREATE POLICY "Admins can manage all jobs" ON jobs
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can view assigned jobs" ON jobs
  FOR SELECT TO authenticated
  USING (public.is_staff() AND assigned_to = auth.uid());

CREATE POLICY "Staff can update assigned jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (public.is_staff() AND assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Clients can view jobs at their sites" ON jobs
  FOR SELECT TO authenticated
  USING (
    public.is_client()
    AND EXISTS (
      SELECT 1
      FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE s.id = jobs.site_id
        AND (
          c.user_id = auth.uid()
          OR lower(c.contact_email) = lower(auth.jwt() ->> 'email')
        )
    )
  );

-- TASKS
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can update assigned tasks" ON tasks;

CREATE POLICY "Admins can manage all tasks" ON tasks
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can view assigned tasks" ON tasks
  FOR SELECT TO authenticated
  USING (public.is_staff() AND assigned_to = auth.uid());

CREATE POLICY "Staff can update assigned tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (public.is_staff() AND assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- CHECK_INS
DROP POLICY IF EXISTS "Admins can manage all check_ins" ON check_ins;
DROP POLICY IF EXISTS "Staff can manage own check_ins" ON check_ins;

CREATE POLICY "Admins can manage all check_ins" ON check_ins
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can manage own check_ins" ON check_ins
  FOR ALL TO authenticated
  USING (public.is_staff() AND user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can view check_ins for their jobs" ON check_ins
  FOR SELECT TO authenticated
  USING (
    public.is_client()
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.sites s ON j.site_id = s.id
      JOIN public.clients c ON s.client_id = c.id
      WHERE j.id = check_ins.job_id
        AND (
          c.user_id = auth.uid()
          OR lower(c.contact_email) = lower(auth.jwt() ->> 'email')
        )
    )
  );

-- INCIDENTS
DROP POLICY IF EXISTS "Admins can manage all incidents" ON incidents;
DROP POLICY IF EXISTS "Staff can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Staff can report incidents" ON incidents;

CREATE POLICY "Admins can manage all incidents" ON incidents
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can view all incidents" ON incidents
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.is_admin());

CREATE POLICY "Staff can report incidents" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND reported_by = auth.uid());

-- ASSETS
DROP POLICY IF EXISTS "Admins can manage all assets" ON assets;
DROP POLICY IF EXISTS "Staff can view assets" ON assets;

CREATE POLICY "Admins can manage all assets" ON assets
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can view assets" ON assets
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.is_admin());

-- JOB_PHOTOS
DROP POLICY IF EXISTS "Admins can manage all job_photos" ON job_photos;
DROP POLICY IF EXISTS "Staff can manage photos for assigned jobs" ON job_photos;
DROP POLICY IF EXISTS "Clients can view photos for their jobs" ON job_photos;

CREATE POLICY "Admins can manage all job_photos" ON job_photos
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff can manage photos for assigned jobs" ON job_photos
  FOR ALL TO authenticated
  USING (
    public.is_staff()
    AND job_id IN (SELECT id FROM jobs WHERE assigned_to = auth.uid())
  );

CREATE POLICY "Clients can view photos for their jobs" ON job_photos
  FOR SELECT TO authenticated
  USING (
    public.is_client()
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.sites s ON j.site_id = s.id
      JOIN public.clients c ON s.client_id = c.id
      WHERE j.id = job_photos.job_id
        AND (
          c.user_id = auth.uid()
          OR lower(c.contact_email) = lower(auth.jwt() ->> 'email')
        )
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_active())
  WITH CHECK (user_id = auth.uid());

-- SETTINGS
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "All users can view settings" ON settings;

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "All users can view settings" ON settings
  FOR SELECT TO authenticated
  USING (public.is_active());

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================
INSERT INTO settings (key, value, description)
VALUES 
  ('gps_radius_meters', '100', 'GPS verification radius in meters'),
  ('enable_client_portal', 'true', 'Enable client portal access'),
  ('enable_dark_mode', 'true', 'Enable dark mode option'),
  ('enable_offline_mode', 'true', 'Enable offline mode for mobile')
ON CONFLICT (key) DO NOTHING;
