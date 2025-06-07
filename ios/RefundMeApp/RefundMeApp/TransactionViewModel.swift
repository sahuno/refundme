import Foundation
import SwiftUI

@MainActor
class TransactionViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var selectedTransactions: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isAnalyzing = false
    
    private let apiService = APIService.shared
    
    func fetchTransactions() async {
        isLoading = true
        errorMessage = nil
        
        // Mock transactions
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        transactions = [
            Transaction(
                id: "1",
                userId: UUID(),
                accountId: "account1", 
                amount: 25.99,
                date: Date(),
                name: "Amazon Purchase",
                merchantName: "Amazon",
                category: ["shopping"],
                pending: false,
                isEligible: true,
                aiAnalysis: AIAnalysis(
                    eligible: true,
                    confidence: 0.95,
                    reason: "Educational supplies",
                    category: "Books & Educational Materials"
                ),
                createdAt: Date()
            ),
            Transaction(
                id: "2", 
                userId: UUID(),
                accountId: "account1",
                amount: 12.50,
                date: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date(),
                name: "Starbucks",
                merchantName: "Starbucks", 
                category: ["food"],
                pending: false,
                isEligible: false,
                aiAnalysis: AIAnalysis(
                    eligible: false,
                    confidence: 0.88,
                    reason: "Personal coffee purchase",
                    category: "Food & Dining"
                ),
                createdAt: Date()
            )
        ]
        
        isLoading = false
    }
    
    func analyzeTransactions() async {
        isAnalyzing = true
        
        // Mock AI analysis
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
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