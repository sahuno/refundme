import Foundation

class APIService {
    static let shared = APIService()
    
    private init() {}
    
    func checkHealth() async throws -> Bool {
        let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/health")!
        let request = URLRequest(url: url)
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            print("API health check failed: \(error)")
            return false
        }
    }
    
    func signInMobile(email: String, password: String) async throws -> (User, SessionData) {
        let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/auth")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password, "action": "signin"]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.authenticationFailed
        }
        
        struct AuthResponse: Codable {
            let user: SupabaseUser
            let session: SessionData
            let profile: User
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        return (authResponse.profile, authResponse.session)
    }
    
    func createLinkToken() async throws -> String {
        let url = URL(string: "\(AppConfig.apiBaseURL)/plaid/create-link-token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header if available - for now skip auth
        // request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct LinkTokenResponse: Codable {
            let linkToken: String
        }
        
        let linkResponse = try JSONDecoder().decode(LinkTokenResponse.self, from: data)
        return linkResponse.linkToken
    }
    
    func exchangePublicToken(_ publicToken: String) async throws {
        let url = URL(string: "\(AppConfig.apiBaseURL)/plaid/exchange-token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header - for now skip auth
        // request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let body = ["public_token": publicToken]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
    }
    
    func analyzeTransactions(_ transactionIds: [String]) async throws -> [Transaction] {
        let url = URL(string: "\(AppConfig.apiBaseURL)/ai/analyze-transactions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header - for now skip auth
        // request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let body = ["transaction_ids": transactionIds]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct AnalysisResponse: Codable {
            let transactions: [Transaction]
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let analysisResponse = try decoder.decode(AnalysisResponse.self, from: data)
        return analysisResponse.transactions
    }
    
    func generateReimbursementPDF(requestId: UUID) async throws -> Data {
        // Generate mock PDF for now
        return try await PDFGenerator.generateMockReimbursementPDF(for: requestId)
    }
    
    func submitReimbursementRequest(requestId: UUID) async throws -> SubmitResponse {
        let url = URL(string: "\(AppConfig.apiBaseURL)/submit-request")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header - for now skip auth
        // request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let body = ["request_id": requestId.uuidString]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        return try JSONDecoder().decode(SubmitResponse.self, from: data)
    }
}

// Supporting types
enum APIError: Error {
    case authenticationFailed
    case networkError
    case invalidResponse
}

struct SupabaseUser: Codable {
    let id: UUID
    let email: String
}

struct SessionData: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
    }
}

struct SubmitResponse: Codable {
    let success: Bool
    let adminEmail: String?
    let error: String?
}

// PDF Generation helper
class PDFGenerator {
    static func generateMockReimbursementPDF(for requestId: UUID) async throws -> Data {
        // Generate mock PDF content
        let pdfString = """
        REIMBURSEMENT REQUEST
        Request ID: \(requestId)
        Total Amount: $150.75
        Status: Pending
        Submitted: \(Date())
        
        Items:
        • Office Supplies: $75.50
        • Software License: $75.25
        """
        return pdfString.data(using: .utf8) ?? Data()
    }
}