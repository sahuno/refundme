import Foundation

struct User: Identifiable, Codable {
    let id: UUID
    let email: String
    let fullName: String?
    let department: String?
    let adminEmail: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
        case department
        case adminEmail = "admin_email"
        case createdAt = "created_at"
    }
}