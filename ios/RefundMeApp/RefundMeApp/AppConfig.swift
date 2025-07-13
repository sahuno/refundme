import Foundation

enum AppConfig {
    // IMPORTANT: Replace these with your actual values
    static let supabaseURL = "https://uipmodsomobzbendohdh.supabase.co" // Same as in web/.env.local
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcG1vZHNvbW9iemJlbmRvaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ2MDksImV4cCI6MjA2MzI5MDYwOX0.qqRdsK7WMtwA8c5JBVAatHexoFxM3gH6fnymsotGYDo" // Same as in web/.env.local
    
    // For local development, use your Mac's IP address:
    // To find your IP: System Settings > Network > WiFi > Details > IP Address
    // static let apiBaseURL = "http://localhost:3001/api"
    // static let mobileAPIBaseURL = "http://localhost:3001/api/mobile"
    
    // For production deployment (using deployed Vercel app):
    static let apiBaseURL = "https://refundme-samuel-ahunos-projects.vercel.app/api"
    static let mobileAPIBaseURL = "https://refundme-samuel-ahunos-projects.vercel.app/api/mobile"
    
    static let apiVersion = "v1"
    static let plaidEnvironment = "sandbox" // Change to "production" for release
}