# RefundMe iOS App

This is the native iOS app for RefundMe, built with SwiftUI and integrated with the Next.js web application backend.

## Setup Instructions

### Prerequisites

- Xcode 15.0+ 
- iOS 16.0+ target
- macOS 13.0+ (for development)

### 1. Create Xcode Project

Since you cannot create an Xcode project programmatically, follow these manual steps:

1. Open Xcode
2. Create a new project → iOS App
3. **Product Name**: RefundMe
4. **Organization Identifier**: com.refundme (or your preference)
5. **Interface**: SwiftUI
6. **Language**: Swift
7. **Use Core Data**: No
8. **Include Tests**: Yes

### 2. Add Swift Package Dependencies

In Xcode, add these package dependencies:

1. File → Add Package Dependencies
2. Add each package URL:

```
https://github.com/supabase/supabase-swift.git (Version: 2.5.0+)
https://github.com/plaid/plaid-link-ios.git (Version: 4.7.0+)
```

### 3. Project Structure

Copy all the Swift files from this `RefundMe/` directory into your Xcode project, maintaining the folder structure:

- `App/` - App entry point and main views
- `Models/` - Data models matching your database schema
- `Views/` - SwiftUI views organized by feature
- `ViewModels/` - MVVM view models
- `Services/` - API and data services
- `Utils/` - Utility files and extensions
- `Config/` - Configuration files

### 4. Update Environment Configuration

Edit `Config/Environment.swift` and replace the placeholder values:

```swift
static let supabaseURL = "YOUR_ACTUAL_SUPABASE_URL"
static let supabaseAnonKey = "YOUR_ACTUAL_SUPABASE_ANON_KEY"
static let apiBaseURL = "https://your-refundme-app.vercel.app/api"
static let mobileAPIBaseURL = "https://your-refundme-app.vercel.app/api/mobile"
```

For local development:
```swift
static let apiBaseURL = "http://localhost:3000/api"
static let mobileAPIBaseURL = "http://localhost:3000/api/mobile"
```

### 5. Build and Run

1. Select your target device/simulator
2. Build and run (⌘+R)

## Features

- ✅ Supabase authentication
- ✅ Transaction list with AI analysis
- ✅ Reimbursement request creation
- ✅ Dashboard with quick stats
- ✅ Settings and profile management
- 🚧 Plaid Link integration (requires additional setup)
- 🚧 PDF generation and viewing
- 🚧 Push notifications

## Development Notes

- The app uses MVVM architecture with SwiftUI
- All API calls go through the web app's endpoints
- Authentication is handled by Supabase
- Data models match the PostgreSQL database schema

## Testing

The app includes basic integration tests in `RefundMeTests/`. To run tests:

1. Select the test scheme
2. Run tests (⌘+U)

## Deployment

For App Store deployment:

1. Update `Environment.swift` with production URLs
2. Archive the app (Product → Archive)
3. Upload to App Store Connect
4. Submit for review

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all Swift Package dependencies are properly added
2. **Network Errors**: Check that your web app is running and accessible
3. **Authentication Issues**: Verify Supabase configuration matches web app

### Local Development

For local development with the web app running on localhost:3000:

1. Update Environment.swift URLs to point to localhost
2. Ensure your web app has the mobile API endpoints running
3. Test the `/api/mobile/health` endpoint first

## API Integration

The iOS app communicates with these web app endpoints:

- `GET /api/mobile/health` - Health check
- `POST /api/mobile/auth` - Authentication
- `POST /api/mobile/transactions/analyze` - AI analysis
- `POST /api/plaid/create-link-token` - Plaid integration
- `POST /api/plaid/exchange-token` - Token exchange

All endpoints support CORS for mobile access.