import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditProfile = false
    
    var body: some View {
        NavigationStack {
            List {
                Section("Profile") {
                    if let user = authViewModel.currentUser {
                        Button(action: { showEditProfile = true }) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(user.fullName ?? user.email)
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Text(user.email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    if let department = user.department {
                                        Text(department)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                Section("Reimbursement Settings") {
                    HStack {
                        Text("Admin Email")
                        Spacer()
                        Text(authViewModel.currentUser?.adminEmail ?? "Not set")
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                    .onTapGesture {
                        showEditProfile = true
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
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
        }
    }
    
    private func signOut() {
        Task {
            await authViewModel.signOut()
        }
    }
}

// MARK: - Edit Profile View
struct EditProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = EditProfileViewModel()
    
    @State private var fullName = ""
    @State private var department = ""
    @State private var studentId = ""
    @State private var adminEmail = ""
    @State private var showSuccessAlert = false
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Personal Information") {
                    TextField("Full Name", text: $fullName)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Department", text: $department)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Student ID", text: $studentId)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
                
                Section {
                    TextField("Admin Email", text: $adminEmail)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                } header: {
                    Text("Reimbursement Settings")
                } footer: {
                    Text("This email will receive notifications about your reimbursement requests")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section {
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(authViewModel.currentUser?.email ?? "")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Account")
                } footer: {
                    Text("Email cannot be changed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            await saveProfile()
                        }
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .onAppear {
                loadCurrentProfile()
            }
            .alert("Success", isPresented: $showSuccessAlert) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your profile has been updated successfully")
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") { }
            } message: {
                Text(viewModel.errorMessage ?? "Failed to update profile")
            }
            .disabled(viewModel.isLoading)
            .overlay {
                if viewModel.isLoading {
                    ProgressView("Saving...")
                        .padding()
                        .background(Color.black.opacity(0.5))
                        .cornerRadius(10)
                }
            }
        }
    }
    
    private func loadCurrentProfile() {
        guard let user = authViewModel.currentUser else { return }
        fullName = user.fullName ?? ""
        department = user.department ?? ""
        // studentId would need to be added to the User model
        adminEmail = user.adminEmail ?? ""
    }
    
    private func saveProfile() async {
        let success = await viewModel.updateProfile(
            fullName: fullName.isEmpty ? nil : fullName,
            department: department.isEmpty ? nil : department,
            studentId: studentId.isEmpty ? nil : studentId,
            adminEmail: adminEmail.isEmpty ? nil : adminEmail
        )
        
        if success {
            // Update the current user in AuthViewModel
            await authViewModel.refreshUser()
            showSuccessAlert = true
        }
    }
}

// MARK: - Edit Profile View Model
@MainActor
class EditProfileViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    func updateProfile(fullName: String?, department: String?, studentId: String?, adminEmail: String?) async -> Bool {
        isLoading = true
        showError = false
        errorMessage = nil
        
        do {
            let success = try await apiService.updateUserProfile(
                fullName: fullName,
                department: department,
                studentId: studentId,
                adminEmail: adminEmail
            )
            
            isLoading = false
            return success
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            isLoading = false
            return false
        }
    }
}