import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DashboardKPI } from '@/types/dashboard.types';
import { useMapFilter, KPIFilterType } from '@/contexts/MapFilterContext';
import { cn } from '@/lib/utils';

interface DashboardKPICardsProps {
  kpis: DashboardKPI[];
  loading?: boolean;
}

// Map KPI labels to filter types
const KPI_LABEL_TO_FILTER: Record<string, KPIFilterType> = {
  'Projects Currently Bidding': 'opp_proposal',
  'Bids Submitted': 'opp_negotiation',
  'Projects Awarded': 'opp_award',
  'Projects Lost': 'opp_lost',
  'Pre-Solicitation Projects': 'opp_lead_gen',
  'Joint Venture Projects': 'joint_venture',
};

export function DashboardKPICards({ kpis, loading }: DashboardKPICardsProps) {
  const { selectedFilter, setSelectedFilter } = useMapFilter();

  const handleKPIClick = (kpiLabel: string) => {
    const filterType = KPI_LABEL_TO_FILTER[kpiLabel];
    if (filterType) {
      // Toggle: if already selected, clear filter; otherwise, set new filter
      if (selectedFilter === filterType) {
        setSelectedFilter('all');
      } else {
        setSelectedFilter(filterType);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => {
        const filterType = KPI_LABEL_TO_FILTER[kpi.label];
        const isClickable = !!filterType;
        const isSelected = filterType && selectedFilter === filterType;

        return (
          <Card 
            key={index} 
            className={cn(
              "transition-all duration-200",
              isClickable && "cursor-pointer hover:shadow-lg hover:scale-105",
              isSelected && "ring-2 ring-blue-500 shadow-lg scale-105 bg-blue-50"
            )}
            style={{ borderTop: `4px solid ${kpi.color}` }}
            onClick={() => isClickable && handleKPIClick(kpi.label)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: kpi.color }}>
                {kpi.displayValue}
              </div>
              {kpi.changeLabel && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {kpi.change !== undefined && (
                    <>
                      {kpi.change > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {kpi.change < 0 && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {kpi.change === 0 && <Minus className="h-3 w-3 text-gray-500" />}
                    </>
                  )}
                  <span>{kpi.changeLabel}</span>
                </div>
              )}
              {isClickable && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  {isSelected ? '✓ Filter active' : 'Click to filter map'}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}