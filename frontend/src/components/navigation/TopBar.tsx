import { Bell, Settings, Menu, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getModuleByRoute } from '@/constants/modules';

interface TopBarProps {
  onToggleMobile: () => void;
}

export function TopBar({ onToggleMobile }: TopBarProps) {
  const location = useLocation();
  const currentModule = getModuleByRoute(location.pathname);

  return (
    <header className="nav-topbar" role="banner">
      {/* Mobile Hamburger */}
      <button
        className="nav-hamburger"
        onClick={onToggleMobile}
        aria-label="Toggle navigation menu"
      >
        <Menu size={24} aria-hidden="true" />
      </button>

      {/* Breadcrumbs */}
      <nav className="nav-breadcrumbs" aria-label="Breadcrumb">
        <span>Home</span>
        {currentModule && (
          <>
            <ChevronRight size={16} className="nav-breadcrumb-separator" aria-hidden="true" />
            <span className="nav-breadcrumb-current">{currentModule.label}</span>
          </>
        )}
      </nav>

      {/* Top Bar Actions */}
      <div className="nav-topbar-actions">
        {/* Notifications */}
        <button
          className="nav-topbar-button"
          aria-label="Notifications (3 unread)"
          title="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="badge">3</span>
        </button>

        {/* Settings */}
        <button
          className="nav-topbar-button"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={20} aria-hidden="true" />
        </button>

        {/* User Menu */}
        <div className="nav-user-menu" role="button" tabIndex={0} aria-label="User menu">
          <div className="nav-user-avatar" aria-hidden="true">
            JD
          </div>
          <div className="nav-user-info">
            <div className="nav-user-name">John Doe</div>
            <div className="nav-user-role">Project Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}