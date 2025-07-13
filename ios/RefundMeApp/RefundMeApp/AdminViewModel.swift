import Foundation
import SwiftUI

// MARK: - Department Statistics
struct DepartmentStats: Codable {
    let department: String
    let totalRequests: Int
    let pendingRequests: Int
    let approvedRequests: Int
    let rejectedRequests: Int
    let totalApprovedAmount: Decimal
    let studentCount: Int
    
    enum CodingKeys: String, CodingKey {
        case department
        case totalRequests = "total_requests"
        case pendingRequests = "pending_requests"
        case approvedRequests = "approved_requests"
        case rejectedRequests = "rejected_requests"
        case totalApprovedAmount = "total_approved_amount"
        case studentCount = "student_count"
    }
}

@MainActor
class AdminViewModel: ObservableObject {
    @Published var pendingRequests: [ReimbursementRequest] = []
    @Published var allRequests: [ReimbursementRequest] = []
    @Published var departmentStats: DepartmentStats?
    @Published var selectedRequest: ReimbursementRequest?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    
    private let apiService = APIService.shared
    
    // Computed properties
    var hasPendingRequests: Bool {
        !pendingRequests.isEmpty
    }
    
    var filteredPendingRequests: [ReimbursementRequest] {
        allRequests.filter { $0.status == "submitted" || $0.status == "pending" }
    }
    
    func loadDepartmentRequests() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Load all requests for the department
            allRequests = try await apiService.fetchDepartmentRequests()
            
            // Filter pending requests
            pendingRequests = filteredPendingRequests
            
            // Calculate stats
            calculateDepartmentStats()
        } catch {
            errorMessage = "Failed to load requests: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    private func calculateDepartmentStats() {
        let totalRequests = allRequests.count
        let pendingCount = allRequests.filter { $0.status == "submitted" || $0.status == "pending" }.count
        let approvedCount = allRequests.filter { $0.status == "approved" }.count
        let rejectedCount = allRequests.filter { $0.status == "rejected" }.count
        
        let totalApproved = allRequests
            .filter { $0.status == "approved" }
            .reduce(Decimal(0)) { $0 + ($1.totalAmount ?? Decimal(0)) }
        
        // For now, we'll use placeholder department name
        departmentStats = DepartmentStats(
            department: "STEM",
            totalRequests: totalRequests,
            pendingRequests: pendingCount,
            approvedRequests: approvedCount,
            rejectedRequests: rejectedCount,
            totalApprovedAmount: totalApproved,
            studentCount: 0
        )
    }
    
    func approveRequest(_ request: ReimbursementRequest, comments: String? = nil) async {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        
        do {
            try await apiService.approveRequest(requestId: request.id.uuidString, comments: comments)
            
            // Remove from pending list
            pendingRequests.removeAll { $0.id == request.id }
            
            successMessage = "Request approved successfully"
            
            // Reload data
            await loadDepartmentRequests()
        } catch {
            errorMessage = "Failed to approve request: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func rejectRequest(_ request: ReimbursementRequest, reason: String) async {
        guard !reason.isEmpty else {
            errorMessage = "Please provide a reason for rejection"
            return
        }
        
        isLoading = true
        errorMessage = nil
        successMessage = nil
        
        do {
            try await apiService.rejectRequest(requestId: request.id.uuidString, reason: reason)
            
            // Remove from pending list
            pendingRequests.removeAll { $0.id == request.id }
            
            successMessage = "Request rejected"
            
            // Reload data
            await loadDepartmentRequests()
        } catch {
            errorMessage = "Failed to reject request: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func selectRequest(_ request: ReimbursementRequest) {
        selectedRequest = request
    }
    
    func clearSelection() {
        selectedRequest = nil
    }
    
    func refreshData() async {
        await loadDepartmentRequests()
    }
}