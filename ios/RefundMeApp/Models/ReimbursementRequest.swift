import Foundation

struct ReimbursementRequest: Identifiable, Codable {
    let id: UUID
    let userId: UUID
    let status: ReimbursementStatus
    let totalAmount: Double
    let submittedAt: Date
    let items: [ReimbursementItem]?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case status
        case totalAmount = "total_amount"
        case submittedAt = "submitted_at"
        case items
    }
}

enum ReimbursementStatus: String, Codable {
    case pending = "pending"
    case approved = "approved"
    case rejected = "rejected"
    case draft = "draft"
    case submitted = "submitted"
}

struct ReimbursementItem: Identifiable, Codable {
    let id: UUID
    let requestId: UUID
    let transactionId: String?
    let description: String
    let amount: Double
    let date: Date
    let category: String
    let isManualEntry: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case requestId = "request_id"
        case transactionId = "transaction_id"
        case description
        case amount
        case date
        case category
        case isManualEntry = "is_manual_entry"
    }
}