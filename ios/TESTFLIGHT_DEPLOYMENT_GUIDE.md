# TestFlight Deployment Guide for RefundMe iOS App

## Prerequisites
- [ ] Apple Developer Account ($99/year)
- [ ] Xcode installed and updated
- [ ] App Store Connect access
- [ ] Valid Apple ID configured in Xcode

## Step 1: Code Preparation ✅

### Already Completed:
- ✅ API URLs pointing to production (`https://refundme-blond.vercel.app/api`)
- ✅ Supabase credentials configured
- ✅ All features implemented and tested

### Still Needed:
- [ ] Remove any `print()` or `console.log` debug statements
- [ ] Remove any hardcoded test data
- [ ] Ensure error handling shows user-friendly messages

## Step 2: Xcode Project Settings

### 2.1 Target Settings
1. Select your project in navigator
2. Select "RefundMeApp" target
3. Go to "General" tab

**Update these fields:**
- [ ] **Display Name**: RefundMe
- [ ] **Bundle Identifier**: com.yourcompany.refundme (must be unique)
- [ ] **Version**: 1.0.0 (user-facing version)
- [ ] **Build**: 1 (increment for each TestFlight upload)

### 2.2 Deployment Info
- [ ] **iOS Deployment Target**: Set to iOS 16.0 or higher
- [ ] **Device**: iPhone (uncheck iPad if not supporting tablets)
- [ ] **Device Orientation**: Portrait only (unless you support landscape)

## Step 3: App Assets

### 3.1 App Icons (Required!)
1. Open `Assets.xcassets`
2. Click on "AppIcon"
3. Add icons for all required sizes:
   - 20pt (2x, 3x)
   - 29pt (2x, 3x)
   - 40pt (2x, 3x)
   - 60pt (2x, 3x)
   - 1024pt (1x) - App Store icon

**Icon Requirements:**
- PNG format
- No transparency
- No rounded corners (iOS adds them)
- 1024x1024 for App Store

### 3.2 Launch Screen
- [ ] Create or verify LaunchScreen exists
- [ ] Should show app logo/branding
- [ ] Keep it simple (loads quickly)

## Step 4: Info.plist Configuration

Add these privacy descriptions if not present:
```xml
<key>NSCameraUsageDescription</key>
<string>RefundMe needs camera access to scan receipts for reimbursements.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>RefundMe needs photo library access to upload receipt images.</string>
```

## Step 5: Code Signing

### 5.1 Automatic Signing (Recommended)
1. Select target → "Signing & Capabilities"
2. Check "Automatically manage signing"
3. Select your Team from dropdown
4. Xcode will create provisioning profiles

### 5.2 Capabilities
Ensure these are enabled if used:
- [ ] Push Notifications (if implementing)
- [ ] Background Modes (if needed)
- [ ] Keychain Sharing (for secure storage)

## Step 6: Build Configuration

### 6.1 Scheme Settings
1. Click scheme selector (next to device selector)
2. Edit Scheme
3. Run → Info → Build Configuration: **Release**
4. Archive → Build Configuration: **Release**

### 6.2 Build Settings Check
- [ ] Swift Language Version: Set appropriately
- [ ] Build Active Architecture Only: No (for Release)
- [ ] Strip Debug Symbols: Yes (for Release)

## Step 7: Final Testing

### 7.1 Clean Build
1. Product → Clean Build Folder (Shift+Cmd+K)
2. Delete app from all test devices
3. Build and run on physical device (not simulator)

### 7.2 Test Checklist
- [ ] Login/Signup flow works
- [ ] Can connect bank account
- [ ] Can view transactions
- [ ] Can create reimbursement request
- [ ] Educational content loads
- [ ] Admin features work (if admin account)
- [ ] All API calls succeed
- [ ] No crashes or freezes

## Step 8: Archive for TestFlight

### 8.1 Create Archive
1. Select "Any iOS Device (arm64)" as destination
2. Product → Archive
3. Wait for build to complete (few minutes)

### 8.2 Upload to App Store Connect
1. Window → Organizer
2. Select your archive
3. Click "Distribute App"
4. Choose:
   - App Store Connect
   - Upload
   - Next through all screens
   - Upload

## Step 9: App Store Connect Setup

### 9.1 TestFlight Tab
1. Go to App Store Connect
2. Select your app
3. Go to TestFlight tab
4. Build will appear after processing (~15 min)

### 9.2 Test Information
Add required information:
- [ ] What to Test
- [ ] App Description
- [ ] Email
- [ ] Contact Info

### 9.3 Export Compliance
- [ ] Answer encryption questions (usually "No" for basic apps)

## Step 10: Add Testers

### 10.1 Internal Testing (up to 100 testers)
- Add Apple IDs of testers
- No review required
- Instant availability

### 10.2 External Testing (up to 10,000 testers)
- Create test group
- Add testers by email
- Requires Beta App Review (24-48 hours)

## Common Issues & Solutions

### Build Fails
- Check all required fields are filled
- Ensure unique bundle identifier
- Verify provisioning profiles

### Upload Fails
- Increment build number
- Check internet connection
- Verify Apple ID permissions

### App Crashes on TestFlight
- Check for Release-specific issues
- Test with Release configuration locally
- Review crash logs in App Store Connect

## Post-Upload Checklist

- [ ] Build processed in App Store Connect (~15 min)
- [ ] Export compliance completed
- [ ] Test information added
- [ ] Internal testers added
- [ ] Test on multiple devices
- [ ] Gather feedback
- [ ] Fix issues and re-upload with incremented build number

## Important Notes

1. **Build Numbers**: Must increment for each upload (1, 2, 3...)
2. **Version Numbers**: Only change for significant updates (1.0.0, 1.1.0...)
3. **Processing Time**: Builds take 15-30 minutes to process
4. **Beta Review**: External testing requires review (24-48 hours)
5. **Expiration**: TestFlight builds expire after 90 days

## Ready to Deploy? 🚀

Once all items are checked, you're ready for TestFlight! Remember to test thoroughly with internal testers before expanding to external testers.