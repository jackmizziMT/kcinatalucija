# Supabase Setup Guide

This guide will help you set up Supabase for your inventory tracker application.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `inventory-tracker` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the region closest to your users
6. Click "Create new project"
7. Wait for the project to be created (this takes a few minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (long string starting with `eyJ`)

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql` from your project
4. Click "Run" to execute the SQL
5. You should see success messages for all the tables and policies

## 4. Configure Environment Variables

### For Local Development:

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

## 5. Enable Authentication (Optional)

If you want to use Supabase Auth instead of the local auth system:

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your authentication settings:
   - **Site URL**: Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - **Redirect URLs**: Add your domain
3. You can configure email templates, providers, etc.

## 6. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to your app and check the admin page
3. You should see a "Cloud Migration" section
4. Try migrating your local data to Supabase

## 7. Database Tables Created

The setup creates the following tables:

- **items**: Product inventory items
- **locations**: Storage locations (A, B, C, D)
- **stock_by_location**: Stock quantities per location
- **audit_trail**: Complete history of all stock movements
- **users**: App users with roles and security questions

## 8. Default Data

The setup includes:
- 4 default locations (A, B, C, D)
- 1 default admin user with security question
- Proper indexes for performance
- Row Level Security policies

## 9. Migration Process

When you're ready to migrate from localStorage to Supabase:

1. **Backup First**: Export your data using the backup system
2. **Run Migration**: Use the "Cloud Migration" component in the admin page
3. **Verify Data**: Check that all your data transferred correctly
4. **Clear Local**: The migration will automatically clear local storage

## 10. Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **"Permission denied"**: Make sure Row Level Security policies are set up
3. **Migration fails**: Ensure all tables were created successfully

### Check Database:

1. Go to **Table Editor** in Supabase dashboard
2. Verify all tables exist and have the correct structure
3. Check that the default data was inserted

### Check Logs:

1. Go to **Logs** in Supabase dashboard
2. Look for any error messages during migration

## 11. Benefits of Supabase

Once migrated, you'll have:

- ✅ **Cloud Storage**: Data stored securely in the cloud
- ✅ **Real-time Sync**: Changes sync across all devices
- ✅ **Automatic Backups**: Built-in backup and recovery
- ✅ **Scalability**: Handle more data and users
- ✅ **Security**: Enterprise-grade security
- ✅ **Performance**: Fast queries with indexes
- ✅ **Audit Trail**: Complete history of all changes

## 12. Next Steps

After successful migration:

1. **Test All Features**: Make sure everything works correctly
2. **Share Access**: Other users can now access the same data
3. **Monitor Usage**: Check Supabase dashboard for usage statistics
4. **Set Up Backups**: Configure additional backup strategies if needed

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the error messages in your browser console
3. Check the Supabase dashboard logs
4. Ensure all environment variables are set correctly
