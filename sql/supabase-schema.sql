/*
  MT Cleaning Group - Authoritative Database Schema
  This file is the SINGLE SOURCE OF TRUTH for the database schema.
  Run this in the Supabase SQL Editor to set up the entire database.
*/

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- PROFILES TABLE (Extends auth.users)
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

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  contact_phone text,
  address text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SITES TABLE
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

-- JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TASKS TABLE
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

-- CHECK_INS TABLE
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

-- INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status text NOT NULL CHECK (status IN ('open', 'investigating', 'resolved')) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  asset_type text,
  serial_number text,
  purchase_date date,
  location text,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('operational', 'maintenance', 'retired', 'lost', 'available', 'in_use')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASSET MAINTENANCE TABLE
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

-- JOB PHOTOS TABLE
CREATE TABLE IF NOT EXISTS job_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  read boolean DEFAULT false,
  related_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_incidents_site_id ON incidents(site_id);
CREATE INDEX IF NOT EXISTS idx_incidents_job_id ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_site_id ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
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
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND status = 'active'
  );
$$;

-- Function to calculate distance between two GPS coordinates (in meters)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
) RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 6371000; -- meters
  d_lat numeric;
  d_lon numeric;
  a numeric;
  c numeric;
BEGIN
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);

  a := sin(d_lat/2) * sin(d_lat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(d_lon/2) * sin(d_lon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
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
    COALESCE(new.raw_user_meta_data->>'role', 'staff'),
    'active',
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$;

-- Function to automatically log changes to important tables
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify staff when assigned to a job
CREATE OR REPLACE FUNCTION notify_job_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO notifications (user_id, title, message, type, related_job_id)
    VALUES (
      NEW.assigned_to,
      'New Job Assignment',
      'You have been assigned to a new cleaning job on ' || NEW.scheduled_date::text,
      'info',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER audit_incidents AFTER INSERT OR UPDATE OR DELETE ON incidents FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Notification triggers
CREATE TRIGGER notify_on_job_assignment AFTER INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION notify_job_assignment();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Admins can do everything)
CREATE POLICY "Admins have full access" ON profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON clients FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON sites FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON jobs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON tasks FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON check_ins FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON incidents FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON assets FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON asset_maintenance FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON job_photos FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON audit_logs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON settings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access" ON notifications FOR ALL TO authenticated USING (public.is_admin());

-- STAFF POLICIES
CREATE POLICY "Staff can view own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Staff can view assigned jobs" ON jobs FOR SELECT TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Staff can update assigned jobs" ON jobs FOR UPDATE TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Staff can view assigned tasks" ON tasks FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR job_id IN (SELECT id FROM jobs WHERE assigned_to = auth.uid()));
CREATE POLICY "Staff can update assigned tasks" ON tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR job_id IN (SELECT id FROM jobs WHERE assigned_to = auth.uid()));
CREATE POLICY "Staff can check in/out" ON check_ins FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff can report incidents" ON incidents FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Staff can view own incidents" ON incidents FOR SELECT TO authenticated USING (reported_by = auth.uid());
CREATE POLICY "Staff can upload job photos" ON job_photos FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Staff can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- CLIENT POLICIES
CREATE POLICY "Clients can view own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Clients can view their jobs" ON jobs FOR SELECT TO authenticated USING (site_id IN (SELECT id FROM sites WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())));
CREATE POLICY "Clients can view their sites" ON sites FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "Clients can view their job photos" ON job_photos FOR SELECT TO authenticated USING (job_id IN (SELECT id FROM jobs WHERE site_id IN (SELECT id FROM sites WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))));

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Note: Run these in the SQL Editor to set up storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage Policies (Simplified)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('job-photos', 'avatars'));
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('job-photos', 'avatars'));
