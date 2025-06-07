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
                StatusBadge(status: request.status)
            }
            
            HStack {
                Text("$\(request.totalAmount, specifier: "%.2f")")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Text(request.submittedAt, style: .date)
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
                    if request.status == .draft {
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
}

struct StatusBadge: View {
    let status: ReimbursementStatus
    
    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .cornerRadius(8)
    }
    
    private var backgroundColor: Color {
        switch status {
        case .pending:
            return .orange.opacity(0.2)
        case .approved:
            return .green.opacity(0.2)
        case .rejected:
            return .red.opacity(0.2)
        case .draft:
            return .gray.opacity(0.2)
        case .submitted:
            return .blue.opacity(0.2)
        }
    }
    
    private var textColor: Color {
        switch status {
        case .pending:
            return .orange
        case .approved:
            return .green
        case .rejected:
            return .red
        case .draft:
            return .gray
        case .submitted:
            return .blue
        }
    }
}