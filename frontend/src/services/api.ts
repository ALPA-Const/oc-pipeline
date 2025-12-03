/**
 * OC Pipeline - Axios API Client
 * Centralized HTTP client with authentication interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '@/lib/supabase';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://oc-pipeline-backend.onrender.com';

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
  correlationId?: string;
}

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper function to safely get session without throwing errors
 */
async function getSessionSafely() {
  try {
    const { data, error } = await supabase.auth.getSession();

    // If there's an error, check if it's a session missing error
    if (error) {
      // AuthSessionMissingError means no session exists - this is expected for unauthenticated users
      if (error.name === 'AuthSessionMissingError' ||
          error.message?.includes('session') ||
          error.message?.includes('Auth session missing')) {
        return { session: null, error: null };
      }
      // Other errors should be returned
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (err: any) {
    // Catch any thrown errors (including AuthSessionMissingError)
    if (err?.name === 'AuthSessionMissingError' ||
        err?.message?.includes('session') ||
        err?.message?.includes('Auth session missing')) {
      return { session: null, error: null };
    }
    return { session: null, error: err };
  }
}

/**
 * Request interceptor - Add JWT token from Supabase session
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { session, error: sessionError } = await getSessionSafely();

    // If there's a non-session error, log it but don't block the request
    if (sessionError && sessionError.name !== 'AuthSessionMissingError') {
      console.error('Error getting session token:', sessionError);
    }

    // If we have a session with a token, add it to the request
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      return config;
    }

    // No session found - check if we should redirect
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('/login') ||
                       currentPath.includes('/auth') ||
                       currentPath.includes('/signup');

    // Only redirect if we're not already on an auth page
    if (!isAuthPage) {
      // Redirect immediately without delay
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/auth')) {
        window.location.href = '/login';
      }

      // Reject the request silently to prevent it from proceeding without auth
      // Use a silent rejection to prevent error logging
      const authError = new Error('Authentication required');
      (authError as any).isAuthError = true; // Mark as auth error
      return Promise.reject(authError);
    }

    // If we're on an auth page, allow the request to proceed (might be a public endpoint)
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return response data directly if it matches our standard format
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { session, error: refreshError } = await getSessionSafely();

        // Handle refresh errors
        if (refreshError) {
          // Check if it's a session missing error
          if (refreshError.name === 'AuthSessionMissingError' ||
              refreshError.message?.includes('session') ||
              refreshError.message?.includes('Auth session missing')) {
            // No session to refresh, redirect to login
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
              window.location.href = '/login';
            }
            return Promise.reject(new Error('Authentication required'));
          }
          // Other refresh errors - redirect to login
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        if (!session) {
          // No session after refresh, redirect to login
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Authentication required'));
        }

        // Retry original request with new token
        if (originalRequest.headers && session.access_token) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Handle AuthSessionMissingError in catch block
        if (refreshError?.name === 'AuthSessionMissingError' ||
            refreshError?.message?.includes('session') ||
            refreshError?.message?.includes('Auth session missing')) {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Authentication required'));
        }
        // Other errors - redirect to login
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    // Don't log auth errors - they're expected when user is not authenticated
    if (error.message?.includes('Authentication required') ||
        (error as any).isAuthError) {
      return Promise.reject(error);
    }

    const errorMessage = error.response?.data?.error?.message ||
                        error.message ||
                        'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Export as both named and default for compatibility
export { apiClient };
export default apiClient;
