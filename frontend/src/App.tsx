import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthCallback } from '@/pages/AuthCallback';
import { Dashboard } from '@/pages/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Module Pages
import Administration from '@/pages/modules/Administration';
import FinancialManagement from '@/pages/modules/FinancialManagement';
import ProjectManagement from '@/pages/modules/ProjectManagement';
import FieldOperations from '@/pages/modules/FieldOperations';
import SafetyCompliance from '@/pages/modules/SafetyCompliance';
import Procurement from '@/pages/modules/Procurement';
import ClientPortal from '@/pages/modules/ClientPortal';
import DocumentControl from '@/pages/modules/DocumentControl';
import CloseoutWarranty from '@/pages/modules/CloseoutWarranty';

// Estimating Module Pages
import {
  EstimatingLayout,
  EstimatingOverview,
  EstimatesList,
  EstimateDetail,
  NewEstimate,
  CostBreakdown,
  BidTracker,
  EstimatingAnalytics,
} from '@/pages/estimating';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes with AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Administration Module */}
            <Route path="/administration" element={<Administration />} />

            {/* Financial Management Module */}
            <Route path="/financial-management" element={<FinancialManagement />} />

            {/* Preconstruction & Estimating Module */}
            <Route path="/preconstruction" element={<EstimatingLayout />}>
              <Route index element={<EstimatingOverview />} />
              <Route path="estimates" element={<EstimatesList />} />
              <Route path="estimates/new" element={<NewEstimate />} />
              <Route path="estimates/:id" element={<EstimateDetail />} />
              <Route path="estimates/:id/edit" element={<NewEstimate />} />
              <Route path="cost-breakdown" element={<CostBreakdown />} />
              <Route path="bids" element={<BidTracker />} />
              <Route path="analytics" element={<EstimatingAnalytics />} />
            </Route>

            {/* Project Management Module */}
            <Route path="/project-management" element={<ProjectManagement />} />

            {/* Field Operations Module */}
            <Route path="/field-operations" element={<FieldOperations />} />

            {/* Safety & Compliance Module */}
            <Route path="/safety-compliance" element={<SafetyCompliance />} />

            {/* Procurement Module */}
            <Route path="/procurement" element={<Procurement />} />

            {/* Client Portal Module */}
            <Route path="/client-portal" element={<ClientPortal />} />

            {/* Document Control Module */}
            <Route path="/document-control" element={<DocumentControl />} />

            {/* Closeout & Warranty Module */}
            <Route path="/closeout-warranty" element={<CloseoutWarranty />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
