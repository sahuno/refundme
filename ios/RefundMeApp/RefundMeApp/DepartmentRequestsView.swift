import SwiftUI

struct DepartmentRequestsView: View {
    @StateObject private var viewModel = AdminViewModel()
    @State private var filterStatus: String = "all"
    @State private var searchText = ""
    @State private var showingApprovalSheet = false
    @State private var showingRejectionSheet = false
    @State private var selectedRequest: ReimbursementRequest?
    @State private var approvalComments = ""
    @State private var rejectionReason = ""
    
    var filteredRequests: [ReimbursementRequest] {
        var requests = viewModel.allRequests
        
        // Filter by status
        if filterStatus != "all" {
            requests = requests.filter { $0.status?.lowercased() == filterStatus }
        }
        
        // Filter by search
        if !searchText.isEmpty {
            requests = requests.filter { request in
                let searchLower = searchText.lowercased()
                return request.userName?.lowercased().contains(searchLower) == true ||
                       request.id.uuidString.lowercased().contains(searchLower) ||
                       request.description?.lowercased().contains(searchLower) == true
            }
        }
        
        return requests
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and Filter
                VStack(spacing: 12) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search by name, ID, or description...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                        
                        if !searchText.isEmpty {
                            Button(action: { searchText = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    
                    // Status Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            StatusFilterChip(
                                title: "All",
                                count: viewModel.allRequests.count,
                                isSelected: filterStatus == "all",
                                action: { filterStatus = "all" }
                            )
                            
                            StatusFilterChip(
                                title: "Pending",
                                count: viewModel.allRequests.filter { $0.status == "submitted" || $0.status == "pending" }.count,
                                isSelected: filterStatus == "submitted" || filterStatus == "pending",
                                action: { filterStatus = "submitted" }
                            )
                            
                            StatusFilterChip(
                                title: "Approved",
                                count: viewModel.allRequests.filter { $0.status == "approved" }.count,
                                isSelected: filterStatus == "approved",
                                action: { filterStatus = "approved" }
                            )
                            
                            StatusFilterChip(
                                title: "Rejected",
                                count: viewModel.allRequests.filter { $0.status == "rejected" }.count,
                                isSelected: filterStatus == "rejected",
                                action: { filterStatus = "rejected" }
                            )
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                
                Divider()
                
                // Requests List
                if viewModel.isLoading {
                    ProgressView("Loading requests...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredRequests.isEmpty {
                    EmptyStateView(
                        title: "No Requests Found",
                        message: searchText.isEmpty ? "No requests match the selected filter." : "Try a different search term.",
                        systemImage: "doc.text.magnifyingglass"
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(filteredRequests) { request in
                        RequestRow(
                            request: request,
                            onApprove: {
                                selectedRequest = request
                                approvalComments = ""
                                showingApprovalSheet = true
                            },
                            onReject: {
                                selectedRequest = request
                                rejectionReason = ""
                                showingRejectionSheet = true
                            }
                        )
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("Department Requests")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.refreshData()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .task {
            await viewModel.loadDepartmentRequests()
        }
        .sheet(isPresented: $showingApprovalSheet) {
            ApprovalSheet(
                request: selectedRequest,
                comments: $approvalComments,
                isPresented: $showingApprovalSheet,
                onApprove: {
                    if let request = selectedRequest {
                        Task {
                            await viewModel.approveRequest(request, comments: approvalComments)
                            showingApprovalSheet = false
                        }
                    }
                }
            )
        }
        .sheet(isPresented: $showingRejectionSheet) {
            RejectionSheet(
                request: selectedRequest,
                reason: $rejectionReason,
                isPresented: $showingRejectionSheet,
                onReject: {
                    if let request = selectedRequest {
                        Task {
                            await viewModel.rejectRequest(request, reason: rejectionReason)
                            showingRejectionSheet = false
                        }
                    }
                }
            )
        }
        .alert("Success", isPresented: .constant(viewModel.successMessage != nil)) {
            Button("OK") {
                viewModel.successMessage = nil
            }
        } message: {
            Text(viewModel.successMessage ?? "")
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
}

// MARK: - Status Filter Chip
struct StatusFilterChip: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(isSelected ? .semibold : .regular)
                
                Text("\(count)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white.opacity(0.2) : Color.primary.opacity(0.1))
                    .cornerRadius(10)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray6))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Request Row
struct RequestRow: View {
    let request: ReimbursementRequest
    let onApprove: () -> Void
    let onReject: () -> Void
    
    var body: some View {
        NavigationLink(destination: RequestDetailView(request: request)) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Request #\(request.id.uuidString.prefix(8))")
                            .font(.headline)
                        
                        if let userName = request.userName {
                            Text(userName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    StatusBadge(status: request.status ?? "pending")
                }
                
                if let description = request.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                HStack {
                    if let amount = request.totalAmount {
                        Label(formatCurrency(amount), systemImage: "dollarsign.circle")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }
                    
                    Spacer()
                    
                    Text(formatDate(request.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Action Buttons for Pending Requests
                if request.status == "submitted" || request.status == "pending" {
                    HStack(spacing: 12) {
                        Button(action: onApprove) {
                            Label("Approve", systemImage: "checkmark.circle")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                        
                        Button(action: onReject) {
                            Label("Reject", systemImage: "xmark.circle")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                        .tint(.red)
                    }
                    .padding(.top, 8)
                }
            }
            .padding(.vertical, 8)
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "$0.00"
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Approval Sheet
struct ApprovalSheet: View {
    let request: ReimbursementRequest?
    @Binding var comments: String
    @Binding var isPresented: Bool
    let onApprove: () -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section("Request Details") {
                    if let request = request {
                        LabeledContent("Request ID", value: String(request.id.uuidString.prefix(8)))
                        
                        if let userName = request.userName {
                            LabeledContent("Student", value: userName)
                        }
                        
                        if let amount = request.totalAmount {
                            LabeledContent("Amount", value: formatCurrency(amount))
                        }
                    }
                }
                
                Section("Comments (Optional)") {
                    TextEditor(text: $comments)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Approve Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Approve") {
                        onApprove()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "$0.00"
    }
}

// MARK: - Rejection Sheet
struct RejectionSheet: View {
    let request: ReimbursementRequest?
    @Binding var reason: String
    @Binding var isPresented: Bool
    let onReject: () -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section("Request Details") {
                    if let request = request {
                        LabeledContent("Request ID", value: String(request.id.uuidString.prefix(8)))
                        
                        if let userName = request.userName {
                            LabeledContent("Student", value: userName)
                        }
                        
                        if let amount = request.totalAmount {
                            LabeledContent("Amount", value: formatCurrency(amount))
                        }
                    }
                }
                
                Section("Reason for Rejection") {
                    TextEditor(text: $reason)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Reject Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Reject") {
                        onReject()
                    }
                    .foregroundColor(.red)
                    .fontWeight(.semibold)
                    .disabled(reason.isEmpty)
                }
            }
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "$0.00"
    }
}

#Preview {
    DepartmentRequestsView()
}