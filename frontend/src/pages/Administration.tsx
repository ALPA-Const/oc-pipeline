import { ModulePlaceholder } from './ModulePlaceholder';

export function Administration() {
  return (
    <ModulePlaceholder
      moduleName="Administration"
      description="System administration, user management, and organizational settings."
      features={[
        "User Management",
        "Role Configuration",
        "System Settings",
        "Audit Logs",
        "Integration Settings",
        "Backup Management"
      ]}
    />
  );
}
