import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
}

export function KPICard({ title, value, change, trend, icon, format = 'number' }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${Number(val).toLocaleString()}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return val;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50';
    if (trend === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{Math.abs(change)}%</span>
        </div>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    </div>
  );
}
