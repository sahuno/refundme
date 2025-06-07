import Foundation

class APIService {
    static let shared = APIService()
    private let session = URLSession.shared
    
    private init() {}
    
    private func authenticatedRequest(url: URL) async throws -> URLRequest {
        var request = URLRequest(url: url)
        
        // Get auth token from Supabase
        if let session = try? await SupabaseService.shared.client.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
    
    // Health check for mobile API
    func checkHealth() async throws -> Bool {
        let url = URL(string: "\(Environment.mobileAPIBaseURL)/health")!
        let request = URLRequest(url: url)
        
        let (_, response) = try await session.data(for: request)
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
    
    // Mobile-specific auth endpoint
    func signInMobile(email: String, password: String) async throws -> (User, Session) {
        let url = URL(string: "\(Environment.mobileAPIBaseURL)/auth")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password, "action": "signin"]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await session.data(for: request)
        
        struct AuthResponse: Codable {
            let user: SupabaseUser
            let session: Session
            let profile: User
        }
        
        let response = try JSONDecoder().decode(AuthResponse.self, from: data)
        return (response.profile, response.session)
    }
    
    // Plaid integration
    func createLinkToken() async throws -> String {
        let url = URL(string: "\(Environment.apiBaseURL)/plaid/create-link-token")!
        let request = try await authenticatedRequest(url: url)
        var mutableRequest = request
        mutableRequest.httpMethod = "POST"
        
        let (data, _) = try await session.data(for: mutableRequest)
        let response = try JSONDecoder().decode(LinkTokenResponse.self, from: data)
        return response.linkToken
    }
    
    func exchangePublicToken(_ publicToken: String) async throws {
        let url = URL(string: "\(Environment.apiBaseURL)/plaid/exchange-token")!
        var request = try await authenticatedRequest(url: url)
        request.httpMethod = "POST"
        
        let body = ["public_token": publicToken]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
    }
    
    // AI Analysis
    func analyzeTransactions(_ transactionIds: [String]) async throws -> [Transaction] {
        let url = URL(string: "\(Environment.mobileAPIBaseURL)/transactions/analyze")!
        var request = try await authenticatedRequest(url: url)
        request.httpMethod = "POST"
        
        let body = ["transaction_ids": transactionIds]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await session.data(for: request)
        
        struct AnalysisResponse: Codable {
            let transactions: [Transaction]
        }
        
        let response = try JSONDecoder().decode(AnalysisResponse.self, from: data)
        return response.transactions
    }
    
    // PDF Generation
    func generateReimbursementPDF(requestId: UUID) async throws -> Data {
        let url = URL(string: "\(Environment.apiBaseURL)/reimbursements/\(requestId.uuidString)/pdf")!
        let request = try await authenticatedRequest(url: url)
        
        let (data, _) = try await session.data(for: request)
        return data
    }
}

enum APIError: Error {
    case invalidResponse
    case unauthorized
    case serverError(String)
}

struct LinkTokenResponse: Codable {
    let linkToken: String
    
    enum CodingKeys: String, CodingKey {
        case linkToken = "linkToken"
    }
}

// Supporting types
struct SupabaseUser: Codable {
    let id: UUID
    let email: String
}

struct Session: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
    }
}