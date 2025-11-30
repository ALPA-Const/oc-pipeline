import { DollarSign, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { KPICard } from './KPICard';
import type { KPIData } from '../../types';

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Budget"
        value={data.budget.value}
        change={data.budget.change}
        trend={data.budget.trend}
        icon={<DollarSign className="h-6 w-6" />}
        format="currency"
      />
      <KPICard
        title="Schedule"
        value={data.schedule.value}
        change={data.schedule.change}
        trend={data.schedule.trend}
        icon={<Calendar className="h-6 w-6" />}
        format="percentage"
      />
      <KPICard
        title="Cost"
        value={data.cost.value}
        change={data.cost.change}
        trend={data.cost.trend}
        icon={<TrendingUp className="h-6 w-6" />}
        format="currency"
      />
      <KPICard
        title="Quality"
        value={data.quality.value}
        change={data.quality.change}
        trend={data.quality.trend}
        icon={<CheckCircle className="h-6 w-6" />}
        format="percentage"
      />
    </div>
  );
}
