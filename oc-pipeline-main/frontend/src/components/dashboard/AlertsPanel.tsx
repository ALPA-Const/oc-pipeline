/**
 * OC Pipeline - Alerts Panel Component
 * Right column showing critical alerts and notifications
 */

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatting';
import { NoAlertsEmpty } from '@/components/common/EmptyStates';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  actionUrl?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  loading?: boolean;
  onAlertClick?: (alert: Alert) => void;
  onViewAll?: () => void;
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    text: 'text-red-400',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700',
    text: 'text-yellow-400',
    iconColor: 'text-yellow-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-900/30',
    border: 'border-blue-700',
    text: 'text-blue-400',
    iconColor: 'text-blue-400',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-900/30',
    border: 'border-green-700',
    text: 'text-green-400',
    iconColor: 'text-green-400',
  },
};

export default function AlertsPanel({
  alerts,
  loading,
  onAlertClick,
  onViewAll
}: AlertsPanelProps) {
  if (loading) {
    return <AlertsPanelSkeleton />;
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <NoAlertsEmpty />
      </div>
    );
  }

  // Sort by type priority (critical first) then by timestamp
  const sortedAlerts = [...alerts].sort((a, b) => {
    const typePriority = { critical: 0, warning: 1, info: 2, success: 3 };
    if (typePriority[a.type] !== typePriority[b.type]) {
      return typePriority[a.type] - typePriority[b.type];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Alerts & Notifications</h3>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-900/50 text-red-400 rounded-full border border-red-700">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-yellow-900/50 text-yellow-400 rounded-full border border-yellow-700">
                {warningCount} Warning
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
        {sortedAlerts.slice(0, 8).map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${config.bg} ${config.border} border flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-semibold text-sm ${config.text} truncate`}>
                      {alert.title}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                    {alert.projectName && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400 truncate">
                          {alert.projectName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-center">
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all {alerts.length} alerts →
        </button>
      </div>
    </div>
  );
}

function AlertsPanelSkeleton() {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="w-40 h-5 bg-slate-700 rounded" />
          <div className="flex gap-2">
            <div className="w-16 h-5 bg-slate-700 rounded-full" />
            <div className="w-16 h-5 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="w-3/4 h-4 bg-slate-700 rounded mb-2" />
              <div className="w-full h-3 bg-slate-700 rounded mb-2" />
              <div className="w-1/3 h-3 bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { AlertsPanel, AlertsPanelSkeleton };

