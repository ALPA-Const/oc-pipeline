import { create } from 'zustand';
import { PipelineProject, PipelineType, StageTransition, PipelineMetrics, PipelineFilters } from '@/types/pipeline.types';
import { getStageById } from '@/config/pipeline-stages';
import { toast } from 'sonner';

interface PipelineState {
  projects: PipelineProject[];
  transitions: StageTransition[];
  metrics: PipelineMetrics | null;
  filters: PipelineFilters;
  isLoading: boolean;
  selectedProject: PipelineProject | null;
}

interface PipelineActions {
  fetchProjects: (type: PipelineType) => Promise<void>;
  fetchMetrics: (type: PipelineType) => Promise<void>;
  moveProject: (projectId: string, toStageId: string, notes?: string) => Promise<boolean>;
  updateProject: (projectId: string, updates: Partial<PipelineProject>) => Promise<boolean>;
  selectProject: (projectId: string) => void;
  updateFilters: (newFilters: PipelineFilters) => void;
  setFilters: (newFilters: PipelineFilters) => void;
  clearFilters: () => void;
  exportPipeline: (type: PipelineType) => void;
  getProjectsByStage: () => Record<string, PipelineProject[]>;
  getFilteredProjects: () => PipelineProject[];
  getStalledProjects: () => PipelineProject[];
  getTotalPipelineValue: () => number;
  getWeightedPipelineValue: () => number;
  projectsByStage: Record<string, PipelineProject[]>;
  filteredProjects: PipelineProject[];
  stalledProjects: PipelineProject[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
}

type PipelineStore = PipelineState & PipelineActions;

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  // Initial state
  projects: [],
  transitions: [],
  metrics: null,
  filters: {},
  isLoading: false,
  selectedProject: null,
  projectsByStage: {},
  filteredProjects: [],
  stalledProjects: [],
  totalPipelineValue: 0,
  weightedPipelineValue: 0,

  // Actions
  fetchProjects: async (type: PipelineType) => {
    set({ isLoading: true });
    try {
      // Mock data - replace with actual API call
      const mockProjects = await import('@/mocks/pipeline.mock');
      
      let typeProjects: PipelineProject[] = [];
      switch (type) {
        case PipelineType.OPPORTUNITY:
          typeProjects = mockProjects.mockOpportunityProjects;
          break;
        case PipelineType.PRECONSTRUCTION:
          typeProjects = mockProjects.mockPreconstructionProjects;
          break;
        case PipelineType.EXECUTION:
          typeProjects = mockProjects.mockExecutionProjects;
          break;
        case PipelineType.CLOSEOUT:
          typeProjects = mockProjects.mockCloseoutProjects;
          break;
      }
      
      // Calculate days in stage and stalled status
      typeProjects.forEach(project => {
        const enteredDate = new Date(project.enteredStageAt);
        const now = new Date();
        project.daysInStage = Math.floor(
          (now.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const stage = getStageById(project.stageId);
        project.isStalled = stage?.averageDuration 
          ? project.daysInStage > stage.averageDuration * 1.5
          : false;
      });

      set({ projects: typeProjects });
      
      // Update computed values
      const store = get();
      set({
        projectsByStage: store.getProjectsByStage(),
        filteredProjects: store.getFilteredProjects(),
        stalledProjects: store.getStalledProjects(),
        totalPipelineValue: store.getTotalPipelineValue(),
        weightedPipelineValue: store.getWeightedPipelineValue(),
      });
    } catch (error) {
      toast.error('Failed to fetch pipeline projects');
      console.error('fetchProjects error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMetrics: async (type: PipelineType) => {
    try {
      const mockData = await import('@/mocks/pipeline.mock');
      set({ metrics: mockData.mockMetrics });
    } catch (error) {
      toast.error('Failed to fetch pipeline metrics');
      console.error('fetchMetrics error:', error);
    }
  },

  moveProject: async (
    projectId: string, 
    toStageId: string, 
    notes?: string
  ): Promise<boolean> => {
    const { projects, transitions } = get();
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      toast.error('Project not found');
      return false;
    }

    const fromStageId = project.stageId;
    const toStage = getStageById(toStageId);
    const fromStage = getStageById(fromStageId);

    // Validate transition
    if (fromStage?.nextStages && !fromStage.nextStages.includes(toStageId)) {
      toast.error(`Cannot move from ${fromStage.name} to ${toStage?.name}`);
      return false;
    }

    try {
      // Update project
      const updatedProject = {
        ...project,
        stageId: toStageId,
        enteredStageAt: new Date().toISOString(),
        daysInStage: 0,
        isStalled: false,
      };

      // Update projects array
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      );

      // Create transition record
      const transition: StageTransition = {
        id: `t${Date.now()}`,
        projectId,
        fromStageId,
        toStageId,
        transitionedAt: new Date().toISOString(),
        notes,
      };

      set({ 
        projects: updatedProjects,
        transitions: [...transitions, transition]
      });

      // Update computed values
      const store = get();
      set({
        projectsByStage: store.getProjectsByStage(),
        filteredProjects: store.getFilteredProjects(),
        stalledProjects: store.getStalledProjects(),
        totalPipelineValue: store.getTotalPipelineValue(),
        weightedPipelineValue: store.getWeightedPipelineValue(),
      });

      toast.success(`Moved to ${toStage?.name}`);
      return true;
    } catch (error) {
      toast.error('Failed to move project');
      console.error('moveProject error:', error);
      return false;
    }
  },

  updateProject: async (
    projectId: string, 
    updates: Partial<PipelineProject>
  ): Promise<boolean> => {
    try {
      const { projects, selectedProject } = get();
      
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      );

      const updatedSelectedProject = selectedProject?.id === projectId 
        ? { ...selectedProject, ...updates } 
        : selectedProject;

      set({ 
        projects: updatedProjects,
        selectedProject: updatedSelectedProject
      });

      // Update computed values
      const store = get();
      set({
        projectsByStage: store.getProjectsByStage(),
        filteredProjects: store.getFilteredProjects(),
        stalledProjects: store.getStalledProjects(),
        totalPipelineValue: store.getTotalPipelineValue(),
        weightedPipelineValue: store.getWeightedPipelineValue(),
      });

      toast.success('Project updated');
      return true;
    } catch (error) {
      toast.error('Failed to update project');
      console.error('updateProject error:', error);
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
    
    // Update computed values
    const store = get();
    set({
      filteredProjects: store.getFilteredProjects(),
      projectsByStage: store.getProjectsByStage(),
      stalledProjects: store.getStalledProjects(),
      totalPipelineValue: store.getTotalPipelineValue(),
      weightedPipelineValue: store.getWeightedPipelineValue(),
    });
  },

  setFilters: (newFilters: PipelineFilters) => {
    set({ filters: newFilters });
    
    // Update computed values
    const store = get();
    set({
      filteredProjects: store.getFilteredProjects(),
      projectsByStage: store.getProjectsByStage(),
      stalledProjects: store.getStalledProjects(),
      totalPipelineValue: store.getTotalPipelineValue(),
      weightedPipelineValue: store.getWeightedPipelineValue(),
    });
  },

  clearFilters: () => {
    set({ filters: {} });
    
    // Update computed values
    const store = get();
    set({
      filteredProjects: store.getFilteredProjects(),
      projectsByStage: store.getProjectsByStage(),
      stalledProjects: store.getStalledProjects(),
      totalPipelineValue: store.getTotalPipelineValue(),
      weightedPipelineValue: store.getWeightedPipelineValue(),
    });
  },

  exportPipeline: (type: PipelineType) => {
    const { getFilteredProjects } = get();
    const filteredProjects = getFilteredProjects();
    
    const headers = ['Project', 'Stage', 'Value', 'Days in Stage', 'PM', 'Agency', 'Status'];
    
    const rows = filteredProjects.map(p => {
      const stage = getStageById(p.stageId);
      return [
        p.name,
        stage?.name || p.stageId,
        p.value,
        p.daysInStage,
        p.pm || '',
        p.agency || '',
        p.isStalled ? 'Stalled' : 'On Track',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pipeline_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Pipeline exported');
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
    return projects.filter(project => {
      const stage = getStageById(project.stageId);
      if (!stage || !stage.averageDuration) return false;
      return project.daysInStage > stage.averageDuration * 1.5;
    });
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