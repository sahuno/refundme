import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationStack {
            List {
                Section("Profile") {
                    if let user = authViewModel.currentUser {
                        HStack {
                            Text("Name")
                            Spacer()
                            Text(user.fullName ?? "Not set")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email)
                                .foregroundColor(.secondary)
                        }
                        
                        if let department = user.department {
                            HStack {
                                Text("Department")
                                Spacer()
                                Text(department)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                
                Section("Bank Connections") {
                    NavigationLink(destination: BankConnectionView()) {
                        Label("Manage Bank Accounts", systemImage: "building.columns")
                    }
                }
                
                Section("Support") {
                    Link(destination: URL(string: "mailto:support@refundme.app")!) {
                        Label("Contact Support", systemImage: "envelope")
                    }
                    
                    NavigationLink(destination: AboutView()) {
                        Label("About", systemImage: "info.circle")
                    }
                }
                
                Section {
                    Button(action: signOut) {
                        Label("Sign Out", systemImage: "arrow.right.square")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
    
    private func signOut() {
        Task {
            await authViewModel.signOut()
        }
    }
}

struct AboutView: View {
    var body: some View {
        List {
            Section("App Information") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Build")
                    Spacer()
                    Text("1")
                        .foregroundColor(.secondary)
                }
            }
            
            Section("Description") {
                Text("RefundMe helps you manage and track your reimbursement requests with ease. Connect your bank accounts, analyze transactions with AI, and submit requests seamlessly.")
                    .foregroundColor(.secondary)
            }
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct BankConnectionView: View {
    @State private var connections: [BankConnection] = []
    @State private var isLoading = false
    @State private var showingPlaidLink = false
    
    var body: some View {
        List {
            Section("Connected Accounts") {
                if connections.isEmpty {
                    Text("No bank accounts connected")
                        .foregroundColor(.secondary)
                        .font(.subheadline)
                } else {
                    ForEach(connections) { connection in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(connection.institutionName)
                                .font(.headline)
                            
                            if let lastSync = connection.lastSync {
                                Text("Last synced: \(lastSync, style: .relative) ago")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            
            Section {
                Button(action: { showingPlaidLink = true }) {
                    Label("Connect New Account", systemImage: "plus.circle")
                }
            }
        }
        .navigationTitle("Bank Accounts")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingPlaidLink) {
            PlaidLinkSheet(onSuccess: handlePlaidSuccess)
        }
        .task {
            await loadConnections()
        }
    }
    
    private func loadConnections() async {
        // Implementation would fetch bank connections from Supabase
        // For now, this is a placeholder
    }
    
    private func handlePlaidSuccess(_ publicToken: String) {
        Task {
            do {
                try await APIService.shared.exchangePublicToken(publicToken)
                await loadConnections()
            } catch {
                print("Failed to exchange token: \(error)")
            }
        }
    }
}

struct PlaidLinkSheet: View {
    let onSuccess: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack {
                Text("Connect Bank Account")
                    .font(.title)
                    .padding()
                
                Text("This feature requires Plaid Link integration. Please see the setup instructions in the manifest file.")
                    .multilineTextAlignment(.center)
                    .padding()
                
                Button("Cancel") {
                    dismiss()
                }
                .padding()
            }
            .navigationBarHidden(true)
        }
    }
}