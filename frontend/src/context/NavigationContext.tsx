// ============================================================
// OC PIPELINE - NAVIGATION CONTEXT v2
// Header-Based Group Navigation State Management
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  NAVIGATION_GROUPS,
  ADMIN_GROUP,
  findGroupByPath,
  findModuleByPath,
  findSubPageByPath,
  filterGroupsByRole,
  hasAdminAccess,
  type GroupConfig, 
  type ModuleConfig,
  type SubPageConfig,
} from '@/config/navigation.config';

// ============================================================
// TYPES
// ============================================================

interface NavigationContextValue {
  // Current state
  activeGroup: GroupConfig | null;
  activeModule: ModuleConfig | null;
  activeSubPage: SubPageConfig | null;
  
  // Available groups (filtered by role)
  availableGroups: GroupConfig[];
  showAdmin: boolean;
  
  // Actions
  navigateToModule: (groupKey: string, moduleKey: string, subPageKey?: string) => void;
  navigateToDashboard: () => void;
  
  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);


// ============================================================
// NAVIGATION PROVIDER
// ============================================================

interface NavigationProviderProps {
  children: React.ReactNode;
  userRoles?: string[];
}

export function NavigationProvider({ 
  children, 
  userRoles = ['*'] 
}: NavigationProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeGroup, setActiveGroup] = useState<GroupConfig | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleConfig | null>(null);
  const [activeSubPage, setActiveSubPage] = useState<SubPageConfig | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filter groups based on user roles
  const availableGroups = filterGroupsByRole(userRoles);
  const showAdmin = hasAdminAccess(userRoles);

  // Sync state with URL on mount and location change
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip dashboard - no group/module selection
    if (currentPath === '/dashboard' || currentPath === '/') {
      setActiveGroup(null);
      setActiveModule(null);
      setActiveSubPage(null);
      return;
    }
    
    // Find matching group and module
    const group = findGroupByPath(currentPath);
    const module = findModuleByPath(currentPath);
    
    if (group && module) {
      setActiveGroup(group);
      setActiveModule(module);
      
      // Find matching subpage
      const subPage = findSubPageByPath(module, currentPath);
      setActiveSubPage(subPage);
    }
  }, [location.pathname]);

  // Navigate to a specific module
  const navigateToModule = useCallback((
    groupKey: string, 
    moduleKey: string, 
    subPageKey?: string
  ) => {
    // Find group
    const allGroups = [...NAVIGATION_GROUPS, ADMIN_GROUP];
    const group = allGroups.find(g => g.key === groupKey);
    if (!group) return;
    
    // Find module
    const module = group.modules.find(m => m.key === moduleKey);
    if (!module) return;
    
    // Build path
    let path = module.path;
    if (subPageKey && module.subPages) {
      const subPage = module.subPages.find(s => s.key === subPageKey);
      if (subPage) {
        path = `${module.path}${subPage.path}`;
      }
    }
    
    navigate(path);
  }, [navigate]);

  // Navigate to dashboard
  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const value: NavigationContextValue = {
    activeGroup,
    activeModule,
    activeSubPage,
    availableGroups,
    showAdmin,
    navigateToModule,
    navigateToDashboard,
    sidebarCollapsed,
    setSidebarCollapsed,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export { NavigationContext };
