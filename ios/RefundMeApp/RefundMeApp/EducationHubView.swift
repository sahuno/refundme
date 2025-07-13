import SwiftUI

struct EducationHubView: View {
    @StateObject private var viewModel = EducationViewModel()
    @State private var showWeeklyTip = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Weekly Tip Banner
                    if showWeeklyTip, let tip = viewModel.weeklyTip {
                        WeeklyTipBanner(tip: tip, showTip: $showWeeklyTip)
                            .padding(.horizontal)
                    }
                    
                    // Search Bar
                    SearchBar(text: $viewModel.searchText, onSearchButtonClicked: {
                        Task {
                            await viewModel.searchContent()
                        }
                    })
                    .padding(.horizontal)
                    
                    // Category Filter
                    CategoryFilterView(selectedCategory: $viewModel.selectedCategory)
                        .padding(.horizontal)
                    
                    // Featured Content (only show when no search/filter)
                    if viewModel.searchText.isEmpty && viewModel.selectedCategory == nil && !viewModel.featuredContent.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Featured Articles")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    ForEach(viewModel.featuredContent) { article in
                                        NavigationLink(destination: ArticleDetailView(slug: article.slug)) {
                                            FeaturedContentCard(article: article)
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                    
                    // All Articles
                    VStack(alignment: .leading, spacing: 12) {
                        Text(viewModel.selectedCategory == nil ? "All Articles" : "\(viewModel.selectedCategory!.displayName) Articles")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if viewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity, minHeight: 200)
                        } else if viewModel.filteredContent.isEmpty {
                            EmptyStateView(
                                title: "No Articles Found",
                                message: viewModel.searchText.isEmpty ? "Check back later for new content." : "Try a different search term.",
                                systemImage: "doc.text.magnifyingglass"
                            )
                            .frame(minHeight: 200)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(viewModel.filteredContent) { article in
                                    NavigationLink(destination: ArticleDetailView(slug: article.slug)) {
                                        ContentCard(article: article)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Financial Education")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.loadContent()
            }
        }
        .task {
            await viewModel.loadContent()
            await viewModel.loadWeeklyTip()
        }
        .onChange(of: viewModel.selectedCategory) {
            Task {
                await viewModel.loadContent()
            }
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    var onSearchButtonClicked: () -> Void
    
    var body: some View {
        HStack {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Search articles...", text: $text)
                    .textFieldStyle(PlainTextFieldStyle())
                    .onSubmit {
                        onSearchButtonClicked()
                    }
                
                if !text.isEmpty {
                    Button(action: { text = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(8)
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
    }
}

// MARK: - Category Filter
struct CategoryFilterView: View {
    @Binding var selectedCategory: ContentCategory?
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // All button
                CategoryChip(
                    title: "All",
                    isSelected: selectedCategory == nil,
                    action: { selectedCategory = nil }
                )
                
                // Category buttons
                ForEach(ContentCategory.allCases, id: \.self) { category in
                    CategoryChip(
                        title: category.displayName,
                        isSelected: selectedCategory == category,
                        action: { selectedCategory = category }
                    )
                }
            }
        }
    }
}

struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray6))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

// MARK: - Weekly Tip Banner
struct WeeklyTipBanner: View {
    let tip: WeeklyTip
    @Binding var showTip: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Weekly Tip", systemImage: "lightbulb.fill")
                    .font(.caption)
                    .foregroundColor(.white)
                
                Spacer()
                
                Button(action: { withAnimation { showTip = false } }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.white.opacity(0.8))
                        .font(.caption)
                }
            }
            
            Text(tip.title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            
            Text(tip.content)
                .font(.caption)
                .foregroundColor(.white.opacity(0.9))
                .lineLimit(2)
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue, Color.blue.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

// MARK: - Content Cards
struct FeaturedContentCard: View {
    let article: EducationalContent
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: article.category.iconName)
                    .font(.title2)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text(article.category.displayName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(8)
            }
            
            Text(article.title)
                .font(.headline)
                .foregroundColor(.white)
                .lineLimit(2)
            
            Text(article.content)
                .font(.caption)
                .foregroundColor(.white.opacity(0.9))
                .lineLimit(3)
            
            Spacer()
            
            HStack {
                Label("\(article.viewCount)", systemImage: "eye")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                if article.featured {
                    Label("Featured", systemImage: "star.fill")
                        .font(.caption)
                        .foregroundColor(.yellow)
                }
            }
        }
        .padding()
        .frame(width: 280, height: 160)
        .background(
            LinearGradient(
                colors: [
                    Color(article.category.color),
                    Color(article.category.color).opacity(0.8)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

struct ContentCard: View {
    let article: EducationalContent
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Category Icon
            Image(systemName: article.category.iconName)
                .font(.title2)
                .foregroundColor(Color(article.category.color))
                .frame(width: 40, height: 40)
                .background(Color(article.category.color).opacity(0.1))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(article.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                Text(article.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Text(article.category.displayName)
                        .font(.caption)
                        .foregroundColor(Color(article.category.color))
                    
                    Text("•")
                        .foregroundColor(.secondary)
                    
                    Label("\(article.viewCount)", systemImage: "eye")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if article.featured {
                        Text("•")
                            .foregroundColor(.secondary)
                        
                        Label("Featured", systemImage: "star.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Empty State
struct EmptyStateView: View {
    let title: String
    let message: String
    let systemImage: String
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    EducationHubView()
}