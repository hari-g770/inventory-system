-- ============================================================================
-- Finefix Technology — Safe Migration Script
-- Run this in Supabase SQL Editor (it won't break existing data)
-- ============================================================================

-- Step 1: Add password column to existing profiles table if it's missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';

-- Step 2: Make sure RLS policy exists (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Public profiles CRUD'
  ) THEN
    CREATE POLICY "Public profiles CRUD" ON public.profiles FOR ALL USING (true);
  END IF;
END $$;

-- Step 3: Upsert users — updates if username already exists, inserts if not
INSERT INTO public.profiles (id, username, full_name, password, role, email, avatar_url)
VALUES
  ('u1', 'admin', 'Alexandra Vance', 'admin123', 'admin', 'admin@finefix.io',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('u2', 'staff', 'Marcus Brody', 'staff123', 'staff', 'marcus@finefix.io',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  username    = EXCLUDED.username,
  full_name   = EXCLUDED.full_name,
  password    = EXCLUDED.password,
  role        = EXCLUDED.role,
  email       = EXCLUDED.email,
  avatar_url  = EXCLUDED.avatar_url;

-- Step 4: Verify — should show your 2 users with passwords
SELECT id, username, full_name, role, password FROM public.profiles;
