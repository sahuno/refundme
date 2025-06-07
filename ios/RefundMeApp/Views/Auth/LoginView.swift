import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Logo
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                
                Text("RefundMe")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Manage your reimbursements")
                    .foregroundColor(.secondary)
                
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focusedField, equals: .email)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .focused($focusedField, equals: .password)
                }
                .padding(.top, 32)
                
                if let errorMessage = authViewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: signIn) {
                    if authViewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Sign In")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .disabled(authViewModel.isLoading || email.isEmpty || password.isEmpty)
                
                NavigationLink(destination: SignUpView()) {
                    Text("Don't have an account? Sign Up")
                        .foregroundColor(.blue)
                }
                
                Spacer()
            }
            .padding()
            .navigationBarHidden(true)
            .task {
                // Check API health on load
                do {
                    let isHealthy = try await APIService.shared.checkHealth()
                    if !isHealthy {
                        authViewModel.errorMessage = "Unable to connect to server"
                    }
                } catch {
                    authViewModel.errorMessage = "Connection error"
                }
            }
        }
    }
    
    private func signIn() {
        Task {
            await authViewModel.signIn(email: email, password: password)
        }
    }
}