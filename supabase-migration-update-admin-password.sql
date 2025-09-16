-- Migration to update the admin user's security answer (password)
-- This script updates the existing admin user with a more secure password

-- Update the admin user's security answer to the new secure password
UPDATE public.app_users
SET security_answer = 'Kcina2025!Lucija#Secure'
WHERE username = 'admin' AND email = 'admin@example.com';

-- Verify the update
SELECT username, email, role, security_answer IS NOT NULL as has_password
FROM public.app_users 
WHERE username = 'admin';
