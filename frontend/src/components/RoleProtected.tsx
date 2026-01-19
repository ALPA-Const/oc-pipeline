import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';

interface RoleProtectedProps {
    roles: string[]; // allowed roles
    children: ReactNode;
}

export function RoleProtected({ roles, children }: RoleProtectedProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    // If no user or user lacks required role, redirect to dashboard
    const hasRole = user && (
        user.user_metadata?.roles?.some((r: string) => roles.includes(r)) ||
        roles.includes(user.user_metadata?.title || '')
    );

    if (!hasRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
