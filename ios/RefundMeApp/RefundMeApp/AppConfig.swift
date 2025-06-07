import Foundation

enum AppConfig {
    // IMPORTANT: Replace these with your actual values
    static let supabaseURL = "https://uipmodsomobzbendohdh.supabase.co" // Same as in web/.env.local
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcG1vZHNvbW9iemJlbmRvaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ2MDksImV4cCI6MjA2MzI5MDYwOX0.qqRdsK7WMtwA8c5JBVAatHexoFxM3gH6fnymsotGYDo" // Same as in web/.env.local
    
    // For local development:
    static let apiBaseURL = "http://localhost:3001/api"
    static let mobileAPIBaseURL = "http://localhost:3001/api/mobile"
    
    // For production deployment, use:
    // static let apiBaseURL = "https://your-refundme-app.vercel.app/api"
    // static let mobileAPIBaseURL = "https://your-refundme-app.vercel.app/api/mobile"
    
    static let apiVersion = "v1"
    static let plaidEnvironment = "sandbox" // Change to "production" for release
}