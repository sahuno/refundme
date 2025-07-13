import Foundation

class APIService {
    static let shared = APIService()
    
    private init() {}
    
    private var accessToken: String? {
        return UserDefaults.standard.string(forKey: "accessToken")
    }
    
    private func authHeaders() -> [String: String] {
        var headers = ["Content-Type": "application/json"]
        if let token = accessToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
    
    func signUpMobile(email: String, password: String, fullName: String) async throws -> (User, SessionData) {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/auth") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password, "fullName": fullName, "action": "signup"]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError
        }
        
        #if DEBUG
        // Log the response for debugging
        if let responseString = String(data: data, encoding: .utf8) {
            print("Signup response: \(responseString)")
        }
        #endif
        
        guard httpResponse.statusCode == 200 else {
            // Try to parse error message
            if let errorResponse = try? JSONDecoder().decode([String: String].self, from: data),
               let errorMessage = errorResponse["error"] {
                #if DEBUG
                print("Signup error: \(errorMessage)")
                #endif
                throw APIError.authenticationFailed
            }
            throw APIError.authenticationFailed
        }
        
        // Parse the response similar to signin
        struct ProfileResponse: Codable {
            let id: String
            let email: String
            let fullName: String?
            let department: String?
            let adminEmail: String?
            let role: String?
            let isAdmin: Bool?
            let isSuperAdmin: Bool?
            let adminDepartment: String?
            let createdAt: String
            
            enum CodingKeys: String, CodingKey {
                case id, email, department, role
                case fullName = "full_name"
                case adminEmail = "admin_email"
                case isAdmin = "is_admin"
                case isSuperAdmin = "is_super_admin"
                case adminDepartment = "admin_department"
                case createdAt = "created_at"
            }
        }
        
        struct AuthResponse: Codable {
            let user: SupabaseUser
            let session: SessionData?
            let profile: ProfileResponse?
            let message: String?
        }
        
        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
        
        guard let session = authResponse.session else {
            throw APIError.authenticationFailed
        }
        
        // Store access token
        UserDefaults.standard.set(session.accessToken, forKey: "accessToken")
        
        // Convert profile response to User object
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        let user = User(
            id: UUID(uuidString: authResponse.profile?.id ?? authResponse.user.id) ?? UUID(),
            email: authResponse.user.email,
            fullName: authResponse.profile?.fullName ?? fullName,
            department: authResponse.profile?.department,
            adminEmail: authResponse.profile?.adminEmail,
            role: authResponse.profile?.role ?? "student",
            isAdmin: authResponse.profile?.isAdmin ?? false,
            isSuperAdmin: authResponse.profile?.isSuperAdmin ?? false,
            adminDepartment: authResponse.profile?.adminDepartment,
            createdAt: dateFormatter.date(from: authResponse.profile?.createdAt ?? "") ?? Date()
        )
        
        return (user, session)
    }
    
    func checkHealth() async throws -> Bool {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/health") else {
            throw APIError.invalidURL
        }
        let request = URLRequest(url: url)
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            #if DEBUG
            print("API health check failed: \(error)")
            #endif
            return false
        }
    }
    
    func signInMobile(email: String, password: String) async throws -> (User, SessionData) {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/auth") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password, "action": "signin"]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError
        }
        
        #if DEBUG
        // Log the response for debugging
        if let responseString = String(data: data, encoding: .utf8) {
            print("Auth response: \(responseString)")
        }
        #endif
        
        guard httpResponse.statusCode == 200 else {
            // Try to parse error message
            if let errorResponse = try? JSONDecoder().decode([String: String].self, from: data),
               let errorMessage = errorResponse["error"] {
                #if DEBUG
                print("Auth error: \(errorMessage)")
                #endif
                throw APIError.authenticationFailed
            }
            throw APIError.authenticationFailed
        }
        
        // Parse the response manually to handle ID conversion
        struct ProfileResponse: Codable {
            let id: String
            let email: String
            let fullName: String?
            let department: String?
            let adminEmail: String?
            let role: String?
            let isAdmin: Bool?
            let isSuperAdmin: Bool?
            let adminDepartment: String?
            let createdAt: String
            
            enum CodingKeys: String, CodingKey {
                case id, email, department, role
                case fullName = "full_name"
                case adminEmail = "admin_email"
                case isAdmin = "is_admin"
                case isSuperAdmin = "is_super_admin"
                case adminDepartment = "admin_department"
                case createdAt = "created_at"
            }
        }
        
        struct AuthResponse: Codable {
            let user: SupabaseUser
            let session: SessionData
            let profile: ProfileResponse?
        }
        
        let decoder = JSONDecoder()
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        
        // Save the access token
        UserDefaults.standard.set(authResponse.session.accessToken, forKey: "accessToken")
        
        // Convert profile response to User model
        let userProfile: User
        if let profile = authResponse.profile {
            let dateFormatter = ISO8601DateFormatter()
            userProfile = User(
                id: UUID(uuidString: profile.id) ?? UUID(),
                email: profile.email,
                fullName: profile.fullName,
                department: profile.department,
                adminEmail: profile.adminEmail,
                role: profile.role,
                isAdmin: profile.isAdmin ?? (profile.role == "administrator"),
                isSuperAdmin: profile.isSuperAdmin ?? false,
                adminDepartment: profile.adminDepartment,
                createdAt: dateFormatter.date(from: profile.createdAt) ?? Date()
            )
        } else {
            userProfile = User(
                id: UUID(uuidString: authResponse.user.id) ?? UUID(),
                email: authResponse.user.email ?? "",
                fullName: "",
                department: nil,
                adminEmail: nil,
                role: "student",
                isAdmin: false,
                isSuperAdmin: false,
                adminDepartment: nil,
                createdAt: Date()
            )
        }
        
        return (userProfile, authResponse.session)
    }
    
    func createLinkToken() async throws -> String {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/plaid/create-link-token") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header if available
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
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
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/plaid/exchange-token") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body = ["public_token": publicToken]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
    }
    
    func analyzeTransactions(_ transactionIds: [String]) async throws -> [Transaction] {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/ai/analyze-transactions") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
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
    
    func fetchReimbursementPDFData(requestId: UUID) async throws -> (request: ReimbursementRequest, items: [ReimbursementItem], profile: User) {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/reimbursements/\(requestId.uuidString)/pdf") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        // Add auth headers
        for (key, value) in authHeaders() {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct PDFDataResponse: Codable {
            let request: ReimbursementRequestData
            let profile: ProfileData
            let items: [ReimbursementItem]
            
            struct ReimbursementRequestData: Codable {
                let id: String
                let userId: String
                let status: String?
                let totalAmount: String?
                let description: String?
                let adminEmail: String?
                let createdAt: String
                let updatedAt: String
                let submittedAt: String?
                let approvedAt: String?
                let rejectedAt: String?
                let rejectionReason: String?
                
                enum CodingKeys: String, CodingKey {
                    case id, status, description
                    case userId = "user_id"
                    case totalAmount = "total_amount"
                    case adminEmail = "admin_email"
                    case createdAt = "created_at"
                    case updatedAt = "updated_at"
                    case submittedAt = "submitted_at"
                    case approvedAt = "approved_at"
                    case rejectedAt = "rejected_at"
                    case rejectionReason = "rejection_reason"
                }
            }
            
            struct ProfileData: Codable {
                let id: String
                let email: String
                let fullName: String?
                let department: String?
                let adminEmail: String?
                let role: String?
                
                enum CodingKeys: String, CodingKey {
                    case id, email, department, role
                    case fullName = "full_name"
                    case adminEmail = "admin_email"
                }
            }
        }
        
        let decoder = JSONDecoder()
        let pdfResponse = try decoder.decode(PDFDataResponse.self, from: data)
        
        // Convert to models
        let dateFormatter = ISO8601DateFormatter()
        
        let reimbursementRequest = ReimbursementRequest(
            id: UUID(uuidString: pdfResponse.request.id) ?? UUID(),
            userId: UUID(uuidString: pdfResponse.request.userId) ?? UUID(),
            status: pdfResponse.request.status,
            totalAmount: pdfResponse.request.totalAmount.flatMap { Decimal(string: $0) },
            description: pdfResponse.request.description,
            adminEmail: pdfResponse.request.adminEmail,
            items: nil,
            createdAt: dateFormatter.date(from: pdfResponse.request.createdAt) ?? Date(),
            updatedAt: dateFormatter.date(from: pdfResponse.request.updatedAt) ?? Date(),
            submittedAt: pdfResponse.request.submittedAt.flatMap { dateFormatter.date(from: $0) },
            approvedAt: pdfResponse.request.approvedAt.flatMap { dateFormatter.date(from: $0) },
            rejectedAt: pdfResponse.request.rejectedAt.flatMap { dateFormatter.date(from: $0) },
            rejectionReason: pdfResponse.request.rejectionReason,
            pdfUrl: nil,
            userName: pdfResponse.profile.fullName ?? pdfResponse.profile.email,
            userEmail: pdfResponse.profile.email
        )
        
        let userProfile = User(
            id: UUID(uuidString: pdfResponse.profile.id) ?? UUID(),
            email: pdfResponse.profile.email,
            fullName: pdfResponse.profile.fullName,
            department: pdfResponse.profile.department,
            adminEmail: pdfResponse.profile.adminEmail,
            role: pdfResponse.profile.role,
            isAdmin: pdfResponse.profile.role == "administrator",
            isSuperAdmin: false,
            adminDepartment: nil,
            createdAt: Date()
        )
        
        return (reimbursementRequest, pdfResponse.items, userProfile)
    }
    
    
    func submitReimbursementRequest(transactions: [Transaction], manualItems: [ReimbursementItem], description: String, adminEmail: String?, notes: String?) async throws -> Bool {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/reimbursements/submit") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Add auth headers
        for (key, value) in authHeaders() {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        let body: [String: Any] = [
            "transactions": transactions.map { [
                "id": $0.id,
                "name": $0.name,
                "amount": $0.amount,
                "category": $0.category?.first ?? "Other",
                "date": ISO8601DateFormatter().string(from: $0.date),
                "description": $0.name
            ]},
            "manualItems": manualItems.map { [
                "description": $0.description,
                "amount": NSDecimalNumber(decimal: $0.amount).doubleValue,
                "category": $0.category ?? "Other",
                "date": ISO8601DateFormatter().string(from: $0.transactionDate ?? Date())
            ]},
            "description": description,
            "adminEmail": adminEmail as Any,
            "notes": notes as Any
        ]
        
        #if DEBUG
        print("Submitting reimbursement request to: \(url)")
        print("Transaction count: \(transactions.count)")
        print("Manual items count: \(manualItems.count)")
        print("Description: \(description)")
        if let jsonData = try? JSONSerialization.data(withJSONObject: body, options: .prettyPrinted),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            print("Request body: \(jsonString)")
        }
        #endif
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError
        }
        
        #if DEBUG
        print("Submit response status: \(httpResponse.statusCode)")
        if let responseString = String(data: data, encoding: .utf8) {
            print("Response body: \(responseString)")
        }
        #endif
        
        if httpResponse.statusCode == 200 {
            // Try to parse success response
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let success = json["success"] as? Bool, success {
                return true
            }
            return true
        } else {
            throw APIError.networkError
        }
    }
    
    func submitReimbursementRequest(requestId: UUID) async throws -> SubmitResponse {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/submit-request") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth header
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body = ["request_id": requestId.uuidString]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        return try JSONDecoder().decode(SubmitResponse.self, from: data)
    }
    
    // MARK: - Educational Content Endpoints
    
    func fetchEducationalContent(category: ContentCategory? = nil, featured: Bool? = nil, search: String? = nil) async throws -> [EducationalContent] {
        var components = URLComponents(string: "\(AppConfig.mobileAPIBaseURL)/education/content")!
        var queryItems: [URLQueryItem] = []
        
        if let category = category {
            queryItems.append(URLQueryItem(name: "category", value: category.rawValue))
        }
        if let featured = featured {
            queryItems.append(URLQueryItem(name: "featured", value: String(featured)))
        }
        if let search = search {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }
        
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct ContentResponse: Codable {
            let data: [EducationalContent]
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let contentResponse = try decoder.decode(ContentResponse.self, from: data)
        return contentResponse.data
    }
    
    func fetchArticle(slug: String) async throws -> EducationalContent {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/education/content/\(slug)") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct ArticleResponse: Codable {
            let data: EducationalContent
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let articleResponse = try decoder.decode(ArticleResponse.self, from: data)
        return articleResponse.data
    }
    
    func trackInteraction(contentId: String, type: InteractionType) async throws {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/education/interactions") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "contentId": contentId,
            "interactionType": type.rawValue
        ]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
    }
    
    func fetchWeeklyTip() async throws -> WeeklyTip? {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/education/weekly-tip") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
        
        struct TipResponse: Codable {
            let data: WeeklyTip?
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let tipResponse = try decoder.decode(TipResponse.self, from: data)
        return tipResponse.data
    }
    
    // MARK: - Profile Update
    
    func updateUserProfile(fullName: String?, department: String?, studentId: String?, adminEmail: String?) async throws -> Bool {
        guard let url = URL(string: "\(AppConfig.mobileAPIBaseURL)/profile/update") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        
        // Add auth headers
        for (key, value) in authHeaders() {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        let body: [String: Any?] = [
            "full_name": fullName,
            "department": department,
            "student_id": studentId,
            "admin_email": adminEmail
        ]
        
        // Remove nil values
        let filteredBody = body.compactMapValues { $0 }
        request.httpBody = try JSONSerialization.data(withJSONObject: filteredBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError
        }
        
        if httpResponse.statusCode == 200 {
            return true
        } else {
            #if DEBUG
            print("Profile update failed with status: \(httpResponse.statusCode)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("Response: \(responseString)")
            }
            #endif
            throw APIError.networkError
        }
    }
    
    // MARK: - Admin Endpoints
    
    func fetchDepartmentRequests() async throws -> [ReimbursementRequest] {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/admin/requests") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        // Add auth headers
        for (key, value) in authHeaders() {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            #if DEBUG
            print("Failed to fetch department requests: Invalid response type")
            #endif
            throw APIError.networkError
        }
        
        guard httpResponse.statusCode == 200 else {
            #if DEBUG
            print("Failed to fetch department requests: \(httpResponse.statusCode)")
            #endif
            throw APIError.networkError
        }
        
        // Parse the response manually to handle nested data
        struct ProfileData: Codable {
            let id: String
            let email: String
            let fullName: String?
            let department: String?
            
            enum CodingKeys: String, CodingKey {
                case id, email, department
                case fullName = "full_name"
            }
        }
        
        struct RequestData: Codable {
            let id: String
            let userId: String
            let status: String?
            let totalAmount: String?
            let description: String?
            let adminEmail: String?
            let createdAt: String
            let updatedAt: String
            let submittedAt: String?
            let approvedAt: String?
            let rejectedAt: String?
            let rejectionReason: String?
            let pdfUrl: String?
            let profiles: ProfileData?
            let reimbursementItems: [ReimbursementItem]?
            
            enum CodingKeys: String, CodingKey {
                case id, status, description, profiles
                case userId = "user_id"
                case totalAmount = "total_amount"
                case adminEmail = "admin_email"
                case createdAt = "created_at"
                case updatedAt = "updated_at"
                case submittedAt = "submitted_at"
                case approvedAt = "approved_at"
                case rejectedAt = "rejected_at"
                case rejectionReason = "rejection_reason"
                case pdfUrl = "pdf_url"
                case reimbursementItems = "reimbursement_items"
            }
        }
        
        struct RequestsResponse: Codable {
            let requests: [RequestData]
            let stats: DepartmentStats?
        }
        
        let decoder = JSONDecoder()
        let requestsResponse = try decoder.decode(RequestsResponse.self, from: data)
        
        // Convert to ReimbursementRequest objects
        let dateFormatter = ISO8601DateFormatter()
        return requestsResponse.requests.map { req in
            ReimbursementRequest(
                id: UUID(uuidString: req.id) ?? UUID(),
                userId: UUID(uuidString: req.userId) ?? UUID(),
                status: req.status,
                totalAmount: req.totalAmount.flatMap { Decimal(string: $0) },
                description: req.description,
                adminEmail: req.adminEmail,
                items: req.reimbursementItems,
                createdAt: dateFormatter.date(from: req.createdAt) ?? Date(),
                updatedAt: dateFormatter.date(from: req.updatedAt) ?? Date(),
                submittedAt: req.submittedAt.flatMap { dateFormatter.date(from: $0) },
                approvedAt: req.approvedAt.flatMap { dateFormatter.date(from: $0) },
                rejectedAt: req.rejectedAt.flatMap { dateFormatter.date(from: $0) },
                rejectionReason: req.rejectionReason,
                pdfUrl: req.pdfUrl,
                userName: req.profiles?.fullName ?? req.profiles?.email,
                userEmail: req.profiles?.email
            )
        }
    }
    
    func approveRequest(requestId: String, comments: String?) async throws {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/admin/requests/\(requestId)/approve") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["comments": comments ?? ""]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
    }
    
    func rejectRequest(requestId: String, reason: String) async throws {
        guard let url = URL(string: "\(AppConfig.apiBaseURL)/admin/requests/\(requestId)/reject") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["reason": reason]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError
        }
    }
}

// Supporting types
enum APIError: Error {
    case authenticationFailed
    case networkError
    case invalidResponse
    case invalidURL
}

struct SupabaseUser: Codable {
    let id: String
    let email: String?
    let role: String?
}

struct SessionData: Codable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int?
    let tokenType: String?
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case tokenType = "token_type"
    }
}

struct SubmitResponse: Codable {
    let success: Bool
    let adminEmail: String?
    let error: String?
}