import { ModulePlaceholder } from './ModulePlaceholder';

export function Import() {
  return (
    <ModulePlaceholder
      moduleName="Import"
      description="Data import tools for opportunities, contacts, and project data."
      features={[
        "SAM.gov Import",
        "CSV Import",
        "Excel Import",
        "Data Mapping",
        "Validation Rules",
        "Import History"
      ]}
    />
  );
}
