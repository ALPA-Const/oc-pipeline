/**
 * AutoGPT Command Center - Elite Dashboard
 * Master control interface for autonomous agents
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Cpu,
  Eye,
} from 'lucide-react';
import { autoGPTService } from '@/services/autogpt.service';
import type { AgentMetrics } from '@/types/autogpt.types';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
    red: 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border backdrop-blur-xl ${bgColorClasses[color]} p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 animate-pulse`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-4 h-4 ${!trend.positive && 'rotate-180'}`} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] transition-transform duration-1000"></div>
    </div>
  );
};

interface CommandCenterHeaderProps {
  metrics: AgentMetrics;
  loading: boolean;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  metrics,
  loading,
}) => {
  const [animateValue, setAnimateValue] = useState(false);

  useEffect(() => {
    setAnimateValue(true);
    const timer = setTimeout(() => setAnimateValue(false), 500);
    return () => clearTimeout(timer);
  }, [metrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-36 bg-slate-800/50 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Active Sessions"
        value={metrics.total_sessions}
        subtitle={`${metrics.active_agents} agents running`}
        icon={<Brain className="w-6 h-6 text-white" />}
        color="blue"
        trend={{ value: 12, positive: true }}
      />

      <MetricCard
        title="Tasks in Queue"
        value={metrics.tasks_in_queue}
        subtitle="Pending execution"
        icon={<Activity className="w-6 h-6 text-white" />}
        color="purple"
      />

      <MetricCard
        title="Success Rate"
        value={`${(metrics.success_rate * 100).toFixed(1)}%`}
        subtitle="Task completion"
        icon={<CheckCircle2 className="w-6 h-6 text-white" />}
        color="green"
        trend={{ value: 5.2, positive: true }}
      />

      <MetricCard
        title="Avg. Completion"
        value={`${metrics.avg_completion_time.toFixed(1)}s`}
        subtitle="Per task"
        icon={<Clock className="w-6 h-6 text-white" />}
        color="orange"
        trend={{ value: 8.3, positive: false }}
      />

      <MetricCard
        title="Cost Today"
        value={`$${metrics.cost_today.toFixed(2)}`}
        subtitle={`${metrics.tokens_used_today.toLocaleString()} tokens`}
        icon={<DollarSign className="w-6 h-6 text-white" />}
        color="red"
      />
    </div>
  );
};

interface LiveActivityFeedProps {
  activities: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    agent?: string;
  }>;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Live Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-400">Real-time</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.agent && (
                    <>
                      <span className="text-xs text-slate-500">{activity.agent}</span>
                      <span className="text-slate-600">•</span>
                    </>
                  )}
                  <span className="text-xs text-slate-500">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface SystemStatsProps {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

export const SystemStats: React.FC<SystemStatsProps> = ({
  cpuUsage,
  memoryUsage,
  activeConnections,
}) => {
  const StatBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
    const percentage = (value / max) * 100;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">{label}</span>
          <span className="text-sm font-bold text-white">{value.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">System Performance</h3>
      </div>

      <div className="space-y-6">
        <StatBar
          label="CPU Usage"
          value={cpuUsage}
          max={100}
          color="from-blue-500 to-blue-600"
        />
        
        <StatBar
          label="Memory Usage"
          value={memoryUsage}
          max={100}
          color="from-purple-500 to-purple-600"
        />

        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active Connections</span>
            <span className="text-2xl font-bold text-white">{activeConnections}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
