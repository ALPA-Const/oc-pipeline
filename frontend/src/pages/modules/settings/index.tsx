// ============================================================
// OC PIPELINE - SETTINGS PANELS EXPORTS
// Mix of live panels (connected to Supabase) and placeholders
// ============================================================

import React from 'react';
import { 
  Ruler, DollarSign, Hash, Tags, FolderTree, Users, Wrench, 
  Truck, Package, HardHat, Receipt, Layers, FileText, 
  Shield, Construction
} from 'lucide-react';

// ============================================================
// LIVE PANELS - Connected to Supabase
// ============================================================

// Re-export live panels
export { CompanyProfilePanel } from './CompanyProfilePanel';
export { SystemDefaultsPanel } from './SystemDefaultsPanel';
export { UnitsOfMeasurePanel } from './UnitsOfMeasurePanel';
export { MarkupDefaultsPanel } from './MarkupDefaultsPanel';

// ============================================================
// PLACEHOLDER PANELS - To be implemented
// ============================================================

const PlaceholderPanel: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="h-full flex flex-col">
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center p-8">
        <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-600 mb-2">Coming Soon</h2>
        <p className="text-gray-400 max-w-md">
          This settings panel is under development. Database schema ready.
        </p>
      </div>
    </div>
  </div>
);

// Currencies Panel
export const CurrenciesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={DollarSign}
    title="Currencies"
    description="Manage currency codes and exchange rates"
  />
);

// Account Codes Panel
export const AccountCodesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Hash}
    title="Account Codes"
    description="Hierarchical cost codes with CSI and UniFormat mapping"
  />
);

// Custom Fields Panel
export const CustomFieldsPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Tags}
    title="Custom Fields & Tags"
    description="Define custom fields and tags for projects, estimates, and contacts"
  />
);

// WBS Templates Panel
export const WBSTemplatesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={FolderTree}
    title="WBS Templates"
    description="Work breakdown structure templates by project type"
  />
);

// Labor Resources Panel
export const LaborResourcesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Users}
    title="Labor Resources"
    description="Trades, crews, wage rates, and burden calculations"
  />
);

// Equipment Resources Panel
export const EquipmentResourcesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Wrench}
    title="Equipment (Owned)"
    description="Owned equipment ownership and operating costs"
  />
);

// Rental Equipment Panel
export const RentalEquipmentPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Truck}
    title="Equipment (Rental)"
    description="Rental rates, delivery costs, and preferred vendors"
  />
);

// Material Resources Panel
export const MaterialResourcesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Package}
    title="Materials"
    description="Permanent materials with pricing and supplier information"
  />
);

// Subcontractor Defaults Panel
export const SubcontractorDefaultsPanel: React.FC = () => (
  <PlaceholderPanel
    icon={HardHat}
    title="Subcontractors"
    description="Trade defaults and preferred subcontractor assignments"
  />
);

// Other Costs Panel
export const OtherCostsPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Receipt}
    title="Other Costs"
    description="Permits, fees, testing, and inspection costs"
  />
);

// Cost Assemblies Panel
export const CostAssembliesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Layers}
    title="Cost Assemblies"
    description="Composite cost items with formulas and auto-generation"
  />
);

// Quote Groups Panel
export const QuoteGroupsPanel: React.FC = () => (
  <PlaceholderPanel
    icon={FileText}
    title="Quote Groups"
    description="Bid package trade groupings with preferred bidders"
  />
);

// Report Templates Panel
export const ReportTemplatesPanel: React.FC = () => (
  <PlaceholderPanel
    icon={FileText}
    title="Report Templates"
    description="Estimate and proposal report formats"
  />
);

// User Management Panel
export const UserManagementPanel: React.FC = () => (
  <PlaceholderPanel
    icon={Shield}
    title="User Management"
    description="Users, roles, and permissions"
  />
);
