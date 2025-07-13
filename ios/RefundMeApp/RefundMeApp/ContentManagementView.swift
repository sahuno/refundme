import SwiftUI

// Placeholder for Content Management View (Super Admin only)
struct ContentManagementView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "text.book.closed.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                
                Text("Content Management")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("This feature allows super administrators to create and manage educational content.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Text("Coming Soon")
                    .font(.headline)
                    .foregroundColor(.orange)
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(10)
            }
            .padding()
            .navigationTitle("Content Management")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

#Preview {
    ContentManagementView()
}