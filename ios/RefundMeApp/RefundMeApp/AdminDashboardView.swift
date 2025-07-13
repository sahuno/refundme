import SwiftUI

struct AdminDashboardView: View {
    @StateObject private var viewModel = AdminViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back,")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        
                        Text(authViewModel.currentUser?.fullName ?? authViewModel.currentUser?.email ?? "Admin")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        if let department = authViewModel.currentUser?.adminDepartment {
                            Label("\(department) Department Admin", systemImage: "building.2")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        } else if authViewModel.currentUser?.isSuperAdmin == true {
                            Label("Super Administrator", systemImage: "star.fill")
                                .font(.subheadline)
                                .foregroundColor(.orange)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    
                    // Department Statistics
                    if let stats = viewModel.departmentStats {
                        VStack(spacing: 16) {
                            Text("Department Overview")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 16) {
                                AdminStatCard(
                                    title: "Pending",
                                    value: "\(stats.pendingRequests)",
                                    icon: "clock.fill",
                                    color: .orange
                                )
                                
                                AdminStatCard(
                                    title: "Approved",
                                    value: "\(stats.approvedRequests)",
                                    icon: "checkmark.circle.fill",
                                    color: .green
                                )
                                
                                AdminStatCard(
                                    title: "Total Amount",
                                    value: formatCurrency(stats.totalApprovedAmount),
                                    icon: "dollarsign.circle.fill",
                                    color: .blue
                                )
                                
                                AdminStatCard(
                                    title: "Students",
                                    value: "\(stats.studentCount)",
                                    icon: "person.2.fill",
                                    color: .purple
                                )
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            if viewModel.hasPendingRequests {
                                QuickActionCard(
                                    title: "Review Pending Requests",
                                    subtitle: "\(viewModel.pendingRequests.count) requests awaiting review",
                                    icon: "doc.badge.clock",
                                    color: .orange,
                                    destination: DepartmentRequestsView()
                                )
                            }
                            
                            QuickActionCard(
                                title: "View All Requests",
                                subtitle: "Browse and manage all department requests",
                                icon: "doc.text.fill",
                                color: .blue,
                                destination: DepartmentRequestsView()
                            )
                            
                            if authViewModel.currentUser?.isSuperAdmin == true {
                                QuickActionCard(
                                    title: "Manage Content",
                                    subtitle: "Create and edit educational content",
                                    icon: "text.book.closed.fill",
                                    color: .green,
                                    destination: ContentManagementView()
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Recent Activity
                    if !viewModel.allRequests.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Requests")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(viewModel.allRequests.prefix(5)) { request in
                                NavigationLink(destination: RequestDetailView(request: request)) {
                                    RecentRequestCard(request: request)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Admin Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.loadDepartmentRequests()
            }
        }
        .task {
            await viewModel.loadDepartmentRequests()
        }
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "$0.00"
    }
}

// MARK: - Stat Card
struct AdminStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Quick Action Card
struct QuickActionCard<Destination: View>: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let destination: Destination
    
    var body: some View {
        NavigationLink(destination: destination) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1))
                    .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

// MARK: - Recent Request Card
struct RecentRequestCard: View {
    let request: ReimbursementRequest
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Request #\(request.id.uuidString.prefix(8))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                if let userName = request.userName {
                    Text(userName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    StatusBadge(status: request.status ?? "pending")
                    
                    if let amount = request.totalAmount {
                        Text(formatCurrency(amount))
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                }
            }
            
            Spacer()
            
            Text(formatDate(request.createdAt))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "$0.00"
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: String
    
    var color: Color {
        switch status.lowercased() {
        case "approved":
            return .green
        case "rejected":
            return .red
        case "submitted", "pending":
            return .orange
        default:
            return .gray
        }
    }
    
    var body: some View {
        Text(status.capitalized)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.1))
            .cornerRadius(4)
    }
}

#Preview {
    AdminDashboardView()
        .environmentObject(AuthViewModel())
}