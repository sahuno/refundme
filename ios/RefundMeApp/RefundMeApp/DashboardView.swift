import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
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
                            value: "$150.75",
                            icon: "clock.fill",
                            color: .orange
                        )
                        
                        StatCard(
                            title: "This Month",
                            value: "$89.99",
                            icon: "calendar",
                            color: .blue
                        )
                    }
                    
                    // Recent Activity
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Activity")
                                .font(.headline)
                            Spacer()
                            NavigationLink(destination: TransactionListView()) {
                                Text("See All")
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        VStack(spacing: 8) {
                            ActivityRow(title: "Amazon Purchase", amount: "$25.99", date: "Today")
                            ActivityRow(title: "Starbucks", amount: "$12.50", date: "Yesterday")
                            ActivityRow(title: "Office Supplies", amount: "$45.00", date: "2 days ago")
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Connect Bank Button
                    NavigationLink(destination: BankConnectionView()) {
                        HStack {
                            Image(systemName: "building.columns.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                            Text("Connect Bank Account")
                                .font(.headline)
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Dashboard")
        }
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

struct ActivityRow: View {
    let title: String
    let amount: String
    let date: String
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(title)
                    .font(.subheadline)
                Text(date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text(amount)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}