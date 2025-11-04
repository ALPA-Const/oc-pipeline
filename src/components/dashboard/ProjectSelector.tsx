import { useState, useEffect } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import type { Project } from '../../types';

interface ProjectSelectorProps {
  onProjectChange?: (project: Project) => void;
}

export function ProjectSelector({ onProjectChange }: ProjectSelectorProps) {
  const { projects, loading } = useProjects({ limit: 50 });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
      onProjectChange?.(projects[0]);
    }
  }, [projects, selectedProject, onProjectChange]);

  const handleSelect = (project: Project) => {
    setSelectedProject(project);
    setIsOpen(false);
    onProjectChange?.(project);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="max-w-[200px] truncate">
          {loading ? 'Loading...' : selectedProject?.name || 'Select Project'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="text-xs text-gray-500">
                    {project.type} • ${(project.value / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' :
                  project.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {project.status}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
