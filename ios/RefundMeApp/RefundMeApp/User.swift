import Foundation

struct User: Identifiable, Codable {
    let id: UUID
    let email: String
    let fullName: String?
    let department: String?
    let adminEmail: String?
    let role: String?
    let isAdmin: Bool
    let isSuperAdmin: Bool
    let adminDepartment: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
        case department
        case adminEmail = "admin_email"
        case role
        case isAdmin = "is_admin"
        case isSuperAdmin = "is_super_admin"
        case adminDepartment = "admin_department"
        case createdAt = "created_at"
    }
    
    // Computed property to check if user has any admin privileges
    var hasAdminAccess: Bool {
        return isAdmin || isSuperAdmin || role == "administrator" || role == "accountant"
    }
}