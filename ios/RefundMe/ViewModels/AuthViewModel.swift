import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseService.shared
    private let api = APIService.shared
    
    init() {
        Task {
            await checkAuthentication()
        }
    }
    
    func checkAuthentication() async {
        do {
            // Check if we have a valid session
            if let user = try await supabase.client.auth.user() {
                self.currentUser = try await supabase.fetchUserProfile(userId: user.id)
                self.isAuthenticated = true
            }
        } catch {
            self.isAuthenticated = false
        }
    }
    
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Use mobile-specific endpoint
            let (user, _) = try await api.signInMobile(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, fullName: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            currentUser = try await supabase.signUp(email: email, password: password, fullName: fullName)
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signOut() async {
        do {
            try await supabase.signOut()
            currentUser = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}