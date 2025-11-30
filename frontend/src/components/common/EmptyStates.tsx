/**
 * OC Pipeline - Empty State Components
 * Contextual empty states for various dashboard sections
 */

import React from 'react';
import {
  Inbox,
  AlertCircle,
  FileText,
  Users,
  TrendingUp,
  FolderOpen,
  Bell,
  Shield
} from 'lucide-react';

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
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-sm">{description}</p>
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
    icon={<Bell className="w-12 h-12" />}
    title="No Active Alerts"
    description="All systems are operating normally. You'll see alerts here when issues arise."
  />
);

export const NoCUIDocumentsEmpty: React.FC<{ onUpload?: () => void }> = ({
  onUpload,
}) => (
  <EmptyState
    icon={<Shield className="w-12 h-12" />}
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

export const NoDocumentsEmpty: React.FC<{ onUpload?: () => void }> = ({
  onUpload,
}) => (
  <EmptyState
    icon={<FolderOpen className="w-12 h-12" />}
    title="No Documents"
    description="Upload documents to get started with document management."
    action={
      onUpload ? { label: 'Upload Document', onClick: onUpload } : undefined
    }
  />
);

export const NoDataEmpty: React.FC<{ message?: string }> = ({
  message = "No data available at this time."
}) => (
  <EmptyState
    icon={<FileText className="w-12 h-12" />}
    title="No Data"
    description={message}
  />
);

export const ErrorEmpty: React.FC<{ onRetry?: () => void }> = ({
  onRetry,
}) => (
  <EmptyState
    icon={<AlertCircle className="w-12 h-12 text-red-400" />}
    title="Error Loading Data"
    description="We encountered an issue loading this content. Please try again."
    action={
      onRetry ? { label: 'Retry', onClick: onRetry } : undefined
    }
  />
);

