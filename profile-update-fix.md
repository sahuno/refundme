# iOS Profile Update Fix Summary

## Problem
The iOS app cannot update user profiles, showing a 405 error and "perform input operation" errors.

## Changes Made

### 1. Fixed `/api/mobile/profile/update/route.ts`
- Updated to use the async `createClient` pattern correctly
- Added CORS support with OPTIONS method handler
- Improved error handling with detailed error messages
- Removed the non-existent `updated_at` field

### 2. Key Fixes Applied
- Changed from manual Supabase client creation to using the standard server client
- Added proper CORS headers for PUT and OPTIONS methods
- Fixed authentication to use the server-side auth session

## Current Status
The endpoint should now:
1. Accept PUT requests from the iOS app
2. Handle preflight OPTIONS requests correctly
3. Authenticate users properly using the session token
4. Update profile fields: full_name, department, student_id, admin_email

## Testing
To verify the fix:
1. Deploy the updated API
2. Try editing profile from iOS app
3. Check that the changes persist

## Endpoint Details
- URL: `/api/mobile/profile/update`
- Method: PUT
- Headers: 
  - Content-Type: application/json
  - Authorization: Bearer [token]
- Body:
```json
{
  "full_name": "string",
  "department": "string", 
  "student_id": "string",
  "admin_email": "string"
}
```

## Middleware
The middleware at `/src/middleware.ts` is already configured to handle CORS for all `/api/mobile/*` endpoints, so preflight requests should work correctly.