import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithMicrosoft,
  signOut as supabaseSignOut,
  getCurrentUser,
  onAuthStateChange,
} from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        setAuthState({
          user: user || null,
          session: null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Auth error',
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const subscription = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);

      setAuthState({
        user: session?.user || null,
        session: session || null,
        loading: false,
        error: null,
      });

      // Handle redirects after OAuth
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Email/Password Sign Up
  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        const data = await signUpWithEmail(email, password);

        setAuthState({
          user: data.user || null,
          session: data.session || null,
          loading: false,
          error: null,
        });

        return { success: true, data };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed';
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return { success: false, error: message };
      }
    },
    []
  );

  // Email/Password Sign In
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        const data = await signInWithEmail(email, password);

        setAuthState({
          user: data.user || null,
          session: data.session || null,
          loading: false,
          error: null,
        });

        return { success: true, data };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign in failed';
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return { success: false, error: message };
      }
    },
    []
  );

  // Google OAuth Sign In
  const handleSignInWithGoogle = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithGoogle();
      // OAuth will redirect, so we don't update state here
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  // Microsoft OAuth Sign In
  const handleSignInWithMicrosoft = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithMicrosoft();
      // OAuth will redirect, so we don't update state here
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Microsoft sign in failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      await supabaseSignOut();

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      navigate('/login');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, [navigate]);

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithMicrosoft: handleSignInWithMicrosoft,
    signOut,
  };
};
