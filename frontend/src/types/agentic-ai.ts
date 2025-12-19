/**
 * OC Pipeline - Agentic AI Estimating Types
 * 
 * Type definitions for:
 * - Pricing Intelligence Agent
 * - Risk Auditor Agent
 * - Confidence Scoring (1-100%)
 * - Drawing Viewer & AI Takeoff
 * - Real-time Market Integration
 * 
 * Standards: BIGINT cents, basis points (10000 = 100%)
 */

// =====================================================
// SECTION 1: MARKET DATA & PRICING INTELLIGENCE
// =====================================================

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

export interface MarketPriceIndex {
  id: string;
  material_category: string;
  commodity_code: string | null;
  index_name: string;
  index_source: string;
  base_value: number; // BIGINT cents
  current_value: number; // BIGINT cents
  change_percent: number; // Basis points
  volatility_score: number; // 0-10000
  trend_direction: TrendDirection;
  last_updated: string;
  data_source_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketPriceHistory {
  id: string;
  index_id: string;
  recorded_value: number;
  recorded_at: string;
  source_reference: string | null;
  created_at: string;
}

export interface GeographicCostFactor {
  id: string;
  zip_code: string;
  city: string | null;
  state: string | null;
  region: string | null;
  labor_factor: number; // Basis points (10000 = 1.0x)
  material_factor: number;
  equipment_factor: number;
  general_conditions_factor: number;
  prevailing_wage_required: boolean;
  davis_bacon_rate_area: string | null;
  effective_date: string;
  expiration_date: string | null;
  data_source: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VolatilityCalculationMethod = 'historical_std' | 'market_trend' | 'fixed';

export interface VolatilityBuffer {
  id: string;
  material_category: string;
  commodity_code: string | null;
  buffer_percent: number; // Basis points
  min_buffer: number;
  max_buffer: number;
  calculation_method: VolatilityCalculationMethod;
  lookback_days: number;
  auto_adjust: boolean;
  last_calculated: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EscalationClauseType = 'material' | 'labor' | 'fuel' | 'index_based';

export interface EscalationClause {
  id: string;
  estimate_id: string;
  clause_type: EscalationClauseType;
  trigger_threshold: number; // Basis points
  max_escalation: number; // Basis points
  reference_index_id: string | null;
  base_date: string | null;
  calculation_formula: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SECTION 2: RISK AUDITOR & RED-TEAM REVIEW
// =====================================================

export interface RiskCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  default_impact_score: number;
  default_probability_score: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type RiskType = 'identified' | 'hidden_killer' | 'scope_gap' | 'market';
export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed';
export type RiskSource = 'manual' | 'ai_detected' | 'historical';
export type RiskSeverity = 'info' | 'warning' | 'critical';

export interface EstimateRiskMatrixItem {
  id: string;
  estimate_id: string;
  risk_category_id: string | null;
  risk_name: string;
  risk_description: string | null;
  risk_type: RiskType;
  impact_score: number; // 0-10000
  probability_score: number; // 0-10000
  risk_score: number; // Calculated: (impact * probability) / 10000
  cost_impact_low: number; // Cents
  cost_impact_mid: number;
  cost_impact_high: number;
  schedule_impact_days: number;
  mitigation_strategy: string | null;
  mitigation_cost: number;
  contingency_recommended: number; // Basis points
  owner_id: string | null;
  status: RiskStatus;
  source: RiskSource;
  ai_confidence: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  risk_category?: RiskCategory;
}

export interface HistoricalBenchmark {
  id: string;
  csi_code: string | null;
  material_description: string | null;
  project_type: string | null;
  region: string | null;
  unit_of_measure: string | null;
  avg_unit_cost: number; // Cents
  min_unit_cost: number | null;
  max_unit_cost: number | null;
  std_deviation: number | null;
  sample_count: number;
  won_bid_avg: number | null;
  lost_bid_avg: number | null;
  last_updated: string;
  data_source: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DeviationAlertType = 'price_high' | 'price_low' | 'quantity_anomaly' | 'scope_gap';

export interface DeviationAlert {
  id: string;
  estimate_id: string;
  line_item_id: string | null;
  benchmark_id: string | null;
  alert_type: DeviationAlertType;
  deviation_percent: number; // Basis points
  threshold_percent: number;
  current_value: number;
  benchmark_value: number;
  severity: RiskSeverity;
  ai_explanation: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export type RedTeamReviewType = 'standard' | 'comprehensive' | 'quick';
export type RedTeamReviewStatus = 'pending' | 'in_progress' | 'completed';

export interface RedTeamReviewFinding {
  category: string;
  severity: RiskSeverity;
  description: string;
  recommendation: string;
  estimated_impact: number;
}

export interface RedTeamReview {
  id: string;
  estimate_id: string;
  review_type: RedTeamReviewType;
  initiated_by: string | null;
  status: RedTeamReviewStatus;
  overall_risk_score: number; // 0-10000
  total_risks_identified: number;
  critical_risks_count: number;
  hidden_killers_count: number;
  scope_gaps_count: number;
  price_anomalies_count: number;
  recommended_contingency: number; // Basis points
  executive_summary: string | null;
  detailed_findings: RedTeamReviewFinding[];
  ai_model_version: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SECTION 3: CONFIDENCE SCORING
// =====================================================

export interface ConfidenceFactorBreakdown {
  factor_name: string;
  score: number;
  weight: number;
  notes: string;
}

export interface LowConfidenceItem {
  line_item_id: string;
  description: string;
  confidence: number;
  reason: string;
}

export interface ConfidenceRecommendation {
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  potential_impact: string;
}

export interface EstimateConfidenceScore {
  id: string;
  estimate_id: string;
  overall_confidence: number; // 0-10000 (display as 0-100%)
  data_completeness_score: number;
  pricing_accuracy_score: number;
  scope_coverage_score: number;
  historical_alignment_score: number;
  market_data_freshness_score: number;
  risk_assessment_score: number;
  factors_breakdown: ConfidenceFactorBreakdown[];
  low_confidence_items: LowConfidenceItem[];
  recommendations: ConfidenceRecommendation[];
  calculated_at: string;
  ai_model_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItemDataSource {
  type: 'drawing' | 'specification' | 'historical' | 'market' | 'manual';
  reference: string;
  confidence: number;
}

export interface LineItemFlag {
  type: 'missing_source' | 'low_confidence' | 'price_deviation' | 'quantity_estimate';
  message: string;
  severity: RiskSeverity;
}

export interface LineItemConfidenceScore {
  id: string;
  line_item_id: string;
  confidence_score: number;
  quantity_confidence: number;
  unit_cost_confidence: number;
  source_reliability: number;
  basis_of_estimate: string | null;
  data_sources: LineItemDataSource[];
  flags: LineItemFlag[];
  ai_notes: string | null;
  calculated_at: string;
  created_at: string;
}

// =====================================================
// SECTION 4: DRAWING VIEWER & AI TAKEOFF
// =====================================================

export type DocumentType = 'drawing' | 'specification' | 'addendum' | 'rfi' | 'schedule';
export type DocumentCategory = 'architectural' | 'structural' | 'mep' | 'civil' | 'general';
export type ProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'error';
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProjectDocument {
  id: string;
  estimate_id: string | null;
  project_id: string | null;
  document_type: DocumentType;
  document_category: DocumentCategory | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  page_count: number;
  upload_status: ProcessingStatus;
  ocr_status: OcrStatus;
  ai_processed: boolean;
  version_number: number;
  revision_id: string | null;
  revision_date: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  // Related
  sheets?: DrawingSheet[];
}

export type SheetType = 'plan' | 'elevation' | 'section' | 'detail' | 'schedule';
export type Discipline = 'A' | 'S' | 'M' | 'E' | 'P' | 'C' | 'L' | 'G';

export interface DrawingSheet {
  id: string;
  document_id: string;
  sheet_number: string;
  sheet_name: string | null;
  sheet_type: SheetType | null;
  discipline: Discipline | null;
  page_index: number;
  scale: string | null;
  scale_factor: number | null;
  width_pixels: number | null;
  height_pixels: number | null;
  thumbnail_path: string | null;
  processed_image_path: string | null;
  ai_extraction_status: ProcessingStatus;
  extraction_confidence: number;
  created_at: string;
  updated_at: string;
  // Related
  takeoff_elements?: AITakeoffElement[];
  annotations?: TakeoffAnnotation[];
}

export type ElementType = 'wall' | 'door' | 'window' | 'fixture' | 'area' | 'linear' | 'count' | 'volume';
export type CalculationMethod = 'area' | 'linear' | 'count' | 'volume';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Polygon {
  points: Array<{ x: number; y: number }>;
}

export interface RawMeasurement {
  type: 'length' | 'area' | 'count';
  value: number;
  unit: string;
  points?: Array<{ x: number; y: number }>;
}

export interface AITakeoffElement {
  id: string;
  sheet_id: string;
  estimate_id: string | null;
  element_type: ElementType;
  element_subtype: string | null;
  csi_code: string | null;
  material_description: string | null;
  quantity: number;
  unit_of_measure: string;
  calculation_method: CalculationMethod | null;
  raw_measurement: RawMeasurement | null;
  coordinates: BoundingBox | Polygon | null;
  grid_reference: string | null;
  layer_name: string | null;
  detection_confidence: number; // 0-10000
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  linked_line_item_id: string | null;
  ai_model_version: string | null;
  extraction_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AnnotationType = 'correction' | 'addition' | 'deletion' | 'note' | 'highlight';

export interface TakeoffAnnotation {
  id: string;
  sheet_id: string;
  takeoff_element_id: string | null;
  annotation_type: AnnotationType;
  coordinates: BoundingBox | Polygon;
  content: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SECTION 5: SCOPE INTELLIGENCE
// =====================================================

export type InvisibleScopeType = 'fastener' | 'coating' | 'prep' | 'tool' | 'accessory' | 'misc';
export type DetectionSource = 'ai' | 'rule_based' | 'manual';

export interface InvisibleScopeItem {
  id: string;
  estimate_id: string;
  parent_line_item_id: string | null;
  scope_type: InvisibleScopeType;
  item_description: string;
  csi_code: string | null;
  estimated_quantity: number | null;
  unit_of_measure: string | null;
  estimated_unit_cost: number | null; // Cents
  estimated_total_cost: number | null;
  calculation_basis: string | null;
  detection_source: DetectionSource;
  confidence_score: number;
  included_in_estimate: boolean;
  linked_line_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DiscrepancyType = 'quantity_mismatch' | 'spec_conflict' | 'missing_detail' | 'ambiguous';
export type ResolutionStatus = 'open' | 'rfi_generated' | 'resolved' | 'accepted';

export interface DocumentDiscrepancy {
  id: string;
  estimate_id: string;
  discrepancy_type: DiscrepancyType;
  severity: RiskSeverity;
  drawing_reference: string | null;
  spec_reference: string | null;
  description: string;
  drawing_states: string | null;
  spec_states: string | null;
  recommended_action: string | null;
  resolution_status: ResolutionStatus;
  rfi_number: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  ai_detected: boolean;
  created_at: string;
  updated_at: string;
}

export type RFIPriority = 'low' | 'normal' | 'high' | 'critical';
export type RFIStatus = 'draft' | 'submitted' | 'answered' | 'closed';

export interface ReferencedDocument {
  document_id: string;
  document_name: string;
  page_number?: number;
  section?: string;
}

export interface GeneratedRFI {
  id: string;
  estimate_id: string;
  discrepancy_id: string | null;
  rfi_number: string;
  subject: string;
  question: string;
  background_context: string | null;
  referenced_documents: ReferencedDocument[];
  suggested_resolution: string | null;
  priority: RFIPriority;
  status: RFIStatus;
  submitted_date: string | null;
  response_due_date: string | null;
  response_received_date: string | null;
  response_text: string | null;
  cost_impact: number;
  schedule_impact_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SECTION 6: AGENT INTERFACES
// =====================================================

/**
 * Pricing Intelligence Agent
 * Market synthesis, geographic costs, volatility buffers
 */
export interface PricingIntelligenceInput {
  estimate_id: string;
  line_items: Array<{
    id: string;
    csi_code: string;
    material_category: string;
    base_unit_cost: number;
    quantity: number;
  }>;
  project_location: {
    zip_code: string;
    state: string;
  };
  project_duration_months: number;
}

export interface PricingIntelligenceOutput {
  adjusted_line_items: Array<{
    line_item_id: string;
    original_unit_cost: number;
    geographic_adjustment: number;
    volatility_buffer: number;
    adjusted_unit_cost: number;
    adjustment_breakdown: {
      geographic_factor: number;
      volatility_factor: number;
      escalation_factor: number;
    };
  }>;
  market_alerts: Array<{
    material_category: string;
    alert_type: 'price_spike' | 'supply_shortage' | 'lead_time_increase';
    message: string;
    severity: RiskSeverity;
  }>;
  escalation_recommendations: Array<{
    clause_type: EscalationClauseType;
    trigger_threshold: number;
    max_escalation: number;
    rationale: string;
  }>;
  total_adjustment_impact: number;
}

/**
 * Risk Auditor Agent
 * Red-team review, historical mirroring, deviation detection
 */
export interface RiskAuditorInput {
  estimate_id: string;
  review_type: RedTeamReviewType;
  include_historical_comparison: boolean;
  deviation_threshold: number; // Basis points (default 1500 = 15%)
}

export interface RiskAuditorOutput {
  review_id: string;
  overall_risk_score: number;
  risk_rating: 'low' | 'medium' | 'high' | 'critical';
  risks_identified: EstimateRiskMatrixItem[];
  hidden_killers: Array<{
    risk_name: string;
    description: string;
    potential_impact: number;
    probability: number;
    mitigation: string;
  }>;
  scope_gaps: Array<{
    description: string;
    missing_items: string[];
    estimated_cost: number;
  }>;
  price_anomalies: DeviationAlert[];
  recommended_contingency: number;
  executive_summary: string;
  action_items: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    responsible_party: string;
    due_date: string;
  }>;
}

/**
 * Scope Scout Agent
 * Inference of omissions, invisible scope detection
 */
export interface ScopScoutInput {
  estimate_id: string;
  line_items: Array<{
    id: string;
    csi_code: string;
    description: string;
    quantity: number;
    unit_of_measure: string;
  }>;
  project_type: string;
  specifications_text?: string;
}

export interface ScopeScoutOutput {
  invisible_scope_items: InvisibleScopeItem[];
  document_discrepancies: DocumentDiscrepancy[];
  generated_rfis: GeneratedRFI[];
  scope_coverage_score: number;
  recommendations: string[];
}

/**
 * AI Takeoff Agent
 * Drawing analysis, quantity extraction
 */
export interface AITakeoffInput {
  document_id: string;
  sheet_ids?: string[];
  target_elements?: ElementType[];
  csi_filter?: string[];
}

export interface AITakeoffOutput {
  takeoff_elements: AITakeoffElement[];
  extraction_summary: {
    total_elements: number;
    by_type: Record<ElementType, number>;
    by_csi: Record<string, number>;
    average_confidence: number;
    low_confidence_count: number;
  };
  processing_time_ms: number;
  model_version: string;
}

// =====================================================
// SECTION 7: API REQUEST/RESPONSE TYPES
// =====================================================

export interface MarketDataFilters {
  material_category?: string;
  commodity_code?: string;
  is_active?: boolean;
}

export interface RiskMatrixFilters {
  estimate_id: string;
  risk_type?: RiskType;
  status?: RiskStatus;
  severity?: RiskSeverity;
}

export interface TakeoffFilters {
  sheet_id?: string;
  estimate_id?: string;
  element_type?: ElementType;
  verified?: boolean;
  min_confidence?: number;
}

export interface ConfidenceScoreRequest {
  estimate_id: string;
  recalculate?: boolean;
}

export interface ApplyGeographicAdjustmentRequest {
  estimate_id: string;
  zip_code: string;
  apply_to_all_items?: boolean;
  line_item_ids?: string[];
}

export interface RunRedTeamReviewRequest {
  estimate_id: string;
  review_type: RedTeamReviewType;
  include_historical: boolean;
}

export interface ProcessDocumentRequest {
  document_id: string;
  run_ocr?: boolean;
  run_takeoff?: boolean;
  target_sheets?: number[];
}

// =====================================================
// SECTION 8: DISPLAY HELPERS
// =====================================================

/**
 * Convert basis points to percentage display
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}

/**
 * Convert percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Format confidence score as percentage string
 */
export function formatConfidence(score: number): string {
  return `${(score / 100).toFixed(1)}%`;
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (score >= 8000) return 'high';
  if (score >= 6000) return 'medium';
  if (score >= 4000) return 'low';
  return 'very_low';
}

/**
 * Get confidence color class
 */
export function getConfidenceColor(score: number): string {
  if (score >= 8000) return 'text-green-600 bg-green-50';
  if (score >= 6000) return 'text-blue-600 bg-blue-50';
  if (score >= 4000) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

/**
 * Get risk severity color class
 */
export function getRiskSeverityColor(severity: RiskSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-700 bg-red-100';
    case 'warning': return 'text-yellow-700 bg-yellow-100';
    case 'info': return 'text-blue-700 bg-blue-100';
    default: return 'text-gray-700 bg-gray-100';
  }
}

/**
 * Get trend direction icon
 */
export function getTrendIcon(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'volatile': return '↕';
    default: return '→';
  }
}

/**
 * Get trend color class
 */
export function getTrendColor(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return 'text-red-600';
    case 'down': return 'text-green-600';
    case 'volatile': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
}
