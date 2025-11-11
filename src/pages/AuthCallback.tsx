// src/pages/AuthCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth callback error:", error.message);
        return;
      }
      if (data?.session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Authenticating...</p>
        <p className="text-sm text-gray-400">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;