import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MODULES } from '@/constants/modules';
import { ModuleLink } from './ModuleLink';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarClasses = [
    'nav-sidebar',
    collapsed && !isMobile ? 'collapsed' : '',
    mobileOpen && isMobile ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div 
          className="nav-mobile-overlay active" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={sidebarClasses} role="navigation" aria-label="Main navigation">
        {/* Sidebar Header */}
        <div className="nav-sidebar-header">
          <div className="nav-sidebar-logo">
            ConstructPro
          </div>
          <button
            className="nav-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight size={20} aria-hidden="true" />
            ) : (
              <ChevronLeft size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <ul className="nav-menu-list" role="list">
            {MODULES.map((module) => (
              <ModuleLink 
                key={module.id} 
                module={module} 
                collapsed={collapsed && !isMobile}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}