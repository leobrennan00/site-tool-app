-- Fix the profile insert policy to allow sign-ups
-- Run this in Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policy that allows profile creation during sign-up
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);
