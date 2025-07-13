import XCTest
@testable import RefundMeApp

final class ModelTests: XCTestCase {
    
    // MARK: - User Model Tests
    
    func testUserInitialization() {
        let user = User(
            id: UUID(),
            email: "test@university.edu",
            fullName: "Test User",
            department: "STEM",
            adminEmail: "admin@university.edu",
            role: "student",
            isAdmin: false,
            isSuperAdmin: false,
            adminDepartment: nil,
            createdAt: Date()
        )
        
        XCTAssertEqual(user.email, "test@university.edu")
        XCTAssertEqual(user.fullName, "Test User")
        XCTAssertEqual(user.department, "STEM")
        XCTAssertFalse(user.hasAdminAccess)
    }
    
    func testAdminUserAccess() {
        let adminUser = User(
            id: UUID(),
            email: "admin@university.edu",
            fullName: "Admin User",
            department: nil,
            adminEmail: nil,
            role: "administrator",
            isAdmin: true,
            isSuperAdmin: false,
            adminDepartment: "STEM",
            createdAt: Date()
        )
        
        XCTAssertTrue(adminUser.hasAdminAccess)
        XCTAssertEqual(adminUser.adminDepartment, "STEM")
    }
    
    func testSuperAdminAccess() {
        let superAdmin = User(
            id: UUID(),
            email: "super@university.edu",
            fullName: "Super Admin",
            department: nil,
            adminEmail: nil,
            role: "administrator",
            isAdmin: true,
            isSuperAdmin: true,
            adminDepartment: nil,
            createdAt: Date()
        )
        
        XCTAssertTrue(superAdmin.hasAdminAccess)
        XCTAssertTrue(superAdmin.isSuperAdmin)
    }
    
    // MARK: - Educational Content Tests
    
    func testEducationalContentInitialization() {
        let content = EducationalContent(
            id: "test-id",
            title: "Budgeting 101",
            slug: "budgeting-101",
            content: "Learn the basics of budgeting...",
            category: .budgeting,
            tags: ["beginner", "finance", "budgeting"],
            featured: true,
            authorId: "author-123",
            viewCount: 100,
            publishedAt: Date(),
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertEqual(content.title, "Budgeting 101")
        XCTAssertEqual(content.category, .budgeting)
        XCTAssertTrue(content.featured)
        XCTAssertEqual(content.tags.count, 3)
    }
    
    func testContentCategoryProperties() {
        XCTAssertEqual(ContentCategory.tips.displayName, "Tips")
        XCTAssertEqual(ContentCategory.tax.iconName, "doc.text.fill")
        XCTAssertEqual(ContentCategory.budgeting.color, "green")
    }
    
    // MARK: - Content Interaction Tests
    
    func testContentInteraction() {
        let interaction = ContentInteraction(
            id: "interaction-1",
            userId: "user-123",
            contentId: "content-456",
            interactionType: .like,
            createdAt: Date()
        )
        
        XCTAssertEqual(interaction.interactionType, .like)
        XCTAssertEqual(interaction.userId, "user-123")
        XCTAssertEqual(interaction.contentId, "content-456")
    }
    
    // MARK: - Weekly Tip Tests
    
    func testWeeklyTip() {
        let tip = WeeklyTip(
            id: "tip-1",
            weekStart: Date(),
            title: "Save on Textbooks",
            content: "Consider buying used textbooks or renting them...",
            category: .savings,
            department: "STEM"
        )
        
        XCTAssertEqual(tip.title, "Save on Textbooks")
        XCTAssertEqual(tip.category, .savings)
        XCTAssertEqual(tip.department, "STEM")
    }
    
    // MARK: - Reimbursement Request Tests
    
    func testReimbursementRequest() {
        let request = ReimbursementRequest(
            id: UUID(),
            userId: UUID(),
            status: "submitted",
            totalAmount: 250.50,
            description: "Office supplies for research",
            adminEmail: "admin@university.edu",
            items: nil,
            createdAt: Date(),
            updatedAt: Date(),
            submittedAt: Date(),
            approvedAt: nil,
            rejectedAt: nil,
            rejectionReason: nil,
            pdfUrl: nil,
            userName: "John Doe",
            userEmail: "john@university.edu"
        )
        
        XCTAssertEqual(request.status, "submitted")
        XCTAssertEqual(request.totalAmount, 250.50)
        XCTAssertNotNil(request.submittedAt)
        XCTAssertNil(request.approvedAt)
    }
    
    // MARK: - JSON Encoding/Decoding Tests
    
    func testUserCodable() throws {
        let user = User(
            id: UUID(),
            email: "test@example.com",
            fullName: "Test User",
            department: "STEM",
            adminEmail: nil,
            role: "student",
            isAdmin: false,
            isSuperAdmin: false,
            adminDepartment: nil,
            createdAt: Date()
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(user)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let decodedUser = try decoder.decode(User.self, from: data)
        
        XCTAssertEqual(user.id, decodedUser.id)
        XCTAssertEqual(user.email, decodedUser.email)
        XCTAssertEqual(user.role, decodedUser.role)
    }
    
    func testEducationalContentCodable() throws {
        let content = EducationalContent(
            id: "test-123",
            title: "Test Article",
            slug: "test-article",
            content: "Test content",
            category: .tips,
            tags: ["test", "sample"],
            featured: false,
            authorId: "author-123",
            viewCount: 0,
            publishedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(content)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let decodedContent = try decoder.decode(EducationalContent.self, from: data)
        
        XCTAssertEqual(content.id, decodedContent.id)
        XCTAssertEqual(content.title, decodedContent.title)
        XCTAssertEqual(content.category, decodedContent.category)
    }
}

// MARK: - ViewModel Tests

final class ViewModelTests: XCTestCase {
    
    @MainActor
    func testEducationViewModelInitialization() {
        let viewModel = EducationViewModel()
        
        XCTAssertTrue(viewModel.featuredContent.isEmpty)
        XCTAssertTrue(viewModel.allContent.isEmpty)
        XCTAssertNil(viewModel.selectedCategory)
        XCTAssertEqual(viewModel.searchText, "")
        XCTAssertFalse(viewModel.isLoading)
    }
    
    @MainActor
    func testArticleViewModelInitialization() {
        let viewModel = ArticleViewModel()
        
        XCTAssertNil(viewModel.article)
        XCTAssertTrue(viewModel.relatedArticles.isEmpty)
        XCTAssertFalse(viewModel.isLiked)
        XCTAssertFalse(viewModel.isBookmarked)
        XCTAssertFalse(viewModel.isLoading)
    }
    
    @MainActor
    func testAdminViewModelInitialization() {
        let viewModel = AdminViewModel()
        
        XCTAssertTrue(viewModel.pendingRequests.isEmpty)
        XCTAssertTrue(viewModel.allRequests.isEmpty)
        XCTAssertNil(viewModel.departmentStats)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertFalse(viewModel.hasPendingRequests)
    }
}