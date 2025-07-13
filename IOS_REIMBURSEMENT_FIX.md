# iOS Reimbursement Creation Fix

## Issue
Users reported they cannot create reimbursement requests in the iOS app.

## Analysis
The iOS app reimbursement creation should work as implemented. The code flow is:

1. **UI Layer** (`CreateReimbursementView.swift`):
   - Collects transactions and manual items
   - Validates input (description required, at least one item)
   - Calls the view model to submit

2. **API Layer** (`APIService.swift`):
   - Sends POST request to `/api/mobile/reimbursements/submit`
   - Includes auth headers
   - Sends transactions and manual items with proper formatting

3. **Backend** (`/api/mobile/reimbursements/submit/route.ts`):
   - Creates draft reimbursement request
   - Creates reimbursement items
   - Submits the request via `/api/submit-request`
   - Sends email notification

## Debugging Steps Added

### 1. Enhanced Error Logging in API
- Added detailed console logging for debugging
- Better error messages with details
- Validation for total amount > 0

### 2. iOS Debug Logging
- Added request body logging
- Response status and body logging
- Better error handling

## Common Issues to Check

### 1. Authentication
Make sure the user is logged in and has a valid access token:
```swift
// Check in Xcode console for auth headers
print("Auth token: \(UserDefaults.standard.string(forKey: "accessToken") ?? "none")")
```

### 2. Network Issues
- Verify the API URL is correct in `AppConfig.swift`
- Check if the request reaches the server (check Vercel logs)
- Ensure CORS is properly configured

### 3. Data Validation
The request requires:
- `description` (non-empty string)
- At least one transaction or manual item
- Total amount > 0
- Valid date formats (ISO8601)

### 4. Common Errors

**401 Unauthorized**: 
- User not logged in
- Access token expired
- Missing auth headers

**400 Bad Request**:
- Empty description
- No items selected
- Total amount is 0

**500 Internal Server Error**:
- Database issues
- Check Supabase logs
- Check RLS policies

## Testing Steps

1. **Check Console Logs**:
   - Run the iOS app in Xcode
   - Try to create a reimbursement
   - Check console output for debug messages

2. **Verify Request Format**:
   ```json
   {
     "transactions": [{
       "id": "trans_123",
       "name": "Transaction name",
       "amount": 50.00,
       "category": "Food",
       "date": "2025-01-13T12:00:00.000Z",
       "description": "Transaction name"
     }],
     "manualItems": [{
       "description": "Manual expense",
       "amount": 25.00,
       "category": "Other",
       "date": "2025-01-13T12:00:00.000Z"
     }],
     "description": "Test reimbursement",
     "adminEmail": null,
     "notes": null
   }
   ```

3. **Check Server Logs**:
   - Go to Vercel dashboard
   - Check Functions logs
   - Look for the `/api/mobile/reimbursements/submit` endpoint

## Database Schema
The reimbursement_items table expects:
- `date` (not `transaction_date`)
- `amount` as number
- `category` as string
- `is_manual_entry` as boolean

## Next Steps
1. Run the iOS app with the debug logging enabled
2. Check the console output for the exact error
3. Verify the access token is being sent
4. Check Vercel logs for server-side errors