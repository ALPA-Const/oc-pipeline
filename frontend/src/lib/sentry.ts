import * as Sentry from '@sentry/react';

/**
 * Sentry Configuration and Error Tracking
 * Initialized with modern Sentry SDK
 */

// Initialize Sentry only in production
export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Sentry (dev mode):', error, context);
  }
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`Sentry (dev mode) [${level}]:`, message, context);
  }
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context
 */
export function clearUser() {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Start a new transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  if (import.meta.env.PROD) {
    return Sentry.startSpan(
      {
        name,
        op,
      },
      (span) => span
    );
  }
  return null;
}

/**
 * Wrap component with error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profile React component
 */
export const withProfiler = Sentry.withProfiler;