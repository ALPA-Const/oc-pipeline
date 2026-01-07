// ============================================================
// APP LAYOUT - Main Application Shell
// Procore-style layout with TopNav + Contextual Sidebar
// ============================================================

import { Outlet } from 'react-router-dom';
import { TopNav, ModuleSidebar } from '@/components/navigation';
import { useNavigation } from '@/context/NavigationContext';

export function AppLayout() {
  const { activeModule } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Contextual Sidebar - only show when module is active */}
        {activeModule && <ModuleSidebar />}

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
