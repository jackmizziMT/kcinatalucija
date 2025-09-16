# Admin Password Recovery Information

## Current Admin Credentials
- **Username:** `admin`
- **Password:** `Kcina2025!Lucija#Secure`
- **Security Question:** "What is the name of your first pet?"
- **Security Answer:** `Kcina2025!Lucija#Secure`

## Password Recovery Process

### Step 1: Access Recovery Page
1. Go to the login page
2. Click "Admin Password Recovery" at the bottom

### Step 2: Answer Security Question
- **Question:** "What is the name of your first pet?"
- **Answer:** `Kcina2025!Lucija#Secure`

### Step 3: Set New Password
After answering correctly, you can set a new password.

## Troubleshooting

### If "Incorrect answer" error:
- Make sure you're entering: `Kcina2025!Lucija#Secure`
- The answer is case-sensitive
- Include the exclamation mark and hash symbol

### If you want to change the security question:
1. Log in as admin
2. Go to Admin page
3. Use the "Security Question Manager" section
4. Update the question and answer

## Alternative: Direct Database Update

If you need to reset the security answer directly in the database:

```sql
-- Update the security answer
UPDATE public.app_users
SET security_answer = 'YourNewAnswer'
WHERE username = 'admin' AND email = 'admin@example.com';
```

## Security Note
The security answer is currently set to the same value as the password for convenience, but you can change it to something different for better security.
