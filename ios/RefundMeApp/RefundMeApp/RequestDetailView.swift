import SwiftUI

struct RequestDetailView: View {
    let request: ReimbursementRequest
    @StateObject private var adminViewModel = AdminViewModel()
    @State private var showingApprovalSheet = false
    @State private var showingRejectionSheet = false
    @State private var approvalComments = ""
    @State private var rejectionReason = ""
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Request #\(request.id.uuidString.prefix(8))")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        StatusBadge(status: request.status ?? "pending")
                    }
                    
                    if let userName = request.userName {
                        Label(userName, systemImage: "person.fill")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    if let email = request.userEmail {
                        Label(email, systemImage: "envelope.fill")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                
                // Amount and Date
                HStack(spacing: 20) {
                    VStack(alignment: .leading) {
                        Text("Total Amount")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let amount = request.totalAmount {
                            Text(formatCurrency(amount))
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text("Submitted")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(formatDate(request.createdAt))
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                
                // Description
                if let description = request.description {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                        
                        Text(description)
                            .font(.body)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
                
                // Items
                if let items = request.items, !items.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Expense Items")
                            .font(.headline)
                        
                        ForEach(items) { item in
                            ExpenseItemRow(item: item)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
                
                // PDF Preview
                VStack(alignment: .leading, spacing: 8) {
                    Text("Documentation")
                        .font(.headline)
                    
                    Button(action: {
                        // TODO: Generate PDF data and show PDFViewerView
                    }) {
                        HStack {
                            Image(systemName: "doc.fill")
                                .font(.title2)
                                .foregroundColor(.blue)
                            
                            VStack(alignment: .leading) {
                                Text("Reimbursement Request.pdf")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Text("Tap to view")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(10)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                
                // Action Buttons (for pending requests)
                if request.status == "submitted" || request.status == "pending" {
                    HStack(spacing: 16) {
                        Button(action: {
                            approvalComments = ""
                            showingApprovalSheet = true
                        }) {
                            Label("Approve", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        
                        Button(action: {
                            rejectionReason = ""
                            showingRejectionSheet = true
                        }) {
                            Label("Reject", systemImage: "xmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                        .tint(.red)
                    }
                    .padding()
                }
            }
            .padding()
        }
        .navigationTitle("Request Details")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingApprovalSheet) {
            ApprovalSheet(
                request: request,
                comments: $approvalComments,
                isPresented: $showingApprovalSheet,
                onApprove: {
                    Task {
                        await adminViewModel.approveRequest(request, comments: approvalComments)
                        showingApprovalSheet = false
                    }
                }
            )
        }
        .sheet(isPresented: $showingRejectionSheet) {
            RejectionSheet(
                request: request,
                reason: $rejectionReason,
                isPresented: $showingRejectionSheet,
                onReject: {
                    Task {
                        await adminViewModel.rejectRequest(request, reason: rejectionReason)
                        showingRejectionSheet = false
                    }
                }
            )
        }
        .alert("Success", isPresented: .constant(adminViewModel.successMessage != nil)) {
            Button("OK") {
                adminViewModel.successMessage = nil
            }
        } message: {
            Text(adminViewModel.successMessage ?? "")
        }
        .alert("Error", isPresented: .constant(adminViewModel.errorMessage != nil)) {
            Button("OK") {
                adminViewModel.errorMessage = nil
            }
        } message: {
            Text(adminViewModel.errorMessage ?? "")
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
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Expense Item Row
struct ExpenseItemRow: View {
    let item: ReimbursementItem
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.description)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let category = item.category {
                    Text(category)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let transactionDate = item.transactionDate {
                    Text(formatDate(transactionDate))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Text(formatCurrency(item.amount))
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
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

#Preview {
    NavigationView {
        RequestDetailView(request: ReimbursementRequest(
            id: UUID(),
            userId: UUID(),
            status: "pending",
            totalAmount: 250.75,
            description: "Office supplies for research project",
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
            userEmail: "john.doe@university.edu"
        ))
    }
}