import Foundation
import SwiftUI

@MainActor
class ReimbursementViewModel: ObservableObject {
    @Published var requests: [ReimbursementRequest] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseService.shared
    
    func fetchRequests() async {
        isLoading = true
        errorMessage = nil
        
        do {
            requests = try await supabase.fetchReimbursementRequests()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func createRequest(transactions: [Transaction], manualItems: [ReimbursementItem] = []) async -> Bool {
        do {
            // Convert transactions to reimbursement items
            let transactionItems = transactions.map { transaction in
                ReimbursementItem(
                    id: UUID(),
                    requestId: UUID(), // Will be set by the service
                    transactionId: transaction.id,
                    description: transaction.name,
                    amount: transaction.amount,
                    date: transaction.date,
                    category: transaction.aiAnalysis?.category ?? "Other",
                    isManualEntry: false
                )
            }
            
            let allItems = transactionItems + manualItems
            let newRequest = try await supabase.createReimbursementRequest(items: allItems)
            
            // Add to local array
            requests.insert(newRequest, at: 0)
            
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}