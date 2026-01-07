// ============================================================
// OC PIPELINE - ADMINISTRATION MODULE
// Main Administration Settings Page
// ============================================================

import React, { useState } from 'react';
import { 
  Building2, 
  Ruler, 
  DollarSign, 
  Hash, 
  Tags, 
  FolderTree,
  Users,
  Wrench,
  Truck,
  Package,
  HardHat,
  Receipt,
  Layers,
  Percent,
  FileText,
  Settings,
  Shield,
  ChevronRight
} from 'lucide-react';

// Import Company Profile (fully implemented)
import { CompanyProfilePanel } from './settings/CompanyProfilePanel';

// Import placeholder panels
import {
  UnitsOfMeasurePanel,
  CurrenciesPanel,
  AccountCodesPanel,
  CustomFieldsPanel,
  WBSTemplatesPanel,
  LaborResourcesPanel,
  EquipmentResourcesPanel,
  RentalEquipmentPanel,
  MaterialResourcesPanel,
  SubcontractorDefaultsPanel,
  OtherCostsPanel,
  CostAssembliesPanel,
  MarkupDefaultsPanel,
  QuoteGroupsPanel,
  ReportTemplatesPanel,
  SystemDefaultsPanel,
  UserManagementPanel,
} from './settings/index';

// Settings menu configuration
const settingsMenu = [
  {
    category: 'Company',
    items: [
      { id: 'company-profile', label: 'Company Profile', icon: Building2, description: 'Company info, licenses, insurance, bonding' },
      { id: 'user-management', label: 'User Management', icon: Shield, description: 'Users, roles, and permissions' },
    ]
  },
  {
    category: 'Standards',
    items: [
      { id: 'units-of-measure', label: 'Units of Measure', icon: Ruler, description: 'Imperial and metric units' },
      { id: 'currencies', label: 'Currencies', icon: DollarSign, description: 'Currency codes and exchange rates' },
      { id: 'account-codes', label: 'Account Codes', icon: Hash, description: 'Cost codes with CSI/UniFormat mapping' },
      { id: 'custom-fields', label: 'Custom Fields & Tags', icon: Tags, description: 'User-defined fields and tags' },
      { id: 'wbs-templates', label: 'WBS Templates', icon: FolderTree, description: 'Work breakdown structure templates' },
    ]
  },
  {
    category: 'Resource Libraries',
    items: [
      { id: 'labor-resources', label: 'Labor', icon: Users, description: 'Crews, trades, burden rates' },
      { id: 'equipment-resources', label: 'Equipment (Owned)', icon: Wrench, description: 'Owned equipment costs' },
      { id: 'rental-equipment', label: 'Equipment (Rental)', icon: Truck, description: 'Rental rates and vendors' },
      { id: 'material-resources', label: 'Materials', icon: Package, description: 'Permanent materials pricing' },
      { id: 'subcontractor-defaults', label: 'Subcontractors', icon: HardHat, description: 'Trade defaults and preferred subs' },
      { id: 'other-costs', label: 'Other Costs', icon: Receipt, description: 'Permits, fees, testing, inspections' },
    ]
  },
  {
    category: 'Estimating',
    items: [
      { id: 'cost-assemblies', label: 'Cost Assemblies', icon: Layers, description: 'Composite cost items with formulas' },
      { id: 'markup-defaults', label: 'Markup & Overhead', icon: Percent, description: 'Overhead, profit, contingency' },
      { id: 'quote-groups', label: 'Quote Groups', icon: FileText, description: 'Bid package groupings' },
    ]
  },
  {
    category: 'System',
    items: [
      { id: 'report-templates', label: 'Report Templates', icon: FileText, description: 'Estimate and proposal formats' },
      { id: 'system-defaults', label: 'System Defaults', icon: Settings, description: 'Work hours, formats, preferences' },
    ]
  }
];

// Panel component mapping
const panelComponents: Record<string, React.ComponentType> = {
  'company-profile': CompanyProfilePanel,
  'user-management': UserManagementPanel,
  'units-of-measure': UnitsOfMeasurePanel,
  'currencies': CurrenciesPanel,
  'account-codes': AccountCodesPanel,
  'custom-fields': CustomFieldsPanel,
  'wbs-templates': WBSTemplatesPanel,
  'labor-resources': LaborResourcesPanel,
  'equipment-resources': EquipmentResourcesPanel,
  'rental-equipment': RentalEquipmentPanel,
  'material-resources': MaterialResourcesPanel,
  'subcontractor-defaults': SubcontractorDefaultsPanel,
  'other-costs': OtherCostsPanel,
  'cost-assemblies': CostAssembliesPanel,
  'markup-defaults': MarkupDefaultsPanel,
  'quote-groups': QuoteGroupsPanel,
  'report-templates': ReportTemplatesPanel,
  'system-defaults': SystemDefaultsPanel,
};

export const AdministrationSettings: React.FC = () => {
  const [activePanel, setActivePanel] = useState<string>('company-profile');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(false);

  const ActivePanelComponent = panelComponents[activePanel];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar Menu */}
      <div 
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          isMenuCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {/* Menu Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isMenuCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          )}
          <button
            onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight 
              size={20} 
              className={`transform transition-transform ${isMenuCollapsed ? '' : 'rotate-180'}`} 
            />
          </button>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {settingsMenu.map((category, categoryIndex) => (
            <div key={categoryIndex} className="py-2">
              {!isMenuCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category.category}
                </div>
              )}
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={isMenuCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className={isActive ? 'text-blue-700' : 'text-gray-400'} />
                    {!isMenuCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {ActivePanelComponent ? (
          <ActivePanelComponent />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a settings category from the menu
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministrationSettings;
