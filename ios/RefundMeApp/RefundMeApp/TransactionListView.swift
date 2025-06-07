import SwiftUI

struct TransactionListView: View {
    @StateObject private var viewModel = TransactionViewModel()
    @State private var showingReimbursementCreation = false
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.isAnalyzing {
                    HStack {
                        ProgressView()
                        Text("Analyzing transactions with AI...")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                }
                
                ForEach(viewModel.transactions) { transaction in
                    TransactionRow(
                        transaction: transaction,
                        isSelected: viewModel.selectedTransactions.contains(transaction.id),
                        onToggle: { viewModel.toggleSelection(transactionId: transaction.id) }
                    )
                }
            }
            .listStyle(PlainListStyle())
            .navigationTitle("Transactions")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Add Manual") {
                        // Mock manual entry
                        addManualTransaction()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Select All Eligible", action: viewModel.selectAllEligible)
                        Button("Clear Selection", action: viewModel.clearSelection)
                        Button("Analyze with AI") {
                            Task { await viewModel.analyzeTransactions() }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .refreshable {
                await viewModel.fetchTransactions()
            }
            .overlay(alignment: .bottom) {
                if !viewModel.selectedTransactions.isEmpty {
                    VStack {
                        Text("Selected: \(viewModel.selectedTransactions.count) transactions")
                        Text("Total: $\(viewModel.selectedTotal, specifier: "%.2f")")
                            .font(.headline)
                        
                        Button("Create Reimbursement Request") {
                            showingReimbursementCreation = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(12)
                    .padding()
                }
            }
            .sheet(isPresented: $showingReimbursementCreation) {
                CreateReimbursementView(
                    transactions: Array(viewModel.transactions.filter { 
                        viewModel.selectedTransactions.contains($0.id) 
                    })
                )
            }
        }
        .task {
            await viewModel.fetchTransactions()
        }
    }
    
    private func addManualTransaction() {
        // Add a new mock transaction
        let newTransaction = Transaction(
            id: UUID().uuidString,
            userId: UUID(),
            accountId: "manual",
            amount: Double.random(in: 10...100),
            date: Date(),
            name: "Manual Entry",
            merchantName: "Manual",
            category: ["manual"],
            pending: false,
            isEligible: true,
            aiAnalysis: AIAnalysis(
                eligible: true,
                confidence: 1.0,
                reason: "Manual entry",
                category: "Manual Entry"
            ),
            createdAt: Date()
        )
        
        Task {
            await MainActor.run {
                viewModel.transactions.insert(newTransaction, at: 0)
            }
        }
    }
}

struct TransactionRow: View {
    let transaction: Transaction
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.name)
                    .font(.headline)
                    .lineLimit(1)
                
                if let merchantName = transaction.merchantName {
                    Text(merchantName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text(transaction.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(transaction.amount, specifier: "%.2f")")
                    .font(.headline)
                
                if let analysis = transaction.aiAnalysis {
                    HStack(spacing: 4) {
                        Image(systemName: analysis.eligible ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(analysis.eligible ? .green : .red)
                            .font(.caption)
                        
                        Text("\(Int(analysis.confidence * 100))%")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isSelected ? .blue : .gray)
                .font(.title2)
                .onTapGesture(perform: onToggle)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture(perform: onToggle)
    }
}