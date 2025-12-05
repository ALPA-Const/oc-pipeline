// C:\Users\Bill Asmar\oc-pipeline\oc-pipeline-main\frontend\src\main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// RBAC / permissions context (dual-scope org + project)
import { PermissionProvider } from './contexts/PermissionContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PermissionProvider>
      <App />
    </PermissionProvider>
  </React.StrictMode>
);
