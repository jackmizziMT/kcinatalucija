-- Migration to update admin user credentials
-- Run this in your Supabase SQL Editor to update the existing admin user

-- Update the admin user's security answer to match the new password
UPDATE public.app_users 
SET security_answer = 'SecureAdmin2025!'
WHERE username = 'admin' AND role = 'admin';

-- Note: The actual password change needs to be done through Supabase Auth
-- This can only be done by the admin user themselves through the password reset flow
-- or by a super admin with elevated privileges

-- To change the admin password in Supabase Auth, the admin user should:
-- 1. Log in with current credentials
-- 2. Go to Admin > Security Question Manager
-- 3. Update their security question/answer
-- 4. Use the password recovery flow if needed
