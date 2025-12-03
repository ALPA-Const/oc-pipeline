# Missing React Components: ErrorBoundary & Empty States

## 1. ErrorBoundary Component

    // frontend/src/components/common/ErrorBoundary.tsx
    import React, { ReactNode } from 'react';
    import { AlertCircle, RefreshCw } from 'lucide-react';

    interface Props {
      children: ReactNode;
      fallback?: ReactNode;
    }

    interface State {
      hasError: boolean;
      error: Error | null;
    }

    export class ErrorBoundary extends React.Component<Props, State> {
      constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
      }

      handleReset = () => {
        this.setState({ hasError: false, error: null });
      };

      render() {
        if (this.state.hasError) {
          return (
            this.props.fallback || (
              <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-slate-600 mb-4">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            )
          );
        }

        return this.props.children;
      }
    }

## 2. Empty State Components

    // frontend/src/components/common/EmptyStates.tsx
    import React from 'react';
    import { Inbox, AlertCircle, FileText, Users, TrendingUp } from 'lucide-react';

    interface EmptyStateProps {
      icon?: React.ReactNode;
      title: string;
      description: string;
      action?: {
        label: string;
        onClick: () => void;
      };
    }

    export const EmptyState: React.FC<EmptyStateProps> = ({
      icon,
      title,
      description,
      action,
    }) => (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-slate-400 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-center mb-6 max-w-sm">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {action.label}
          </button>
        )}
      </div>
    );

    export const NoProjectsEmpty: React.FC<{ onCreateProject?: () => void }> = ({
      onCreateProject,
    }) => (
      <EmptyState
        icon={<Inbox className="w-12 h-12" />}
        title="No Projects Yet"
        description="Get started by creating your first project or importing existing data."
        action={
          onCreateProject
            ? { label: 'Create Project', onClick: onCreateProject }
            : undefined
        }
      />
    );

    export const NoAlertsEmpty: React.FC = () => (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12" />}
        title="No Active Alerts"
        description="All systems are operating normally. You'll see alerts here when issues arise."
      />
    );

    export const NoCUIDocumentsEmpty: React.FC<{ onUpload?: () => void }> = ({
      onUpload,
    }) => (
      <EmptyState
        icon={<FileText className="w-12 h-12" />}
        title="No CUI Documents"
        description="Controlled Unclassified Information documents will appear here once uploaded."
        action={
          onUpload ? { label: 'Upload Document', onClick: onUpload } : undefined
        }
      />
    );

    export const NoTeamMembersEmpty: React.FC<{ onInvite?: () => void }> = ({
      onInvite,
    }) => (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="No Team Members"
        description="Invite team members to collaborate on projects."
        action={onInvite ? { label: 'Invite Member', onClick: onInvite } : undefined}
      />
    );

    export const NoAnalyticsEmpty: React.FC = () => (
      <EmptyState
        icon={<TrendingUp className="w-12 h-12" />}
        title="No Analytics Data"
        description="Analytics will be available once you have completed projects with financial data."
      />
    );

## 3. Dashboard Error Fallback

    // frontend/src/components/dashboard/DashboardError.tsx
    import React from 'react';
    import { AlertTriangle, Home } from 'lucide-react';
    import { useNavigate } from 'react-router-dom';

    export const DashboardError: React.FC = () => {
      const navigate = useNavigate();

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Dashboard Error
            </h1>
            <p className="text-slate-600 mb-6">
              We encountered an issue loading your dashboard. Please try refreshing or contact support.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    };

## 4. Updated Dashboard with Components

    // frontend/src/pages/Dashboard.tsx
    import React from 'react';
    import { ErrorBoundary } from '@/components/common/ErrorBoundary';
    import { DashboardError } from '@/components/dashboard/DashboardError';
    import { useQuery } from '@tanstack/react-query';
    import { HeroMetrics } from '@/components/dashboard/HeroMetrics';
    import { ProjectList } from '@/components/dashboard/ProjectList';
    import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
    import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
    import { NoProjectsEmpty } from '@/components/common/EmptyStates';

    export const Dashboard: React.FC = () => {
      const { data: projects, isLoading, error } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
          const response = await fetch('/api/v1/projects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          return response.json();
        },
        staleTime: 60000,
      });

      if (isLoading) {
        return <DashboardSkeleton />;
      }

      if (!projects?.length) {
        return <NoProjectsEmpty />;
      }

      return (
        <ErrorBoundary fallback={<DashboardError />}>
          <div className="space-y-6 p-6">
            <HeroMetrics projects={projects} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProjectList projects={projects} />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>
            <AnalyticsPanel />
          </div>
        </ErrorBoundary>
      );
    };

    const DashboardSkeleton: React.FC = () => (
      <div className="space-y-6 p-6">
        <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );

## 5. Usage in App

    // frontend/src/App.tsx
    import { ErrorBoundary } from '@/components/common/ErrorBoundary';
    import { Dashboard } from '@/pages/Dashboard';

    export function App() {
      return (
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      );
    }
