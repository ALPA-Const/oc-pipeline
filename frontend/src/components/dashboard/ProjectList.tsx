/**
 * OC Pipeline - Project List Component
 * Left column showing user's active projects with status indicators
 */

import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatting';
import { NoProjectsEmpty } from '@/components/common/EmptyStates';

export interface Project {
  id: string;
  name: string;
  location: string;
  value: number;
  progress: number;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  risks: number;
  lastUpdated: string;
}

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onViewAll?: () => void;
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-900/30 text-blue-400 border-blue-700',
  active: 'bg-green-900/30 text-green-400 border-green-700',
  completed: 'bg-gray-900/30 text-gray-400 border-gray-700',
  'on-hold': 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
};

export default function ProjectList({
  projects,
  loading,
  onProjectClick,
  onViewAll
}: ProjectListProps) {
  if (loading) {
    return <ProjectListSkeleton />;
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <NoProjectsEmpty />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">My Projects</h3>
        <p className="text-xs text-slate-400 mt-1">{projects.length} active projects</p>
      </div>

      {/* Project List */}
      <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
        {projects.slice(0, 5).map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectClick?.(project)}
            className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{project.location}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">
                  {formatCurrency(project.value)}
                </span>
                <span className="text-xs text-slate-400">{project.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Status & Risks */}
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColors[project.status]}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              {project.risks > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/30 border border-red-700 text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs font-semibold">{project.risks}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-center">
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all {projects.length} projects →
        </button>
      </div>
    </div>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-700">
        <div className="w-24 h-5 bg-slate-700 rounded mb-2" />
        <div className="w-32 h-3 bg-slate-700 rounded" />
      </div>
      <div className="divide-y divide-slate-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4">
            <div className="w-3/4 h-4 bg-slate-700 rounded mb-2" />
            <div className="w-1/2 h-3 bg-slate-700 rounded mb-3" />
            <div className="w-full h-1.5 bg-slate-700 rounded mb-3" />
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-slate-700 rounded" />
              <div className="w-12 h-5 bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ProjectList, ProjectListSkeleton };

