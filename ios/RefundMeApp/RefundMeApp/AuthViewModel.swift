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
        
        do {
            let (user, session) = try await APIService.shared.signUpMobile(
                email: email,
                password: password,
                fullName: fullName
            )
            
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = "Sign up failed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func signOut() async {
        currentUser = nil
        isAuthenticated = false
    }
    
    func refreshUser() async {
        // Refresh user profile data
        guard currentUser?.id != nil else { return }
        
        // For now, we'll just keep the current user data
        // In a real implementation, we would fetch updated user data from the API
        // This method will be called after profile updates to ensure UI shows latest data
    }
}