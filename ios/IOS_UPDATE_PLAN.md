# iOS App Update Plan - Financial Education Hub & Admin Features

## Overview
This plan outlines how to incorporate all the web app updates from July 10, 2025 into the iOS app, including the Financial Education Hub, enhanced admin structure, and improved user experience features.

## Phase 1: Data Models & Services (Week 1)

### 1.1 New Data Models
Create Swift models matching the new database tables:

**Models/EducationalContent.swift**
```swift
struct EducationalContent: Codable, Identifiable {
    let id: String
    let title: String
    let slug: String
    let content: String
    let category: ContentCategory
    let tags: [String]
    let featured: Bool
    let authorId: String
    let viewCount: Int
    let publishedAt: Date?
    let createdAt: Date
    let updatedAt: Date
}

enum ContentCategory: String, Codable, CaseIterable {
    case tips = "tips"
    case tax = "tax"
    case budgeting = "budgeting"
    case savings = "savings"
    case investing = "investing"
}
```

**Models/ContentInteraction.swift**
```swift
struct ContentInteraction: Codable {
    let id: String
    let userId: String
    let contentId: String
    let interactionType: InteractionType
    let createdAt: Date
}

enum InteractionType: String, Codable {
    case view = "view"
    case like = "like"
    case bookmark = "bookmark"
}
```

**Models/WeeklyTip.swift**
```swift
struct WeeklyTip: Codable {
    let id: String
    let weekStart: Date
    let title: String
    let content: String
    let category: ContentCategory
    let department: String?
}
```

**Models/BudgetTemplate.swift**
```swift
struct BudgetTemplate: Codable {
    let id: String
    let name: String
    let department: String
    let categories: [String: BudgetCategory]
    let totalBudget: Decimal
    let isActive: Bool
}

struct BudgetCategory: Codable {
    let name: String
    let suggestedAmount: Decimal
    let description: String?
}
```

### 1.2 Update User Model
Update the existing User model to include admin fields:

**Models/User.swift**
```swift
struct User: Codable {
    // ... existing fields ...
    let isAdmin: Bool
    let isSuperAdmin: Bool
    let adminDepartment: String?
    let department: String
}
```

### 1.3 API Service Extensions
Add new API endpoints to APIService.swift:

```swift
// Educational Content
func fetchEducationalContent(category: ContentCategory? = nil, featured: Bool? = nil) async throws -> [EducationalContent]
func fetchArticle(slug: String) async throws -> EducationalContent
func trackInteraction(contentId: String, type: InteractionType) async throws
func fetchWeeklyTip() async throws -> WeeklyTip?

// Admin Functions (only for admin users)
func fetchDepartmentRequests() async throws -> [ReimbursementRequest]
func approveRequest(requestId: String, comments: String?) async throws
func rejectRequest(requestId: String, reason: String) async throws
func fetchDepartmentStats() async throws -> DepartmentStats

// Content Management (super admin only)
func createContent(_ content: EducationalContent) async throws
func updateContent(_ content: EducationalContent) async throws
func deleteContent(contentId: String) async throws
```

## Phase 2: View Models (Week 1-2)

### 2.1 Educational Content ViewModels

**ViewModels/EducationViewModel.swift**
```swift
@MainActor
class EducationViewModel: ObservableObject {
    @Published var featuredContent: [EducationalContent] = []
    @Published var allContent: [EducationalContent] = []
    @Published var selectedCategory: ContentCategory?
    @Published var searchText = ""
    @Published var isLoading = false
    @Published var weeklyTip: WeeklyTip?
    
    func loadContent() async
    func searchContent() async
    func loadWeeklyTip() async
    func trackView(for content: EducationalContent) async
    func toggleInteraction(_ type: InteractionType, for content: EducationalContent) async
}
```

**ViewModels/ArticleViewModel.swift**
```swift
@MainActor
class ArticleViewModel: ObservableObject {
    @Published var article: EducationalContent?
    @Published var relatedArticles: [EducationalContent] = []
    @Published var isLiked = false
    @Published var isBookmarked = false
    @Published var isLoading = false
    
    func loadArticle(slug: String) async
    func toggleLike() async
    func toggleBookmark() async
    func shareArticle()
}
```

### 2.2 Admin ViewModels

**ViewModels/AdminViewModel.swift**
```swift
@MainActor
class AdminViewModel: ObservableObject {
    @Published var pendingRequests: [ReimbursementRequest] = []
    @Published var departmentStats: DepartmentStats?
    @Published var selectedRequest: ReimbursementRequest?
    @Published var isLoading = false
    
    func loadDepartmentRequests() async
    func approveRequest(_ request: ReimbursementRequest, comments: String?) async
    func rejectRequest(_ request: ReimbursementRequest, reason: String) async
    func loadStats() async
}
```

**ViewModels/ContentManagementViewModel.swift** (Super Admin only)
```swift
@MainActor
class ContentManagementViewModel: ObservableObject {
    @Published var content: [EducationalContent] = []
    @Published var editingContent: EducationalContent?
    @Published var isCreating = false
    @Published var isLoading = false
    
    func loadAllContent() async
    func createContent(_ content: EducationalContent) async
    func updateContent(_ content: EducationalContent) async
    func deleteContent(_ content: EducationalContent) async
    func toggleFeatured(_ content: EducationalContent) async
}
```

## Phase 3: Views & UI (Week 2-3)

### 3.1 Educational Hub Views

**Views/Education/EducationHubView.swift**
- Main education hub with featured articles
- Category filters
- Search functionality
- Weekly tip banner

**Views/Education/ArticleDetailView.swift**
- Markdown rendering for article content
- Like/bookmark/share actions
- Related articles section
- View count display

**Views/Education/Components/ContentCardView.swift**
- Reusable card component for article listings
- Category badge
- View count
- Featured indicator

**Views/Education/Components/WeeklyTipView.swift**
- Banner component for weekly tips
- Dismissible with animation
- Category-specific styling

### 3.2 Admin Views

**Views/Admin/AdminDashboardView.swift**
- Department statistics
- Pending requests count
- Quick actions
- Only visible to users with admin roles

**Views/Admin/DepartmentRequestsView.swift**
- List of requests from admin's department
- Filtering and sorting
- Approve/reject actions
- Comments/reason modal

**Views/Admin/RequestDetailView.swift**
- Detailed request view
- Transaction list
- PDF preview
- Approval/rejection form

### 3.3 Super Admin Views

**Views/Admin/ContentManagementView.swift**
- List all educational content
- Create/edit/delete actions
- Toggle featured status
- Search and filter

**Views/Admin/ContentEditorView.swift**
- Markdown editor
- Live preview
- Category and tag management
- Publish/draft toggle

### 3.4 Update Existing Views

**Update ContentView.swift**
```swift
struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        if authViewModel.isAuthenticated {
            if authViewModel.currentUser?.isAdmin == true {
                AdminTabView() // New admin-specific tab view
            } else {
                StudentTabView() // Regular user tab view
            }
        } else {
            LoginView()
        }
    }
}
```

**Create StudentTabView.swift**
```swift
struct StudentTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
            
            EducationHubView() // NEW
                .tabItem {
                    Label("Learn", systemImage: "book.fill")
                }
            
            TransactionListView()
                .tabItem {
                    Label("Transactions", systemImage: "creditcard.fill")
                }
            
            ReimbursementListView()
                .tabItem {
                    Label("Requests", systemImage: "doc.text.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}
```

**Create AdminTabView.swift**
```swift
struct AdminTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        TabView {
            AdminDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar.fill")
                }
            
            DepartmentRequestsView()
                .tabItem {
                    Label("Requests", systemImage: "doc.badge.clock")
                }
            
            if authViewModel.currentUser?.isSuperAdmin == true {
                ContentManagementView()
                    .tabItem {
                        Label("Content", systemImage: "text.book.closed.fill")
                    }
            }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}
```

## Phase 4: Features & Functionality (Week 3-4)

### 4.1 Markdown Rendering
- Add markdown parsing library (swift-markdown or similar)
- Create MarkdownView component
- Support for basic formatting (bold, italic, headers, lists)

### 4.2 Offline Support
- Cache educational content locally using CoreData
- Sync interactions when online
- Download articles for offline reading
- Show offline indicator

### 4.3 Push Notifications
- Weekly tip notifications
- New content notifications
- Request approval/rejection notifications for students
- New request notifications for admins

### 4.4 Search & Filtering
- Full-text search using CoreData
- Filter by category, tags
- Sort by date, popularity
- Save search preferences

### 4.5 Sharing
- Native iOS share sheet
- Deep linking to articles
- Social media integration

## Phase 5: Testing & Polish (Week 4)

### 5.1 Unit Tests
- Test all ViewModels
- Test API service methods
- Test data models
- Test offline functionality

### 5.2 UI Tests
- Test navigation flows
- Test admin workflows
- Test content interactions
- Test error states

### 5.3 Performance
- Optimize image loading
- Implement lazy loading for content lists
- Cache API responses
- Minimize network requests

### 5.4 Accessibility
- VoiceOver support
- Dynamic Type support
- Color contrast compliance
- Keyboard navigation

## Implementation Priority

1. **High Priority (Must Have)**
   - Educational content viewing
   - Basic admin request management
   - Updated navigation structure

2. **Medium Priority (Should Have)**
   - Content search and filtering
   - Weekly tips
   - Content interactions (like/bookmark)
   - Admin statistics

3. **Low Priority (Nice to Have)**
   - Offline support
   - Push notifications
   - Content management for super admins
   - Budget templates

## Technical Considerations

1. **API Compatibility**
   - Use the existing mobile API endpoints where possible
   - Add new mobile-specific endpoints if needed
   - Handle CORS for development

2. **State Management**
   - Use @StateObject and @EnvironmentObject appropriately
   - Consider using Combine for complex flows
   - Implement proper error handling

3. **Security**
   - Store admin status securely in Keychain
   - Validate admin permissions before showing UI
   - Use proper authentication headers

4. **Performance**
   - Implement pagination for content lists
   - Use AsyncImage for remote images
   - Cache frequently accessed data

## Development Setup

1. Update Package.swift dependencies:
   - Markdown parsing library
   - Any additional UI components

2. Update Environment.swift:
   - Add education API endpoints
   - Add admin API endpoints

3. Update APIService.swift:
   - Add authentication headers
   - Handle new response types

4. Create development test data:
   - Sample educational content
   - Test admin accounts
   - Mock department data

## Estimated Timeline

- **Week 1**: Data models and services
- **Week 2**: ViewModels and basic views
- **Week 3**: Complete UI implementation
- **Week 4**: Testing and polish
- **Total**: 4 weeks for full feature parity

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create feature branches for each phase
4. Begin with Phase 1 implementation
5. Regular testing on actual devices
6. Beta testing with select users
7. App Store submission