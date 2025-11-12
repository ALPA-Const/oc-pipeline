// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/KPICards";
import { apiClient } from "@/lib/api";
import type { DashboardData, Project } from "@/lib/database.types";

// Optional: local trend visualization
type TrendType = "up" | "down" | "neutral";

interface EnrichedKPIData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  budget: number;
  budget_change?: number;
  budget_trend?: TrendType;
  revenue: number;
  revenue_change?: number;
  revenue_trend?: TrendType;
  profit: number;
  profit_change?: number;
  profit_trend?: TrendType;
}

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<EnrichedKPIData | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch dashboard data from API on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData: DashboardData = await apiClient.getDashboard();

        if (!dashboardData || !dashboardData.kpis) {
          throw new Error("Invalid dashboard data received.");
        }

        const baseKPI = dashboardData.kpis;

        // ✅ Enrich KPI data with local computed or static trends
        const enrichedKPIs: EnrichedKPIData = {
          totalProjects: baseKPI.totalProjects ?? 0,
          activeProjects: baseKPI.activeProjects ?? 0,
          completedProjects: baseKPI.completedProjects ?? 0,
          budget: baseKPI.budget ?? 0,
          budget_change: 5,
          budget_trend: "up",
          revenue: (baseKPI as any).revenue ?? 250000, // fallback if not in schema
          revenue_change: 10,
          revenue_trend: "up",
          profit: (baseKPI as any).profit ?? 75000,
          profit_change: -2,
          profit_trend: "down",
        };

        setKpis(enrichedKPIs);
        setRecentProjects(dashboardData.recentProjects ?? []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  // ✅ Error UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  // ✅ No KPI fallback
  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        No KPI data available.
      </div>
    );
  }

  // ✅ Main Dashboard
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>

      {/* KPI Cards */}
      <KPICards
        totalProjects={kpis.totalProjects}
        activeProjects={kpis.activeProjects}
        completedProjects={kpis.completedProjects}
        budget={kpis.budget}
        budget_change={kpis.budget_change}
        budget_trend={kpis.budget_trend}
        revenue={kpis.revenue}
        revenue_change={kpis.revenue_change}
        revenue_trend={kpis.revenue_trend}
        profit={kpis.profit}
        profit_change={kpis.profit_change}
        profit_trend={kpis.profit_trend}
      />

      {/* Recent Projects Section */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Projects</h2>

        {recentProjects.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentProjects.map((project) => (
              <li key={project.id} className="py-2 flex justify-between">
                <span className="font-medium text-gray-700">{project.name}</span>
                <span
                  className={`text-sm ${
                    project.status === "active"
                      ? "text-green-600"
                      : project.status === "completed"
                      ? "text-blue-600"
                      : project.status === "on-hold"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                >
                  {project.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No recent projects found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;