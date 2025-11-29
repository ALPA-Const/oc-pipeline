import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthCallback } from '@/pages/AuthCallback';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Preconstruction Module */}
          <Route
            path="/preconstruction/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Preconstruction" 
                  description="Estimating, bid management, and pipeline tracking"
                  features={['Pipeline Management', 'Cost Estimating', 'Bid Packages', 'Vendor Management']}
                />
              </ProtectedRoute>
            }
          />

          {/* Cost Module */}
          <Route
            path="/cost/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Cost Management" 
                  description="Budget tracking, change orders, and financial forecasting"
                  features={['Budget Tracking', 'Change Orders', 'Invoicing', 'Cost Forecasting']}
                />
              </ProtectedRoute>
            }
          />

          {/* Schedule Module */}
          <Route
            path="/schedule/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Schedule" 
                  description="Timeline management, milestones, and look-ahead planning"
                  features={['Gantt Charts', 'Milestones', 'Look-Ahead', 'Critical Path']}
                />
              </ProtectedRoute>
            }
          />

          {/* Risk Module */}
          <Route
            path="/risk/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Risk Management" 
                  description="Risk register, heat mapping, and mitigation tracking"
                  features={['Risk Register', 'Heat Map', 'Mitigation Plans', 'Risk Scoring']}
                />
              </ProtectedRoute>
            }
          />

          {/* Quality Module */}
          <Route
            path="/quality/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Quality Control" 
                  description="Inspections, punch lists, and deficiency tracking"
                  features={['Inspections', 'Punch Lists', 'Deficiencies', 'QC Reports']}
                />
              </ProtectedRoute>
            }
          />

          {/* Safety Module */}
          <Route
            path="/safety/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Safety" 
                  description="Safety metrics, incident tracking, and compliance"
                  features={['Incident Reports', 'TRIR/DART/EMR', 'Safety Training', 'OSHA Compliance']}
                />
              </ProtectedRoute>
            }
          />

          {/* Procurement Module */}
          <Route
            path="/procurement/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Procurement" 
                  description="Vendor management, contracts, and purchase orders"
                  features={['Vendor Database', 'Contracts', 'Purchase Orders', 'Spend Analytics']}
                />
              </ProtectedRoute>
            }
          />

          {/* Communications Module */}
          <Route
            path="/communications/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Communications" 
                  description="RFIs, submittals, meetings, and correspondence"
                  features={['RFI Management', 'Submittals', 'Meeting Minutes', 'Correspondence Log']}
                />
              </ProtectedRoute>
            }
          />

          {/* Staffing Module */}
          <Route
            path="/staffing/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Staffing & Resources" 
                  description="Team management, certifications, and utilization"
                  features={['Team Directory', 'Certifications', 'Utilization Tracking', 'Resource Planning']}
                />
              </ProtectedRoute>
            }
          />

          {/* Closeout Module */}
          <Route
            path="/closeout/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Closeout" 
                  description="Project completion, handover, and lessons learned"
                  features={['Closeout Checklist', 'As-Builts', 'Warranties', 'Lessons Learned']}
                />
              </ProtectedRoute>
            }
          />

          {/* Documents Module */}
          <Route
            path="/documents/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Document Control" 
                  description="Document management, drawings, and specifications"
                  features={['File Management', 'Drawings', 'Specifications', 'Version Control']}
                />
              </ProtectedRoute>
            }
          />

          {/* Analytics */}
          <Route
            path="/analytics/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Analytics & Reporting" 
                  description="Dashboards, reports, and business intelligence"
                  features={['Portfolio Analytics', 'Custom Reports', 'KPI Tracking', 'Data Export']}
                />
              </ProtectedRoute>
            }
          />

          {/* Admin Module */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <ModulePlaceholder 
                  moduleName="Administration" 
                  description="User management, roles, and system settings"
                  features={['User Management', 'Role & Permissions', 'Company Settings', 'Audit Log']}
                />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
