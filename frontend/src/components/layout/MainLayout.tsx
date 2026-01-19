// ============================================================
// MAIN LAYOUT - Header-Based Group Navigation
// HeaderNav (top) + ContextSidebar (left) + Content
// ============================================================

import { HeaderNav, ContextSidebar } from '@/components/navigation';
import { NavigationProvider } from '@/context/NavigationContext';
import { useAuth } from '@/hooks/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Inner layout that uses navigation context
function LayoutContent({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Navigation with Group Dropdowns */}
      <HeaderNav />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Context Sidebar - shows sub-pages for active module */}
        <ContextSidebar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Main layout wrapper with navigation provider
export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const roles = user?.user_metadata?.roles || ['*'];

  return (
    <NavigationProvider userRoles={roles}>
      <LayoutContent>{children}</LayoutContent>
    </NavigationProvider>
  );
}
