import Foundation
import SwiftUI

@MainActor
class TransactionViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var selectedTransactions: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isAnalyzing = false
    
    private let supabase = SupabaseService.shared
    private let api = APIService.shared
    
    func fetchTransactions() async {
        isLoading = true
        errorMessage = nil
        
        do {
            transactions = try await supabase.fetchTransactions()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func analyzeTransactions() async {
        isAnalyzing = true
        
        let unanalyzedIds = transactions
            .filter { $0.aiAnalysis == nil }
            .map { $0.id }
        
        if !unanalyzedIds.isEmpty {
            do {
                let analyzed = try await api.analyzeTransactions(unanalyzedIds)
                
                // Update local transactions with analysis results
                for analyzedTransaction in analyzed {
                    if let index = transactions.firstIndex(where: { $0.id == analyzedTransaction.id }) {
                        transactions[index] = analyzedTransaction
                    }
                }
            } catch {
                errorMessage = "Failed to analyze transactions"
            }
        }
        
        isAnalyzing = false
    }
    
    func toggleSelection(transactionId: String) {
        if selectedTransactions.contains(transactionId) {
            selectedTransactions.remove(transactionId)
        } else {
            selectedTransactions.insert(transactionId)
        }
    }
    
    func selectAllEligible() {
        selectedTransactions = Set(transactions
            .filter { $0.aiAnalysis?.eligible == true }
            .map { $0.id })
    }
    
    func clearSelection() {
        selectedTransactions.removeAll()
    }
    
    var selectedTotal: Double {
        transactions
            .filter { selectedTransactions.contains($0.id) }
            .reduce(0) { $0 + $1.amount }
    }
}