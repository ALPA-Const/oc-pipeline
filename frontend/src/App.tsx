import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/hooks/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCallback } from "@/pages/AuthCallback";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Dashboard } from "@/pages/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtected } from "@/components/RoleProtected";
import { MainLayout } from "@/components/layout/MainLayout";
import { RecoveryDetector } from "@/components/RecoveryDetector";
import { FEATURE_FLAGS } from "@/config/featureFlags";

// Module Pages - using default imports (no curly braces)
import Preconstruction from "@/pages/modules/Preconstruction";
import Pursuits from "@/pages/modules/Pursuits";
import PursuitDetail from "@/pages/modules/pursuits/PursuitDetail";
import Administration from "@/pages/modules/Administration";
import DocumentControl from "@/pages/modules/DocumentControl";
import FieldOperations from "@/pages/modules/FieldOperations";
import FinancialManagement from "@/pages/modules/FinancialManagement";
import Procurement from "@/pages/modules/Procurement";
import ProjectManagement from "@/pages/modules/ProjectManagement";
import Resources from "@/pages/modules/Resources";
import SafetyCompliance from "@/pages/modules/SafetyCompliance";
import CloseoutWarranty from "@/pages/modules/CloseoutWarranty";
import ClientPortal from "@/pages/modules/ClientPortal";

// Admin Pages
import Analytics from "@/pages/admin/Analytics";
import Pipeline from "@/pages/admin/Pipeline";
import Import from "@/pages/admin/Import";

// Estimating Module (New Dashboard)
import Estimating from "@/pages/modules/Estimating";

// Risk Agent Page
import RiskPage from "@/pages/Risk";

// PM Pages
import PMCommandCenter from "@/pages/pm/PMCommandCenter";

// OEOC Module Pages
import {
  OEOCLayout,
  CommandCenterPage,
  AIChatPage,
  OrchestratorsPage,
  SwarmPage,
  WorkflowsPage,
  ExecutionsPage,
  PromptLabPage,
  AuditVaultPage,
} from "@/pages/oeoc";

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
        <RecoveryDetector>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/confirm" element={<AuthCallback />} />

            {/* Protected Routes - All with Sidebar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedPage>
                  <Dashboard />
                </ProtectedPage>
              }
            />

            {/* Preconstruction Module */}
            <Route
              path="/preconstruction"
              element={
                <ProtectedPage>
                  <Preconstruction />
                </ProtectedPage>
              }
            />
            {/* Pursuits Module */}
            <Route
              path="/pursuits"
              element={
                <ProtectedPage>
                  <Pursuits />
                </ProtectedPage>
              }
            />
            <Route
              path="/pursuits/:id"
              element={
                <ProtectedPage>
                  <PursuitDetail />
                </ProtectedPage>
              }
            />
            {/* Cost/Financial Module */}
            <Route
              path="/cost"
              element={
                <ProtectedPage>
                  <FinancialManagement />
                </ProtectedPage>
              }
            />
            <Route
              path="/cost/*"
              element={
                <ProtectedPage>
                  <FinancialManagement />
                </ProtectedPage>
              }
            />
            <Route
              path="/financial"
              element={
                <ProtectedPage>
                  <FinancialManagement />
                </ProtectedPage>
              }
            />

            {/* Schedule Module */}
            <Route
              path="/schedule"
              element={
                <ProtectedPage>
                  <ProjectManagement />
                </ProtectedPage>
              }
            />
            <Route
              path="/schedule/*"
              element={
                <ProtectedPage>
                  <ProjectManagement />
                </ProtectedPage>
              }
            />

            {/* Risk Module – now wired to RiskPage (AI Risk Agent) */}
            <Route
              path="/risk"
              element={
                <ProtectedPage>
                  <RiskPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/risk/*"
              element={
                <ProtectedPage>
                  <RiskPage />
                </ProtectedPage>
              }
            />

            {/* Resources Module */}
            <Route
              path="/resources"
              element={
                <ProtectedPage>
                  <Resources />
                </ProtectedPage>
              }
            />

            {/* Quality Module */}
            <Route
              path="/quality"
              element={
                <ProtectedPage>
                  <FieldOperations />
                </ProtectedPage>
              }
            />
            <Route
              path="/quality/*"
              element={
                <ProtectedPage>
                  <FieldOperations />
                </ProtectedPage>
              }
            />

            {/* Safety Module */}
            <Route
              path="/safety"
              element={
                <ProtectedPage>
                  <SafetyCompliance />
                </ProtectedPage>
              }
            />
            <Route
              path="/safety/*"
              element={
                <ProtectedPage>
                  <SafetyCompliance />
                </ProtectedPage>
              }
            />

            {/* Procurement Module */}
            <Route
              path="/procurement"
              element={
                <ProtectedPage>
                  <Procurement />
                </ProtectedPage>
              }
            />
            <Route
              path="/procurement/*"
              element={
                <ProtectedPage>
                  <Procurement />
                </ProtectedPage>
              }
            />

            {/* Field Operations (New) */}
            <Route
              path="/field/daily-logs"
              element={
                <ProtectedPage>
                  <Resources title="Daily Logs" />
                </ProtectedPage>
              }
            />
            <Route
              path="/field/reporting"
              element={
                <ProtectedPage>
                  <Resources title="Field Reporting" />
                </ProtectedPage>
              }
            />
            <Route
              path="/field/observations"
              element={
                <ProtectedPage>
                  <Resources title="Observations" />
                </ProtectedPage>
              }
            />
            <Route
              path="/field/photos"
              element={
                <ProtectedPage>
                  <Resources title="Photos" />
                </ProtectedPage>
              }
            />
            <Route
              path="/field/punchlist"
              element={
                <ProtectedPage>
                  <Resources title="Punchlist" />
                </ProtectedPage>
              }
            />
            <Route
              path="/field/inspections"
              element={
                <ProtectedPage>
                  <Resources title="Inspections" />
                </ProtectedPage>
              }
            />

            {/* Communications Module */}
            <Route
              path="/communications"
              element={
                <ProtectedPage>
                  <DocumentControl />
                </ProtectedPage>
              }
            />
            <Route
              path="/communications/*"
              element={
                <ProtectedPage>
                  <DocumentControl />
                </ProtectedPage>
              }
            />

            {/* Staffing Module */}
            <Route
              path="/staffing"
              element={
                <ProtectedPage>
                  <Administration />
                </ProtectedPage>
              }
            />
            <Route
              path="/staffing/*"
              element={
                <ProtectedPage>
                  <Administration />
                </ProtectedPage>
              }
            />

            {/* Closeout Module */}
            <Route
              path="/closeout"
              element={
                <ProtectedPage>
                  <CloseoutWarranty />
                </ProtectedPage>
              }
            />
            <Route
              path="/closeout/*"
              element={
                <ProtectedPage>
                  <CloseoutWarranty />
                </ProtectedPage>
              }
            />

            {/* Documents Module */}
            <Route
              path="/documents"
              element={
                <ProtectedPage>
                  <DocumentControl />
                </ProtectedPage>
              }
            />
            <Route
              path="/documents/*"
              element={
                <ProtectedPage>
                  <DocumentControl />
                </ProtectedPage>
              }
            />

            {/* Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedPage>
                  <Analytics />
                </ProtectedPage>
              }
            />

            {/* Estimating Module - Estimates Dashboard */}
            <Route
              path="/estimating"
              element={
                <ProtectedPage>
                  <Estimating />
                </ProtectedPage>
              }
            />
            <Route
              path="/estimating/*"
              element={
                <ProtectedPage>
                  <Estimating />
                </ProtectedPage>
              }
            />

            <Route
              path="/pm-command-center"
              element={
                <RoleProtected roles={['ProjectManager', 'ProjectExecutive', 'Superintendent', 'Admin', 'Preconstruction Executive']}>
                  <ProtectedPage>
                    <PMCommandCenter />
                  </ProtectedPage>
                </RoleProtected>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedPage>
                  <Administration />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedPage>
                  <Administration />
                </ProtectedPage>
              }
            />
            <Route
              path="/administration"
              element={
                <ProtectedPage>
                  <Administration />
                </ProtectedPage>
              }
            />

            {/* Other Routes */}
            <Route
              path="/pipeline"
              element={
                <ProtectedPage>
                  <Pipeline />
                </ProtectedPage>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedPage>
                  <Import />
                </ProtectedPage>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedPage>
                  <ProjectManagement />
                </ProtectedPage>
              }
            />
            <Route
              path="/field-operations"
              element={
                <ProtectedPage>
                  <FieldOperations />
                </ProtectedPage>
              }
            />
            <Route
              path="/client-portal"
              element={
                <ProtectedPage>
                  <ClientPortal />
                </ProtectedPage>
              }
            />

            {/* OEOC - AI Orchestration Module */}
            <Route
              path="/oeoc"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OEOCLayout />
                  </MainLayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<CommandCenterPage />} />
              <Route path="ai-chat" element={<AIChatPage />} />
              <Route path="orchestrators" element={<OrchestratorsPage />} />
              <Route path="swarm" element={<SwarmPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="executions" element={<ExecutionsPage />} />
              <Route path="prompts" element={<PromptLabPage />} />
              <Route path="audit" element={<AuditVaultPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </RecoveryDetector>
      </Router>
    </AuthProvider>
  );
}

export default App;
