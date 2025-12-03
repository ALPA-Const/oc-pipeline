/**
 * OC Pipeline - React Query Client Configuration
 * Centralized QueryClient setup with default options
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.message?.includes('Authentication required') ||
            error?.message?.includes('Auth session missing') ||
            error?.name === 'AuthSessionMissingError' ||
            error?.isAuthError) {
          return false;
        }
        return failureCount < 1; // Retry once for other errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: 'stale', // Refetch if data is stale
      refetchOnReconnect: 'stale', // Refetch if data is stale when reconnecting
      // Suppress auth errors globally
      onError: (error: any) => {
        // Completely suppress auth errors - don't log them
        const isAuthError = error?.message?.includes('Authentication required') ||
                           error?.message?.includes('Auth session missing') ||
                           error?.name === 'AuthSessionMissingError' ||
                           error?.isAuthError;

        if (!isAuthError) {
          // Only log non-auth errors
          console.error('Query error:', error);
        }
      },
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Suppress auth errors in mutations too
      onError: (error: any) => {
        const isAuthError = error?.message?.includes('Authentication required') ||
                           error?.message?.includes('Auth session missing') ||
                           error?.name === 'AuthSessionMissingError' ||
                           error?.isAuthError;

        if (!isAuthError) {
          console.error('Mutation error:', error);
        }
      },
    },
  },
  // Global error logger - suppress auth errors
  logger: {
    log: (...args: any[]) => {
      // Check if any arg contains auth error
      const hasAuthError = args.some(arg =>
        (typeof arg === 'string' && (
          arg.includes('Authentication required') ||
          arg.includes('Auth session missing') ||
          arg.includes('AuthSessionMissingError')
        )) ||
        (arg?.name === 'AuthSessionMissingError') ||
        (arg?.isAuthError)
      );

      if (!hasAuthError) {
        console.log(...args);
      }
    },
    warn: (...args: any[]) => {
      const hasAuthError = args.some(arg =>
        (typeof arg === 'string' && (
          arg.includes('Authentication required') ||
          arg.includes('Auth session missing') ||
          arg.includes('AuthSessionMissingError')
        )) ||
        (arg?.name === 'AuthSessionMissingError') ||
        (arg?.isAuthError)
      );

      if (!hasAuthError) {
        console.warn(...args);
      }
    },
    error: (...args: any[]) => {
      const hasAuthError = args.some(arg =>
        (typeof arg === 'string' && (
          arg.includes('Authentication required') ||
          arg.includes('Auth session missing') ||
          arg.includes('AuthSessionMissingError')
        )) ||
        (arg?.name === 'AuthSessionMissingError') ||
        (arg?.isAuthError)
      );

      if (!hasAuthError) {
        console.error(...args);
      }
    },
  },
});

