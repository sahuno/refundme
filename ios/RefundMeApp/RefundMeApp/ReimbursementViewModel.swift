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
                status: "pending",
                totalAmount: 150.75,
                description: "Office supplies for research",
                adminEmail: "admin@university.edu",
                items: [],
                createdAt: Date(),
                updatedAt: Date(),
                submittedAt: Date(),
                approvedAt: nil,
                rejectedAt: nil,
                rejectionReason: nil,
                pdfUrl: nil,
                userName: "John Doe",
                userEmail: "john@university.edu"
            ),
            ReimbursementRequest(
                id: UUID(),
                userId: UUID(),
                status: "approved",
                totalAmount: 89.99,
                description: "Conference registration",
                adminEmail: "admin@university.edu",
                items: [],
                createdAt: Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date(),
                updatedAt: Date(),
                submittedAt: Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date(),
                approvedAt: Calendar.current.date(byAdding: .day, value: -5, to: Date()) ?? Date(),
                rejectedAt: nil,
                rejectionReason: nil,
                pdfUrl: nil,
                userName: "Jane Smith",
                userEmail: "jane@university.edu"
            )
        ]
        
        isLoading = false
    }
    
    func createRequest(transactions: [Transaction], manualItems: [ReimbursementItem] = [], description: String, adminEmail: String?, notes: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let success = try await apiService.submitReimbursementRequest(
                transactions: transactions,
                manualItems: manualItems,
                description: description,
                adminEmail: adminEmail,
                notes: notes
            )
            
            if success {
                // Refresh the request list to show the new request
                await fetchRequests()
            }
            
            isLoading = false
            return success
        } catch {
            errorMessage = "Failed to create request: \(error.localizedDescription)"
            isLoading = false
            return false
        }
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
            // Fetch request data from API
            let pdfData = try await apiService.fetchReimbursementPDFData(requestId: request.id)
            
            // Generate PDF locally
            return PDFGenerator.generateReimbursementPDF(
                for: pdfData.request,
                items: pdfData.items,
                profile: pdfData.profile
            )
        } catch {
            errorMessage = "Failed to generate PDF: \(error.localizedDescription)"
            print("Error generating PDF: \(error)")
            return nil
        }
    }
}