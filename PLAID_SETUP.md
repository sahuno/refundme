# Plaid Bank Connection Setup Guide

## Issue
New users cannot connect their bank accounts. The "Setting up..." button is grayed out and the Plaid Link token creation is failing.

## Root Cause
The Plaid API credentials are not configured in the Vercel deployment environment.

## Solution

### 1. Get Plaid API Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Sign up or log in to your account
3. Navigate to Team Settings > Keys
4. Copy your credentials:
   - Client ID
   - Sandbox Secret (for testing)
   - Development/Production Secret (for live environment)

### 2. Configure Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `refundme` project
3. Go to **Settings** > **Environment Variables**
4. Add the following variables:

   ```
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SECRET=your_secret_here
   PLAID_ENV=sandbox
   NEXT_PUBLIC_PLAID_ENV=sandbox
   ```

   For production, use:
   ```
   PLAID_ENV=production
   NEXT_PUBLIC_PLAID_ENV=production
   ```

5. Click "Save" for each variable
6. **Important**: Redeploy your application for the changes to take effect

### 3. Verify Configuration

After deployment, test the configuration:

1. Visit: `https://your-app.vercel.app/api/test-plaid`
2. You should see a success message if configured correctly

### 4. Test Bank Connection Flow

1. Log in as a user
2. Go to Dashboard
3. Click "Connect a Bank Account"
4. Use Plaid's test credentials:
   - Username: `user_good`
   - Password: `pass_good`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAID_CLIENT_ID` | Your Plaid client ID | `5e8f5a2c3d1b2c001234567` |
| `PLAID_SECRET` | Your Plaid secret key | `1234567890abcdef1234567890abcd` |
| `PLAID_ENV` | Plaid environment | `sandbox`, `development`, or `production` |
| `NEXT_PUBLIC_PLAID_ENV` | Public Plaid environment | Same as PLAID_ENV |

## Troubleshooting

### "Setting up..." Button Stays Grayed Out
- Check browser console for errors
- Verify environment variables in Vercel
- Check `/api/test-plaid` endpoint

### API Errors
- Ensure credentials match the environment (sandbox vs production)
- Verify the secret key is correct for the environment
- Check Plaid dashboard for any account issues

### Common Error Codes
- `INVALID_API_KEYS`: Wrong client ID or secret
- `INVALID_CONFIGURATION`: Environment mismatch
- `UNAUTHORIZED`: Expired or invalid credentials

## Development vs Production

### Sandbox (Testing)
- Use test credentials
- No real bank connections
- Free to use

### Production
- Real bank connections
- Requires Plaid account upgrade
- Usage-based pricing

## Security Notes
- Never commit API keys to git
- Use environment variables only
- Rotate secrets regularly
- Monitor Plaid dashboard for suspicious activity