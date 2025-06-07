import Foundation

struct Constants {
    // App configuration
    static let appName = "RefundMe"
    static let appVersion = "1.0.0"
    static let buildNumber = "1"
    
    // Expense categories
    static let expenseCategories = [
        "Books & Educational Materials",
        "Research Supplies & Equipment",
        "Academic Software & Technology",
        "Conference Fees & Academic Travel",
        "Office Supplies for Academic Work",
        "Food & Dining",
        "Other"
    ]
    
    // Date formatters
    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
    
    static let isoDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}