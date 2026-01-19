import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get params from URL
        const type = searchParams.get('type');
        const tokenHash = searchParams.get('token_hash');
        const redirectTo = searchParams.get('redirect_to');
        
        // Also check hash params (Supabase sometimes uses hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashType = hashParams.get('type');
        const hashAccessToken = hashParams.get('access_token');
        
        console.log('AuthCallback: type =', type, 'hashType =', hashType);
        console.log('AuthCallback: tokenHash =', tokenHash);
        console.log('AuthCallback: redirectTo =', redirectTo);
        
        // If we have a token_hash, verify it first
        if (tokenHash) {
          console.log('AuthCallback: Verifying token hash...');
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'recovery' | 'signup' | 'email' || 'recovery',
          });
          
          if (verifyError) {
            console.error('Token verification error:', verifyError);
            navigate('/login?error=invalid_token');
            return;
          }
        }
        
        // Get session after verification
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (data.session) {
          // If this is a password recovery flow, redirect to reset password page
          if (type === 'recovery' || hashType === 'recovery') {
            console.log('AuthCallback: Recovery flow detected, redirecting to reset-password');
            navigate('/auth/reset-password');
            return;
          }
          
          // If there's a custom redirect_to, use it
          if (redirectTo) {
            // Check if it's a path or full URL
            if (redirectTo.startsWith('/')) {
              navigate(redirectTo);
              return;
            }
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
