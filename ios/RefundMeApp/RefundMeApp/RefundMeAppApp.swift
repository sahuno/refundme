import SwiftUI
import Sentry

@main
struct RefundMeAppApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    init() {
        if !AppConfig.sentryDSN.isEmpty {
            SentrySDK.start { options in
                options.dsn = AppConfig.sentryDSN
                options.tracesSampleRate = 1.0

                #if DEBUG
                options.debug = true
                options.environment = "development"
                #else
                options.environment = "production"
                #endif

                options.enableAutoSessionTracking = true
                options.attachScreenshot = true
                options.enableUserInteractionTracing = true
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}
