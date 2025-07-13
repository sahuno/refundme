import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        if authViewModel.isAuthenticated {
            if authViewModel.currentUser?.hasAdminAccess == true {
                AdminTabView()
            } else {
                StudentTabView()
            }
        } else {
            LoginView()
        }
    }
}

struct StudentTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
            
            EducationHubView()
                .tabItem {
                    Label("Learn", systemImage: "book.fill")
                }
            
            TransactionListView()
                .tabItem {
                    Label("Transactions", systemImage: "list.bullet.rectangle")
                }
            
            ReimbursementListView()
                .tabItem {
                    Label("Requests", systemImage: "doc.text.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}

struct AdminTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        TabView {
            AdminDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar.fill")
                }
            
            DepartmentRequestsView()
                .tabItem {
                    Label("Requests", systemImage: "doc.badge.clock")
                }
            
            if authViewModel.currentUser?.isSuperAdmin == true {
                ContentManagementView()
                    .tabItem {
                        Label("Content", systemImage: "text.book.closed.fill")
                    }
            }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
        .environmentObject(authViewModel)
    }
}

#Preview {
    ContentView()
}
