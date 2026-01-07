// Master Contact Directory Components
// Exports for use throughout OC Pipeline

export { 
  NewProjectWizard, 
  useInMemoryDirectoryProvider 
} from './NewProjectWizard';

export type { 
  NewProjectWizardPayload, 
  DirectoryProvider 
} from './NewProjectWizard';

// AI-First Project Wizard (Upload → Extract → Review → Link)
export { 
  AIProjectWizard,
  useInMemoryDirectoryProvider as useAIDirectoryProvider 
} from './AIProjectWizard';
