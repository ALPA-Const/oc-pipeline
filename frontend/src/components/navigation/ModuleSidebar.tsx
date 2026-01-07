// ============================================================
// MODULE SIDEBAR - Contextual Sub-Module Navigation
// Shows sub-modules for the active primary module
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { filterSubModulesByRole, type SubModuleConfig } from '@/config/navigation.config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModuleSidebarProps {
  userRoles?: string[];
}

export function ModuleSidebar({ userRoles = ['*'] }: ModuleSidebarProps) {
  const location = useLocation();
  const { activeModule, sidebarCollapsed, setSidebarCollapsed } = useNavigation();

  if (!activeModule) {
    return null;
  }

  const subModules = filterSubModulesByRole(activeModule.subModules, userRoles);

  const isActive = (subModule: SubModuleConfig) => {
    const fullPath = `${activeModule.path}${subModule.path}`;
    return location.pathname === fullPath || 
           (subModule.path === '' && location.pathname === activeModule.path);
  };

  return (
    <aside 
      className={cn(
        "bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Module Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <activeModule.icon className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">{activeModule.label}</span>
            </div>
          )}
          {sidebarCollapsed && (
            <activeModule.icon className="w-5 h-5 text-purple-600 mx-auto" />
          )}
        </div>
      </div>


      {/* Sub-Module Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {subModules.map((subModule) => (
            <li key={subModule.key}>
              <Link
                to={`${activeModule.path}${subModule.path}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive(subModule)
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                title={sidebarCollapsed ? subModule.label : undefined}
              >
                <subModule.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive(subModule) ? "text-purple-600" : "text-gray-500"
                )} />
                {!sidebarCollapsed && (
                  <span className="truncate">{subModule.label}</span>
                )}
                {subModule.badge && !sidebarCollapsed && (
                  <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {subModule.badge}
                  </span>
                )}
              </Link>

              {/* Nested children (if any) */}
              {subModule.children && !sidebarCollapsed && (
                <ul className="ml-8 mt-1 space-y-1">
                  {subModule.children.map((child) => (
                    <li key={child.key}>
                      <Link
                        to={`${activeModule.path}${subModule.path}${child.path}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          location.pathname === `${activeModule.path}${subModule.path}${child.path}`
                            ? "bg-purple-50 text-purple-700"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <child.icon className="w-4 h-4" />
                        <span>{child.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full justify-center"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
