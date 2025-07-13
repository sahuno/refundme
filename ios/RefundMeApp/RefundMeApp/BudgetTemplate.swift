import Foundation

// MARK: - Budget Template Model
struct BudgetTemplate: Codable, Identifiable {
    let id: String
    let name: String
    let department: String
    let categories: [String: BudgetCategory]
    let totalBudget: Decimal
    let isActive: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case department
        case categories
        case totalBudget = "total_budget"
        case isActive = "is_active"
    }
}

// MARK: - Budget Category
struct BudgetCategory: Codable {
    let name: String
    let suggestedAmount: Decimal
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case name
        case suggestedAmount = "suggested_amount"
        case description
    }
}