import Foundation

// MARK: - Educational Content Model
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
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case slug
        case content
        case category
        case tags
        case featured
        case authorId = "author_id"
        case viewCount = "view_count"
        case publishedAt = "published_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Content Category
enum ContentCategory: String, Codable, CaseIterable {
    case tips = "tips"
    case tax = "tax"
    case budgeting = "budgeting"
    case savings = "savings"
    case investing = "investing"
    
    var displayName: String {
        switch self {
        case .tips: return "Tips"
        case .tax: return "Tax"
        case .budgeting: return "Budgeting"
        case .savings: return "Savings"
        case .investing: return "Investing"
        }
    }
    
    var iconName: String {
        switch self {
        case .tips: return "lightbulb.fill"
        case .tax: return "doc.text.fill"
        case .budgeting: return "chart.pie.fill"
        case .savings: return "banknote.fill"
        case .investing: return "chart.line.uptrend.xyaxis"
        }
    }
    
    var color: String {
        switch self {
        case .tips: return "blue"
        case .tax: return "purple"
        case .budgeting: return "green"
        case .savings: return "orange"
        case .investing: return "red"
        }
    }
}