import { useState } from 'react';
import { ProjectSelector } from '../components/dashboard/ProjectSelector';
import { KPICards } from '../components/dashboard/KPICards';
import type { DashboardData, Project } from '../types';

// Mock data to allow immediate access without backend dependency
const mockDashboardData: DashboardData = {
  kpis: {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    budget: 0,
    schedule: 0,
    cost: 0,
    quality: 0,
    revenue: 0,
    profit: 0
  },
  projects: [],
  recentActivity: [],
  quickStats: {}
};

export function Dashboard() {
  const [data] = useState<DashboardData>(mockDashboardData);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {data.projects && data.projects.length > 0 && (
          <ProjectSelector
            projects={data.projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
          />
        )}
      </div>

      <KPICards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600">Activity feed will appear here...</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <p className="text-gray-600">Statistics will appear here...</p>
        </div>
      </div>
    </div>
  );
}