// ============================================================
// OC PIPELINE - AI TAKEOFF TYPES
// Elite Agentic AI Estimator Integration
// ============================================================

// ============================================================
// CORE TYPES
// ============================================================

export type TakeoffStatus = 
  | 'initialized'
  | 'agent1_running'
  | 'agent1_complete'
  | 'checkpoint1_pending'
  | 'agent2_running'
  | 'agent2_complete'
  | 'checkpoint2_pending'
  | 'pricing_running'
  | 'checkpoint3_pending'
  | 'checkpoint4_pending'
  | 'finalized'
  | 'error';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CheckpointStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

export type ReviewStatus = 'approved' | 'corrected' | 'rejected';



// ============================================================
// AI TAKEOFF SESSION
// ============================================================

export interface AITakeoffSession {
  id: string;
  workspaceId: string;
  projectId?: string;
  pursuitId?: string;
  estimateId?: string;
  
  sessionName: string;
  status: TakeoffStatus;
  regionCode: string;
  
  // Risk Assessment
  riskProjectComplexity?: number;
  riskSpecificationClarity?: number;
  riskMarketVolatility?: number;
  riskSubcontractorAvailability?: number;
  riskScheduleConstraints?: number;
  riskSiteConditions?: number;
  riskRegulatoryRequirements?: number;
  riskWeightedScore?: number;
  riskLevel?: RiskLevel;
  contingencyPercentLow?: number;
  contingencyPercentHigh?: number;
  
  // Totals
  totalLineItems: number;
  subtotalLow?: number;
  subtotalLikely?: number;
  subtotalHigh?: number;
  
  // Audit
  agent1Version?: string;
  agent2Version?: string;
  orchestratorVersion?: string;
  
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}


// ============================================================
// AI TAKEOFF LINE ITEM
// ============================================================

export interface AITakeoffItem {
  id: string;
  sessionId: string;
  workspaceId: string;
  
  csiSection: string;
  csiTitle?: string;
  tradeAssignment?: string;
  
  materialDescription?: string;
  quantityValue: number;
  calculationMetric: string;
  
  // Traceability
  drawingNumber?: string;
  specSection?: string;
  specPage?: string;
  sourceNotes?: string;
  
  // Confidence
  confidenceLevel?: ConfidenceLevel;
  confidenceScore?: number;
  confidenceReasons?: string[];
  confidenceFactors?: Record<string, number>;
  
  // Costs
  unitCost?: number;
  costLow?: number;
  costLikely?: number;
  costHigh?: number;
  costSource?: string;
  regionalFactor?: number;
  escalationFactor?: number;
  
  // Review
  requiresReview: boolean;
  reviewReason?: string;
  validationFlags?: string[];
  
  reviewedBy?: string;
  reviewedAt?: string;
  reviewStatus?: ReviewStatus;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


// ============================================================
// AI CHECKPOINT
// ============================================================

export interface AICheckpoint {
  id: string;
  sessionId: string;
  
  checkpointNumber: number;
  checkpointName: string;
  checkpointDescription?: string;
  
  status: CheckpointStatus;
  
  itemsForReview: number;
  itemsApproved: number;
  itemsCorrected: number;
  
  reviewerId?: string;
  reviewStartedAt?: string;
  reviewCompletedAt?: string;
  reviewerNotes?: string;
  
  createdAt: string;
}



// ============================================================
// AI CHECKPOINT REVIEW
// ============================================================

export interface AICheckpointReview {
  id: string;
  checkpointId: string;
  takeoffItemId: string;
  
  reviewStatus: ReviewStatus;
  
  fieldCorrected?: string;
  originalValue?: string;
  correctedValue?: string;
  correctionReason?: string;
  
  reviewedBy?: string;
  reviewedAt: string;
}


// ============================================================
// AI TAKEOFF DOCUMENT
// ============================================================

export interface AITakeoffDocument {
  id: string;
  sessionId: string;
  
  documentType: 'drawing' | 'specification' | 'addendum' | 'other';
  documentName: string;
  documentNumber?: string;
  filePath?: string;
  fileUrl?: string;
  
  pagesAnalyzed?: number;
  extractionStatus?: string;
  extractionNotes?: string;
  
  createdAt: string;
}


// ============================================================
// RISK ASSESSMENT
// ============================================================

export interface RiskAssessment {
  projectComplexity: number;
  specificationClarity: number;
  marketVolatility: number;
  subcontractorAvailability: number;
  scheduleConstraints: number;
  siteConditions: number;
  regulatoryRequirements: number;
}

export interface RiskResult {
  weightedScore: number;
  level: RiskLevel;
  contingencyLow: number;
  contingencyHigh: number;
}


// ============================================================
// CREATE / UPDATE INPUTS
// ============================================================

export interface CreateTakeoffSessionInput {
  sessionName: string;
  projectId?: string;
  pursuitId?: string;
  estimateId?: string;
  regionCode?: string;
  riskAssessment?: RiskAssessment;
}

export interface UpdateTakeoffItemInput {
  csiSection?: string;
  csiTitle?: string;
  materialDescription?: string;
  quantityValue?: number;
  calculationMetric?: string;
  unitCost?: number;
  reviewStatus?: ReviewStatus;
  correctionReason?: string;
}


// ============================================================
// SUMMARY TYPES
// ============================================================

export interface TakeoffSummary {
  sessionId: string;
  sessionName: string;
  status: TakeoffStatus;
  riskLevel?: RiskLevel;
  totalLineItems: number;
  subtotalLow?: number;
  subtotalLikely?: number;
  subtotalHigh?: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  itemsRequiringReview: number;
  projectName?: string;
  pursuitName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TakeoffByTrade {
  sessionId: string;
  tradeAssignment: string;
  itemCount: number;
  totalLow?: number;
  totalLikely?: number;
  totalHigh?: number;
  avgConfidence?: number;
}

export interface TakeoffByDivision {
  sessionId: string;
  csiDivision: string;
  itemCount: number;
  totalLow?: number;
  totalLikely?: number;
  totalHigh?: number;
  avgConfidence?: number;
}


// ============================================================
// COST REGIONS
// ============================================================

export interface CostRegion {
  id: string;
  regionCode: string;
  regionName: string;
  adjustmentFactor: number;
  isActive: boolean;
}


// ============================================================
// STATUS HELPERS
// ============================================================

export const STATUS_DISPLAY: Record<TakeoffStatus, string> = {
  initialized: 'Initialized',
  agent1_running: 'Analyzing Drawings...',
  agent1_complete: 'Drawings Analyzed',
  checkpoint1_pending: 'Review: Quantities',
  agent2_running: 'Processing Specs...',
  agent2_complete: 'Specs Processed',
  checkpoint2_pending: 'Review: CSI Codes',
  pricing_running: 'Calculating Costs...',
  checkpoint3_pending: 'Review: Pricing',
  checkpoint4_pending: 'Final Approval',
  finalized: 'Complete',
  error: 'Error',
};

export const CHECKPOINT_NAMES: Record<number, string> = {
  1: 'Quantity Review',
  2: 'CSI & Spec Review',
  3: 'Pricing Review',
  4: 'Final Approval',
};
