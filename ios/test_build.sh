#!/bin/bash

# Script to test iOS build and capture errors
cd /Users/joycemaryamponsem/sta/apps/refundme/ios/RefundMeApp

# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData/RefundMeApp-*

# Build the project and capture output
xcodebuild -project RefundMeApp.xcodeproj \
           -scheme RefundMeApp \
           -configuration Debug \
           -sdk iphonesimulator \
           -derivedDataPath build \
           build 2>&1 | tee build_output.txt

# Check if build succeeded
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Build succeeded!"
else
    echo "❌ Build failed. Check build_output.txt for errors."
    # Extract just the error lines
    grep -E "(error:|warning:)" build_output.txt > build_errors.txt
    echo "Errors saved to build_errors.txt"
fi