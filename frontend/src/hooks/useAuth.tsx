import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      [key: string]: any;
    };
  } | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithMicrosoft: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      [key: string]: any;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          setUser(null);
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
          });
          setError(null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize auth"
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        });
        setError(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== AuthContext signIn ===');
      console.log('Attempting signInWithPassword for:', email);

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error("Supabase signIn error:", signInError);
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      if (data.user) {
        console.log('User signed in:', data.user.email);
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });
        return { success: true };
      }

      return { success: false, error: "Unknown error" };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      console.error("Sign in exception:", err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign Up
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Supabase signUp error:", signUpError);
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });
        return { success: true };
      }

      return { success: false, error: "Unknown error" };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign up failed";
      console.error("Sign up exception:", err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (googleError) {
        console.error("Supabase Google signIn error:", googleError);
        setError(googleError.message);
        return { success: false, error: googleError.message };
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: false, error: "No redirect URL provided" };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google sign in failed";
      console.error("Google sign in exception:", err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Microsoft OAuth Sign In
  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: microsoftError } =
        await supabase.auth.signInWithOAuth({
          provider: "azure",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: "openid profile email",
          },
        });

      if (microsoftError) {
        console.error("Supabase Microsoft signIn error:", microsoftError);
        setError(microsoftError.message);
        return { success: false, error: microsoftError.message };
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: false, error: "No redirect URL provided" };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Microsoft sign in failed";
      console.error("Microsoft sign in exception:", err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Supabase signOut error:", signOutError);
        throw signOutError;
      }

      setUser(null);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign out failed";
      console.error("Sign out exception:", err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
