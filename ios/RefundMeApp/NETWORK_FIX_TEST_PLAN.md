# iOS App Network Fix Test Plan

## Changes Made
✅ Updated `AppConfig.swift` to use the deployed Vercel URL instead of localhost
- Old: `http://localhost:3001/api`
- New: `https://refundme-blond.vercel.app/api`

## Test Steps

1. **Build and Run**
   - Open Xcode (already opened)
   - Select iPhone 15 simulator
   - Press ⌘+R to build and run

2. **Test Sign In**
   - On the login screen, enter your credentials
   - Tap "Sign In"
   - Expected: Successfully authenticate and navigate to the main app

3. **Verify API Connectivity**
   - After signing in, navigate to different sections:
     - Dashboard
     - Transactions
     - Education Hub (Learn tab)
   - Each section should load data from the API

4. **Test Features**
   - Create a new reimbursement request
   - View educational articles
   - Check that all API calls work properly

## Expected Results
- ✅ No more "Could not connect to the server" errors
- ✅ Successful authentication
- ✅ Data loads from the deployed backend
- ✅ All features work as expected

## Troubleshooting
If you still see connection errors:
1. Check that the Vercel app is deployed and running
2. Verify the URL in AppConfig.swift matches your deployment
3. Check for any CORS issues in the browser console
4. Ensure your Supabase credentials are correct