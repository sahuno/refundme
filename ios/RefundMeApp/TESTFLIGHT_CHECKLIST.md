# TestFlight Preparation Checklist

## 1. ✅ API Configuration (Already Done)
- AppConfig.swift is already pointing to production URL: `https://refundme-blond.vercel.app/api`
- No changes needed here

## 2. 🔧 Build Configuration
In Xcode:
- [ ] Change build scheme from Debug to Release
- [ ] Select "Any iOS Device (arm64)" as the destination (not a simulator)

## 3. 📱 App Settings
- [ ] Update Bundle Identifier if needed (must match App Store Connect)
- [ ] Increment Build Number (must be unique for each TestFlight upload)
- [ ] Set Version Number (e.g., 1.0.0)

## 4. 🔐 Code Signing
- [ ] Ensure you have a valid Apple Developer account
- [ ] Set Team in Signing & Capabilities
- [ ] Use "Automatically manage signing" or configure provisioning profiles

## 5. 🎨 App Assets
- [ ] Add App Icon (all required sizes in Assets.xcassets)
- [ ] Add Launch Screen if not present
- [ ] Ensure all image assets are included

## 6. 📝 Info.plist Updates
Check these keys exist:
- [ ] NSCameraUsageDescription (if using camera for receipts)
- [ ] NSPhotoLibraryUsageDescription (if accessing photos)
- [ ] App Transport Security settings (should be fine with HTTPS URLs)

## 7. 🏗️ Archive & Upload
1. In Xcode: Product > Archive
2. Once archived: Window > Organizer
3. Select archive and click "Distribute App"
4. Choose "App Store Connect" > "Upload"
5. Follow the wizard to upload to TestFlight

## 8. 🧪 In App Store Connect
- [ ] Add TestFlight test information
- [ ] Add internal/external testers
- [ ] Submit for Beta App Review (for external testers)

## 9. 🚨 Common Issues to Check
- [ ] Remove any localhost references
- [ ] Ensure all API endpoints use HTTPS
- [ ] Remove any debug console.log statements
- [ ] Test all features work with production API
- [ ] Ensure Supabase credentials are correct

## 10. 🔍 Pre-Upload Testing
Before uploading:
- [ ] Clean build folder (Shift+Cmd+K)
- [ ] Delete app from device/simulator
- [ ] Fresh install and test all features
- [ ] Test on multiple device sizes

## Current Status
✅ API URLs are already configured for production
✅ Supabase credentials are set
⚠️ Need to add App Icons
⚠️ Need to increment build/version numbers
⚠️ Need to configure code signing