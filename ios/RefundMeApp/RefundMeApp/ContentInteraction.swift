import Foundation

// MARK: - Content Interaction Model
struct ContentInteraction: Codable, Identifiable {
    let id: String
    let userId: String
    let contentId: String
    let interactionType: InteractionType
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case contentId = "content_id"
        case interactionType = "interaction_type"
        case createdAt = "created_at"
    }
}

// MARK: - Interaction Type
enum InteractionType: String, Codable {
    case view = "view"
    case like = "like"
    case bookmark = "bookmark"
}