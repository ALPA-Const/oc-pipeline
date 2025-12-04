import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for recovery/reset password flow
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to');
        
        // Also check hash params (Supabase sometimes uses hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashType = hashParams.get('type');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (data.session) {
          // If this is a password recovery flow, redirect to reset password page
          if (type === 'recovery' || hashType === 'recovery') {
            navigate('/auth/reset-password');
            return;
          }
          
          // If there's a custom redirect_to, use it
          if (redirectTo) {
            // Make sure it's a safe redirect (same origin)
            try {
              const url = new URL(redirectTo, window.location.origin);
              if (url.origin === window.location.origin) {
                navigate(url.pathname + url.search);
                return;
              }
            } catch {
              // Invalid URL, fall through to default
            }
          }
          
          // Default: go to dashboard
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
