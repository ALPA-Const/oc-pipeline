import { AppLayout } from '@/components/layout/AppLayout';
import { useLocation } from 'react-router-dom';
import { 
  Construction, 
  Clock, 
  CheckCircle2,
  ArrowRight 
} from 'lucide-react';

interface ModulePlaceholderProps {
  moduleName: string;
  description: string;
  features: string[];
}

export function ModulePlaceholder({ moduleName, description, features }: ModulePlaceholderProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Extract subpage from path
  const pathParts = currentPath.split('/').filter(Boolean);
  const subPage = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;
  const formattedSubPage = subPage 
    ? subPage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>{moduleName}</span>
            {formattedSubPage && (
              <>
                <ArrowRight className="h-4 w-4" />
                <span className="text-gray-700 font-medium">{formattedSubPage}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {formattedSubPage || moduleName}
          </h1>
          <p className="mt-2 text-gray-600">{description}</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <Construction className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Module Under Development</h2>
            <p className="text-blue-100 max-w-md mx-auto">
              This module is being built to federal-grade specifications. Check back soon!
            </p>
          </div>

          <div className="p-6">
            {/* Features List */}
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Planned Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Development in progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Phase 1
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Q1 2025
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Request Feature
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            View Roadmap
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Get Notified
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
