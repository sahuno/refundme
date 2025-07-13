# Login Troubleshooting Guide

## Current Issue: Rate Limit Reached

You've hit Supabase's rate limit for authentication attempts. This is a security feature.

## Solution:

### 1. Wait for Rate Limit to Reset
- Supabase rate limits typically reset after **10-15 minutes**
- The exact message "Request rate limit reached" confirms this

### 2. While Waiting, Verify Your Credentials

Check your Supabase dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → Users
4. Verify your user exists with email: ekwame001@gmail.com

### 3. Test Direct Supabase Connection

You can test if Supabase is accessible:
```bash
curl https://uipmodsomobzbendohdh.supabase.co/auth/v1/health
```

### 4. After Rate Limit Resets (10-15 min)

Try logging in again with:
- Email: ekwame001@gmail.com
- Password: Your actual password

### 5. If Login Still Fails

Common issues:
1. **Wrong password** - Try resetting it in Supabase dashboard
2. **User doesn't exist** - Create user in Supabase dashboard
3. **Email not confirmed** - Check if email confirmation is required

### Alternative: Create Test User

In Supabase Dashboard:
1. Authentication → Users
2. Click "Create User"
3. Enter test email and password
4. Uncheck "Auto Confirm User" to skip email verification
5. Try logging in with this test user

## iOS Specific Error

The iOS error "RefundMeApp.APIError error 0" is likely because:
- The mobile auth endpoint returned a rate limit error
- The iOS app doesn't handle this specific error gracefully

Once the rate limit resets, both web and iOS login should work.