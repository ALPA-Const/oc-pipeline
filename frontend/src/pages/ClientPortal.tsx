import { ModulePlaceholder } from './ModulePlaceholder';

export function ClientPortal() {
  return (
    <ModulePlaceholder
      moduleName="Client Portal"
      description="External client access portal for project updates and documentation."
      features={[
        "Project Updates",
        "Document Access",
        "Progress Photos",
        "Schedule View",
        "Invoice History",
        "Communication Log"
      ]}
    />
  );
}
