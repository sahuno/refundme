import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var recentTransactions: [Transaction] = []
    @State private var pendingRequests: [ReimbursementRequest] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Card
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back,")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text(authViewModel.currentUser?.fullName ?? authViewModel.currentUser?.email ?? "User")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Quick Stats
                    HStack(spacing: 16) {
                        StatCard(
                            title: "Pending",
                            value: "$\(pendingAmount, specifier: "%.2f")",
                            icon: "clock.fill",
                            color: .orange
                        )
                        
                        StatCard(
                            title: "This Month",
                            value: "$\(monthlyAmount, specifier: "%.2f")",
                            icon: "calendar",
                            color: .blue
                        )
                    }
                    
                    // Recent Transactions
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Transactions")
                                .font(.headline)
                            Spacer()
                            NavigationLink(destination: TransactionListView()) {
                                Text("See All")
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        if recentTransactions.isEmpty {
                            Text("No recent transactions")
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        } else {
                            ForEach(recentTransactions.prefix(5)) { transaction in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(transaction.name)
                                            .font(.subheadline)
                                        Text(transaction.date, style: .date)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Text("$\(transaction.amount, specifier: "%.2f")")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Quick Actions
                    VStack(spacing: 12) {
                        NavigationLink(destination: BankConnectionView()) {
                            ActionCard(
                                title: "Connect Bank Account",
                                icon: "building.columns.fill",
                                color: .green
                            )
                        }
                        
                        NavigationLink(destination: CreateReimbursementView(transactions: [])) {
                            ActionCard(
                                title: "Create Manual Request",
                                icon: "plus.circle.fill",
                                color: .blue
                            )
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await loadDashboardData()
            }
        }
        .task {
            await loadDashboardData()
        }
    }
    
    private var pendingAmount: Double {
        pendingRequests
            .filter { $0.status == .pending }
            .reduce(0) { $0 + $1.totalAmount }
    }
    
    private var monthlyAmount: Double {
        let calendar = Calendar.current
        let now = Date()
        let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
        
        return recentTransactions
            .filter { $0.date >= startOfMonth }
            .reduce(0) { $0 + $1.amount }
    }
    
    private func loadDashboardData() async {
        isLoading = true
        
        do {
            async let transactions = SupabaseService.shared.fetchTransactions()
            async let requests = SupabaseService.shared.fetchReimbursementRequests()
            
            self.recentTransactions = try await transactions
            self.pendingRequests = try await requests
        } catch {
            print("Failed to load dashboard data: \(error)")
        }
        
        isLoading = false
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct ActionCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}