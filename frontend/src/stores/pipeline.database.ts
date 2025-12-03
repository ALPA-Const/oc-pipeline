import { create } from 'zustand';
import type {
  PipelineProject,
  PipelineStage,
  PipelineType,
  StageTransition,
  PipelineMetrics,
  PipelineFilters,
} from '@/types/pipeline.types';
import { pipelineService } from '@/services/pipeline.service';
import { getStagesByType } from '@/config/pipeline-stages';
import { toast } from 'sonner';

interface IntegrityCheck {
  check_name: string;
  status: string;
  message: string;
  affected_records: number;
}

interface PipelineState {
  projects: PipelineProject[];
  stages: PipelineStage[];
  transitions: StageTransition[];
  metrics: PipelineMetrics | null;
  filters: PipelineFilters;
  isLoading: boolean;
  error: string | null;
  selectedProject: PipelineProject | null;
  currentUserId: string;
}

interface PipelineActions {
  setCurrentUser: (userId: string) => void;
  fetchProjects: (type: PipelineType) => Promise<void>;
  fetchMetrics: (type: PipelineType) => Promise<void>;
  moveProject: (projectId: string, toStageId: string, notes?: string) => Promise<boolean>;
  updateProject: (projectId: string, updates: Partial<PipelineProject>) => Promise<boolean>;
  createProject: (project: Omit<PipelineProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  selectProject: (projectId: string) => void;
  updateFilters: (newFilters: PipelineFilters) => void;
  clearFilters: () => void;
  exportToCSV: (projects: PipelineProject[], filename: string) => void;
  flagProjectStalled: (projectId: string, reason: string) => Promise<boolean>;
  unflagProjectStalled: (projectId: string) => Promise<boolean>;
  getProjectsByStage: () => Record<string, PipelineProject[]>;
  getFilteredProjects: () => PipelineProject[];
  getStalledProjects: () => PipelineProject[];
  getTotalPipelineValue: () => number;
  getWeightedPipelineValue: () => number;
  checkDatabaseIntegrity: () => Promise<void>;
}

type PipelineStore = PipelineState & PipelineActions;

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  // Initial state
  projects: [],
  stages: [],
  transitions: [],
  metrics: null,
  filters: {},
  isLoading: false,
  error: null,
  selectedProject: null,
  currentUserId: 'user0001-0000-0000-0000-000000000001', // Default user

  // Set current user
  setCurrentUser: (userId: string) => {
    set({ currentUserId: userId });
  },

  // Fetch projects from database
  fetchProjects: async (type: PipelineType) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await pipelineService.fetchProjects(type);
      const stages = getStagesByType(type);
      set({ projects, stages, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      console.error('fetchProjects error:', error);
    }
  },

  // Fetch metrics from database
  fetchMetrics: async (type: PipelineType) => {
    try {
      const metrics = await pipelineService.getPipelineMetrics(type);
      set({ metrics });
    } catch (error) {
      toast.error('Failed to fetch pipeline metrics');
      console.error('fetchMetrics error:', error);
    }
  },

  // Move project using database function
  moveProject: async (
    projectId: string, 
    toStageId: string, 
    notes?: string
  ): Promise<boolean> => {
    const { currentUserId } = get();
    
    try {
      const success = await pipelineService.moveProject(
        projectId,
        toStageId,
        currentUserId,
        notes
      );

      if (success) {
        // Refresh projects to get updated data
        const { projects } = get();
        const project = projects.find(p => p.id === projectId);
        if (project) {
          await get().fetchProjects(project.pipelineType);
        }
      }

      return success;
    } catch (error) {
      toast.error('Failed to move project');
      console.error('moveProject error:', error);
      return false;
    }
  },

  // Update project in database
  updateProject: async (
    projectId: string, 
    updates: Partial<PipelineProject>
  ): Promise<boolean> => {
    try {
      const updatedProject = await pipelineService.updateProject(projectId, updates);
      
      // Update local state
      const { projects, selectedProject } = get();
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      );

      const updatedSelectedProject = selectedProject?.id === projectId 
        ? updatedProject 
        : selectedProject;

      set({ 
        projects: updatedProjects,
        selectedProject: updatedSelectedProject
      });

      toast.success('Project updated');
      return true;
    } catch (error) {
      toast.error('Failed to update project');
      console.error('updateProject error:', error);
      return false;
    }
  },

  // Create new project
  createProject: async (
    project: Omit<PipelineProject, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const newProject = await pipelineService.createProject({
        ...project,
        createdBy: get().currentUserId,
      });
      
      // Add to local state
      const { projects } = get();
      set({ projects: [...projects, newProject] });

      toast.success('Project created');
      return true;
    } catch (error) {
      toast.error('Failed to create project');
      console.error('createProject error:', error);
      return false;
    }
  },

  // Flag project as stalled
  flagProjectStalled: async (projectId: string, reason: string): Promise<boolean> => {
    const { currentUserId } = get();
    
    try {
      const success = await pipelineService.flagProjectStalled(
        projectId,
        reason,
        currentUserId
      );

      if (success) {
        // Update local state
        const { projects } = get();
        const updatedProjects = projects.map(p => 
          p.id === projectId 
            ? { ...p, isStalled: true, stalledReason: reason, stalledAt: new Date().toISOString() }
            : p
        );
        set({ projects: updatedProjects });
        toast.success('Project flagged as stalled');
      }

      return success;
    } catch (error) {
      toast.error('Failed to flag project as stalled');
      console.error('flagProjectStalled error:', error);
      return false;
    }
  },

  // Unflag stalled project
  unflagProjectStalled: async (projectId: string): Promise<boolean> => {
    const { currentUserId } = get();
    
    try {
      const success = await pipelineService.unflagProjectStalled(
        projectId,
        currentUserId
      );

      if (success) {
        // Update local state
        const { projects } = get();
        const updatedProjects = projects.map(p => 
          p.id === projectId 
            ? { ...p, isStalled: false, stalledReason: undefined, stalledAt: undefined }
            : p
        );
        set({ projects: updatedProjects });
        toast.success('Project unflagged');
      }

      return success;
    } catch (error) {
      toast.error('Failed to unflag stalled project');
      console.error('unflagProjectStalled error:', error);
      return false;
    }
  },

  selectProject: (projectId: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === projectId) || null;
    set({ selectedProject: project });
  },

  updateFilters: (newFilters: PipelineFilters) => {
    set({ filters: newFilters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  // Export to CSV
  exportToCSV: (projects: PipelineProject[], filename: string) => {
    const headers = ['Name', 'Stage', 'Value', 'Agency', 'PM', 'Priority', 'Days in Stage', 'Status'];
    const rows = projects.map(p => [
      p.name,
      p.stageId,
      p.value.toString(),
      p.agency || '',
      p.pm || '',
      p.priority || '',
      p.daysInStage.toString(),
      p.isStalled ? 'Stalled' : 'Active'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },

  // Check database integrity
  checkDatabaseIntegrity: async () => {
    try {
      const results = await pipelineService.checkDataIntegrity();
      
      const failedChecks = results.filter((check: IntegrityCheck) => check.status === 'FAIL');
      
      if (failedChecks.length > 0) {
        toast.error(`Database integrity issues found: ${failedChecks.length} failed checks`);
        console.warn('Database integrity issues:', failedChecks);
      } else {
        toast.success('Database integrity check passed');
      }
    } catch (error) {
      toast.error('Failed to check database integrity');
      console.error('checkDatabaseIntegrity error:', error);
    }
  },

  // Computed getters
  getProjectsByStage: () => {
    const { getFilteredProjects } = get();
    const filteredProjects = getFilteredProjects();
    const grouped: Record<string, PipelineProject[]> = {};
    
    filteredProjects.forEach(project => {
      if (!grouped[project.stageId]) {
        grouped[project.stageId] = [];
      }
      grouped[project.stageId].push(project);
    });
    
    return grouped;
  },

  getFilteredProjects: () => {
    const { projects, filters } = get();
    let result = [...projects];

    if (filters.agency?.length) {
      result = result.filter(p => 
        p.agency && filters.agency!.includes(p.agency)
      );
    }

    if (filters.setAside?.length) {
      result = result.filter(p => 
        p.setAside && filters.setAside!.includes(p.setAside)
      );
    }

    if (filters.pm?.length) {
      result = result.filter(p => 
        p.pm && filters.pm!.includes(p.pm)
      );
    }

    if (filters.priority?.length) {
      result = result.filter(p => 
        p.priority && filters.priority!.includes(p.priority)
      );
    }

    if (filters.valueRange) {
      result = result.filter(p => 
        p.value >= filters.valueRange!.min && 
        p.value <= filters.valueRange!.max
      );
    }

    if (filters.showStalled) {
      result = result.filter(p => p.isStalled);
    }

    if (filters.tags?.length) {
      result = result.filter(p => 
        p.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return result;
  },

  getStalledProjects: () => {
    const { projects } = get();
    return projects.filter(project => project.isStalled);
  },

  getTotalPipelineValue: () => {
    const { getFilteredProjects } = get();
    return getFilteredProjects().reduce((sum, p) => sum + p.value, 0);
  },

  getWeightedPipelineValue: () => {
    const { getFilteredProjects } = get();
    return getFilteredProjects().reduce((sum, p) => {
      const probability = p.winProbability || 100;
      return sum + (p.value * probability / 100);
    }, 0);
  },
}));