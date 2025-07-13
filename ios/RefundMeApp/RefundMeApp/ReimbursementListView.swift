import SwiftUI

struct ReimbursementListView: View {
    @StateObject private var viewModel = ReimbursementViewModel()
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.requests) { request in
                    ReimbursementRow(request: request)
                }
            }
            .navigationTitle("Requests")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: CreateReimbursementView(transactions: [])) {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.fetchRequests()
            }
        }
        .task {
            await viewModel.fetchRequests()
        }
    }
}

struct ReimbursementRow: View {
    let request: ReimbursementRequest
    @StateObject private var viewModel = ReimbursementViewModel()
    @State private var showingPDF = false
    @State private var pdfData: Data?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Request #\(request.id.uuidString.prefix(8))...")
                    .font(.headline)
                Spacer()
                StatusBadge(status: request.status ?? "pending")
            }
            
            HStack {
                Text(formatCurrency(request.totalAmount))
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Text(formatDate(request.submittedAt ?? request.createdAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                if let items = request.items, !items.isEmpty {
                    Text("\(items.count) item\(items.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    if request.status == "draft" {
                        Button("Submit") {
                            submitRequest()
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                    
                    Button("PDF") {
                        generatePDF()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }
        }
        .padding(.vertical, 4)
        .sheet(isPresented: $showingPDF) {
            if let pdfData = pdfData {
                PDFViewerView(pdfData: pdfData)
            }
        }
    }
    
    private func submitRequest() {
        Task {
            await viewModel.submitRequest(request)
        }
    }
    
    private func generatePDF() {
        Task {
            if let data = await viewModel.generatePDF(for: request) {
                await MainActor.run {
                    self.pdfData = data
                    self.showingPDF = true
                }
            }
        }
    }
    
    // Helper functions
    private func formatCurrency(_ amount: Decimal?) -> String {
        guard let amount = amount else { return "$0.00" }
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