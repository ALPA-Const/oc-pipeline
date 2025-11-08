/**
 * Enhanced KPI Card Component
 * Part B & E: KPI with tooltip, formula, sparkline, and click-to-filter
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkline } from './Sparkline';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import type { MetricWithTrend } from '@/types/metrics.types';
import { cn } from '@/lib/utils';

interface EnhancedKPICardProps {
  metric: MetricWithTrend;
  formula: string;
  clickable?: boolean;
  filterStage?: string;
  color?: string;
  simulated?: boolean;
}

export function EnhancedKPICard({
  metric,
  formula,
  clickable = false,
  filterStage,
  color = '#3B82F6',
  simulated = false,
}: EnhancedKPICardProps) {
  const { filters, applyKPIFilter } = useDashboardFilter();
  const isActive = clickable && filterStage && filters.stage === filterStage;

  const handleClick = () => {
    if (clickable && filterStage) {
      applyKPIFilter(filterStage);
    }
  };

  const formatValue = (value: number | null) => {
    if (value === null) return 'N/A';
    
    // Format based on metric type
    if (metric.metric.includes('rate') || metric.metric.includes('percentage')) {
      return `${value.toFixed(1)}%`;
    }
    
    if (metric.metric.includes('value') || metric.metric.includes('ytd') || metric.metric.includes('projected')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    if (metric.metric.includes('velocity')) {
      return `${value} days`;
    }
    
    return value.toString();
  };

  const lastRefresh = new Date(metric.as_of).toLocaleString();

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        clickable && 'cursor-pointer hover:shadow-lg hover:scale-105',
        isActive && 'ring-2 ring-blue-500 shadow-lg scale-105 bg-blue-50',
        simulated && 'border-blue-500 border-2'
      )}
      style={{ borderTop: `4px solid ${color}` }}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.metric.replace(/_/g, ' ').toUpperCase()}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">Formula:</p>
                    <p className="text-xs font-mono">{formula}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Window:</p>
                    <p className="text-xs">{metric.window.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Last Refresh:</p>
                    <p className="text-xs">{lastRefresh}</p>
                  </div>
                  {metric.samples !== undefined && (
                    <div>
                      <p className="font-semibold">Samples:</p>
                      <p className="text-xs">{metric.samples} data points</p>
                    </div>
                  )}
                  {metric.reason && (
                    <div>
                      <p className="font-semibold text-yellow-600">Note:</p>
                      <p className="text-xs text-yellow-600">{metric.reason}</p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold" style={{ color }}>
              {formatValue(metric.value as number)}
            </div>
            {simulated && (
              <Badge variant="secondary" className="text-xs">
                Simulated
              </Badge>
            )}
          </div>

          {/* Sparkline for forecast metrics */}
          {metric.trend && metric.trend.length > 0 && (
            <Sparkline
              data={metric.trend}
              trend={metric.trend_direction}
              trendPercentage={metric.trend_percentage}
            />
          )}

          {/* Click hint */}
          {clickable && (
            <div className="text-xs text-blue-600 font-medium">
              {isActive ? '✓ Filter active' : 'Click to filter'}
            </div>
          )}

          {/* Reason for N/A */}
          {metric.value === null && metric.reason && (
            <div className="text-xs text-yellow-600">
              {metric.reason}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}