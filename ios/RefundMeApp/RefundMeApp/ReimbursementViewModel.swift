import Foundation
import SwiftUI

@MainActor
class ReimbursementViewModel: ObservableObject {
    @Published var requests: [ReimbursementRequest] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    func fetchRequests() async {
        isLoading = true
        errorMessage = nil
        
        // Mock data for now
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        requests = [
            ReimbursementRequest(
                id: UUID(),
                userId: UUID(),
                status: .pending,
                totalAmount: 150.75,
                submittedAt: Date(),
                items: []
            ),
            ReimbursementRequest(
                id: UUID(),
                userId: UUID(),
                status: .approved,
                totalAmount: 89.99,
                submittedAt: Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date(),
                items: []
            )
        ]
        
        isLoading = false
    }
    
    func createRequest(transactions: [Transaction], manualItems: [ReimbursementItem] = []) async -> Bool {
        // Mock request creation
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        let totalAmount = transactions.reduce(0) { $0 + $1.amount } + manualItems.reduce(0) { $0 + $1.amount }
        
        let newRequest = ReimbursementRequest(
            id: UUID(),
            userId: UUID(),
            status: .draft,
            totalAmount: totalAmount,
            submittedAt: Date(),
            items: manualItems
        )
        
        requests.insert(newRequest, at: 0)
        return true
    }
    
    func submitRequest(_ request: ReimbursementRequest) async {
        do {
            _ = try await apiService.submitReimbursementRequest(requestId: request.id)
            // Refresh the request list to get updated status
            await fetchRequests()
        } catch {
            errorMessage = "Failed to submit request: \(error.localizedDescription)"
            print("Error submitting request: \(error)")
        }
    }
    
    func generatePDF(for request: ReimbursementRequest) async -> Data? {
        do {
            return try await apiService.generateReimbursementPDF(requestId: request.id)
        } catch {
            errorMessage = "Failed to generate PDF: \(error.localizedDescription)"
            print("Error generating PDF: \(error)")
            return nil
        }
    }
}