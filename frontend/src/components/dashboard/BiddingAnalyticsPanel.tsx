import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import type { BiddingAnalytics } from '@/types/dashboard.types';

interface BiddingAnalyticsPanelProps {
  analytics: BiddingAnalytics;
  loading?: boolean;
}

export function BiddingAnalyticsPanel({ analytics, loading }: BiddingAnalyticsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const capacityStatus =
    analytics.capacityPercentage > 100
      ? 'text-red-600'
      : analytics.capacityPercentage > 80
      ? 'text-yellow-600'
      : 'text-green-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total Projects Bidding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {analytics.totalProjects}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Active bids</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            ${(analytics.totalValue / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-muted-foreground mt-1">Combined magnitude</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Avg Pipeline Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {analytics.averagePipelineVelocity}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Days to award</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Capacity if All Won
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${capacityStatus}`}>
            {analytics.capacityPercentage.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${(analytics.capacityIfAllWon / 1000000).toFixed(1)}M of $30M
          </p>
        </CardContent>
      </Card>
    </div>
  );
}