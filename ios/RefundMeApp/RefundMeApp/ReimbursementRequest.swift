import Foundation

struct ReimbursementRequest: Identifiable, Codable {
    let id: UUID
    let userId: UUID
    let status: String?
    let totalAmount: Decimal?
    let description: String?
    let adminEmail: String?
    let items: [ReimbursementItem]?
    let createdAt: Date
    let updatedAt: Date
    let submittedAt: Date?
    let approvedAt: Date?
    let rejectedAt: Date?
    let rejectionReason: String?
    let pdfUrl: String?
    let userName: String?
    let userEmail: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case status
        case totalAmount = "total_amount"
        case description
        case adminEmail = "admin_email"
        case items
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case submittedAt = "submitted_at"
        case approvedAt = "approved_at"
        case rejectedAt = "rejected_at"
        case rejectionReason = "rejection_reason"
        case pdfUrl = "pdf_url"
        case userName = "user_name"
        case userEmail = "user_email"
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
    let amount: Decimal
    let transactionDate: Date?
    let category: String?
    let isManualEntry: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case requestId = "request_id"
        case transactionId = "transaction_id"
        case description
        case amount
        case transactionDate = "transaction_date"
        case category
        case isManualEntry = "is_manual_entry"
    }
}