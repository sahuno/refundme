# iOS Integration Test Plan

This document outlines how to test the iOS app integration with the web backend.

## Prerequisites

1. Web app running on localhost:3001 (or deployed URL)
2. Xcode project created with all Swift files added
3. Environment.swift configured with correct URLs

## Test Steps

### 1. API Connectivity Test

First, test the mobile API endpoints directly:

```bash
# Health check
curl -X GET http://localhost:3001/api/mobile/health

# Expected response:
# {"status":"ok","version":"v1","timestamp":"2025-05-31T14:10:06.624Z"}

# CORS preflight test
curl -H "Origin: http://localhost" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/api/mobile/auth

# Expected: 200 OK with CORS headers
```

### 2. iOS App Configuration

Update `ios/RefundMe/Config/Environment.swift`:

```swift
// For local development
static let supabaseURL = "YOUR_SUPABASE_URL"
static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
static let apiBaseURL = "http://localhost:3001/api"
static let mobileAPIBaseURL = "http://localhost:3001/api/mobile"
```

### 3. Xcode Project Setup

1. **Create New iOS Project in Xcode:**
   - Product Name: RefundMe
   - Interface: SwiftUI
   - Language: Swift

2. **Add Package Dependencies:**
   - `https://github.com/supabase/supabase-swift.git`
   - `https://github.com/plaid/plaid-link-ios.git`

3. **Copy Swift Files:**
   Copy all files from `ios/RefundMe/` into your Xcode project maintaining the folder structure.

### 4. Build and Run Tests

1. **Build the app:** ⌘+B
2. **Run on simulator:** ⌘+R
3. **Test authentication flow**
4. **Test API connectivity**

### 5. Expected Features

When properly configured, the iOS app should:

- ✅ Display login screen
- ✅ Connect to health endpoint successfully
- ✅ Authenticate users via mobile auth endpoint
- ✅ Fetch and display transactions
- ✅ Create reimbursement requests
- ✅ Display dashboard with user data

### 6. Troubleshooting

**Common Issues:**

1. **Build Errors:**
   - Ensure all Swift Package dependencies are added
   - Check that all Swift files are properly added to the target

2. **Network Errors:**
   - Verify web app is running on correct port
   - Check Environment.swift URLs
   - Test mobile API endpoints with curl

3. **Authentication Issues:**
   - Verify Supabase configuration matches web app
   - Check that user exists in database

### 7. Production Deployment

For production deployment:

1. **Update Environment.swift:**
```swift
static let apiBaseURL = "https://your-refundme-app.vercel.app/api"
static let mobileAPIBaseURL = "https://your-refundme-app.vercel.app/api/mobile"
static let plaidEnvironment = "production"
```

2. **Archive and upload to App Store Connect**

## Integration Verification Checklist

- [ ] Web app builds successfully with new mobile APIs
- [ ] Mobile health endpoint returns 200 OK
- [ ] CORS headers are present for mobile endpoints
- [ ] iOS project compiles without errors
- [ ] Authentication flow works end-to-end
- [ ] Data models match between TypeScript and Swift
- [ ] API responses are properly decoded in iOS app
- [ ] Production URLs configured correctly

## Notes

- Both apps share the same Supabase database
- iOS app makes HTTP requests to Next.js API routes
- All authentication is handled by Supabase
- Mobile APIs have CORS support for cross-origin requests