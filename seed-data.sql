-- MT Cleaning Group - Seed Data for Testing
-- Run this file AFTER schema.sql to populate test data
-- WARNING: Only use this in development/testing environments!

-- ============================================
-- IMPORTANT: Replace these UUIDs with actual user IDs
-- ============================================

-- After creating users in Supabase Auth dashboard, get their UUIDs and replace below
-- Example: '123e4567-e89b-12d3-a456-426614174000'

-- STEP 1: Create users in Supabase Auth dashboard first
-- STEP 2: Copy their UUIDs from the Auth dashboard
-- STEP 3: Replace the placeholder UUIDs below
-- STEP 4: Run this script

-- Example placeholder IDs (REPLACE THESE!)
DO $$
DECLARE
  admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
  staff_user_1_id uuid := '00000000-0000-0000-0000-000000000002';
  staff_user_2_id uuid := '00000000-0000-0000-0000-000000000003';
  client_id uuid;
  site_id_1 uuid;
  site_id_2 uuid;
  site_id_3 uuid;
  job_id_1 uuid;
  job_id_2 uuid;
  task_template_id_1 uuid;
  task_template_id_2 uuid;
BEGIN
  -- WARNING: These sample IDs won't work! Replace with actual user IDs from Supabase Auth

  -- ============================================
  -- PROFILES
  -- ============================================

  -- Insert profiles for the users (link to auth.users)
  INSERT INTO profiles (id, full_name, phone, role, status) VALUES
  (admin_user_id, 'Admin User', '0412345678', 'admin', 'active'),
  (staff_user_1_id, 'John Cleaner', '0423456789', 'staff', 'active'),
  (staff_user_2_id, 'Jane Smith', '0434567890', 'staff', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CLIENTS
  -- ============================================

  INSERT INTO clients (name, contact_email, contact_phone, address, notes)
  VALUES
  ('Sydney Hospital', 'facilities@sydneyhospital.nsw.gov.au', '02 9382 7111', '8 Macquarie St, Sydney NSW 2000', 'High priority healthcare client')
  RETURNING id INTO client_id;

  -- ============================================
  -- SITES
  -- ============================================

  -- Sydney CBD locations (adjust GPS coordinates as needed)
  INSERT INTO sites (name, address, latitude, longitude, client_id, instructions, active)
  VALUES
  ('Sydney Hospital - Main Building', '8 Macquarie St, Sydney NSW 2000', -33.8688, 151.2093, client_id, 'Use staff entrance. Sign in at reception. Infection control protocols required.', true),
  ('Sydney Hospital - Wing B', '8 Macquarie St, Sydney NSW 2000', -33.8690, 151.2095, client_id, 'Access via Level 2 corridor. PPE required in all areas.', true),
  ('Government Office - Martin Place', '1 Martin Place, Sydney NSW 2000', -33.8671, 151.2074, NULL, 'After hours access - security code 1234. Contact security on arrival.', true)
  RETURNING id INTO site_id_1;

  -- Get the other site IDs
  SELECT id INTO site_id_2 FROM sites WHERE name = 'Sydney Hospital - Wing B' LIMIT 1;
  SELECT id INTO site_id_3 FROM sites WHERE name = 'Government Office - Martin Place' LIMIT 1;

  -- ============================================
  -- TASK TEMPLATES
  -- ============================================

  INSERT INTO task_templates (name, description, site_id)
  VALUES
  ('Floor Mopping', 'Mop all floors with hospital-grade disinfectant', NULL),
  ('Surface Sanitization', 'Sanitize all high-touch surfaces including door handles, light switches, and handrails', NULL),
  ('Bathroom Deep Clean', 'Complete bathroom cleaning including toilets, sinks, mirrors, and floors', NULL),
  ('Waste Removal', 'Empty all bins and replace liners. Dispose of waste according to hospital protocols.', site_id_1),
  ('Kitchen Area Clean', 'Clean kitchen surfaces, sink, microwave, and refrigerator exterior', NULL),
  ('Window Cleaning', 'Clean all interior windows and glass surfaces', NULL),
  ('Infection Control Check', 'Verify cleaning meets infection control standards. Document any concerns.', site_id_1)
  RETURNING id INTO task_template_id_1;

  SELECT id INTO task_template_id_2 FROM task_templates WHERE name = 'Surface Sanitization' LIMIT 1;

  -- ============================================
  -- JOBS
  -- ============================================

  -- Job for today
  INSERT INTO jobs (site_id, assigned_to, scheduled_date, scheduled_start_time, scheduled_end_time, status, notes, created_by)
  VALUES
  (site_id_1, staff_user_1_id, CURRENT_DATE, '09:00', '11:00', 'pending', 'Morning cleaning shift. Priority areas: Emergency department and main lobby.', admin_user_id)
  RETURNING id INTO job_id_1;

  -- Job for tomorrow
  INSERT INTO jobs (site_id, assigned_to, scheduled_date, scheduled_start_time, scheduled_end_time, status, notes, created_by)
  VALUES
  (site_id_2, staff_user_2_id, CURRENT_DATE + INTERVAL '1 day', '14:00', '16:00', 'pending', 'Afternoon deep clean.', admin_user_id)
  RETURNING id INTO job_id_2;

  -- Completed job from yesterday
  INSERT INTO jobs (site_id, assigned_to, scheduled_date, scheduled_start_time, scheduled_end_time, status, notes, created_by)
  VALUES
  (site_id_3, staff_user_1_id, CURRENT_DATE - INTERVAL '1 day', '18:00', '20:00', 'completed', 'After hours cleaning completed successfully.', admin_user_id);

  -- ============================================
  -- JOB TASKS
  -- ============================================

  -- Tasks for today's job
  INSERT INTO job_tasks (job_id, task_template_id, task_name, task_description, completed)
  VALUES
  (job_id_1, task_template_id_1, 'Floor Mopping', 'Mop all floors in emergency department', false),
  (job_id_1, task_template_id_2, 'Surface Sanitization', 'Sanitize reception area and waiting room surfaces', false),
  (job_id_1, NULL, 'Bathroom Deep Clean', 'Clean all public bathrooms on ground floor', false);

  -- ============================================
  -- ASSETS
  -- ============================================

  INSERT INTO assets (name, serial_number, purchase_date, location, status, notes)
  VALUES
  ('Industrial Vacuum Cleaner #1', 'VAC-2023-001', '2023-01-15', 'Equipment Room A', 'operational', 'Regular maintenance required'),
  ('Floor Polisher', 'POL-2023-002', '2023-03-20', 'Equipment Room A', 'operational', 'In good condition'),
  ('Pressure Washer', 'PRS-2022-005', '2022-11-10', 'Equipment Room B', 'maintenance', 'Needs repair - pump issue'),
  ('Steam Cleaner', 'STM-2023-003', '2023-02-28', 'Equipment Room A', 'operational', 'Recently serviced');

  -- ============================================
  -- SAMPLE NOTIFICATIONS
  -- ============================================

  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES
  (staff_user_1_id, 'Welcome to MT Cleaning CMS', 'You have been added to the system. Check your job assignments below.', 'info', false),
  (staff_user_1_id, 'Job Assigned', 'New cleaning job assigned for today at Sydney Hospital', 'success', false);

END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Run these queries to verify data was inserted:

SELECT 'Profiles created:' as info, COUNT(*) as count FROM profiles;
SELECT 'Clients created:' as info, COUNT(*) as count FROM clients;
SELECT 'Sites created:' as info, COUNT(*) as count FROM sites;
SELECT 'Task templates created:' as info, COUNT(*) as count FROM task_templates;
SELECT 'Jobs created:' as info, COUNT(*) as count FROM jobs;
SELECT 'Job tasks created:' as info, COUNT(*) as count FROM job_tasks;
SELECT 'Assets created:' as info, COUNT(*) as count FROM assets;
SELECT 'Notifications created:' as info, COUNT(*) as count FROM notifications;

-- ============================================
-- IMPORTANT REMINDERS
-- ============================================

/*
TO USE THIS SEED DATA:

1. First, create test users in Supabase Authentication dashboard:
   - Go to Authentication → Users
   - Click "Add user" → "Create new user"
   - Create at least 3 users (1 admin, 2 staff)
   - Note their User IDs (UUIDs)

2. Edit this file and replace the placeholder UUIDs at the top:
   - admin_user_id
   - staff_user_1_id
   - staff_user_2_id

3. Run this file in Supabase SQL Editor

4. You can now log in with the test users and see sample data

5. For GPS testing:
   - Update the latitude/longitude values to match real locations
   - Or adjust GPS radius in Settings to allow testing from anywhere

6. NEVER use this seed data in production!
   - This is for testing only
   - Create real data through the UI for production use
*/
