import SwiftUI

struct BankConnectionView: View {
    @StateObject private var viewModel = BankConnectionViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if viewModel.isLoading {
                    ProgressView("Connecting to bank...")
                        .progressViewStyle(CircularProgressViewStyle())
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "building.columns.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.blue)
                        
                        Text("Connect Your Bank Account")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Securely connect your bank account to automatically import transactions for reimbursement requests.")
                            .font(.body)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                        
                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .foregroundColor(.red)
                                .font(.caption)
                        }
                        
                        Button("Connect Bank Account") {
                            Task {
                                await viewModel.connectBank()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        
                        if viewModel.isConnected {
                            VStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                    .font(.title)
                                
                                Text("Bank account connected successfully!")
                                    .foregroundColor(.green)
                                    .fontWeight(.medium)
                                
                                Button("Continue") {
                                    dismiss()
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Bank Connection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

@MainActor
class BankConnectionViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isConnected = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    func connectBank() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Get link token from backend
            let linkToken = try await apiService.createLinkToken()
            
            // For now, simulate successful connection
            // In production, this would open Plaid Link with the token
            try await Task.sleep(nanoseconds: 2_000_000_000)
            
            // Simulate successful token exchange
            try await apiService.exchangePublicToken("mock_public_token")
            
            isConnected = true
        } catch {
            errorMessage = "Failed to connect bank: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
}

#Preview {
    BankConnectionView()
}