# App.tsx Route Updates for Pursuits Module

Add these imports and routes to your existing App.tsx file.

## 1. Add Imports (at the top with other module imports)

```tsx
// Add after existing module imports
import Pursuits from "@/pages/modules/Pursuits";
import PursuitDetail from "@/pages/modules/pursuits/PursuitDetail";
```

## 2. Add Routes (inside the <Routes> component)

Add these routes after the existing Preconstruction routes:

```tsx
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
```

## 3. Full Updated App.tsx

For reference, here's what your imports section should look like:

```tsx
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
import { MainLayout } from "@/components/layout/MainLayout";
import { RecoveryDetector } from "@/components/RecoveryDetector";

// Module Pages
import Preconstruction from "@/pages/modules/Preconstruction";
import Pursuits from "@/pages/modules/Pursuits";                    // ADD THIS
import PursuitDetail from "@/pages/modules/pursuits/PursuitDetail"; // ADD THIS
import Administration from "@/pages/modules/Administration";
import DocumentControl from "@/pages/modules/DocumentControl";
import FieldOperations from "@/pages/modules/FieldOperations";
import FinancialManagement from "@/pages/modules/FinancialManagement";
import Procurement from "@/pages/modules/Procurement";
import ProjectManagement from "@/pages/modules/ProjectManagement";
import SafetyCompliance from "@/pages/modules/SafetyCompliance";
import CloseoutWarranty from "@/pages/modules/CloseoutWarranty";
import ClientPortal from "@/pages/modules/ClientPortal";

// ... rest of imports
```

## 4. Sidebar Navigation Update

You'll also want to add "Pursuits" to your sidebar navigation. 
Look for the navigation configuration in:
- `frontend/src/components/navigation/Sidebar.tsx`
- or `frontend/src/components/layout/Sidebar.tsx`

Add this to your navigation items:

```tsx
{
  name: 'Pursuits',
  href: '/pursuits',
  icon: Target,  // from lucide-react
}
```
