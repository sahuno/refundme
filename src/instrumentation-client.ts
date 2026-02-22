import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // Adjust in production to a lower value to reduce costs.
  tracesSampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Capture unhandled promise rejections
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Session Replay — capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
