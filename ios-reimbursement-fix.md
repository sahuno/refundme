# iOS Reimbursement Request Fix - Summary

## Problem
The iOS app couldn't create reimbursement requests because it was trying to use a mobile-specific endpoint (`/api/mobile/reimbursements/submit`) that had issues.

## Root Cause Analysis

### Web App Flow (Working)
1. Creates a draft request in `reimbursement_requests` table
2. Creates items in `reimbursement_items` table  
3. Calls `/api/submit-request` to change status from 'draft' to 'submitted'
4. Sends email notification to admin

### iOS App Issue
The iOS app was calling `/api/mobile/reimbursements/submit` which:
- Had authentication issues (using old pattern)
- Wasn't properly creating items with correct field mappings
- Wasn't calling the submit-request endpoint to finalize submission

## Changes Made

### 1. Fixed `/api/mobile/reimbursements/submit/route.ts`
- Updated to use the standard `createClient` from `@/lib/supabase/server`
- Fixed the flow to match web app: create request → create items → submit
- Added proper error handling and rollback on failure
- Added CORS support for mobile access
- Now properly calls the existing `/api/submit-request` endpoint

### 2. Fixed `/api/mobile/reimbursements/[id]/pdf/route.ts`
- Updated authentication to use standard pattern
- Added CORS support for mobile access

### 3. Updated `/api/submit-request/route.ts`
- Fixed async createClient call
- Added CORS support for mobile access

## How It Works Now

The iOS app will now:
1. Call `/api/mobile/reimbursements/submit` with transactions and manual items
2. The endpoint creates a draft request
3. Creates all items (both transaction-based and manual)
4. Automatically submits the request via the submit-request endpoint
5. Returns success with email notification status

## iOS App Requirements

The iOS app's `submitReimbursementRequest` method in `APIService.swift` should work as-is, sending:
```json
{
  "transactions": [...],
  "manualItems": [...],
  "description": "...",
  "adminEmail": "...", 
  "notes": "..."
}
```

The API will handle all the database operations and email notifications.

## Testing
To test the fix:
1. Deploy the updated API endpoints
2. Try creating a reimbursement request from the iOS app
3. Verify the request appears in the database with status 'submitted'
4. Check that the admin email was sent