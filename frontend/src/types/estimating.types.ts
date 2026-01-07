// ============================================================
// OC PIPELINE - ESTIMATING MODULE TYPES
// ============================================================

export interface Estimate {
  id: string;
  orgId: string;
  pursuitId?: string;
  projectId?: string;
  name: string;
  version: number;
  description?: string;
  
  // Totals
  subtotal: number;
  overheadPercent: number;
  overheadAmount: number;
  profitPercent: number;
  profitAmount: number;
  contingencyPercent: number;
  contingencyAmount: number;
  total: number;
  
  // Status
  status: EstimateStatus;
  isBaseline: boolean;
  
  // Metadata
  assumptions?: string;
  exclusions?: string;
  notes?: string;
  
  // Tracking
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type EstimateStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'superseded';

export interface EstimateItem {
  id: string;
  estimateId: string;
  parentId?: string;
  
  // Item details
  costCode?: string;
  description: string;
  unit?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  
  // Cost breakdown
  laborHours: number;
  laborRate: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  otherCost: number;
  
  // Ordering
  orderIndex: number;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // For tree structure
  children?: EstimateItem[];
}

export interface BidPackage {
  id: string;
  orgId: string;
  pursuitId?: string;
  projectId?: string;
  
  name: string;
  trade?: string;
  csiDivision?: string;
  description?: string;
  scopeOfWork?: string;
  
  // Budget
  budgetAmount?: number;
  
  // Dates
  issueDate?: string;
  dueDate?: string;
  preBidDate?: string;
  awardDate?: string;
  
  // Status
  status: BidPackageStatus;
  
  // Awarded
  awardedVendorId?: string;
  awardedVendorName?: string;
  awardedAmount?: number;
  
  // Tracking
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  invitationCount?: number;
  responseCount?: number;
}

export type BidPackageStatus = 'draft' | 'issued' | 'bidding' | 'evaluation' | 'awarded' | 'cancelled';

export interface BidInvitation {
  id: string;
  bidPackageId: string;
  vendorId: string;
  vendorName?: string;
  vendorEmail?: string;
  
  status: BidInvitationStatus;
  
  invitedAt: string;
  viewedAt?: string;
  respondedAt?: string;
  
  willBid?: boolean;
  declineReason?: string;
  notes?: string;
  createdAt: string;
}

export type BidInvitationStatus = 'pending' | 'viewed' | 'accepted' | 'declined' | 'no_response';


export interface BidResponse {
  id: string;
  bidInvitationId: string;
  bidPackageId?: string;
  vendorId?: string;
  vendorName?: string;
  
  baseBid?: number;
  alternateBids?: AlternateBid[];
  totalBid?: number;
  
  exclusions?: string;
  clarifications?: string;
  
  status: BidResponseStatus;
  isSelected: boolean;
  
  score?: number;
  evaluationNotes?: string;
  
  submittedAt: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  createdAt: string;
}

export type BidResponseStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface AlternateBid {
  name: string;
  amount: number;
  description?: string;
}

export interface Takeoff {
  id: string;
  orgId: string;
  estimateId?: string;
  
  name: string;
  description?: string;
  
  sourceFileId?: string;
  sourceFileName?: string;
  sourcePage?: string;
  
  item: string;
  quantity: number;
  unit: string;
  
  location?: string;
  area?: string;
  
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pursuit {
  id: string;
  orgId: string;
  
  name: string;
  code?: string;
  description?: string;
  
  clientName?: string;
  clientAgency?: string;
  clientContactName?: string;
  clientContactEmail?: string;
  clientContactPhone?: string;
  
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  latitude?: number;
  longitude?: number;
  
  estimatedValue?: number;
  lowValue?: number;
  highValue?: number;
  
  projectType?: string;
  deliveryMethod?: string;
  contractType?: string;
  setAsideType?: string;
  naicsCode?: string;
  magnitude?: string;
  
  stageId?: string;
  stageName?: string;
  stageEnteredAt?: string;
  winProbability?: number;
  
  solicitationDate?: string;
  dueDate?: string;
  decisionDate?: string;
  startDate?: string;
  
  outcome?: PursuitOutcome;
  outcomeDate?: string;
  outcomeReason?: string;
  awardedTo?: string;
  awardedAmount?: number;
  
  isJv: boolean;
  jvPartner?: string;
  jvPercentage?: number;
  
  status: PursuitStatus;
  priority: PursuitPriority;
  
  source?: string;
  sourceUrl?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  
  createdBy?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export type PursuitOutcome = 'won' | 'lost' | 'no_bid' | 'cancelled';
export type PursuitStatus = 'active' | 'on_hold' | 'archived';
export type PursuitPriority = 'low' | 'medium' | 'high' | 'critical';



// ============================================================
// FILTER AND SUMMARY TYPES
// ============================================================

export interface EstimateFilters {
  status?: EstimateStatus[];
  pursuitId?: string;
  projectId?: string;
  search?: string;
  dateRange?: { start: string; end: string; };
}

export interface BidPackageFilters {
  status?: BidPackageStatus[];
  trade?: string[];
  pursuitId?: string;
  projectId?: string;
  search?: string;
}

export interface PursuitFilters {
  status?: PursuitStatus[];
  outcome?: PursuitOutcome[];
  stageId?: string[];
  priority?: PursuitPriority[];
  setAsideType?: string[];
  projectType?: string[];
  search?: string;
  valueRange?: { min: number; max: number; };
}

export interface EstimatingSummary {
  totalPursuits: number;
  activePursuits: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  winRate: number;
  averageBidValue: number;
  upcomingDeadlines: number;
  pendingBids: number;
}

// ============================================================
// CSI DIVISIONS
// ============================================================

export const CSI_DIVISIONS = [
  { code: '01', name: 'General Requirements' },
  { code: '02', name: 'Existing Conditions' },
  { code: '03', name: 'Concrete' },
  { code: '04', name: 'Masonry' },
  { code: '05', name: 'Metals' },
  { code: '06', name: 'Wood, Plastics, and Composites' },
  { code: '07', name: 'Thermal and Moisture Protection' },
  { code: '08', name: 'Openings' },
  { code: '09', name: 'Finishes' },
  { code: '10', name: 'Specialties' },
  { code: '11', name: 'Equipment' },
  { code: '12', name: 'Furnishings' },
  { code: '13', name: 'Special Construction' },
  { code: '14', name: 'Conveying Equipment' },
  { code: '21', name: 'Fire Suppression' },
  { code: '22', name: 'Plumbing' },
  { code: '23', name: 'HVAC' },
  { code: '25', name: 'Integrated Automation' },
  { code: '26', name: 'Electrical' },
  { code: '27', name: 'Communications' },
  { code: '28', name: 'Electronic Safety and Security' },
  { code: '31', name: 'Earthwork' },
  { code: '32', name: 'Exterior Improvements' },
  { code: '33', name: 'Utilities' },
] as const;

export type CSIDivision = typeof CSI_DIVISIONS[number];
