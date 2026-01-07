// ============================================================
// MODULE DROPDOWN - Top Navigation Module Selector
// Procore-style global module switcher
// ============================================================

import { ChevronDown, Check } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ModuleDropdown() {
  const { activeModule, availableModules, setActiveModule } = useNavigation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 h-auto font-semibold text-base"
        >
          {activeModule && (
            <>
              <activeModule.icon className="w-5 h-5 text-purple-600" />
              <span>{activeModule.label}</span>
            </>
          )}
          {!activeModule && <span>Select Module</span>}
          <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {availableModules.map((module, index) => (
          <div key={module.key}>
            {/* Add separator before Admin */}
            {module.key === 'admin' && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => setActiveModule(module.key)}
              className="flex items-center gap-3 py-2.5 cursor-pointer"
            >
              <module.icon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium">{module.label}</div>
                {module.description && (
                  <div className="text-xs text-gray-500">{module.description}</div>
                )}
              </div>
              {activeModule?.key === module.key && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
