-- Migration to add email column to app_users table
-- Run this in Supabase SQL Editor after the main schema

-- Add email column to app_users table
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update existing admin user with email
UPDATE public.app_users 
SET email = 'admin@example.com' 
WHERE username = 'admin' AND email IS NULL;

-- Make email NOT NULL after updating existing records
ALTER TABLE public.app_users ALTER COLUMN email SET NOT NULL;
