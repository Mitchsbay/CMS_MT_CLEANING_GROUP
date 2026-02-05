/*
  # Add Helper Function to Check User Role
  
  ## Purpose
  Create a security definer function that can check user roles without
  causing infinite recursion in RLS policies.
  
  ## Changes
  1. Create a function in public schema to get current user's role
  2. Update policies to use this function
*/

-- Function to get the current user's role
-- SECURITY DEFINER allows it to bypass RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop the temporary overly-permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON profiles;

-- Create proper role-based policies using the function

-- Admins can view all profiles, users can view own
CREATE POLICY "View profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin' OR id = auth.uid());

-- Admins can update any profile, users can update own
CREATE POLICY "Update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin' OR id = auth.uid())
  WITH CHECK (public.current_user_role() = 'admin' OR id = auth.uid());

-- Admins can delete profiles
CREATE POLICY "Delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Allow profile creation during signup and by admins
CREATE POLICY "Insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin' OR id = auth.uid());