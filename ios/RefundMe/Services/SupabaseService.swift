import Foundation
import Supabase

class SupabaseService {
    static let shared = SupabaseService()
    
    let client: SupabaseClient
    
    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: Environment.supabaseURL)!,
            supabaseKey: Environment.supabaseAnonKey
        )
    }
    
    // Authentication
    func signIn(email: String, password: String) async throws -> User {
        let response = try await client.auth.signIn(email: email, password: password)
        return try await fetchUserProfile(userId: response.user.id)
    }
    
    func signUp(email: String, password: String, fullName: String) async throws -> User {
        let response = try await client.auth.signUp(email: email, password: password)
        
        // Create profile
        try await client
            .from("profiles")
            .insert([
                "id": response.user!.id.uuidString,
                "email": email,
                "full_name": fullName
            ])
            .execute()
        
        return try await fetchUserProfile(userId: response.user!.id)
    }
    
    func signOut() async throws {
        try await client.auth.signOut()
    }
    
    func fetchUserProfile(userId: UUID) async throws -> User {
        let response = try await client
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(User.self, from: response.data)
    }
    
    // Transactions
    func fetchTransactions() async throws -> [Transaction] {
        let response = try await client
            .from("transactions")
            .select()
            .order("date", ascending: false)
            .execute()
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([Transaction].self, from: response.data)
    }
    
    // Reimbursements
    func fetchReimbursementRequests() async throws -> [ReimbursementRequest] {
        let response = try await client
            .from("reimbursement_requests")
            .select("*, reimbursement_items(*)")
            .order("submitted_at", ascending: false)
            .execute()
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([ReimbursementRequest].self, from: response.data)
    }
    
    func createReimbursementRequest(items: [ReimbursementItem]) async throws -> ReimbursementRequest {
        // Create request
        let requestId = UUID()
        let totalAmount = items.reduce(0) { $0 + $1.amount }
        
        let requestData = [
            "id": requestId.uuidString,
            "total_amount": totalAmount,
            "status": "pending"
        ] as [String : Any]
        
        try await client
            .from("reimbursement_requests")
            .insert(requestData)
            .execute()
        
        // Create items
        let itemsData = items.map { item in
            [
                "request_id": requestId.uuidString,
                "transaction_id": item.transactionId as Any,
                "description": item.description,
                "amount": item.amount,
                "date": ISO8601DateFormatter().string(from: item.date),
                "category": item.category,
                "is_manual_entry": item.isManualEntry
            ]
        }
        
        try await client
            .from("reimbursement_items")
            .insert(itemsData)
            .execute()
        
        return try await fetchReimbursementRequest(id: requestId)
    }
    
    private func fetchReimbursementRequest(id: UUID) async throws -> ReimbursementRequest {
        let response = try await client
            .from("reimbursement_requests")
            .select("*, reimbursement_items(*)")
            .eq("id", value: id.uuidString)
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(ReimbursementRequest.self, from: response.data)
    }
}