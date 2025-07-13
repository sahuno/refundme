# Local Development Guide for iOS App

## Current Setup ✅
1. **Web Server Running**: http://localhost:3001
2. **iOS App Configured**: Points to localhost:3001

## To Test the iOS App:

1. **Keep the web server running** (already started)
   ```bash
   PORT=3001 npm run dev
   ```

2. **In Xcode**:
   - Clean build folder: Shift+Cmd+K
   - Select iPhone simulator
   - Run the app: Cmd+R

3. **Sign In**:
   - Use your existing credentials
   - The app will connect to http://localhost:3001/api

## Troubleshooting

If you still see "Unable to connect to server":

### Option 1: Check server is running
- Terminal should show: "Ready in XXXms"
- Try accessing http://localhost:3001 in Safari

### Option 2: For physical device testing
You'll need to use your Mac's IP address:
1. Update AppConfig.swift:
   ```swift
   static let apiBaseURL = "http://192.168.1.35:3001/api"
   static let mobileAPIBaseURL = "http://192.168.1.35:3001/api/mobile"
   ```
2. Make sure your iPhone and Mac are on the same WiFi network

### Option 3: Deploy to Vercel
If you need a new deployment:
```bash
npm run deploy:web
```
Then update AppConfig.swift with the new URL.

## Current Status
- ✅ Web server is running on port 3001
- ✅ iOS app configured for localhost
- ✅ Ready to test sign-in