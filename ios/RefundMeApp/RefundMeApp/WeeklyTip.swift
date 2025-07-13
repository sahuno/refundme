import Foundation

// MARK: - Weekly Tip Model
struct WeeklyTip: Codable, Identifiable {
    let id: String
    let weekStart: Date
    let title: String
    let content: String
    let category: ContentCategory
    let department: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case weekStart = "week_start"
        case title
        case content
        case category
        case department
    }
}