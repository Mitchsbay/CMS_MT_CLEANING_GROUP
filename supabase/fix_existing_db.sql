/*
  Fix script to align an existing database to the schema expected by the CMS app.
  Run in Supabase SQL Editor if you are seeing PostgREST 400/500 errors on jobs/sites,
  especially around jobs.status filters and jobs->profiles joins.
*/

-- Ensure required columns exist (safe no-ops if already present)
ALTER TABLE IF EXISTS public.sites ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE IF EXISTS public.jobs
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS scheduled_start_time time,
  ADD COLUMN IF NOT EXISTS scheduled_end_time time,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- 1) Fix jobs.status so API filters like status=in.(pending,in_progress) work.
--    Many older schemas used an enum that didn't include 'pending', causing 500s.
--    Convert to text and enforce via a CHECK constraint.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  c record;
BEGIN
  -- Drop any CHECK constraints on jobs.status (unknown names)
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT %I', c.conname);
  END LOOP;

  -- Convert status to text (works from enum/varchar/text)
  EXECUTE 'ALTER TABLE public.jobs ALTER COLUMN status TYPE text USING status::text';

  -- Set default if missing
  BEGIN
    EXECUTE 'ALTER TABLE public.jobs ALTER COLUMN status SET DEFAULT ''pending''';
  EXCEPTION WHEN others THEN
    -- ignore
  END;

  -- Add a single authoritative CHECK constraint
  EXECUTE $q$
    ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('pending','scheduled','in_progress','completed','cancelled'))
  $q$;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Fix jobs.assigned_to relationship so PostgREST embeds via profiles work.
--    The frontend uses profiles!jobs_assigned_to_fkey(full_name)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fk record;
BEGIN
  -- Drop any FK constraints that involve (assigned_to)
  FOR fk IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%(assigned_to)%'
  LOOP
    EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT %I', fk.conname);
  END LOOP;

  -- Ensure assigned_to is uuid
  BEGIN
    EXECUTE 'ALTER TABLE public.jobs ALTER COLUMN assigned_to TYPE uuid USING assigned_to::uuid';
  EXCEPTION WHEN undefined_column THEN
    -- If the column doesn't exist, create it
    EXECUTE 'ALTER TABLE public.jobs ADD COLUMN assigned_to uuid';
  END;

  -- Create FK to profiles with the exact name expected by the frontend query
  EXECUTE '
    ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL
  ';
END $$;

-- ---------------------------------------------------------------------------
-- 3) (Optional) Align check_ins.user_id to profiles for easier joins
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fk record;
BEGIN
  IF to_regclass('public.check_ins') IS NULL THEN
    RETURN;
  END IF;

  FOR fk IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.check_ins'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%(user_id)%'
  LOOP
    EXECUTE format('ALTER TABLE public.check_ins DROP CONSTRAINT %I', fk.conname);
  END LOOP;

  EXECUTE '
    ALTER TABLE public.check_ins
    ADD CONSTRAINT check_ins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
  ';
EXCEPTION WHEN others THEN
  -- Non-fatal; some schemas may not support this cleanly
  NULL;
END $$;

-- Touch updated_at on jobs when rows change (if trigger not already present)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.jobs') IS NOT NULL THEN
    BEGIN
      EXECUTE 'DROP TRIGGER IF EXISTS trg_jobs_touch_updated_at ON public.jobs';
      EXECUTE 'CREATE TRIGGER trg_jobs_touch_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()';
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
END $$;
