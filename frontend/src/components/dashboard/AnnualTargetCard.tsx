import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar, LucideIcon } from 'lucide-react';
import type { AnnualTarget } from '@/types/dashboard.types';

interface AnnualTargetCardProps {
  target: AnnualTarget;
  loading?: boolean;
}

export function AnnualTargetCard({ target, loading }: AnnualTargetCardProps) {
  if (loading) {
    return (
      <Card className="col-span-full animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary'; icon: LucideIcon; label: string }> = {
      ahead: { variant: 'default', icon: TrendingUp, label: 'Ahead of Target' },
      on_track: { variant: 'secondary', icon: Target, label: 'On Track' },
      behind: { variant: 'destructive', icon: TrendingDown, label: 'Behind Target' },
    };

    const status = variants[target.onTrackStatus];
    const Icon = status.icon;

    return (
      <Badge variant={status.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  };

  return (
    <Card className="col-span-full border-t-4 border-t-blue-600">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Annual Target 2026
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Target 2026</div>
              <div className="text-3xl font-bold text-blue-600">
                ${(target.targetAmount / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">100% of annual goal</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Awarded YTD</div>
              <div className="text-3xl font-bold text-green-600">
                ${(target.awardedYTD / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">
                {target.percentageComplete.toFixed(1)}% of target
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Remaining to Target</div>
              <div className="text-3xl font-bold text-orange-600">
                ${(target.remainingToTarget / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">
                {(100 - target.percentageComplete).toFixed(1)}% remaining
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to Target</span>
              <span className="font-semibold">{target.percentageComplete.toFixed(1)}%</span>
            </div>
            <Progress value={target.percentageComplete} className="h-3" />
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Projects Needed</div>
                <div className="text-2xl font-bold">{target.projectsNeeded}</div>
                <div className="text-xs text-muted-foreground">
                  Based on avg project value
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Current Run Rate</div>
                <div className="text-2xl font-bold">
                  ${(target.currentRunRate / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-muted-foreground">Per month</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Projected Year-End</div>
                <div className="text-2xl font-bold">
                  ${(target.projectedYearEnd / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-muted-foreground">
                  {target.projectedYearEnd >= target.targetAmount
                    ? '✓ Exceeds target'
                    : '⚠ Below target'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}