import SwiftUI

struct CreateReimbursementView: View {
    let transactions: [Transaction]
    @StateObject private var viewModel = ReimbursementViewModel()
    @State private var manualItems: [ManualReimbursementItem] = []
    @State private var newItem = ManualReimbursementItem()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                if !transactions.isEmpty {
                    Section("Selected Transactions") {
                        ForEach(transactions) { transaction in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(transaction.name)
                                        .font(.subheadline)
                                    if let merchantName = transaction.merchantName {
                                        Text(merchantName)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                Spacer()
                                Text("$\(transaction.amount, specifier: "%.2f")")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                            }
                        }
                    }
                }
                
                Section("Manual Items") {
                    ForEach(manualItems) { item in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(item.description)
                                    .font(.subheadline)
                                Text(item.category)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text("$\(item.amount, specifier: "%.2f")")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                    }
                    .onDelete(perform: deleteManualItem)
                    
                    // Add new item form
                    VStack(spacing: 12) {
                        TextField("Description", text: $newItem.description)
                        
                        HStack {
                            TextField("Amount", value: $newItem.amount, format: .currency(code: "USD"))
                                .keyboardType(.decimalPad)
                            
                            DatePicker("Date", selection: $newItem.date, displayedComponents: .date)
                        }
                        
                        Picker("Category", selection: $newItem.category) {
                            ForEach(expenseCategories, id: \.self) { category in
                                Text(category).tag(category)
                            }
                        }
                        .pickerStyle(.menu)
                        
                        Button("Add Item") {
                            addManualItem()
                        }
                        .disabled(newItem.description.isEmpty || newItem.amount <= 0 || newItem.category.isEmpty)
                    }
                }
                
                Section("Summary") {
                    HStack {
                        Text("Total Amount")
                            .font(.headline)
                        Spacer()
                        Text("$\(totalAmount, specifier: "%.2f")")
                            .font(.headline)
                            .fontWeight(.bold)
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
                        submitRequest()
                    }
                    .disabled(totalAmount <= 0)
                }
            }
        }
    }
    
    private let expenseCategories = [
        "Books & Educational Materials",
        "Research Supplies & Equipment",
        "Academic Software & Technology",
        "Conference Fees & Academic Travel",
        "Office Supplies for Academic Work",
        "Food & Dining",
        "Other"
    ]
    
    private var totalAmount: Double {
        let transactionTotal = transactions.reduce(0) { $0 + $1.amount }
        let manualTotal = manualItems.reduce(0) { $0 + $1.amount }
        return transactionTotal + manualTotal
    }
    
    private func addManualItem() {
        let item = ManualReimbursementItem(
            id: UUID(),
            description: newItem.description,
            amount: newItem.amount,
            date: newItem.date,
            category: newItem.category
        )
        manualItems.append(item)
        newItem = ManualReimbursementItem()
    }
    
    private func deleteManualItem(at offsets: IndexSet) {
        manualItems.remove(atOffsets: offsets)
    }
    
    private func submitRequest() {
        Task {
            let reimbursementItems = manualItems.map { item in
                ReimbursementItem(
                    id: UUID(),
                    requestId: UUID(), // Will be set by the service
                    transactionId: nil,
                    description: item.description,
                    amount: item.amount,
                    date: item.date,
                    category: item.category,
                    isManualEntry: true
                )
            }
            
            let success = await viewModel.createRequest(
                transactions: transactions,
                manualItems: reimbursementItems
            )
            
            if success {
                dismiss()
            }
        }
    }
}

struct ManualReimbursementItem: Identifiable {
    let id = UUID()
    var description = ""
    var amount: Double = 0
    var date = Date()
    var category = ""
}