# iOS App Missing Features TODO List

## 🚨 Critical Features (Core Functionality)

### 1. ✅ Request Submission Workflow
**Current Issue**: Can't submit requests, no manual entry, no receipt scanning
- [ ] Add manual expense entry form
- [ ] Enable transaction multi-select with checkboxes
- [ ] Add category selection/editing for transactions
- [ ] Implement notes/description field
- [ ] Add draft saving functionality
- [ ] Create submission confirmation dialog
- [ ] Fix submit API endpoint integration

### 2. ✅ PDF Generation
**Current Issue**: Can't generate PDFs for reimbursements
- [ ] Implement PDF generation using PDFKit
- [ ] Create reimbursement PDF template
- [ ] Add download/share functionality
- [ ] Integrate with submission workflow

### 3. ✅ Profile Editing
**Current Issue**: Settings show profile but can't edit
- [ ] Create profile edit form in SettingsView
- [ ] Add form fields: full name, department, student ID, admin email
- [ ] Create API endpoint for profile updates
- [ ] Add save/cancel functionality
- [ ] Show success/error messages

## 🔧 Important Features (Enhanced Functionality)

### 4. Bank Connection (Plaid Integration)
**Current Issue**: BankConnectionView is just a placeholder
- [ ] Implement Plaid Link SDK for iOS
- [ ] Create link token generation flow
- [ ] Add bank account connection UI
- [ ] Implement transaction sync
- [ ] Add disconnect bank functionality
- [ ] Show last synced timestamp

### 5. Receipt Scanning/OCR
**Current Issue**: No way to scan receipts
- [ ] Add camera/photo library access
- [ ] Implement receipt capture UI
- [ ] Create OCR API endpoint for mobile
- [ ] Parse and display extracted items
- [ ] Allow editing of extracted data

### 6. Transaction Management
**Current Issue**: Can't edit or categorize transactions
- [ ] Add category selection for transactions
- [ ] Enable bulk selection with checkboxes
- [ ] Add category editing functionality
- [ ] Improve transaction detail view

## 📊 Nice-to-Have Features

### 7. Budget/Allowance Tracking
**Current Issue**: No visibility into spending limits
- [ ] Add allowance display to dashboard
- [ ] Show used vs remaining amounts
- [ ] Add progress indicators
- [ ] Create budget warnings

### 8. Notifications System
**Current Issue**: No notifications feature
- [ ] Create notifications list view
- [ ] Add read/unread status
- [ ] Implement mark as read
- [ ] Add push notifications support
- [ ] Link to related requests

### 9. AI Transaction Analysis
**Current Issue**: API exists but no UI
- [ ] Add analyze transactions button
- [ ] Show AI suggestions UI
- [ ] Allow accepting/rejecting suggestions
- [ ] Integrate with submission flow

## 🔍 Current Blockers

### API Issues Found:
1. **Educational Content Error**: 
   - `column educational_content.published does not exist`
   - Should be `published_at` not `published`

2. **Missing Mobile Endpoints**:
   - Profile update endpoint
   - PDF generation endpoint
   - Receipt OCR endpoint

### iOS Implementation Issues:
1. **APIService**: Needs methods for new endpoints
2. **Models**: May need updates for new data
3. **ViewModels**: Need to handle new workflows
4. **Navigation**: Some features need new views

## 📋 Implementation Priority

**Phase 1** (Make app functional):
1. Fix request submission workflow
2. Add manual expense entry
3. Enable profile editing

**Phase 2** (Core features):
4. Implement PDF generation
5. Add receipt scanning
6. Fix transaction management

**Phase 3** (Enhanced experience):
7. Add Plaid integration
8. Implement notifications
9. Add budget tracking
10. Enable AI features

## 🎯 Next Steps

1. **Start with Phase 1** - These are blocking users from using the app
2. **Fix the API errors** first (educational content query)
3. **Test each feature** as implemented
4. **Ensure feature parity** with web app where possible