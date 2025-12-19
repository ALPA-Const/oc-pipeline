/**
 * Estimating Module Layout
 * Provides navigation and structure for all estimating-related pages
 */

import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Calculator,
  Target,
  TrendingUp,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const estimatingNavItems = [
  {
    label: 'Overview',
    href: '/preconstruction',
    icon: BarChart3,
    end: true,
  },
  {
    label: 'Estimates',
    href: '/preconstruction/estimates',
    icon: FileText,
  },
  {
    label: 'Cost Breakdown',
    href: '/preconstruction/cost-breakdown',
    icon: Calculator,
  },
  {
    label: 'Bid Tracker',
    href: '/preconstruction/bids',
    icon: Target,
  },
  {
    label: 'Analytics',
    href: '/preconstruction/analytics',
    icon: TrendingUp,
  },
];

export default function EstimatingLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <nav className="flex space-x-1">
              {estimatingNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <NavLink
              to="/preconstruction/estimates/new"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Estimate
            </NavLink>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
}
