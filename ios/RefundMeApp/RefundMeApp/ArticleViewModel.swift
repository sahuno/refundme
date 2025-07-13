import Foundation
import SwiftUI

@MainActor
class ArticleViewModel: ObservableObject {
    @Published var article: EducationalContent?
    @Published var relatedArticles: [EducationalContent] = []
    @Published var isLiked = false
    @Published var isBookmarked = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    private var hasTrackedView = false
    
    func loadArticle(slug: String) async {
        isLoading = true
        errorMessage = nil
        hasTrackedView = false
        
        do {
            // Fetch the article
            article = try await apiService.fetchArticle(slug: slug)
            
            // Track view (only once per load)
            if let article = article, !hasTrackedView {
                hasTrackedView = true
                try await apiService.trackInteraction(contentId: article.id, type: .view)
            }
            
            // Load related articles
            if let article = article {
                await loadRelatedArticles(for: article)
            }
        } catch {
            errorMessage = "Failed to load article: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    private func loadRelatedArticles(for article: EducationalContent) async {
        do {
            // Fetch articles from the same category
            let allInCategory = try await apiService.fetchEducationalContent(category: article.category)
            
            // Filter out the current article and limit to 3
            relatedArticles = allInCategory
                .filter { $0.id != article.id }
                .prefix(3)
                .map { $0 }
        } catch {
            // Silently fail for related articles
            print("Failed to load related articles: \(error)")
        }
    }
    
    func toggleLike() async {
        guard let article = article else { return }
        
        isLiked.toggle()
        
        do {
            try await apiService.trackInteraction(contentId: article.id, type: .like)
        } catch {
            // Revert on failure
            isLiked.toggle()
            errorMessage = "Failed to update like: \(error.localizedDescription)"
        }
    }
    
    func toggleBookmark() async {
        guard let article = article else { return }
        
        isBookmarked.toggle()
        
        do {
            try await apiService.trackInteraction(contentId: article.id, type: .bookmark)
        } catch {
            // Revert on failure
            isBookmarked.toggle()
            errorMessage = "Failed to update bookmark: \(error.localizedDescription)"
        }
    }
    
    func shareArticle() {
        guard let article = article else { return }
        
        let shareText = "Check out this article: \(article.title)"
        let shareURL = URL(string: "https://refundme.app/learn/\(article.slug)")
        
        let activityItems: [Any] = [shareText, shareURL as Any].compactMap { $0 }
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {
            let activityViewController = UIActivityViewController(
                activityItems: activityItems,
                applicationActivities: nil
            )
            
            // For iPad
            if let popover = activityViewController.popoverPresentationController {
                popover.sourceView = window
                popover.sourceRect = CGRect(x: window.bounds.midX, y: window.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            
            rootViewController.present(activityViewController, animated: true)
        }
    }
}