import Foundation

struct BankConnection: Identifiable, Codable {
    let id: String
    let userId: UUID
    let institutionName: String
    let accessToken: String?
    let itemId: String
    let createdAt: Date
    let lastSync: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case institutionName = "institution_name"
        case accessToken = "access_token"
        case itemId = "item_id"
        case createdAt = "created_at"
        case lastSync = "last_sync"
    }
}