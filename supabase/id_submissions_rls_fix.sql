-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: id_submissions table + id-photos storage bucket RLS policies
-- Run in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create id_submissions table if it does not yet exist
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.id_submissions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_type          text        NOT NULL,
  id_front_url     text        NOT NULL,
  id_back_url      text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at     timestamptz DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid
);

-- 2. Enable RLS on id_submissions
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.id_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts on re-run
DROP POLICY IF EXISTS "Users can insert own submission"  ON public.id_submissions;
DROP POLICY IF EXISTS "Users can view own submissions"   ON public.id_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions"  ON public.id_submissions;
DROP POLICY IF EXISTS "Admins can update submissions"    ON public.id_submissions;

-- Authenticated users may submit their own ID
CREATE POLICY "Users can insert own submission" ON public.id_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only see their own submissions
CREATE POLICY "Users can view own submissions" ON public.id_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service-role / admin updates (approve / reject)
-- The AdminPanel runs with the service role key, so this covers admin actions.
-- If you use the anon key for admin too, add a separate policy with an is_admin() check.
CREATE POLICY "Admins can update submissions" ON public.id_submissions
  FOR UPDATE USING (true);

-- 3. Create the id-photos storage bucket (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-photos', 'id-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies for id-photos
-- Files are stored as:  <user_id>/front_<ts>.jpg  and  <user_id>/back_<ts>.jpg
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can upload own ID photos"   ON storage.objects;
DROP POLICY IF EXISTS "Users can view own ID photos"     ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ID photos"    ON storage.objects;
DROP POLICY IF EXISTS "Users can replace own ID photos"  ON storage.objects;

-- INSERT: authenticated user may upload only to their own sub-folder
CREATE POLICY "Users can upload own ID photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'id-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE (upsert): authenticated user may replace only their own files
CREATE POLICY "Users can replace own ID photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'id-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: authenticated user may read only their own files
CREATE POLICY "Users can view own ID photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'id-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: service role (AdminPanel) can read all ID photos for review
-- This relies on the AdminPanel using a service-role Supabase client.
-- If your admin UI uses the anon key, add an is_admin() guard here instead.
CREATE POLICY "Admins can view all ID photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'id-photos');
