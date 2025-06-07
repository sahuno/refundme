import SwiftUI

struct CreateReimbursementView: View {
    let transactions: [Transaction]
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
                } else {
                    Section {
                        Text("No transactions selected")
                            .foregroundColor(.secondary)
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
                        // Mock submission
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var totalAmount: Double {
        transactions.reduce(0) { $0 + $1.amount }
    }
}