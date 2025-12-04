import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface RecoveryDetectorProps {
  children: React.ReactNode;
}

export function RecoveryDetector({ children }: RecoveryDetectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkForRecovery = async () => {
      // Check URL hash for recovery type (Supabase redirect format)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      // Also check query params
      const queryParams = new URLSearchParams(window.location.search);
      const queryType = queryParams.get('type');
      
      console.log('RecoveryDetector: hash type =', type, 'query type =', queryType);
      console.log('RecoveryDetector: current path =', location.pathname);
      console.log('RecoveryDetector: full hash =', window.location.hash);
      
      // If this is a recovery flow and we're not already on the reset page
      if ((type === 'recovery' || queryType === 'recovery') && 
          location.pathname !== '/auth/reset-password') {
        console.log('RecoveryDetector: Detected recovery flow, redirecting to reset-password');
        navigate('/auth/reset-password', { replace: true });
        return;
      }
      
      setChecking(false);
    };

    checkForRecovery();
  }, [navigate, location.pathname]);

  // Show nothing while checking to prevent flash
  if (checking && window.location.hash.includes('type=recovery')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
