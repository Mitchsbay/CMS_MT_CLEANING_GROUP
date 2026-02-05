/*
  # Auto-create Profile on User Signup
  
  ## Problem
  When users sign up via Supabase Auth, a record is created in auth.users
  but NOT in public.profiles, causing login to fail.
  
  ## Solution
  Create a trigger that automatically creates a profile when a new user
  signs up in the auth.users table.
  
  ## Changes
  1. Create function to handle new user signup
  2. Create trigger on auth.users table
*/

-- Function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status)
  VALUES (
    new.id,
    'staff',  -- Default role for new signups
    'active'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();