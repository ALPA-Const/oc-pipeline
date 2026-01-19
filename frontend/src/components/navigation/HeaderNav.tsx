// ============================================================
// HEADER NAVIGATION - Group-Based Dropdowns
// Procore-style top navigation with functional groups
// ============================================================

import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ChevronDown,
  Gauge
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useNavigation } from '@/context/NavigationContext';
import { ADMIN_GROUP, type GroupConfig, type ModuleConfig } from '@/config/navigation.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ============================================================
// GROUP DROPDOWN COMPONENT
// ============================================================

interface GroupDropdownProps {
  group: GroupConfig;
  isActive: boolean;
  hideLabel?: boolean;
}

function GroupDropdown({ group, isActive, hideLabel }: GroupDropdownProps) {
  const { navigateToModule } = useNavigation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 h-auto text-sm font-medium transition-colors",
            isActive
              ? "text-purple-700 bg-purple-50"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
            hideLabel && "px-2 h-9 w-9 justify-center"
          )}
        >
          <group.icon className="w-4 h-4" />
          {!hideLabel && (
            <>
              <span className="hidden lg:inline">{group.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={hideLabel ? "end" : "start"} className="w-64">
        {group.modules.map((module) => (
          <DropdownMenuItem
            key={module.key}
            onClick={() => navigateToModule(group.key, module.key)}
            className="flex items-center gap-3 py-2.5 cursor-pointer"
          >
            <module.icon className="w-4 h-4 text-gray-500" />
            <div className="flex-1">
              <div className="font-medium text-sm">{module.label}</div>
              {module.description && (
                <div className="text-xs text-gray-500 mt-0.5">{module.description}</div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


// ============================================================
// MAIN HEADER NAVIGATION
// ============================================================

export function HeaderNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { availableGroups, showAdmin, activeGroup, navigateToDashboard } = useNavigation();

  // Check if a group is active based on current path
  const isGroupActive = (group: GroupConfig) => {
    return activeGroup?.key === group.key;
  };

  // Check if user has PM/Admin roles for the command center button
  const pmRoles = ['ProjectManager', 'ProjectExecutive', 'Superintendent', 'Admin', 'Preconstruction Executive'];
  const canSeeCommandCenter = FEATURE_FLAGS.PM_COMMAND_CENTER &&
    (user?.user_metadata?.roles?.some((r: string) => pmRoles.includes(r)) ||
      pmRoles.includes(user?.user_metadata?.title || ''));

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left: Logo (Home) + Group Navigation */}
      <div className="flex items-center gap-1">
        {/* Logo - Routes to Dashboard */}
        <button
          onClick={navigateToDashboard}
          className="flex items-center justify-center w-9 h-9 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors mr-3"
          title="Dashboard"
        >
          <span className="text-white font-bold text-lg">O</span>
        </button>

        {/* Group Dropdowns */}
        <nav className="flex items-center">
          {availableGroups.map((group) => (
            <GroupDropdown
              key={group.key}
              group={group}
              isActive={isGroupActive(group)}
            />
          ))}
        </nav>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">

        {/* Admin - Standalone (role-restricted) */}
        {showAdmin && (
          <GroupDropdown
            group={ADMIN_GROUP}
            isActive={isGroupActive(ADMIN_GROUP)}
            hideLabel={true}
          />
        )}

        {/* PM Command Center Button */}
        {canSeeCommandCenter && (
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            title="PM Command Center"
            aria-label="PM Command Center"
            onClick={() => navigate('/pm-command-center')}
          >
            <Gauge className="w-4 h-4 text-gray-500" />
          </Button>
        )}

        {/* Help */}
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
          <HelpCircle className="w-4 h-4 text-gray-500" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-full ml-1">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <div className="font-medium text-sm">{user?.user_metadata?.full_name || user?.email || 'User'}</div>
              <div className="text-xs text-gray-500">{user?.user_metadata?.title || 'No Title'}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
