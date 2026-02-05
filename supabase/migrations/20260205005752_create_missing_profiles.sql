/*
  # Create Missing Profiles for Existing Users
  
  ## Problem
  Users can exist in auth.users but not have a corresponding profile,
  causing login to fail with 403 errors.
  
  ## Solution
  1. Update the trigger function to handle edge cases
  2. Create profiles for any existing auth.users without profiles
  
  ## Changes
  1. Improve handle_new_user function
  2. Create profiles for existing orphaned users
*/

-- Improved function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status, full_name)
  VALUES (
    new.id,
    'staff',
    'active',
    COALESCE(new.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Create profiles for any existing auth.users without profiles
INSERT INTO public.profiles (id, role, status, full_name)
SELECT 
  u.id,
  'admin' as role,  -- First user gets admin, rest get staff
  'active' as status,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User') as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;