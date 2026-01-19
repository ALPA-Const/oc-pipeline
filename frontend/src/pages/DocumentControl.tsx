import { ModulePlaceholder } from './ModulePlaceholder';

export function DocumentControl() {
  return (
    <ModulePlaceholder
      moduleName="Document Control"
      description="Federal-grade document management, submittal tracking, and RFI processing."
      features={[
        "Document Library",
        "Submittal Management",
        "RFI Tracking",
        "Drawing Control",
        "Transmittals",
        "Version Control"
      ]}
    />
  );
}
