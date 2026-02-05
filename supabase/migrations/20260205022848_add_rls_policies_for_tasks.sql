/*
  # Add RLS Policies for Tasks Table

  ## Overview
  This migration adds Row Level Security policies for the new tasks table.

  ## Security Policies

  ### tasks table
  - Admins can do everything
  - Staff can view tasks assigned to them
  - Staff can update tasks assigned to them

  ## Policy Details
  - SELECT: Authenticated users can view all tasks (admins) or their own tasks (staff)
  - INSERT: Only admins can create tasks
  - UPDATE: Admins can update all tasks, staff can update their assigned tasks
  - DELETE: Only admins can delete tasks
*/

-- Tasks policies
CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
  );

CREATE POLICY "Admins can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can update assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
