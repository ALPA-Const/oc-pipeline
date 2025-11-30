/**
 * Dashboard Tabs Component
 * Part B: Map | Table | Bar Distribution views
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Table as TableIcon, BarChart3, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDashboardFilter } from '@/contexts/DashboardFilterContext';
import GeoMapTemplate_HeatView from '@/templates/maps/GeoMapTemplate_HeatView';
import { BiddingProjectsTable } from './BiddingProjectsTable';
import { BarDistributionChart } from './BarDistributionChart';
import type { BiddingProject } from '@/types/dashboard.types';

interface DashboardTabsProps {
  projects: BiddingProject[];
  loading?: boolean;
  totalProjects: number;
}

export function DashboardTabs({ projects, loading, totalProjects }: DashboardTabsProps) {
  const { filters, filterChips, trackEvent } = useDashboardFilter();
  const [activeTab, setActiveTab] = useState('map');

  const filteredCount = projects.length;
  const hasMismatch = filteredCount !== totalProjects;

  useEffect(() => {
    trackEvent('tab_changed', { tab: activeTab });
  }, [activeTab, trackEvent]);

  return (
    <div className="space-y-4">
      {/* Count Header with Warning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            Showing {filteredCount} of {totalProjects} projects
          </h3>
          {hasMismatch && filterChips.length > 0 && (
            <Alert className="inline-flex items-center gap-2 py-1 px-3 border-yellow-500 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-800">
                {totalProjects - filteredCount} project{totalProjects - filteredCount !== 1 ? 's' : ''} hidden by filters
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <TableIcon className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <GeoMapTemplate_HeatView />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <BiddingProjectsTable projects={projects} loading={loading} />
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <BarDistributionChart projects={projects} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}