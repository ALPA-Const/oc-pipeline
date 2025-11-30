import { Link, useLocation } from 'react-router-dom';
import type { Module } from '@/constants/modules';

interface ModuleLinkProps {
  module: Module;
  collapsed: boolean;
}

export function ModuleLink({ module, collapsed }: ModuleLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === module.route || location.pathname.startsWith(`${module.route}/`);
  
  const Icon = module.icon;

  return (
    <li>
      <Link
        to={module.route}
        className={`nav-module-link ${isActive ? 'active' : ''}`}
        aria-label={module.label}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? module.label : undefined}
      >
        <Icon className="nav-module-icon" aria-hidden="true" />
        <span className="nav-module-label">{module.label}</span>
      </Link>
    </li>
  );
}