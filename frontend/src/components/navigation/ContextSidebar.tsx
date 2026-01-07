// ============================================================
// CONTEXT SIDEBAR - Module Sub-Navigation
// Shows sub-pages for the active module only
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ContextSidebar() {
  const location = useLocation();
  const { 
    activeGroup, 
    activeModule, 
    sidebarCollapsed, 
    setSidebarCollapsed 
  } = useNavigation();

  // Don't show sidebar if no module selected or module has no subpages
  if (!activeModule || !activeModule.subPages || activeModule.subPages.length === 0) {
    return null;
  }

  const isSubPageActive = (subPagePath: string) => {
    const fullPath = `${activeModule.path}${subPagePath}`;
    return location.pathname === fullPath || 
           (subPagePath === '' && location.pathname === activeModule.path);
  };

  return (
    <aside 
      className={cn(
        "bg-gray-50 border-r border-gray-200 transition-all duration-200 flex flex-col",
        sidebarCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Module Header */}
      <div className={cn(
        "border-b border-gray-200 flex items-center",
        sidebarCollapsed ? "p-2 justify-center" : "p-3"
      )}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <activeModule.icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-semibold text-sm text-gray-900 truncate">
              {activeModule.label}
            </span>
          </div>
        ) : (
          <activeModule.icon className="w-4 h-4 text-purple-600" />
        )}
      </div>


      {/* Sub-Page Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {activeModule.subPages.map((subPage) => (
            <li key={subPage.key}>
              <Link
                to={`${activeModule.path}${subPage.path}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  isSubPageActive(subPage.path)
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                title={sidebarCollapsed ? subPage.label : undefined}
              >
                <subPage.icon className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isSubPageActive(subPage.path) ? "text-purple-600" : "text-gray-400"
                )} />
                {!sidebarCollapsed && (
                  <span className="truncate">{subPage.label}</span>
                )}
              </Link>
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
          className="w-full h-8 justify-center text-gray-500 hover:text-gray-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
