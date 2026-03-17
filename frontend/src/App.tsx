import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCallback } from "@/pages/AuthCallback";
import { CivoraDashboard } from "@/pages/CivoraDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Adjust these imports to match your actual file paths:
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";

import { Preconstruction } from "@/pages/Preconstruction";
import { FinancialManagement } from "@/pages/FinancialManagement";
import { ProjectManagement } from "@/pages/ProjectManagement";
import { FieldOperations } from "@/pages/FieldOperations";
import { SafetyCompliance } from "@/pages/SafetyCompliance";
import { Procurement } from "@/pages/Procurement";
import { DocumentControl } from "@/pages/DocumentControl";
import { Administration } from "@/pages/Administration";
import { CloseoutWarranty } from "@/pages/CloseoutWarranty";
import { Analytics } from "@/pages/Analytics";
import { Pipeline } from "@/pages/Pipeline";
import { Import } from "@/pages/Import";
import { ClientPortal } from "@/pages/ClientPortal";
import { AIEstimatingDashboard } from "@/pages/AIEstimatingDashboard";
import { AIChat } from "@/pages/AIChat";
import { AIChatDemo } from "@/pages/AIChatDemo";

import { RecoveryDetector } from "@/components/RecoveryDetector";

// Simple wrapper that ensures everything inside is behind your auth gate.
// You can later enhance this to also apply a shared layout/sidebar.
const ProtectedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    {children}
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
            
            {/* Demo Routes (No Auth Required) */}
            <Route path="/demo/ai-chat" element={<AIChatDemo />} />

            {/* Protected Routes - All with ProtectedPage wrapper */}

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedPage>
                  <CivoraDashboard />
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
            <Route
              path="/preconstruction/*"
              element={
                <ProtectedPage>
                  <Preconstruction />
                </ProtectedPage>
              }
            />

            {/* AI Estimating Module */}
            <Route
              path="/estimating/:id/ai"
              element={
                <ProtectedPage>
                  <AIEstimatingDashboard />
                </ProtectedPage>
              }
            />

            {/* AI Chat Module */}
            <Route
              path="/ai-chat"
              element={
                <ProtectedPage>
                  <AIChat />
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

            {/* Risk Module */}
            <Route
              path="/risk"
              element={
                <ProtectedPage>
                  <ProjectManagement />
                </ProtectedPage>
              }
            />
            <Route
              path="/risk/*"
              element={
                <ProtectedPage>
                  <ProjectManagement />
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
