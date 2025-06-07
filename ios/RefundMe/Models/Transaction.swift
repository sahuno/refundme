import Foundation

struct Transaction: Identifiable, Codable {
    let id: String
    let userId: UUID
    let accountId: String
    let amount: Double
    let date: Date
    let name: String
    let merchantName: String?
    let category: [String]?
    let pending: Bool
    let isEligible: Bool?
    let aiAnalysis: AIAnalysis?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case accountId = "account_id"
        case amount
        case date
        case name
        case merchantName = "merchant_name"
        case category
        case pending
        case isEligible = "is_eligible"
        case aiAnalysis = "ai_analysis"
        case createdAt = "created_at"
    }
}

struct AIAnalysis: Codable {
    let eligible: Bool
    let confidence: Double
    let reason: String
    let category: String
}