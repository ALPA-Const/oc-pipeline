

// ============================================================
// SECTION 8: COST ITEM ASSEMBLIES
// ============================================================

export interface CostAssembly {
  id: string;
  org_id: string;
  
  code: string;
  name: string;
  description?: string;
  
  category?: string;
  csi_division?: string;
  csi_section?: string;
  
  unit: string;
  
  production_rate?: number;
  production_unit?: string;
  
  items?: CostAssemblyItem[];
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export type AssemblyItemType = 'labor' | 'equipment' | 'rental' | 'material' | 'subcontract' | 'other';

export interface CostAssemblyItem {
  id: string;
  assembly_id: string;
  
  item_type: AssemblyItemType;
  
  resource_id?: string;
  resource_code?: string;
  resource_name?: string;
  
  quantity_per_unit: number;
  unit?: string;
  
  unit_cost_override?: number;
  
  formula?: string;
  
  notes?: string;
  order_index: number;
  
  created_at: string;
}

export interface AssemblyLookupTable {
  id: string;
  org_id: string;
  
  name: string;
  description?: string;
  
  columns: LookupColumn[];
  data: Record<string, any>[];
  
  created_at: string;
  updated_at: string;
}

export interface LookupColumn {
  name: string;
  type: 'text' | 'number';
}

// ============================================================
// SECTION 9: MARKUP & OVERHEAD DEFAULTS
// ============================================================

export type EscalationMethod = 'simple' | 'compound' | 'by_year';

export interface MarkupDefaults {
  id: string;
  org_id: string;
  
  name: string;
  description?: string;
  
  home_office_overhead_percent: number;
  profit_percent: number;
  
  bid_bond_percent: number;
  performance_bond_percent: number;
  payment_bond_percent: number;
  
  builders_risk_percent: number;
  general_liability_percent: number;
  umbrella_percent: number;
  
  design_contingency_percent: number;
  construction_contingency_percent: number;
  
  escalation_percent: number;
  escalation_method: EscalationMethod;
  
  is_default: boolean;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================================
// SECTION 10: QUOTE GROUPS
// ============================================================

export interface QuoteGroup {
  id: string;
  org_id: string;
  
  name: string;
  code?: string;
  
  csi_divisions: string[];
  
  typical_bid_count: number;
  minimum_bid_count: number;
  
  preferred_bidders: PreferredBidder[];
  
  notes?: string;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface PreferredBidder {
  vendor_id: string;
  vendor_name: string;
  priority: number;
}

// ============================================================
// SECTION 11: REPORT TEMPLATES
// ============================================================

export type ReportType = 'estimate_summary' | 'detailed_estimate' | 'bid_tab' | 'proposal' | 'cost_breakdown' | 'resource_loading';
export type PageSize = 'letter' | 'legal' | 'a4' | 'tabloid';
export type Orientation = 'portrait' | 'landscape';

export interface ReportTemplate {
  id: string;
  org_id: string;
  
  name: string;
  report_type: ReportType;
  description?: string;
  
  include_company_logo: boolean;
  header_text?: string;
  footer_text?: string;
  
  columns?: ReportColumn[];
  group_by?: string[];
  sort_by?: ReportSort[];
  
  show_subtotals: boolean;
  subtotal_levels: string[];
  
  page_size: PageSize;
  orientation: Orientation;
  
  is_default: boolean;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ReportColumn {
  field: string;
  label: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  format?: string;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================
// SECTION 12: SYSTEM DEFAULTS
// ============================================================

export interface SystemDefaults {
  id: string;
  org_id: string;
  
  hours_per_day: number;
  days_per_week: number;
  weeks_per_year: number;
  
  fiscal_year_start_month: number;
  
  date_format: string;
  time_format: '12h' | '24h';
  timezone: string;
  
  decimal_separator: string;
  thousands_separator: string;
  currency_decimals: number;
  quantity_decimals: number;
  
  auto_save_interval_seconds: number;
  
  measurement_system: MeasurementSystem;
  
  created_at: string;
  updated_at: string;
}

// ============================================================
// SECTION 13: PROJECT-LEVEL SETTINGS
// ============================================================

export type OCIPCCIPType = 'none' | 'OCIP' | 'CCIP';
export type SubmissionMethod = 'email' | 'portal' | 'physical' | 'electronic';
export type StructureType = 'steel' | 'concrete' | 'wood' | 'masonry' | 'hybrid' | 'other';
export type FoundationType = 'spread_footing' | 'mat' | 'piles' | 'drilled_shafts' | 'other';

export interface ShiftConfig {
  shifts: 1 | 2 | 3;
  shift1: ShiftDetails;
  shift2?: ShiftDetails;
  shift3?: ShiftDetails;
}

export interface ShiftDetails {
  hours: number;
  ot_hours: number;
  dt_hours: number;
  differential?: number;
}

export interface FuelCosts {
  diesel_per_gallon: number;
  gasoline_per_gallon: number;
  propane_per_gallon: number;
  natural_gas_per_therm: number;
  electricity_per_kwh: number;
  effective_date?: string;
}

export interface WorkingCalendar {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  holidays: string[];
}

export interface Milestone {
  name: string;
  date: string;
  description?: string;
}

export interface Alternate {
  number: string;
  description: string;
  type: 'add' | 'deduct';
  amount?: number;
}

export interface Allowance {
  description: string;
  amount: number;
}

export interface ProjectSettings {
  id: string;
  project_id: string;
  
  // Cost Basis
  currency_code: string;
  hours_per_day: number;
  days_per_week: number;
  
  sales_tax_percent: number;
  sales_tax_on_labor: boolean;
  sales_tax_on_equipment: boolean;
  sales_tax_on_materials: boolean;
  
  wage_area?: string;
  prevailing_wage_required: boolean;
  davis_bacon_required: boolean;
  
  // Shift Work
  shift_config: ShiftConfig;
  shift_rate_factor: number;
  
  // Fuel Costs
  fuel_costs: FuelCosts;
  
  // Markup & Pricing (Overrides)
  home_office_overhead_percent?: number;
  field_office_overhead_percent?: number;
  profit_percent?: number;
  
  bid_bond_required: boolean;
  bid_bond_percent?: number;
  performance_bond_required: boolean;
  performance_bond_percent?: number;
  payment_bond_required: boolean;
  payment_bond_percent?: number;
  
  builders_risk_percent?: number;
  ocip_ccip_type: OCIPCCIPType;
  ocip_ccip_credit_percent?: number;
  
  design_contingency_percent?: number;
  construction_contingency_percent?: number;
  
  escalation_percent?: number;
  escalation_start_date?: string;
  escalation_method?: EscalationMethod;
  
  permit_allowance?: number;
  testing_allowance?: number;
  inspection_allowance?: number;
  
  // Schedule
  schedule_software?: string;
  schedule_link?: string;
  milestones: Milestone[];
  
  ld_per_day?: number;
  ld_cap?: number;
  early_completion_bonus_per_day?: number;
  early_completion_bonus_cap?: number;
  
  working_calendar: WorkingCalendar;
  
  // Bid Requirements
  bid_form_required: boolean;
  bid_bond_amount?: number;
  sub_listing_required: boolean;
  sub_listing_threshold?: number;
  
  unit_prices_required: boolean;
  alternates: Alternate[];
  allowances: Allowance[];
  
  submission_method?: SubmissionMethod;
  submission_platform?: string;
  
  pre_bid_meeting_date?: string;
  pre_bid_meeting_required: boolean;
  pre_bid_meeting_location?: string;
  
  site_visit_date?: string;
  site_visit_required: boolean;
  
  rfi_deadline?: string;
  
  // Scope Definition
  building_type?: string;
  building_size_sf?: number;
  number_of_floors?: number;
  number_of_buildings: number;
  
  structure_type?: StructureType;
  foundation_type?: FoundationType;
  
  major_systems: string[];
  
  site_size_acres?: number;
  parking_spaces?: number;
  
  special_conditions?: string;
  exclusions?: string;
  clarifications?: string;
  
  // Notes
  estimating_notes?: string;
  bid_strategy_notes?: string;
  risk_notes?: string;
  historical_reference?: string;
  lessons_learned?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================
// SECTION 14: PROJECT TEAM & CONTACTS
// ============================================================

export type TeamRole = 'project_manager' | 'lead_estimator' | 'estimator' | 'superintendent' | 'project_engineer' | 'assistant_pm' | 'other';
export type ContactRole = 'owner' | 'architect' | 'engineer' | 'cm' | 'bonding_company' | 'insurance_agent' | 'legal' | 'other';

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  user_id?: string;
  
  role: TeamRole;
  is_primary: boolean;
  
  start_date?: string;
  end_date?: string;
  
  notes?: string;
  
  created_at: string;
}

export interface ProjectContact {
  id: string;
  project_id: string;
  contact_id?: string;
  
  role: ContactRole;
  company_name?: string;
  contact_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  
  is_primary: boolean;
  notes?: string;
  
  created_at: string;
}

// ============================================================
// SECTION 15: PROJECT TAGS & CUSTOM FIELDS
// ============================================================

export interface ProjectTag {
  id: string;
  project_id: string;
  tag_id: string;
  
  // Joined from tags table
  tag_name?: string;
  tag_color?: string;
  
  created_at: string;
}

export interface ProjectCustomField {
  id: string;
  project_id: string;
  field_id: string;
  
  value_text?: string;
  value_number?: number;
  value_date?: string;
  value_boolean?: boolean;
  value_json?: any;
  
  // Joined from custom_field_definitions
  field_name?: string;
  field_label?: string;
  field_type?: CustomFieldType;
  
  created_at: string;
  updated_at: string;
}

// ============================================================
// SECTION 16: FORM TYPES (For UI Components)
// ============================================================

// Company Settings Form
export interface CompanySettingsFormData {
  company_name: string;
  legal_name?: string;
  dba_name?: string;
  tax_id?: string;
  duns_number?: string;
  cage_code?: string;
  sam_uei?: string;
  
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  
  license_number?: string;
  license_state?: string;
  license_expiration?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiration?: string;
  
  bonding_company?: string;
  single_bond_limit?: number;
  aggregate_bond_limit?: number;
  
  certifications?: Certification[];
}

// Labor Resource Form
export interface LaborResourceFormData {
  code: string;
  name: string;
  description?: string;
  
  trade?: string;
  craft?: string;
  skill_level?: SkillLevel;
  union_affiliation?: string;
  
  base_wage_rate: number;
  wage_unit: 'hour' | 'day' | 'week';
  
  fica_percent: number;
  futa_percent: number;
  suta_percent: number;
  workers_comp_percent: number;
  general_liability_percent: number;
  health_welfare_hourly: number;
  pension_percent: number;
  training_hourly: number;
  vacation_percent: number;
  annuity_percent: number;
  small_tools_percent: number;
  per_diem_daily: number;
  subsistence_daily: number;
  
  ot_multiplier: number;
  dt_multiplier: number;
  
  wage_area?: string;
  effective_date?: string;
  expiration_date?: string;
}

// Project Settings Form
export interface ProjectSettingsFormData {
  currency_code: string;
  hours_per_day: number;
  days_per_week: number;
  
  sales_tax_percent: number;
  sales_tax_on_labor: boolean;
  sales_tax_on_equipment: boolean;
  sales_tax_on_materials: boolean;
  
  wage_area?: string;
  prevailing_wage_required: boolean;
  davis_bacon_required: boolean;
  
  shift_config: ShiftConfig;
  fuel_costs: FuelCosts;
  
  // ... other form fields
}

// ============================================================
// SECTION 17: API RESPONSE TYPES
// ============================================================

export interface AdminSettingsResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface AdminSettingsListResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  error: string | null;
  success: boolean;
}

// ============================================================
// END OF ADMINISTRATION TYPES
// ============================================================
