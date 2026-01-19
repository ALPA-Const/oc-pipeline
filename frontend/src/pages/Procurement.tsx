import { ModulePlaceholder } from './ModulePlaceholder';

export function Procurement() {
  return (
    <ModulePlaceholder
      moduleName="Procurement"
      description="Subcontractor and vendor management, bidding, and purchase order tracking."
      features={[
        "Subcontractor Database",
        "Bid Solicitation",
        "Purchase Orders",
        "Contract Management",
        "Vendor Compliance",
        "Payment Tracking"
      ]}
    />
  );
}
