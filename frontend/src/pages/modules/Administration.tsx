// ============================================================
// OC PIPELINE - ADMINISTRATION MODULE
// Wrapper for Administration Settings
// ============================================================

import { AdministrationSettings } from './AdministrationSettings';

export default function Administration() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <AdministrationSettings />
    </div>
  );
}
