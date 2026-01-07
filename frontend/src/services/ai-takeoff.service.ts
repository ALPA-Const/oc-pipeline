// ============================================================
// OC PIPELINE - AI TAKEOFF SERVICE
// Elite Agentic AI Estimator Integration
// ============================================================

import { supabase } from '@/lib/supabase';
import type {
  AITakeoffSession,
  AITakeoffItem,
  AICheckpoint,
  AICheckpointReview,
  AITakeoffDocument,
  CostRegion,
  TakeoffSummary,
  TakeoffByTrade,
  CreateTakeoffSessionInput,
  UpdateTakeoffItemInput,
  RiskAssessment,
  RiskResult,
  TakeoffStatus,
  RiskLevel,
} from '@/types/ai-takeoff.types';

// ============================================================
// DATABASE MAPPERS
// ============================================================

function mapDbSession(db: any): AITakeoffSession {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    projectId: db.project_id,
    pursuitId: db.pursuit_id,
    estimateId: db.estimate_id,
    sessionName: db.session_name,
    status: db.status as TakeoffStatus,
    regionCode: db.region_code || 'MIDWEST',
    riskProjectComplexity: db.risk_project_complexity,
    riskSpecificationClarity: db.risk_specification_clarity,
    riskMarketVolatility: db.risk_market_volatility,
    riskSubcontractorAvailability: db.risk_subcontractor_availability,
    riskScheduleConstraints: db.risk_schedule_constraints,
    riskSiteConditions: db.risk_site_conditions,
    riskRegulatoryRequirements: db.risk_regulatory_requirements,
    riskWeightedScore: db.risk_weighted_score,
    riskLevel: db.risk_level as RiskLevel,
    contingencyPercentLow: db.contingency_percent_low,
    contingencyPercentHigh: db.contingency_percent_high,
    totalLineItems: db.total_line_items || 0,
    subtotalLow: db.subtotal_low,
    subtotalLikely: db.subtotal_likely,
    subtotalHigh: db.subtotal_high,
    agent1Version: db.agent1_version,
    agent2Version: db.agent2_version,
    orchestratorVersion: db.orchestrator_version,
    startedAt: db.started_at,
    completedAt: db.completed_at,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}


function mapDbItem(db: any): AITakeoffItem {
  return {
    id: db.id,
    sessionId: db.session_id,
    workspaceId: db.workspace_id,
    csiSection: db.csi_section,
    csiTitle: db.csi_title,
    tradeAssignment: db.trade_assignment,
    materialDescription: db.material_description,
    quantityValue: parseFloat(db.quantity_value) || 0,
    calculationMetric: db.calculation_metric,
    drawingNumber: db.drawing_number,
    specSection: db.spec_section,
    specPage: db.spec_page,
    sourceNotes: db.source_notes,
    confidenceLevel: db.confidence_level,
    confidenceScore: db.confidence_score,
    confidenceReasons: db.confidence_reasons || [],
    confidenceFactors: db.confidence_factors || {},
    unitCost: db.unit_cost,
    costLow: db.cost_low,
    costLikely: db.cost_likely,
    costHigh: db.cost_high,
    costSource: db.cost_source,
    regionalFactor: db.regional_factor,
    escalationFactor: db.escalation_factor,
    requiresReview: db.requires_review || false,
    reviewReason: db.review_reason,
    validationFlags: db.validation_flags || [],
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at,
    reviewStatus: db.review_status,
    createdBy: db.created_by || 'AGENTIC_AI',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}


function mapDbCheckpoint(db: any): AICheckpoint {
  return {
    id: db.id,
    sessionId: db.session_id,
    checkpointNumber: db.checkpoint_number,
    checkpointName: db.checkpoint_name,
    checkpointDescription: db.checkpoint_description,
    status: db.status,
    itemsForReview: db.items_for_review || 0,
    itemsApproved: db.items_approved || 0,
    itemsCorrected: db.items_corrected || 0,
    reviewerId: db.reviewer_id,
    reviewStartedAt: db.review_started_at,
    reviewCompletedAt: db.review_completed_at,
    reviewerNotes: db.reviewer_notes,
    createdAt: db.created_at,
  };
}

function mapDbDocument(db: any): AITakeoffDocument {
  return {
    id: db.id,
    sessionId: db.session_id,
    documentType: db.document_type,
    documentName: db.document_name,
    documentNumber: db.document_number,
    filePath: db.file_path,
    fileUrl: db.file_url,
    pagesAnalyzed: db.pages_analyzed,
    extractionStatus: db.extraction_status,
    extractionNotes: db.extraction_notes,
    createdAt: db.created_at,
  };
}

function mapDbRegion(db: any): CostRegion {
  return {
    id: db.id,
    regionCode: db.region_code,
    regionName: db.region_name,
    adjustmentFactor: parseFloat(db.adjustment_factor) || 1,
    isActive: db.is_active,
  };
}



// ============================================================
// RISK CALCULATOR
// ============================================================

function calculateRisk(assessment: RiskAssessment): RiskResult {
  const weights = {
    projectComplexity: 0.20,
    specificationClarity: 0.15,
    marketVolatility: 0.15,
    subcontractorAvailability: 0.15,
    scheduleConstraints: 0.15,
    siteConditions: 0.10,
    regulatoryRequirements: 0.10,
  };

  const weightedScore =
    assessment.projectComplexity * weights.projectComplexity +
    assessment.specificationClarity * weights.specificationClarity +
    assessment.marketVolatility * weights.marketVolatility +
    assessment.subcontractorAvailability * weights.subcontractorAvailability +
    assessment.scheduleConstraints * weights.scheduleConstraints +
    assessment.siteConditions * weights.siteConditions +
    assessment.regulatoryRequirements * weights.regulatoryRequirements;

  let level: RiskLevel;
  let contingencyLow: number;
  let contingencyHigh: number;

  if (weightedScore <= 3) {
    level = 'LOW';
    contingencyLow = 0.03;
    contingencyHigh = 0.05;
  } else if (weightedScore <= 6) {
    level = 'MEDIUM';
    contingencyLow = 0.05;
    contingencyHigh = 0.10;
  } else {
    level = 'HIGH';
    contingencyLow = 0.10;
    contingencyHigh = 0.20;
  }

  return { weightedScore, level, contingencyLow, contingencyHigh };
}



// ============================================================
// AI TAKEOFF SERVICE CLASS
// ============================================================

export class AITakeoffService {

  // ---------- SESSIONS ----------

  async fetchSessions(filters?: { status?: TakeoffStatus; pursuitId?: string; projectId?: string }): Promise<AITakeoffSession[]> {
    try {
      let query = supabase.from('ai_takeoff_sessions').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.pursuitId) {
        query = query.eq('pursuit_id', filters.pursuitId);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbSession);
    } catch (error) {
      console.error('Error fetching AI takeoff sessions:', error);
      throw error;
    }
  }

  async fetchSessionById(id: string): Promise<AITakeoffSession | null> {
    try {
      const { data, error } = await supabase
        .from('ai_takeoff_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapDbSession(data) : null;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }


  async createSession(input: CreateTakeoffSessionInput): Promise<AITakeoffSession> {
    try {
      const insertData: Record<string, any> = {
        session_name: input.sessionName,
        project_id: input.projectId,
        pursuit_id: input.pursuitId,
        estimate_id: input.estimateId,
        region_code: input.regionCode || 'MIDWEST',
        status: 'initialized',
      };

      // Calculate risk if provided
      if (input.riskAssessment) {
        const risk = calculateRisk(input.riskAssessment);
        insertData.risk_project_complexity = input.riskAssessment.projectComplexity;
        insertData.risk_specification_clarity = input.riskAssessment.specificationClarity;
        insertData.risk_market_volatility = input.riskAssessment.marketVolatility;
        insertData.risk_subcontractor_availability = input.riskAssessment.subcontractorAvailability;
        insertData.risk_schedule_constraints = input.riskAssessment.scheduleConstraints;
        insertData.risk_site_conditions = input.riskAssessment.siteConditions;
        insertData.risk_regulatory_requirements = input.riskAssessment.regulatoryRequirements;
        insertData.risk_weighted_score = risk.weightedScore;
        insertData.risk_level = risk.level;
        insertData.contingency_percent_low = risk.contingencyLow;
        insertData.contingency_percent_high = risk.contingencyHigh;
      }

      const { data, error } = await supabase
        .from('ai_takeoff_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Create the 4 checkpoints
      await this.createCheckpoints(data.id);

      return mapDbSession(data);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  private async createCheckpoints(sessionId: string): Promise<void> {
    const checkpoints = [
      { checkpoint_number: 1, checkpoint_name: 'Quantity Review', checkpoint_description: 'Review AI-extracted quantities from drawings' },
      { checkpoint_number: 2, checkpoint_name: 'CSI & Spec Review', checkpoint_description: 'Review CSI code assignments and spec references' },
      { checkpoint_number: 3, checkpoint_name: 'Pricing Review', checkpoint_description: 'Review unit costs and cost sources' },
      { checkpoint_number: 4, checkpoint_name: 'Final Approval', checkpoint_description: 'Final review before estimate finalization' },
    ];

    for (const cp of checkpoints) {
      await supabase.from('ai_checkpoints').insert({
        session_id: sessionId,
        ...cp,
        status: 'pending',
      });
    }
  }


  async updateSessionStatus(id: string, status: TakeoffStatus): Promise<AITakeoffSession> {
    try {
      const updates: Record<string, any> = { status };
      
      if (status === 'agent1_running') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'finalized') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('ai_takeoff_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbSession(data);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_takeoff_sessions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }



  // ---------- LINE ITEMS ----------

  async fetchItems(sessionId: string, filters?: { requiresReview?: boolean; confidenceLevel?: string }): Promise<AITakeoffItem[]> {
    try {
      let query = supabase
        .from('ai_takeoff_items')
        .select('*')
        .eq('session_id', sessionId);

      if (filters?.requiresReview !== undefined) {
        query = query.eq('requires_review', filters.requiresReview);
      }
      if (filters?.confidenceLevel) {
        query = query.eq('confidence_level', filters.confidenceLevel);
      }

      const { data, error } = await query.order('csi_section', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbItem);
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async updateItem(id: string, updates: UpdateTakeoffItemInput): Promise<AITakeoffItem> {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.csiSection !== undefined) dbUpdates.csi_section = updates.csiSection;
      if (updates.csiTitle !== undefined) dbUpdates.csi_title = updates.csiTitle;
      if (updates.materialDescription !== undefined) dbUpdates.material_description = updates.materialDescription;
      if (updates.quantityValue !== undefined) dbUpdates.quantity_value = updates.quantityValue;
      if (updates.calculationMetric !== undefined) dbUpdates.calculation_metric = updates.calculationMetric;
      if (updates.unitCost !== undefined) dbUpdates.unit_cost = updates.unitCost;
      if (updates.reviewStatus !== undefined) {
        dbUpdates.review_status = updates.reviewStatus;
        dbUpdates.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('ai_takeoff_items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbItem(data);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }


  // ---------- CHECKPOINTS ----------

  async fetchCheckpoints(sessionId: string): Promise<AICheckpoint[]> {
    try {
      const { data, error } = await supabase
        .from('ai_checkpoints')
        .select('*')
        .eq('session_id', sessionId)
        .order('checkpoint_number', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbCheckpoint);
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      throw error;
    }
  }

  async approveCheckpoint(checkpointId: string, notes?: string): Promise<AICheckpoint> {
    try {
      const { data, error } = await supabase
        .from('ai_checkpoints')
        .update({
          status: 'approved',
          review_completed_at: new Date().toISOString(),
          reviewer_notes: notes,
        })
        .eq('id', checkpointId)
        .select()
        .single();

      if (error) throw error;
      return mapDbCheckpoint(data);
    } catch (error) {
      console.error('Error approving checkpoint:', error);
      throw error;
    }
  }




  // ---------- DOCUMENTS ----------

  async fetchDocuments(sessionId: string): Promise<AITakeoffDocument[]> {
    try {
      const { data, error } = await supabase
        .from('ai_takeoff_documents')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbDocument);
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async addDocument(sessionId: string, doc: Partial<AITakeoffDocument>): Promise<AITakeoffDocument> {
    try {
      const { data, error } = await supabase
        .from('ai_takeoff_documents')
        .insert({
          session_id: sessionId,
          document_type: doc.documentType,
          document_name: doc.documentName,
          document_number: doc.documentNumber,
          file_path: doc.filePath,
          file_url: doc.fileUrl,
          extraction_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbDocument(data);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }


  // ---------- REGIONS ----------

  async fetchRegions(): Promise<CostRegion[]> {
    try {
      const { data, error } = await supabase
        .from('cost_regions')
        .select('*')
        .eq('is_active', true)
        .order('region_name', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbRegion);
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }



  // ---------- SUMMARY / ANALYTICS ----------

  async getSessionSummary(sessionId: string): Promise<TakeoffSummary | null> {
    try {
      // Use the view for summary
      const { data, error } = await supabase
        .from('v_takeoff_summary')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        // View might not exist, fallback to manual query
        const session = await this.fetchSessionById(sessionId);
        if (!session) return null;
        
        const items = await this.fetchItems(sessionId);
        
        return {
          sessionId: session.id,
          sessionName: session.sessionName,
          status: session.status,
          riskLevel: session.riskLevel,
          totalLineItems: items.length,
          subtotalLow: session.subtotalLow,
          subtotalLikely: session.subtotalLikely,
          subtotalHigh: session.subtotalHigh,
          highConfidenceCount: items.filter(i => i.confidenceLevel === 'HIGH').length,
          mediumConfidenceCount: items.filter(i => i.confidenceLevel === 'MEDIUM').length,
          lowConfidenceCount: items.filter(i => i.confidenceLevel === 'LOW').length,
          itemsRequiringReview: items.filter(i => i.requiresReview).length,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
        };
      }

      return {
        sessionId: data.session_id,
        sessionName: data.session_name,
        status: data.status,
        riskLevel: data.risk_level,
        totalLineItems: data.total_line_items || 0,
        subtotalLow: data.subtotal_low,
        subtotalLikely: data.subtotal_likely,
        subtotalHigh: data.subtotal_high,
        highConfidenceCount: data.high_confidence_count || 0,
        mediumConfidenceCount: data.medium_confidence_count || 0,
        lowConfidenceCount: data.low_confidence_count || 0,
        itemsRequiringReview: data.items_requiring_review || 0,
        projectName: data.project_name,
        pursuitName: data.pursuit_name,
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  async getItemsByTrade(sessionId: string): Promise<TakeoffByTrade[]> {
    try {
      const { data, error } = await supabase
        .from('v_takeoff_by_trade')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      return (data || []).map(d => ({
        sessionId: d.session_id,
        tradeAssignment: d.trade_assignment,
        itemCount: d.item_count,
        totalLow: d.total_low,
        totalLikely: d.total_likely,
        totalHigh: d.total_high,
        avgConfidence: d.avg_confidence,
      }));
    } catch (error) {
      console.error('Error fetching by trade:', error);
      throw error;
    }
  }



  // ---------- IMPORT TO ESTIMATE ----------

  async importToEstimate(sessionId: string, estimateId: string): Promise<void> {
    try {
      const items = await this.fetchItems(sessionId);
      
      const estimateLines = items.map((item, index) => ({
        estimate_id: estimateId,
        csi_code: item.csiSection,
        description: item.materialDescription || item.csiTitle,
        quantity: item.quantityValue,
        unit: item.calculationMetric,
        unit_cost: item.unitCost || 0,
        total_cost: item.costLikely || 0,
        sort_order: index,
        notes: `AI Takeoff: ${item.drawingNumber || ''} | Confidence: ${item.confidenceLevel}`,
      }));

      const { error } = await supabase
        .from('estimate_lines')
        .insert(estimateLines);

      if (error) throw error;

      // Update session with estimate link
      await supabase
        .from('ai_takeoff_sessions')
        .update({ estimate_id: estimateId })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error importing to estimate:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiTakeoffService = new AITakeoffService();
