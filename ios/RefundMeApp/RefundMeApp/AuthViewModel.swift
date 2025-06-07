import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    init() {
        // For now, start unauthenticated
    }
    
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let (user, _) = try await apiService.signInMobile(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = "Sign in failed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, fullName: String) async {
        isLoading = true
        errorMessage = nil
        
        // For now, simulate sign up
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        if !email.isEmpty && !password.isEmpty && !fullName.isEmpty {
            currentUser = User(
                id: UUID(),
                email: email,
                fullName: fullName,
                department: nil,
                adminEmail: nil,
                createdAt: Date()
            )
            isAuthenticated = true
        } else {
            errorMessage = "Please fill in all fields"
        }
        
        isLoading = false
    }
    
    func signOut() async {
        currentUser = nil
        isAuthenticated = false
    }
}