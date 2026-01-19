import {
  Settings,
  DollarSign,
  BarChart3,
  Calendar,
  HardHat,
  ShieldAlert,
  Package,
  Users,
  FolderOpen,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

export interface Module {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  active: boolean;
  order: number;
  description?: string;
}

export const MODULES: Module[] = [
  {
    id: 'administration',
    label: 'Administration & System Core',
    icon: Settings,
    route: '/administration',
    active: true,
    order: 1,
    description: 'System settings, user management, and core configurations',
  },
  {
    id: 'financial',
    label: 'Financial Management',
    icon: DollarSign,
    route: '/financial-management',
    active: false,
    order: 2,
    description: 'Budgeting, invoicing, and financial reporting',
  },
  {
    id: 'preconstruction',
    label: 'Preconstruction & Estimating',
    icon: BarChart3,
    route: '/preconstruction',
    active: true,
    order: 3,
    description: 'Cost estimation, bid management, and project planning',
  },
  {
    id: 'project-management',
    label: 'Project Management & Scheduling',
    icon: Calendar,
    route: '/project-management',
    active: false,
    order: 4,
    description: 'Project timelines, task management, and scheduling',
  },
  {
    id: 'field-operations',
    label: 'Field Operations',
    icon: HardHat,
    route: '/field-operations',
    active: false,
    order: 5,
    description: 'On-site management, daily logs, and field reporting',
  },
  {
    id: 'safety-compliance',
    label: 'Safety & Compliance',
    icon: ShieldAlert,
    route: '/safety-compliance',
    active: false,
    order: 6,
    description: 'Safety protocols, incident tracking, and regulatory compliance',
  },
  {
    id: 'procurement',
    label: 'Procurement & Vendor Management',
    icon: Package,
    route: '/procurement',
    active: false,
    order: 7,
    description: 'Vendor relationships, purchase orders, and material tracking',
  },
  {
    id: 'client-portal',
    label: 'Client & Stakeholder Portal',
    icon: Users,
    route: '/client-portal',
    active: false,
    order: 8,
    description: 'Client communication, project updates, and stakeholder access',
  },
  {
    id: 'document-control',
    label: 'Document Control & Management',
    icon: FolderOpen,
    route: '/document-control',
    active: false,
    order: 9,
    description: 'Document storage, version control, and file management',
  },
  {
    id: 'closeout-warranty',
    label: 'Closeout & Warranty Management',
    icon: CheckCircle,
    route: '/closeout-warranty',
    active: false,
    order: 10,
    description: 'Project closeout, warranty tracking, and final documentation',
  },
];

export const getModuleByRoute = (route: string): Module | undefined => {
  return MODULES.find((module) => module.route === route);
};

export const getModuleById = (id: string): Module | undefined => {
  return MODULES.find((module) => module.id === id);
};

export const getActiveModules = (): Module[] => {
  return MODULES.filter((module) => module.active);
};