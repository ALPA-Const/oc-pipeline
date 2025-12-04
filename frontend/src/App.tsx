import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/hooks/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCallback } from "@/pages/AuthCallback";
import { Dashboard } from "@/pages/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Module Pages - using default imports (no curly braces)
import Preconstruction from "@/pages/modules/Preconstruction";
import Administration from "@/pages/modules/Administration";
import DocumentControl from "@/pages/modules/DocumentControl";
import FieldOperations from "@/pages/modules/FieldOperations";
import FinancialManagement from "@/pages/modules/FinancialManagement";
import Procurement from "@/pages/modules/Procurement";
import ProjectManagement from "@/pages/modules/ProjectManagement";
import SafetyCompliance from "@/pages/modules/SafetyCompliance";
import CloseoutWarranty from "@/pages/modules/CloseoutWarranty";
import ClientPortal from "@/pages/modules/ClientPortal";

// Admin Pages
import Analytics from "@/pages/admin/Analytics";
import Pipeline from "@/pages/admin/Pipeline";
import Import from "@/pages/admin/Import";

// Protected page wrapper with MainLayout
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes - All with Sidebar */}
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          
          {/* Preconstruction Module */}
          <Route path="/preconstruction" element={<ProtectedPage><Preconstruction /></ProtectedPage>} />
          <Route path="/preconstruction/*" element={<ProtectedPage><Preconstruction /></ProtectedPage>} />
          
          {/* Cost/Financial Module */}
          <Route path="/cost" element={<ProtectedPage><FinancialManagement /></ProtectedPage>} />
          <Route path="/cost/*" element={<ProtectedPage><FinancialManagement /></ProtectedPage>} />
          <Route path="/financial" element={<ProtectedPage><FinancialManagement /></ProtectedPage>} />
          
          {/* Schedule Module */}
          <Route path="/schedule" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
          <Route path="/schedule/*" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
          
          {/* Risk Module */}
          <Route path="/risk" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
          <Route path="/risk/*" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
          
          {/* Quality Module */}
          <Route path="/quality" element={<ProtectedPage><FieldOperations /></ProtectedPage>} />
          <Route path="/quality/*" element={<ProtectedPage><FieldOperations /></ProtectedPage>} />
          
          {/* Safety Module */}
          <Route path="/safety" element={<ProtectedPage><SafetyCompliance /></ProtectedPage>} />
          <Route path="/safety/*" element={<ProtectedPage><SafetyCompliance /></ProtectedPage>} />
          
          {/* Procurement Module */}
          <Route path="/procurement" element={<ProtectedPage><Procurement /></ProtectedPage>} />
          <Route path="/procurement/*" element={<ProtectedPage><Procurement /></ProtectedPage>} />
          
          {/* Communications Module */}
          <Route path="/communications" element={<ProtectedPage><DocumentControl /></ProtectedPage>} />
          <Route path="/communications/*" element={<ProtectedPage><DocumentControl /></ProtectedPage>} />
          
          {/* Staffing Module */}
          <Route path="/staffing" element={<ProtectedPage><Administration /></ProtectedPage>} />
          <Route path="/staffing/*" element={<ProtectedPage><Administration /></ProtectedPage>} />
          
          {/* Closeout Module */}
          <Route path="/closeout" element={<ProtectedPage><CloseoutWarranty /></ProtectedPage>} />
          <Route path="/closeout/*" element={<ProtectedPage><CloseoutWarranty /></ProtectedPage>} />
          
          {/* Documents Module */}
          <Route path="/documents" element={<ProtectedPage><DocumentControl /></ProtectedPage>} />
          <Route path="/documents/*" element={<ProtectedPage><DocumentControl /></ProtectedPage>} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<ProtectedPage><Analytics /></ProtectedPage>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedPage><Administration /></ProtectedPage>} />
          <Route path="/admin/*" element={<ProtectedPage><Administration /></ProtectedPage>} />
          <Route path="/administration" element={<ProtectedPage><Administration /></ProtectedPage>} />
          
          {/* Other Routes */}
          <Route path="/pipeline" element={<ProtectedPage><Pipeline /></ProtectedPage>} />
          <Route path="/import" element={<ProtectedPage><Import /></ProtectedPage>} />
          <Route path="/projects" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
          <Route path="/field-operations" element={<ProtectedPage><FieldOperations /></ProtectedPage>} />
          <Route path="/client-portal" element={<ProtectedPage><ClientPortal /></ProtectedPage>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

