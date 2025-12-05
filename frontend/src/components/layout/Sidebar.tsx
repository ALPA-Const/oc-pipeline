/**
 * OC Pipeline - Sidebar Navigation
 * Updated with dual-scope admin sections (Company + Project)
 */

import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShoppingCart,
  MessageSquare,
  Users,
  FileCheck,
  FolderOpen,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building,
  UserCog,
  Layers,
  FileText,
  Link as LinkIcon,
  CreditCard,
  ScrollText,
  UsersRound,
  FolderCog,
} from 'lucide-react';
import { usePermissions, PermissionGate } from '@/contexts/PermissionContext';

// OC Pipeline Module Navigation Structure
const moduleNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Portfolio overview & KPIs',
  },
  {
    name: 'Preconstruction',
    href: '/preconstruction',
    icon: Building2,
    description: 'Estimating & bid management',
    children: [
      { name: 'Pipeline', href: '/preconstruction/pipeline' },
      { name: 'Estimates', href: '/preconstruction/estimates' },
      { name: 'Bid Packages', href: '/preconstruction/packages' },
      { name: 'Vendors', href: '/preconstruction/vendors' },
    ],
  },
  {
    name: 'Cost',
    href: '/cost',
    icon: DollarSign,
    description: 'Budget & financial tracking',
    children: [
      { name: 'Budget', href: '/cost/budget' },
      { name: 'Change Orders', href: '/cost/change-orders' },
      { name: 'Invoicing', href: '/cost/invoicing' },
      { name: 'Forecasting', href: '/cost/forecasting' },
    ],
  },
  {
    name: 'Schedule',
    href: '/schedule',
    icon: CalendarDays,
    description: 'Timeline & milestones',
    children: [
      { name: 'Gantt View', href: '/schedule/gantt' },
      { name: 'Milestones', href: '/schedule/milestones' },
      { name: 'Look-Ahead', href: '/schedule/look-ahead' },
    ],
  },
  {
    name: 'Risk',
    href: '/risk',
    icon: AlertTriangle,
    description: 'Risk register & mitigation',
    children: [
      { name: 'Register', href: '/risk/register' },
      { name: 'Heat Map', href: '/risk/heat-map' },
      { name: 'Mitigation', href: '/risk/mitigation' },
    ],
  },
  {
    name: 'Quality',
    href: '/quality',
    icon: CheckCircle2,
    description: 'QC & inspections',
    children: [
      { name: 'Inspections', href: '/quality/inspections' },
      { name: 'Punch Lists', href: '/quality/punch-lists' },
      { name: 'Deficiencies', href: '/quality/deficiencies' },
    ],
  },
  {
    name: 'Safety',
    href: '/safety',
    icon: Shield,
    description: 'Safety metrics & compliance',
    children: [
      { name: 'Incidents', href: '/safety/incidents' },
      { name: 'Metrics', href: '/safety/metrics' },
      { name: 'Training', href: '/safety/training' },
    ],
  },
  {
    name: 'Procurement',
    href: '/procurement',
    icon: ShoppingCart,
    description: 'Vendors & contracts',
    children: [
      { name: 'Vendors', href: '/procurement/vendors' },
      { name: 'Contracts', href: '/procurement/contracts' },
      { name: 'Purchase Orders', href: '/procurement/purchase-orders' },
    ],
  },
  {
    name: 'Communications',
    href: '/communications',
    icon: MessageSquare,
    description: 'RFIs, submittals & meetings',
    children: [
      { name: 'RFIs', href: '/communications/rfis' },
      { name: 'Submittals', href: '/communications/submittals' },
      { name: 'Meetings', href: '/communications/meetings' },
      { name: 'Correspondence', href: '/communications/correspondence' },
    ],
  },
  {
    name: 'Staffing',
    href: '/staffing',
    icon: Users,
    description: 'Resources & certifications',
    children: [
      { name: 'Team', href: '/staffing/team' },
      { name: 'Certifications', href: '/staffing/certifications' },
      { name: 'Utilization', href: '/staffing/utilization' },
    ],
  },
  {
    name: 'Closeout',
    href: '/closeout',
    icon: FileCheck,
    description: 'Project completion & handover',
    children: [
      { name: 'Checklist', href: '/closeout/checklist' },
      { name: 'As-Builts', href: '/closeout/as-builts' },
      { name: 'Warranties', href: '/closeout/warranties' },
      { name: 'Lessons Learned', href: '/closeout/lessons-learned' },
    ],
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FolderOpen,
    description: 'Document control',
    children: [
      { name: 'All Files', href: '/documents/files' },
      { name: 'Drawings', href: '/documents/drawings' },
      { name: 'Specifications', href: '/documents/specifications' },
    ],
  },
];

// Company (Org-level) Admin Navigation
const companyAdminNavigation = [
  {
    name: 'Company Profile',
    href: '/admin/company',
    icon: Building,
    permission: { resource: 'org', action: 'read_org_profile' },
  },
  {
    name: 'Users & Roles',
    href: '/admin/users',
    icon: UserCog,
    permission: { resource: 'org', action: 'view_org_users' },
    children: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Roles', href: '/admin/roles' },
    ],
  },
  {
    name: 'Departments',
    href: '/admin/departments',
    icon: Layers,
    permission: { resource: 'org', action: 'view_org_departments' },
  },
  {
    name: 'Cost Codes',
    href: '/admin/cost-codes',
    icon: FileText,
    permission: { resource: 'org', action: 'view_org_cost_codes' },
  },
  {
    name: 'Templates',
    href: '/admin/templates',
    icon: FolderCog,
    permission: { resource: 'org', action: 'view_org_templates' },
  },
  {
    name: 'Integrations',
    href: '/admin/integrations',
    icon: LinkIcon,
    permission: { resource: 'org', action: 'view_org_integrations' },
  },
  {
    name: 'Billing',
    href: '/admin/billing',
    icon: CreditCard,
    permission: { resource: 'org', action: 'view_org_billing' },
  },
  {
    name: 'Audit Log',
    href: '/admin/audit-log',
    icon: ScrollText,
    permission: { resource: 'org_audit', action: 'view_audit_logs' },
  },
];

// Project-level Admin Navigation (shown when inside a project)
const projectAdminNavigation = [
  {
    name: 'Project Settings',
    href: '/project/:projectId/settings',
    icon: Settings,
    permission: { resource: 'project', action: 'manage_project_settings' },
  },
  {
    name: 'Project Team',
    href: '/project/:projectId/team',
    icon: UsersRound,
    permission: { resource: 'project', action: 'manage_project_team' },
  },
];

interface NavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    children?: Array<{ name: string; href: string }>;
    permission?: { resource: string; action: string };
  };
  collapsed: boolean;
  isActive: boolean;
  projectId?: string;
}

function NavItem({ item, collapsed, isActive, projectId }: NavItemProps) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Replace :projectId placeholder if present
  const href = projectId ? item.href.replace(':projectId', projectId) : item.href;
  const children = item.children?.map((child) => ({
    ...child,
    href: projectId ? child.href.replace(':projectId', projectId) : child.href,
  }));

  const isChildActive =
    hasChildren &&
    children?.some(
      (child) =>
        location.pathname === child.href ||
        location.pathname.startsWith(child.href + '/')
    );

  const isCurrentActive = isActive || isChildActive;

  const content = (
    <div>
      <div className="flex items-center">
        <Link
          to={href}
          className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isCurrentActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={collapsed ? item.name : undefined}
        >
          <Icon
            className={`h-5 w-5 flex-shrink-0 ${
              isCurrentActive ? 'text-blue-700' : 'text-gray-500'
            }`}
          />
          {!collapsed && <span className="flex-1">{item.name}</span>}
        </Link>
        {!collapsed && hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Children */}
      {!collapsed && hasChildren && expanded && (
        <div className="ml-8 mt-1 space-y-1">
          {children?.map((child) => {
            const childActive =
              location.pathname === child.href ||
              location.pathname.startsWith(child.href + '/');
            return (
              <Link
                key={child.href}
                to={child.href}
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  childActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  // Wrap in permission gate if permission is specified
  if (item.permission) {
    return (
      <PermissionGate
        resource={item.permission.resource}
        action={item.permission.action}
        projectId={projectId}
      >
        {content}
      </PermissionGate>
    );
  }

  return content;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { projectId } = useParams<{ projectId?: string }>();
  const { isOrgAdmin } = usePermissions();

  // Determine if we're in a project context
  const isInProject = location.pathname.includes('/project/') || !!projectId;

  return (
    <aside
      className={`relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <div className="mb-2 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Modules
            </h3>
          </div>
        )}
        {moduleNavigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' &&
              location.pathname.startsWith(item.href + '/'));
          return (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Project Admin Section (when inside a project) */}
      {isInProject && projectId && (
        <div className="border-t border-gray-200 p-3">
          {!collapsed && (
            <div className="mb-2 px-3 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Project
              </h3>
            </div>
          )}
          {projectAdminNavigation.map((item) => {
            const href = item.href.replace(':projectId', projectId);
            const isActive =
              location.pathname === href ||
              location.pathname.startsWith(href + '/');
            return (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
                projectId={projectId}
              />
            );
          })}
        </div>
      )}

      {/* Company Admin Section */}
      <div className="border-t border-gray-200 p-3">
        {!collapsed && (
          <div className="mb-2 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Company
            </h3>
          </div>
        )}

        {/* Analytics (visible to all) */}
        <NavItem
          item={{
            name: 'Analytics',
            href: '/analytics',
            icon: BarChart3,
            description: 'Reports & insights',
          }}
          collapsed={collapsed}
          isActive={
            location.pathname === '/analytics' ||
            location.pathname.startsWith('/analytics/')
          }
        />

        {/* Admin items (permission-gated) */}
        {companyAdminNavigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + '/');
          return (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
            />
          );
        })}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-semibold text-gray-700">OC Pipeline v1.0.0</div>
            <div className="mt-1">© 2025 O'Neill Contractors</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;

