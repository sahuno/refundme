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
                
                Section("App") {
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