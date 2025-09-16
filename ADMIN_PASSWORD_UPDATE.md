# Admin Password Update Instructions

## New Admin Password
- **Username:** admin
- **New Password:** `Kcina2025!Lucija#Secure`

## Steps to Update Admin Password

### 1. Update App Users Table
Run the migration script in your Supabase SQL Editor:

```sql
-- Update the admin user's security answer to the new secure password
UPDATE public.app_users
SET security_answer = 'Kcina2025!Lucija#Secure'
WHERE username = 'admin' AND email = 'admin@example.com';
```

### 2. Update Supabase Auth Password
Since we cannot update the Supabase Auth password from the client side, you have two options:

#### Option A: Use Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication → Users**
3. Find the user with email `admin@example.com`
4. Click on the user to edit
5. Update the password to: `Kcina2025!Lucija#Secure`
6. Save the changes

#### Option B: Use Supabase CLI (Advanced)
If you have Supabase CLI installed:
```bash
supabase auth users update admin@example.com --password "Kcina2025!Lucija#Secure"
```

### 3. Verify the Update
After updating both:
1. Try logging in with:
   - Username: `admin`
   - Password: `Kcina2025!Lucija#Secure`
2. Test the password recovery system with the new security answer

## Security Features of New Password
- **Length:** 22 characters
- **Contains:** Uppercase, lowercase, numbers, special characters
- **Mnemonic:** Based on your app name "Kcina ta' Lucija"
- **Unique:** Not easily guessable

## Demo Credentials Removed
The demo credentials have been removed from the login page for security.

## Next Steps
1. Run the SQL migration
2. Update the Supabase Auth password via Dashboard
3. Test login with new credentials
4. Consider creating additional admin users with different credentials
