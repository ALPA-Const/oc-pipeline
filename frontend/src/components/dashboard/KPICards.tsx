import { DollarSign, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { KPICard } from './KPICard';
import type { KPIData } from '../../types';

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  // Guard against undefined data
  if (!data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Budget"
        value={data.budget?.value ?? 0}
        change={data.budget?.change ?? 0}
        trend={data.budget?.trend ?? 'neutral'}
        icon={<DollarSign className="h-6 w-6" />}
        format="currency"
      />
      <KPICard
        title="Schedule"
        value={data.schedule?.value ?? 0}
        change={data.schedule?.change ?? 0}
        trend={data.schedule?.trend ?? 'neutral'}
        icon={<Calendar className="h-6 w-6" />}
        format="percentage"
      />
      <KPICard
        title="Cost"
        value={data.cost?.value ?? 0}
        change={data.cost?.change ?? 0}
        trend={data.cost?.trend ?? 'neutral'}
        icon={<TrendingUp className="h-6 w-6" />}
        format="currency"
      />
      <KPICard
        title="Quality"
        value={data.quality?.value ?? 0}
        change={data.quality?.change ?? 0}
        trend={data.quality?.trend ?? 'neutral'}
        icon={<CheckCircle className="h-6 w-6" />}
        format="percentage"
      />
    </div>
  );
}
