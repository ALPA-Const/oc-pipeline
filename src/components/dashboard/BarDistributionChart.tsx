/**
 * Bar Distribution Chart Component
 * Shows project distribution by state, stage, or set-aside type
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { BiddingProject } from '@/types/dashboard.types';

interface BarDistributionChartProps {
  projects: BiddingProject[];
  loading?: boolean;
}

export function BarDistributionChart({ projects, loading }: BarDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Group by state
  const byState = projects.reduce((acc, p) => {
    const state = p.projectState || 'Unknown';
    if (!acc[state]) {
      acc[state] = { state, count: 0, value: 0 };
    }
    acc[state].count++;
    acc[state].value += p.magnitude;
    return acc;
  }, {} as Record<string, { state: string; count: number; value: number }>);

  const stateData = Object.values(byState)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(d => ({
      name: d.state,
      count: d.count,
      value: Math.round(d.value / 1000000), // Convert to millions
    }));

  // Group by set-aside
  const bySetAside = projects.reduce((acc, p) => {
    const setAside = p.setAside || 'none';
    if (!acc[setAside]) {
      acc[setAside] = { type: setAside, count: 0, value: 0 };
    }
    acc[setAside].count++;
    acc[setAside].value += p.magnitude;
    return acc;
  }, {} as Record<string, { type: string; count: number; value: number }>);

  const setAsideData = Object.values(bySetAside)
    .sort((a, b) => b.value - a.value)
    .map(d => ({
      name: d.type.replace('_', ' ').toUpperCase(),
      count: d.count,
      value: Math.round(d.value / 1000000),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="state" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="state">By State</TabsTrigger>
            <TabsTrigger value="setaside">By Set-Aside</TabsTrigger>
          </TabsList>

          <TabsContent value="state" className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'value') return [`$${value}M`, 'Total Value'];
                    return [value, 'Project Count'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Projects" />
                <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Value ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="setaside" className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={setAsideData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'value') return [`$${value}M`, 'Total Value'];
                    return [value, 'Project Count'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Projects" />
                <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Value ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}