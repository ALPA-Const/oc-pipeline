/**
 * OC Pipeline - Analytics Panel Component
 * Center column with budget trend and schedule health charts
 */

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { NoAnalyticsEmpty } from "@/components/common/EmptyStates";

export interface BudgetTrendData {
  month: string;
  budget: number;
  actual: number;
  forecast: number;
}

export interface ScheduleData {
  phase: string;
  completed: number;
}

interface AnalyticsPanelProps {
  budgetTrend?: BudgetTrendData[];
  scheduleData?: ScheduleData[];
  loading?: boolean;
}

// Default sample data for initial render
const defaultBudgetTrend: BudgetTrendData[] = [
  { month: "Jan", actual: 2400, forecast: 2400, budget: 2400 },
  { month: "Feb", actual: 2210, forecast: 2290, budget: 2400 },
  { month: "Mar", actual: 2290, forecast: 2000, budget: 2400 },
  { month: "Apr", actual: 2000, forecast: 2181, budget: 2400 },
  { month: "May", actual: 2181, forecast: 2500, budget: 2400 },
  { month: "Jun", actual: 2500, forecast: 2100, budget: 2400 },
];

const defaultScheduleData: ScheduleData[] = [
  { phase: "Design", completed: 100 },
  { phase: "Procurement", completed: 75 },
  { phase: "Construction", completed: 45 },
  { phase: "Testing", completed: 20 },
  { phase: "Closeout", completed: 0 },
];

export default function AnalyticsPanel({
  budgetTrend = defaultBudgetTrend,
  scheduleData = defaultScheduleData,
  loading,
}: AnalyticsPanelProps) {
  if (loading) {
    return <AnalyticsPanelSkeleton />;
  }

  if (!budgetTrend?.length && !scheduleData?.length) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <NoAnalyticsEmpty />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Trend Chart */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Budget Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={budgetTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Budget"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-300">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">Forecast</span>
          </div>
        </div>
      </div>

      {/* Schedule Health Chart */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Schedule Health
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scheduleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="phase"
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value: number) => [`${value}%`, "Completed"]}
            />
            <Bar
              dataKey="completed"
              fill="#06b6d4"
              radius={[8, 8, 0, 0]}
              name="Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnalyticsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 animate-pulse">
        <div className="w-32 h-5 bg-slate-700 rounded mb-4" />
        <div className="w-full h-[200px] bg-slate-700 rounded" />
      </div>
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 animate-pulse">
        <div className="w-32 h-5 bg-slate-700 rounded mb-4" />
        <div className="w-full h-[180px] bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export { AnalyticsPanel, AnalyticsPanelSkeleton };
