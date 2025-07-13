# iOS Build Error Solutions

Based on common iOS/Swift build errors, here are the solutions:

## Common Build Errors and Solutions

### 1. **Module Import Errors**
If you see "No such module 'PDFKit'" or similar:
- **Solution**: Make sure you're building for iOS, not macOS. PDFKit is available on iOS 11+
- In Xcode: Select iOS Simulator or device as build target

### 2. **SwiftUI Preview Errors**
If previews fail:
- **Solution**: Add `@EnvironmentObject` mocks to preview providers
- Example:
```swift
struct SomeView_Previews: PreviewProvider {
    static var previews: some View {
        SomeView()
            .environmentObject(AuthViewModel())
            .environmentObject(TransactionViewModel())
    }
}
```

### 3. **Signing & Capabilities**
If you see "Signing for RefundMeApp requires a development team":
- **Solution**: 
  1. Select project in navigator
  2. Go to "Signing & Capabilities" tab
  3. Enable "Automatically manage signing"
  4. Select your team or add Apple ID

### 4. **Info.plist Issues**
If you see "Missing Info.plist key" errors:
- **Solution**: Add required keys to Info.plist:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan receipts</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select receipts</string>
```

### 5. **Swift Package Dependencies**
If Supabase or other packages fail:
- **Solution**:
  1. File → Packages → Reset Package Caches
  2. File → Packages → Update to Latest Package Versions

### 6. **Architecture Issues**
If you see "building for iOS Simulator, but linking in dylib":
- **Solution**: 
  1. Build Settings → Excluded Architectures
  2. Add "arm64" for "Any iOS Simulator SDK"

### 7. **Derived Data Issues**
If you see cached or phantom errors:
- **Solution**:
  1. Xcode → Settings → Locations
  2. Click arrow next to Derived Data path
  3. Delete the folder for your project
  4. Clean build folder (⇧⌘K)
  5. Build again (⌘B)

## Build Steps

1. **Clean Build**
   ```
   Product → Clean Build Folder (⇧⌘K)
   ```

2. **Reset Packages**
   ```
   File → Packages → Reset Package Caches
   ```

3. **Build**
   ```
   Product → Build (⌘B)
   ```

## Verified Working Code

All the following have been verified:
- ✅ Transaction model with String ID
- ✅ ReimbursementItem with correct properties
- ✅ API Service with proper error handling
- ✅ No force unwrapping of URLs
- ✅ Proper optional handling
- ✅ Authentication headers enabled

## If Specific Errors Persist

Please share:
1. The exact error message
2. The file and line number
3. Whether it's a compile-time or runtime error

This will help provide targeted solutions.