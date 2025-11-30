/**
 * OC Pipeline - Hero Metrics Component
 * Top-row KPI cards with trends and visual indicators
 */

import React from 'react';
import { formatCurrency, formatPercent } from '@/lib/formatting';
import {
  Building2,
  DollarSign,
  AlertTriangle,
  Target,
  Shield
} from 'lucide-react';

export interface HeroMetricsData {
  activeProjects: number;
  pipelineValue: number;
  budgetAtRisk: number;
  winRate: number;
  cuiDocumentsSecured: number;
  trends: {
    activeProjects: number;
    pipelineValue: number;
    budgetAtRisk: number;
    winRate: number;
  };
}

interface HeroMetricsProps {
  metrics: HeroMetricsData | null;
  loading?: boolean;
}

interface KPIConfig {
  label: string;
  value: number;
  trend: number;
  icon: React.ReactNode;
  color: string;
  format: (v: number) => string;
  isRiskMetric?: boolean;
}

export default function HeroMetrics({ metrics, loading }: HeroMetricsProps) {
  if (loading || !metrics) {
    return <HeroMetricsSkeleton />;
  }

  const kpis: KPIConfig[] = [
    {
      label: 'Active Projects',
      value: metrics.activeProjects,
      trend: metrics.trends.activeProjects,
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-600 to-blue-400',
      format: (v: number) => v.toString(),
    },
    {
      label: 'Pipeline Value',
      value: metrics.pipelineValue,
      trend: metrics.trends.pipelineValue,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-green-600 to-green-400',
      format: (v: number) => formatCurrency(v),
    },
    {
      label: 'Budget at Risk',
      value: metrics.budgetAtRisk,
      trend: metrics.trends.budgetAtRisk,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'from-red-600 to-red-400',
      format: (v: number) => formatCurrency(v),
      isRiskMetric: true,
    },
    {
      label: 'Win Rate',
      value: metrics.winRate,
      trend: metrics.trends.winRate,
      icon: <Target className="w-6 h-6" />,
      color: 'from-purple-600 to-purple-400',
      format: (v: number) => formatPercent(v),
    },
    {
      label: 'CUI Docs Secured',
      value: metrics.cuiDocumentsSecured,
      trend: 0,
      icon: <Shield className="w-6 h-6" />,
      color: 'from-emerald-600 to-emerald-400',
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <MetricCard key={idx} kpi={kpi} />
      ))}
    </div>
  );
}

function MetricCard({ kpi }: { kpi: KPIConfig }) {
  const isPositive = kpi.trend >= 0;
  const shouldBeGood = !kpi.isRiskMetric;
  const isGood = isPositive === shouldBeGood;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color} bg-opacity-20`}>
            <div className="text-white">{kpi.icon}</div>
          </div>
          {kpi.trend !== 0 && <TrendBadge trend={kpi.trend} isGood={isGood} />}
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-slate-400 mb-2">{kpi.label}</p>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-white">{kpi.format(kpi.value)}</p>
        </div>

        {/* Trend Detail */}
        {kpi.trend !== 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className={`text-xs font-medium ${isGood ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(kpi.trend)}% from last month
            </p>
          </div>
        )}
      </div>

      {/* Bottom Accent */}
      <div className={`h-1 bg-gradient-to-r ${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
}

function TrendBadge({ trend, isGood }: { trend: number; isGood: boolean }) {
  const isPositive = trend >= 0;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
      isGood
        ? 'bg-green-900/30 text-green-400 border border-green-700/50'
        : 'bg-red-900/30 text-red-400 border border-red-700/50'
    }`}>
      {isPositive ? '↑' : '↓'}
      <span>{Math.abs(trend)}%</span>
    </div>
  );
}

function HeroMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-800 border border-slate-700 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-lg" />
            <div className="w-12 h-5 bg-slate-700 rounded-full" />
          </div>
          <div className="w-24 h-4 bg-slate-700 rounded mb-2" />
          <div className="w-20 h-8 bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export { HeroMetrics, HeroMetricsSkeleton };

