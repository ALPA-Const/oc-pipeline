import { ModulePlaceholder } from './ModulePlaceholder';

export function FinancialManagement() {
  return (
    <ModulePlaceholder
      moduleName="Financial Management"
      description="DCAA-compliant financial tracking, budgeting, and cost control for federal projects."
      features={[
        "Budget Management",
        "Cost Tracking",
        "Change Order Processing",
        "Invoice Management",
        "DCAA Compliance",
        "Financial Reporting"
      ]}
    />
  );
}
