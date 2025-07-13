import SwiftUI

struct ArticleDetailView: View {
    let slug: String
    @StateObject private var viewModel = ArticleViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                ProgressView("Loading article...")
                    .frame(maxWidth: .infinity, minHeight: 400)
            } else if let article = viewModel.article {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Label(article.category.displayName, systemImage: article.category.iconName)
                                .font(.caption)
                                .foregroundColor(Color(article.category.color))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(article.category.color).opacity(0.1))
                                .cornerRadius(16)
                            
                            if article.featured {
                                Label("Featured", systemImage: "star.fill")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.orange.opacity(0.1))
                                    .cornerRadius(16)
                            }
                            
                            Spacer()
                        }
                        
                        Text(article.title)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        HStack {
                            Text(formatDate(article.publishedAt ?? article.createdAt))
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Text("•")
                                .foregroundColor(.secondary)
                            
                            Label("\(article.viewCount) views", systemImage: "eye")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        // Tags
                        if !article.tags.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(article.tags, id: \.self) { tag in
                                        Text("#\(tag)")
                                            .font(.caption)
                                            .foregroundColor(.blue)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.blue.opacity(0.1))
                                            .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    Divider()
                    
                    // Content - Using basic markdown rendering
                    MarkdownView(content: article.content)
                        .padding(.horizontal)
                    
                    // Action buttons
                    HStack(spacing: 16) {
                        Button(action: {
                            Task {
                                await viewModel.toggleLike()
                            }
                        }) {
                            Label(viewModel.isLiked ? "Liked" : "Like", systemImage: viewModel.isLiked ? "heart.fill" : "heart")
                                .foregroundColor(viewModel.isLiked ? .red : .primary)
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: {
                            Task {
                                await viewModel.toggleBookmark()
                            }
                        }) {
                            Label(viewModel.isBookmarked ? "Saved" : "Save", systemImage: viewModel.isBookmarked ? "bookmark.fill" : "bookmark")
                                .foregroundColor(viewModel.isBookmarked ? .blue : .primary)
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: {
                            viewModel.shareArticle()
                        }) {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding(.horizontal)
                    
                    // Related Articles
                    if !viewModel.relatedArticles.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Related Articles")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(viewModel.relatedArticles) { relatedArticle in
                                NavigationLink(destination: ArticleDetailView(slug: relatedArticle.slug)) {
                                    RelatedArticleCard(article: relatedArticle)
                                }
                                .buttonStyle(PlainButtonStyle())
                                .padding(.horizontal)
                            }
                        }
                        .padding(.top)
                    }
                }
                .padding(.vertical)
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.red)
                    
                    Text("Failed to load article")
                        .font(.headline)
                    
                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Try Again") {
                        Task {
                            await viewModel.loadArticle(slug: slug)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .frame(maxWidth: .infinity, minHeight: 400)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if viewModel.article != nil {
                    Button(action: { viewModel.shareArticle() }) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
        }
        .task {
            await viewModel.loadArticle(slug: slug)
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Basic Markdown View
struct MarkdownView: View {
    let content: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(parseContent(content), id: \.self) { paragraph in
                if paragraph.hasPrefix("# ") {
                    Text(paragraph.dropFirst(2))
                        .font(.title)
                        .fontWeight(.bold)
                } else if paragraph.hasPrefix("## ") {
                    Text(paragraph.dropFirst(3))
                        .font(.title2)
                        .fontWeight(.semibold)
                } else if paragraph.hasPrefix("### ") {
                    Text(paragraph.dropFirst(4))
                        .font(.title3)
                        .fontWeight(.semibold)
                } else if paragraph.hasPrefix("- ") || paragraph.hasPrefix("* ") {
                    HStack(alignment: .top, spacing: 8) {
                        Text("•")
                            .fontWeight(.bold)
                        Text(paragraph.dropFirst(2))
                    }
                } else if !paragraph.isEmpty {
                    Text(formatInlineMarkdown(paragraph))
                }
            }
        }
    }
    
    private func parseContent(_ content: String) -> [String] {
        content.components(separatedBy: "\n")
    }
    
    private func formatInlineMarkdown(_ text: String) -> AttributedString {
        var result = text
        
        // Simple markdown replacements
        // Bold: **text** -> text (would be bold in real markdown renderer)
        result = result.replacingOccurrences(of: "**", with: "")
        
        // Italic: *text* -> text (would be italic in real markdown renderer)
        // Only replace single asterisks not part of bold syntax
        let components = result.components(separatedBy: "*")
        if components.count > 2 {
            result = components.joined(separator: "")
        }
        
        return AttributedString(result)
    }
}

// MARK: - Related Article Card
struct RelatedArticleCard: View {
    let article: EducationalContent
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: article.category.iconName)
                .font(.title3)
                .foregroundColor(Color(article.category.color))
                .frame(width: 32, height: 32)
                .background(Color(article.category.color).opacity(0.1))
                .cornerRadius(6)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(article.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                Text(article.content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Text(article.category.displayName)
                        .font(.caption2)
                        .foregroundColor(Color(article.category.color))
                    
                    Text("•")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Label("\(article.viewCount)", systemImage: "eye")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

#Preview {
    NavigationView {
        ArticleDetailView(slug: "sample-article")
    }
}