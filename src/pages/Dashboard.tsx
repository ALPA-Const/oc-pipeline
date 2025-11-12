// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { KPICards } from "@/components/dashboard/KPICards";
import { apiClient } from "@/lib/api";

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

interface Project {
  id: string;
  name: string;
  status: string;
  budget?: number;
}

interface DashboardData {
  kpis: any;
  recentProjects: Project[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<EnrichedKPIData | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Auth session error:", sessionError);
      setError("Authentication error. Please log in again.");
      navigate("/login");
      return;
    }

    if (!session) {
      console.warn("No active session found");
      setError("Auth session missing. Please log in.");
      navigate("/login");
      return;
    }

    console.log("Auth session verified:", session.user.email);
    setAuthChecked(true);
  } catch (err) {
    console.error("Auth check failed:", err);
    setError("Failed to verify authentication.");
    navigate("/login");
  }
};

checkAuth();

  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;

const fetchDashboard = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log("Fetching dashboard data...");
    const dashboardData: DashboardData = await apiClient.getDashboard();

    if (!dashboardData) {
      throw new Error("No dashboard data received from server.");
    }

    if (!dashboardData.kpis) {
      console.warn("No KPI data in response, using defaults");
      dashboardData.kpis = {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        budget: 0,
      };
    }

    const baseKPI = dashboardData.kpis;

    const enrichedKPIs: EnrichedKPIData = {
      totalProjects: baseKPI.totalProjects ?? 0,
      activeProjects: baseKPI.activeProjects ?? 0,
      completedProjects: baseKPI.completedProjects ?? 0,
      budget: baseKPI.budget ?? 0,
      budget_change: 5,
      budget_trend: "up",
      revenue: baseKPI.revenue ?? 250000,
      revenue_change: 10,
      revenue_trend: "up",
      profit: baseKPI.profit ?? 75000,
      profit_change: -2,
      profit_trend: "down",
    };

    console.log("Dashboard data loaded:", enrichedKPIs);
    setKpis(enrichedKPIs);
    setRecentProjects(dashboardData.recentProjects ?? []);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error loading dashboard data:", errorMessage);
    setError(`Failed to load dashboard data: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

fetchDashboard();

  }, [authChecked]);

  if (loading) {
    return (
      
        
          
          Loading dashboard...
        
      
    );
  }

  if (error) {
    return (
      
        
          Error
          {error}
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            Retry
          
        
      
    );
  }

  if (!kpis) {
    return (
      
        
          No KPI data available.
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Refresh
          
        
      
    );
  }

  return (
    
      
        Dashboard Overview
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm"
        >
          Refresh
        
      

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

  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
    {recentProjects.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-700">Project Name</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Budget</th>
            </tr>
          </thead>
          <tbody>
            {recentProjects.map((project) => (
              <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{project.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : project.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : project.status === "on-hold"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">${(project.budget ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent projects found.</p>
      </div>
    )}
  </div>
</div>

  );
};

export default Dashboard;