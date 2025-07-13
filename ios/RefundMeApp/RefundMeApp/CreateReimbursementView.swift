import SwiftUI

struct CreateReimbursementView: View {
    let transactions: [Transaction]
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CreateReimbursementViewModel()
    @State private var description = ""
    @State private var adminEmail = ""
    @State private var notes = ""
    @State private var showManualEntry = false
    @State private var showSubmitConfirmation = false
    @State private var selectedTransactionIds = Set<String>()
    
    var body: some View {
        NavigationStack {
            Form {
                // Description Section
                Section("Request Details") {
                    TextField("Description", text: $description)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Admin Email (optional)", text: $adminEmail)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...6)
                }
                
                // Selected Transactions Section
                if !transactions.isEmpty {
                    Section("Bank Transactions") {
                        ForEach(transactions) { transaction in
                            ReimbursementTransactionRow(
                                transaction: transaction,
                                isSelected: selectedTransactionIds.contains(transaction.id),
                                onToggle: { toggleTransaction(transaction) }
                            )
                        }
                    }
                }
                
                // Manual Items Section
                Section {
                    if !viewModel.manualItems.isEmpty {
                        ForEach(viewModel.manualItems) { item in
                            ManualItemRow(item: item) {
                                viewModel.removeManualItem(item)
                            }
                        }
                    }
                    
                    Button(action: { showManualEntry = true }) {
                        Label("Add Manual Entry", systemImage: "plus.circle.fill")
                            .foregroundColor(.blue)
                    }
                } header: {
                    Text("Manual Entries")
                } footer: {
                    Text("Add expenses not in your bank transactions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Summary Section
                Section("Summary") {
                    HStack {
                        Text("Bank Transactions")
                        Spacer()
                        Text("$\(selectedTransactionsTotal, specifier: "%.2f")")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Manual Entries")
                        Spacer()
                        Text("$\(NSDecimalNumber(decimal: manualItemsTotal).doubleValue, specifier: "%.2f")")
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    HStack {
                        Text("Total Amount")
                            .font(.headline)
                        Spacer()
                        Text("$\(totalAmount, specifier: "%.2f")")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
            }
            .navigationTitle("Create Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        showSubmitConfirmation = true
                    }
                    .disabled(!canSubmit)
                }
            }
            .sheet(isPresented: $showManualEntry) {
                ManualEntryView(viewModel: viewModel)
            }
            .alert("Submit Request", isPresented: $showSubmitConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Submit", role: .destructive) {
                    Task {
                        await submitRequest()
                    }
                }
            } message: {
                Text("Are you sure you want to submit this reimbursement request for $\(totalAmount, specifier: "%.2f")?")
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") { }
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
            .onAppear {
                // Pre-select all transactions
                selectedTransactionIds = Set(transactions.map { $0.id })
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var selectedTransactions: [Transaction] {
        transactions.filter { selectedTransactionIds.contains($0.id) }
    }
    
    private var selectedTransactionsTotal: Double {
        selectedTransactions.reduce(0) { $0 + $1.amount }
    }
    
    private var manualItemsTotal: Decimal {
        viewModel.manualItems.reduce(0) { $0 + $1.amount }
    }
    
    private var totalAmount: Double {
        selectedTransactionsTotal + NSDecimalNumber(decimal: manualItemsTotal).doubleValue
    }
    
    private var canSubmit: Bool {
        !description.isEmpty && (selectedTransactionIds.count > 0 || !viewModel.manualItems.isEmpty)
    }
    
    // MARK: - Methods
    
    private func toggleTransaction(_ transaction: Transaction) {
        if selectedTransactionIds.contains(transaction.id) {
            selectedTransactionIds.remove(transaction.id)
        } else {
            selectedTransactionIds.insert(transaction.id)
        }
    }
    
    private func submitRequest() async {
        await viewModel.createRequest(
            transactions: selectedTransactions,
            description: description,
            adminEmail: adminEmail.isEmpty ? nil : adminEmail,
            notes: notes.isEmpty ? nil : notes
        )
        
        if !viewModel.showError {
            dismiss()
        }
    }
}

// MARK: - Transaction Row
struct ReimbursementTransactionRow: View {
    let transaction: Transaction
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        HStack {
            Button(action: onToggle) {
                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                    .foregroundColor(isSelected ? .blue : .gray)
                    .font(.title3)
            }
            .buttonStyle(PlainButtonStyle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.name)
                    .font(.subheadline)
                    .lineLimit(1)
                
                HStack {
                    if let merchantName = transaction.merchantName {
                        Text(merchantName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    if let categories = transaction.category, let firstCategory = categories.first {
                        Text("• \(firstCategory)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("$\(transaction.amount, specifier: "%.2f")")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(transaction.date, style: .date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            onToggle()
        }
    }
}

// MARK: - Manual Item Row
struct ManualItemRow: View {
    let item: ReimbursementItem
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.description)
                    .font(.subheadline)
                
                if let category = item.category {
                    Text(category)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Text("$\(NSDecimalNumber(decimal: item.amount).doubleValue, specifier: "%.2f")")
                .font(.subheadline)
                .fontWeight(.medium)
            
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(.red)
                    .font(.caption)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

// MARK: - Manual Entry View
struct ManualEntryView: View {
    @ObservedObject var viewModel: CreateReimbursementViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var description = ""
    @State private var amount = ""
    @State private var category = "Other"
    @State private var date = Date()
    
    let categories = ["Food", "Transportation", "Office Supplies", "Equipment", "Conference", "Other"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Item Details") {
                    TextField("Description", text: $description)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Amount", text: $amount)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.decimalPad)
                    
                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.self) { category in
                            Text(category).tag(category)
                        }
                    }
                    
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
            }
            .navigationTitle("Add Manual Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addItem()
                    }
                    .disabled(!canAdd)
                }
            }
        }
    }
    
    private var canAdd: Bool {
        !description.isEmpty && Double(amount) != nil && Double(amount)! > 0
    }
    
    private func addItem() {
        guard let amountValue = Double(amount) else { return }
        
        let item = ReimbursementItem(
            id: UUID(),
            requestId: UUID(),
            transactionId: nil,
            description: description,
            amount: Decimal(amountValue),
            transactionDate: date,
            category: category,
            isManualEntry: true
        )
        
        viewModel.addManualItem(item)
        dismiss()
    }
}

// MARK: - View Model
@MainActor
class CreateReimbursementViewModel: ObservableObject {
    @Published var manualItems: [ReimbursementItem] = []
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    func addManualItem(_ item: ReimbursementItem) {
        manualItems.append(item)
    }
    
    func removeManualItem(_ item: ReimbursementItem) {
        manualItems.removeAll { $0.id == item.id }
    }
    
    func createRequest(transactions: [Transaction], description: String, adminEmail: String?, notes: String?) async {
        isLoading = true
        showError = false
        errorMessage = nil
        
        do {
            let success = try await apiService.submitReimbursementRequest(
                transactions: transactions,
                manualItems: manualItems,
                description: description,
                adminEmail: adminEmail,
                notes: notes
            )
            
            if !success {
                throw APIError.networkError
            }
            
            isLoading = false
        } catch {
            errorMessage = "Failed to submit request: \(error.localizedDescription)"
            showError = true
            isLoading = false
        }
    }
}