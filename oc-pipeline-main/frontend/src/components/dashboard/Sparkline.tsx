/**
 * Sparkline Component
 * 6-month trend visualization for KPIs
 */

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SparklineData } from '@/types/metrics.types';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: SparklineData[];
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  className?: string;
}

export function Sparkline({ data, trend, trendPercentage, className }: SparklineProps) {
  const color = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ResponsiveContainer width={80} height={24}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-1 text-xs">
        <TrendIcon className="h-3 w-3" style={{ color }} />
        <span style={{ color }}>
          {Math.abs(trendPercentage).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}