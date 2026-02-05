/*
  # MT Cleaning Group - Complete Database Schema

  This is the SINGLE SOURCE OF TRUTH for the database schema.
  Run this in the Supabase SQL Editor.

  ## Tables
  - profiles: User profiles (admin, staff, client roles)
  - clients: Client companies/organizations
  - sites: Cleaning locations
  - jobs: Scheduled cleaning jobs
  - check_ins: Staff check-in/check-out records with GPS
  - incidents: Incident reports (admin + staff only, NOT visible to clients)
  - job_photos: Before/after photos for jobs

  ## Storage Buckets
  - job-photos: For before/after photos

  ## Admin Access
  - ONLY accounts@mtcleaninggroup.com.au has admin role
  - All RLS policies use JWT email check to avoid recursion
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'client')) DEFAULT 'staff',
  status text NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Admin can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE POLICY "Admin can manage all clients"
  ON clients FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  TO authenticated
  USING (contact_email = (auth.jwt() ->> 'email'));

-- =============================================================================
-- SITES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  instructions text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all sites"
  ON sites FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Clients can view their sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE contact_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Staff can view sites for assigned jobs"
  ON sites FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT site_id FROM jobs
      WHERE assigned_to = auth.uid()
    )
  );

-- =============================================================================
-- JOBS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all jobs"
  ON jobs FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Staff can view assigned jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Staff can update assigned jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Clients can view jobs at their sites"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.contact_email = (auth.jwt() ->> 'email')
    )
  );

-- =============================================================================
-- CHECK_INS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  check_in_lat decimal(10, 8),
  check_in_lng decimal(11, 8),
  check_out_lat decimal(10, 8),
  check_out_lng decimal(11, 8),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all check_ins"
  ON check_ins FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Staff can insert check_ins for assigned jobs"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs
      WHERE assigned_to = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Staff can update own check_ins"
  ON check_ins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view own check_ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- INCIDENTS TABLE (NOT VISIBLE TO CLIENTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status text NOT NULL CHECK (status IN ('open', 'investigating', 'resolved')) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all incidents"
  ON incidents FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Staff can view all incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

CREATE POLICY "Staff can insert incidents for their job sites"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    site_id IN (
      SELECT site_id FROM jobs
      WHERE assigned_to = auth.uid()
    )
    AND reported_by = auth.uid()
  );

-- =============================================================================
-- JOB_PHOTOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all job_photos"
  ON job_photos FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'accounts@mtcleaninggroup.com.au');

CREATE POLICY "Staff can insert photos for assigned jobs"
  ON job_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs
      WHERE assigned_to = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Staff can view photos for assigned jobs"
  ON job_photos FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE assigned_to = auth.uid()
    )
  );

CREATE POLICY "Clients can view photos for their jobs"
  ON job_photos FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN sites s ON j.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      WHERE c.contact_email = (auth.jwt() ->> 'email')
    )
  );

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(active);
CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_job_id ON check_ins(job_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_site_id ON incidents(site_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    CREATE TRIGGER update_clients_updated_at
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sites_updated_at') THEN
    CREATE TRIGGER update_sites_updated_at
      BEFORE UPDATE ON sites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_updated_at') THEN
    CREATE TRIGGER update_jobs_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_incidents_updated_at') THEN
    CREATE TRIGGER update_incidents_updated_at
      BEFORE UPDATE ON incidents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.email = 'accounts@mtcleaninggroup.com.au' THEN 'admin'
      ELSE 'staff'
    END,
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- =============================================================================
-- STORAGE BUCKET SETUP (run this in Supabase Dashboard > Storage)
-- =============================================================================
-- Create bucket: job-photos
-- Make it private (not public)
-- RLS policies for storage:
-- 1. Admin can do everything
-- 2. Staff can upload to folders matching their assigned job IDs
-- 3. Clients can view photos for their jobs only
