import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get the code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const provider = params.get('provider') || 'google';

      if (!code) {
        console.error('No code received');
        setError('Authentication failed: No code received');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Exchange code for tokens via your backend
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/exchange`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              code,
              redirectUri: `${window.location.origin}/auth/callback`
            })
          }
        );

        if (!response.ok) {
          throw new Error('Authentication exchange failed');
        }

        const data = await response.json();

        if (data.token) {
          // Store JWT token
          localStorage.setItem('auth_token', data.token);
          // Store user info if provided
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          throw new Error('No token received');
        }
      } catch (error) {
        console.error('Auth exchange failed:', error);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">
          {error || 'Completing sign in...'}
        </p>
      </div>
    </div>
  );
}
