# MT Cleaning CMS - Comprehensive Project Analysis Report

Following the implementation of the primary fixes for the `create-user` race condition and RLS policy security, I have conducted a deep dive into the entire codebase. This report outlines remaining risks and recommended improvements.

---

## 1. Security & Access Control

### 1.1 Hardcoded Admin Identification (Critical)
In `create-user/index.ts`, `delete-user/index.ts`, and `AuthContext.tsx`, the admin role is identified by a hardcoded email address: `accounts@mtcleaninggroup.com.au`.
*   **Risk**: If the admin email changes, the system breaks. It also bypasses the database-driven role system.
*   **Fix**: Rely solely on the `role` field in the `profiles` table or JWT claims.

### 1.2 Potential RLS Bypass in Edge Functions (High)
The Edge Functions use the `SERVICE_ROLE_KEY` to interact with the database. While necessary for administrative tasks, these functions currently perform their own manual authorization checks.
*   **Risk**: Any logic error in the function's authorization check (like the hardcoded email) grants full service-role access to the database.
*   **Fix**: Implement a more robust check that queries the `profiles` table within the function to verify the caller's role before proceeding with administrative actions.

### 1.3 Insecure "All Users" Policy for Settings (Medium)
The policy `CREATE POLICY "All users can view settings" ON settings FOR SELECT TO authenticated USING (true);` allows any logged-in user (including staff and clients) to view all settings.
*   **Risk**: If sensitive configuration (like API keys or internal thresholds) is added to the `settings` table, it is exposed to all users.
*   **Fix**: Restrict select access to admins only, or create a `public_settings` table for non-sensitive configuration.

---

## 2. Architectural Consistency

### 2.1 Redundant Profile Creation Logic (Medium)
Profile creation logic exists in three places:
1.  **Database Trigger**: `handle_new_user` in `schema.sql`.
2.  **Edge Function**: `create-user/index.ts`.
3.  **Frontend**: `signUp` method in `AuthContext.tsx`.
*   **Risk**: Maintenance overhead and potential for logic drift (e.g., one place updates `full_name` while another doesn't).
*   **Fix**: Consolidate all profile creation to the database trigger. Edge Functions and the frontend should only handle the `auth.users` creation; the trigger will automatically handle the profile.

### 2.2 Lack of Database Transactions (Medium)
In `create-user/index.ts`, the user is created in Auth, and then a profile is upserted. If the upsert fails, the function attempts to delete the user.
*   **Risk**: If the deletion fails (e.g., network error), you end up with an "orphan" user in Auth without a corresponding profile or with incorrect data.
*   **Fix**: While Supabase Auth and Public schema are separate, ensure that the Edge Function has robust retry/cleanup logic or move more logic into database functions that can use `BEGIN/COMMIT` blocks.

---

## 3. Data Integrity & Leakage

### 3.1 Client Email Exposure (Low)
RLS for `clients` uses `contact_email = (auth.jwt() ->> 'email')`. 
*   **Risk**: If a client user changes their email in Supabase Auth, they lose access to their client record until an admin manually updates the `clients` table.
*   **Fix**: Store the `auth.users.id` as a foreign key in the `clients` table and use `auth.uid()` for the policy.

### 3.2 Inactive User Access (Medium)
While `AuthContext.tsx` checks for `status = 'inactive'`, RLS policies do not.
*   **Risk**: An inactive user could still theoretically make API calls via the Supabase client if they have a valid session token, as the RLS only checks for `authenticated`.
*   **Fix**: Update `is_admin()` and other policies to also verify `status = 'active'` in the `profiles` table.

---

## 4. Configuration & DevOps

### 4.1 Sensitive Credentials in Templates (Low)
The `.env.example` file contains a real Supabase URL and Anon Key.
*   **Risk**: Users might accidentally use these "template" credentials, which could point to a decommissioned or insecure project.
*   **Fix**: Replace all real values in `.env.example` with placeholders like `your-project-url`.

### 4.2 Missing Storage RLS (Medium)
The `QUICKSTART.md` suggests creating "Public" buckets for photos.
*   **Risk**: "Public" in Supabase Storage means anyone with the URL can view the files, bypassing app-level logic.
*   **Fix**: Use "Private" buckets and implement Storage RLS policies to ensure only assigned staff or the relevant client can access job-specific photos.

---

## Summary of Recommendations

1.  **Centralize Role Management**: Remove hardcoded emails and use the `is_admin()` SQL function consistently.
2.  **Harden RLS**: Add `status = 'active'` checks to all policies.
3.  **Clean up .env**: Ensure no real keys are in example files.
4.  **Storage Security**: Implement RLS for Storage buckets instead of making them public.
