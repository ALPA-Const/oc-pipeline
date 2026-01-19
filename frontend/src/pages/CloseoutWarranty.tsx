import { ModulePlaceholder } from './ModulePlaceholder';

export function CloseoutWarranty() {
  return (
    <ModulePlaceholder
      moduleName="Closeout & Warranty"
      description="Project closeout documentation, warranty tracking, and final compliance."
      features={[
        "Closeout Checklists",
        "Warranty Management",
        "As-Built Documentation",
        "Final Inspections",
        "O&M Manuals",
        "Training Records"
      ]}
    />
  );
}
