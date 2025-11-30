/**
 * What-If Analysis Drawer
 * Part C: Interactive simulation with win rate and avg award size
 */

import { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { metricsService } from '@/services/metrics/metrics.service';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import type { WhatIfResults } from '@/types/metrics.types';
import { toast } from 'sonner';

interface WhatIfDrawerProps {
  currentWinRate: number;
  currentAvgAwardSize: number;
}

export function WhatIfDrawer({ currentWinRate, currentAvgAwardSize }: WhatIfDrawerProps) {
  const { filters, trackEvent } = useDashboardFilter();
  const [open, setOpen] = useState(false);
  const [winRate, setWinRate] = useState(currentWinRate);
  const [avgAwardSize, setAvgAwardSize] = useState(currentAvgAwardSize);
  const [results, setResults] = useState<WhatIfResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced calculation
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      calculateWhatIf();
    }, 300);

    return () => clearTimeout(timer);
  }, [winRate, avgAwardSize, open]);

  const calculateWhatIf = async () => {
    try {
      setLoading(true);
      const whatIfResults = await metricsService.calculateWhatIf(
        { win_rate: winRate, avg_award_size: avgAwardSize },
        filters
      );
      setResults(whatIfResults);
      trackEvent('whatif_changed', { win_rate: winRate, avg_award_size: avgAwardSize });
    } catch (error) {
      console.error('Error calculating what-if:', error);
      toast.error('Failed to calculate what-if scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWinRate(currentWinRate);
    setAvgAwardSize(currentAvgAwardSize);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          What-If Analysis
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            What-If Analysis
          </SheetTitle>
          <SheetDescription>
            Adjust parameters to see how they affect your projections
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Win Rate Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="win-rate">Win Rate</Label>
              <Badge variant="secondary">{winRate.toFixed(0)}%</Badge>
            </div>
            <Slider
              id="win-rate"
              min={10}
              max={90}
              step={5}
              value={[winRate]}
              onValueChange={([value]) => setWinRate(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Avg Award Size Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="avg-award">Average Award Size</Label>
              <Badge variant="secondary">{formatCurrency(avgAwardSize)}</Badge>
            </div>
            <Input
              id="avg-award"
              type="number"
              value={avgAwardSize}
              onChange={(e) => setAvgAwardSize(Number(e.target.value))}
              step={1000000}
              min={1000000}
              max={100000000}
            />
          </div>

          {/* Reset Button */}
          <Button variant="outline" onClick={handleReset} className="w-full">
            Reset to Current Values
          </Button>

          {/* Results */}
          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Calculating...
            </div>
          )}

          {results && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <TrendingUp className="h-4 w-4" />
                Simulated Results
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Projects Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.projects_needed.value}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Simulated
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Projected FY End
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(results.projected_fy_end.value)}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Simulated
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Capacity if All Win
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.capacity_if_all_win.value !== null
                      ? `${results.capacity_if_all_win.value.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                  {results.capacity_if_all_win.value !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Simulated
                    </Badge>
                  )}
                  {results.capacity_if_all_win.reason && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {results.capacity_if_all_win.reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}