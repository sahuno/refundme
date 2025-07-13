import Foundation
import SwiftUI

@MainActor
class EducationViewModel: ObservableObject {
    @Published var featuredContent: [EducationalContent] = []
    @Published var allContent: [EducationalContent] = []
    @Published var selectedCategory: ContentCategory?
    @Published var searchText = ""
    @Published var isLoading = false
    @Published var weeklyTip: WeeklyTip?
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    private var loadTask: Task<Void, Never>?
    
    // Filtered content based on search and category
    var filteredContent: [EducationalContent] {
        var filtered = allContent
        
        // Filter by category
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { content in
                content.title.localizedCaseInsensitiveContains(searchText) ||
                content.content.localizedCaseInsensitiveContains(searchText) ||
                content.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }
        
        return filtered
    }
    
    func loadContent() async {
        loadTask?.cancel()
        
        loadTask = Task {
            isLoading = true
            errorMessage = nil
            
            do {
                // Load featured content
                let featured = try await apiService.fetchEducationalContent(featured: true)
                if !Task.isCancelled {
                    self.featuredContent = featured
                }
                
                // Load all content
                let all = try await apiService.fetchEducationalContent(category: selectedCategory)
                if !Task.isCancelled {
                    self.allContent = all
                }
            } catch {
                if !Task.isCancelled {
                    errorMessage = "Failed to load content: \(error.localizedDescription)"
                }
            }
            
            if !Task.isCancelled {
                isLoading = false
            }
        }
    }
    
    func searchContent() async {
        guard !searchText.isEmpty else {
            await loadContent()
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let results = try await apiService.fetchEducationalContent(search: searchText)
            allContent = results
        } catch {
            errorMessage = "Search failed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func loadWeeklyTip() async {
        do {
            weeklyTip = try await apiService.fetchWeeklyTip()
        } catch {
            // Silently fail for weekly tip
            print("Failed to load weekly tip: \(error)")
        }
    }
    
    func trackView(for content: EducationalContent) async {
        do {
            try await apiService.trackInteraction(contentId: content.id, type: .view)
        } catch {
            // Silently fail for view tracking
            print("Failed to track view: \(error)")
        }
    }
    
    func toggleInteraction(_ type: InteractionType, for content: EducationalContent) async {
        do {
            try await apiService.trackInteraction(contentId: content.id, type: type)
        } catch {
            errorMessage = "Failed to update: \(error.localizedDescription)"
        }
    }
}