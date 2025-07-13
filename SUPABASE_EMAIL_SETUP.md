# Supabase Email Confirmation Setup Guide

## Issue
When users register and click the email confirmation link, they see a blank page instead of being redirected properly.

## Solution Implemented
Created the missing `/auth/callback` route to handle email confirmation callbacks from Supabase.

## Required Supabase Dashboard Configuration

### 1. Update Site URL
In your Supabase project dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://your-domain.com`)
3. For local development, set it to `http://localhost:3000`

### 2. Configure Redirect URLs
In the same URL Configuration section:
1. Add the following to **Redirect URLs** (allowed list):
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://your-domain.com/**
   https://your-domain.com/auth/callback
   ```

### 3. Email Template Configuration (Optional)
To customize the confirmation email:
1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Ensure the confirmation URL uses the correct callback:
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```

## How It Works

1. **Registration**: User signs up with email/password
2. **Email Sent**: Supabase sends confirmation email with a link containing a code
3. **User Clicks Link**: Link goes to `/auth/callback?code=xxxxx`
4. **Code Exchange**: The callback route exchanges the code for a session
5. **Redirect**: User is redirected to dashboard (if successful) or login page with error

## Files Modified/Created

1. **Created**: `/src/app/auth/callback/route.ts`
   - Handles the email confirmation callback
   - Exchanges the code for a session
   - Redirects appropriately based on success/failure

2. **Modified**: `/src/middleware.ts`
   - Added `/auth/callback` to the list of public routes
   - Prevents redirect loop during confirmation

3. **Modified**: `/src/app/(auth)/login/page.tsx`
   - Added error parameter handling
   - Shows both success and error messages

## Testing

1. Register a new account
2. Check email for confirmation link
3. Click the link - should redirect to dashboard after confirmation
4. If there's an error, you'll be redirected to login with an error message

## Troubleshooting

If the confirmation still doesn't work:

1. **Check Supabase Logs**: Go to your Supabase dashboard → **Logs** → **Auth** to see any errors
2. **Verify Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
3. **Check Browser Console**: Look for any JavaScript errors when clicking the confirmation link
4. **Verify Email Settings**: In Supabase dashboard, check **Authentication** → **Settings** → ensure email confirmations are enabled