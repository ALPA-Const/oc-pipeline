// ============================================================
// OC PIPELINE - ESTIMATING SERVICE
// Updated to match actual Supabase database schema
// ============================================================

import { supabase } from '@/lib/supabase';
import type {
  Estimate,
  EstimateItem,
  BidPackage,
  BidInvitation,
  BidResponse,
  Takeoff,
  Pursuit,
  EstimateFilters,
  BidPackageFilters,
  PursuitFilters,
  EstimatingSummary,
} from '@/types/estimating.types';

// ============================================================
// DATABASE MAPPERS - Match actual Supabase column names
// ============================================================

/**
 * Maps database estimate row to frontend Estimate type
 * DB uses: workspace_id, base_cost, total_cost, bid_price
 */
function mapDbEstimate(db: any): Estimate {
  return {
    id: db.id,
    orgId: db.workspace_id,
    pursuitId: db.pursuit_id,
    projectId: db.project_id,
    name: db.name,
    version: parseInt(db.version) || 1,
    description: db.notes, // DB uses 'notes' instead of 'description'
    subtotal: parseFloat(db.base_cost) || 0,
    overheadPercent: parseFloat(db.overhead_percent) || 0,
    overheadAmount: parseFloat(db.overhead_amount) || 0,
    profitPercent: parseFloat(db.profit_percent) || 0,
    profitAmount: parseFloat(db.profit_amount) || 0,
    contingencyPercent: parseFloat(db.contingency_percent) || 0,
    contingencyAmount: parseFloat(db.contingency_amount) || 0,
    total: parseFloat(db.total_cost) || parseFloat(db.bid_price) || 0,
    status: db.status || 'draft',
    isBaseline: false, // Not in DB schema
    assumptions: db.metadata?.assumptions,
    exclusions: db.metadata?.exclusions,
    notes: db.notes,
    createdBy: db.created_by,
    approvedBy: db.approved_by,
    approvedAt: db.approved_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}


/**
 * Maps database estimate_lines row to frontend EstimateItem type
 * DB uses: csi_code, csi_division, sort_order, is_assembly
 */
function mapDbEstimateItem(db: any): EstimateItem {
  return {
    id: db.id,
    estimateId: db.estimate_id,
    parentId: db.parent_id,
    costCode: db.csi_code,
    description: db.description,
    unit: db.unit,
    quantity: parseFloat(db.quantity) || 0,
    unitCost: parseFloat(db.unit_cost) || 0,
    totalCost: parseFloat(db.total_cost) || 0,
    laborHours: 0,
    laborRate: 0,
    laborCost: parseFloat(db.labor_cost) || 0,
    materialCost: parseFloat(db.material_cost) || 0,
    equipmentCost: parseFloat(db.equipment_cost) || 0,
    subcontractorCost: parseFloat(db.subcontractor_cost) || 0,
    otherCost: parseFloat(db.other_cost) || 0,
    orderIndex: db.sort_order || 0,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Maps database bid_packages row to frontend BidPackage type
 */
function mapDbBidPackage(db: any): BidPackage {
  return {
    id: db.id,
    orgId: db.workspace_id,
    pursuitId: db.pursuit_id,
    projectId: db.project_id,
    name: db.name,
    trade: db.trade,
    csiDivision: db.csi_division,
    description: db.notes,
    scopeOfWork: db.scope_of_work,
    budgetAmount: parseFloat(db.budget_amount) || undefined,
    issueDate: db.issue_date,
    dueDate: db.due_date,
    preBidDate: db.pre_bid_date,
    awardDate: db.award_date,
    status: db.status || 'draft',
    awardedVendorId: db.awarded_vendor_id,
    awardedVendorName: db.awarded_vendor_name,
    awardedAmount: parseFloat(db.awarded_amount) || undefined,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    invitationCount: db.invitation_count,
    responseCount: db.response_count,
  };
}


/**
 * Maps database pursuits row to frontend Pursuit type
 */
function mapDbPursuit(db: any): Pursuit {
  const location = db.location || {};
  return {
    id: db.id,
    orgId: db.workspace_id,
    name: db.name,
    code: db.solicitation_number,
    description: db.notes,
    clientName: db.agency,
    clientAgency: db.contracting_office,
    clientContactName: db.key_personnel?.[0]?.name,
    clientContactEmail: db.key_personnel?.[0]?.email,
    clientContactPhone: db.key_personnel?.[0]?.phone,
    addressStreet: location.street,
    addressCity: location.city,
    addressState: location.state,
    addressZip: location.zip,
    latitude: location.latitude,
    longitude: location.longitude,
    estimatedValue: parseFloat(db.estimated_value) || undefined,
    lowValue: undefined,
    highValue: undefined,
    projectType: db.competition_type,
    deliveryMethod: db.contract_type,
    contractType: db.contract_type,
    setAsideType: db.set_aside_type,
    naicsCode: db.naics_code,
    magnitude: undefined,
    stageId: db.stage,
    stageName: db.stage,
    stageEnteredAt: undefined,
    winProbability: parseFloat(db.win_probability) || undefined,
    solicitationDate: undefined,
    dueDate: db.bid_due_date,
    decisionDate: db.go_no_go_date,
    startDate: undefined,
    outcome: db.go_no_go_decision === 'go' ? undefined : 
             db.go_no_go_decision === 'no-go' ? 'no_bid' : undefined,
    outcomeDate: undefined,
    outcomeReason: db.go_no_go_notes,
    awardedTo: undefined,
    awardedAmount: undefined,
    isJv: false,
    jvPartner: undefined,
    jvPercentage: undefined,
    status: 'active',
    priority: 'medium',
    source: db.source,
    sourceUrl: db.source_url,
    notes: db.notes,
    customFields: db.metadata,
    createdBy: db.created_by,
    assignedTo: undefined,
    assignedToName: undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Maps database takeoffs row to frontend Takeoff type
 */
function mapDbTakeoff(db: any): Takeoff {
  return {
    id: db.id,
    orgId: db.workspace_id,
    estimateId: db.estimate_id,
    name: db.name,
    description: db.item_description,
    sourceFileId: db.source_file_id,
    sourceFileName: db.source_file_name,
    sourcePage: db.source_page,
    item: db.item_description || db.name,
    quantity: parseFloat(db.quantity) || 0,
    unit: db.unit,
    location: db.location,
    area: db.area,
    notes: db.notes,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Maps database bid_responses row to frontend BidResponse type
 */
function mapDbBidResponse(db: any): BidResponse {
  return {
    id: db.id,
    bidInvitationId: db.bid_invitation_id,
    bidPackageId: db.bid_package_id,
    vendorId: db.vendor_id,
    vendorName: db.vendor_name,
    baseBid: parseFloat(db.base_amount) || undefined,
    alternateBids: db.alternate_amounts || [],
    totalBid: parseFloat(db.total_amount) || undefined,
    exclusions: db.exclusions,
    clarifications: db.clarifications,
    status: db.status || 'submitted',
    isSelected: db.status === 'accepted',
    score: parseFloat(db.evaluation_score) || undefined,
    evaluationNotes: db.evaluation_notes,
    submittedAt: db.received_at,
    evaluatedBy: undefined,
    evaluatedAt: undefined,
    createdAt: db.created_at,
  };
}



// ============================================================
// ESTIMATING SERVICE CLASS
// ============================================================

export class EstimatingService {
  
  // ---------- PURSUITS ----------

  async fetchPursuits(filters?: PursuitFilters): Promise<Pursuit[]> {
    try {
      let query = supabase.from('pursuits').select('*');

      if (filters?.status?.length) {
        query = query.in('stage', filters.status);
      }
      if (filters?.stageId?.length) {
        query = query.in('stage', filters.stageId);
      }
      if (filters?.setAsideType?.length) {
        query = query.in('set_aside_type', filters.setAsideType);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,agency.ilike.%${filters.search}%`);
      }
      if (filters?.valueRange?.min) {
        query = query.gte('estimated_value', filters.valueRange.min);
      }
      if (filters?.valueRange?.max) {
        query = query.lte('estimated_value', filters.valueRange.max);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbPursuit);
    } catch (error) {
      console.error('Error fetching pursuits:', error);
      throw error;
    }
  }

  async fetchPursuitById(id: string): Promise<Pursuit | null> {
    try {
      const { data, error } = await supabase
        .from('pursuits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapDbPursuit(data) : null;
    } catch (error) {
      console.error('Error fetching pursuit:', error);
      throw error;
    }
  }

  async createPursuit(pursuit: Partial<Pursuit>): Promise<Pursuit> {
    try {
      const { data, error } = await supabase
        .from('pursuits')
        .insert({
          name: pursuit.name,
          solicitation_number: pursuit.code,
          agency: pursuit.clientName,
          contracting_office: pursuit.clientAgency,
          estimated_value: pursuit.estimatedValue,
          set_aside_type: pursuit.setAsideType,
          naics_code: pursuit.naicsCode,
          bid_due_date: pursuit.dueDate,
          stage: 'identification',
          win_probability: pursuit.winProbability || 50,
          notes: pursuit.notes,
          location: {
            city: pursuit.addressCity,
            state: pursuit.addressState,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbPursuit(data);
    } catch (error) {
      console.error('Error creating pursuit:', error);
      throw error;
    }
  }


  async updatePursuit(id: string, updates: Partial<Pursuit>): Promise<Pursuit> {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.code !== undefined) dbUpdates.solicitation_number = updates.code;
      if (updates.clientName !== undefined) dbUpdates.agency = updates.clientName;
      if (updates.clientAgency !== undefined) dbUpdates.contracting_office = updates.clientAgency;
      if (updates.estimatedValue !== undefined) dbUpdates.estimated_value = updates.estimatedValue;
      if (updates.setAsideType !== undefined) dbUpdates.set_aside_type = updates.setAsideType;
      if (updates.naicsCode !== undefined) dbUpdates.naics_code = updates.naicsCode;
      if (updates.dueDate !== undefined) dbUpdates.bid_due_date = updates.dueDate;
      if (updates.stageId !== undefined) dbUpdates.stage = updates.stageId;
      if (updates.winProbability !== undefined) dbUpdates.win_probability = updates.winProbability;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('pursuits')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbPursuit(data);
    } catch (error) {
      console.error('Error updating pursuit:', error);
      throw error;
    }
  }

  async deletePursuit(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pursuits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pursuit:', error);
      throw error;
    }
  }


  // ---------- ESTIMATES ----------

  async fetchEstimates(filters?: EstimateFilters): Promise<Estimate[]> {
    try {
      let query = supabase.from('estimates').select('*');

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.pursuitId) {
        query = query.eq('pursuit_id', filters.pursuitId);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbEstimate);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      throw error;
    }
  }

  async fetchEstimateById(id: string): Promise<Estimate | null> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapDbEstimate(data) : null;
    } catch (error) {
      console.error('Error fetching estimate:', error);
      throw error;
    }
  }


  async createEstimate(estimate: Partial<Estimate>): Promise<Estimate> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .insert({
          pursuit_id: estimate.pursuitId,
          project_id: estimate.projectId,
          name: estimate.name,
          estimate_type: 'conceptual',
          version: '1',
          base_cost: estimate.subtotal || 0,
          overhead_percent: estimate.overheadPercent || 0,
          profit_percent: estimate.profitPercent || 0,
          contingency_percent: estimate.contingencyPercent || 0,
          status: estimate.status || 'draft',
          notes: estimate.notes,
          metadata: {
            assumptions: estimate.assumptions,
            exclusions: estimate.exclusions,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbEstimate(data);
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw error;
    }
  }

  async updateEstimate(id: string, updates: Partial<Estimate>): Promise<Estimate> {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.subtotal !== undefined) dbUpdates.base_cost = updates.subtotal;
      if (updates.overheadPercent !== undefined) dbUpdates.overhead_percent = updates.overheadPercent;
      if (updates.overheadAmount !== undefined) dbUpdates.overhead_amount = updates.overheadAmount;
      if (updates.profitPercent !== undefined) dbUpdates.profit_percent = updates.profitPercent;
      if (updates.profitAmount !== undefined) dbUpdates.profit_amount = updates.profitAmount;
      if (updates.contingencyPercent !== undefined) dbUpdates.contingency_percent = updates.contingencyPercent;
      if (updates.contingencyAmount !== undefined) dbUpdates.contingency_amount = updates.contingencyAmount;
      if (updates.total !== undefined) dbUpdates.total_cost = updates.total;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('estimates')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbEstimate(data);
    } catch (error) {
      console.error('Error updating estimate:', error);
      throw error;
    }
  }

  async deleteEstimate(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('estimates').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting estimate:', error);
      throw error;
    }
  }



  // ---------- ESTIMATE ITEMS (estimate_lines table) ----------

  async fetchEstimateItems(estimateId: string): Promise<EstimateItem[]> {
    try {
      const { data, error } = await supabase
        .from('estimate_lines')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbEstimateItem);
    } catch (error) {
      console.error('Error fetching estimate items:', error);
      throw error;
    }
  }

  async createEstimateItem(item: Partial<EstimateItem>): Promise<EstimateItem> {
    try {
      const totalCost = (item.quantity || 0) * (item.unitCost || 0);
      
      const { data, error } = await supabase
        .from('estimate_lines')
        .insert({
          estimate_id: item.estimateId,
          parent_id: item.parentId,
          csi_code: item.costCode,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity || 0,
          unit_cost: item.unitCost || 0,
          total_cost: totalCost,
          labor_cost: item.laborCost || 0,
          material_cost: item.materialCost || 0,
          equipment_cost: item.equipmentCost || 0,
          subcontractor_cost: item.subcontractorCost || 0,
          other_cost: item.otherCost || 0,
          sort_order: item.orderIndex || 0,
          is_assembly: false,
          notes: item.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbEstimateItem(data);
    } catch (error) {
      console.error('Error creating estimate item:', error);
      throw error;
    }
  }

  async updateEstimateItem(id: string, updates: Partial<EstimateItem>): Promise<EstimateItem> {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.costCode !== undefined) dbUpdates.csi_code = updates.costCode;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unitCost !== undefined) dbUpdates.unit_cost = updates.unitCost;
      if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
      if (updates.laborCost !== undefined) dbUpdates.labor_cost = updates.laborCost;
      if (updates.materialCost !== undefined) dbUpdates.material_cost = updates.materialCost;
      if (updates.equipmentCost !== undefined) dbUpdates.equipment_cost = updates.equipmentCost;
      if (updates.subcontractorCost !== undefined) dbUpdates.subcontractor_cost = updates.subcontractorCost;
      if (updates.otherCost !== undefined) dbUpdates.other_cost = updates.otherCost;
      if (updates.orderIndex !== undefined) dbUpdates.sort_order = updates.orderIndex;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('estimate_lines')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbEstimateItem(data);
    } catch (error) {
      console.error('Error updating estimate item:', error);
      throw error;
    }
  }

  async deleteEstimateItem(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('estimate_lines').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting estimate item:', error);
      throw error;
    }
  }



  // ---------- BID PACKAGES ----------

  async fetchBidPackages(filters?: BidPackageFilters): Promise<BidPackage[]> {
    try {
      let query = supabase.from('bid_packages').select('*');

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.trade?.length) {
        query = query.in('trade', filters.trade);
      }
      if (filters?.pursuitId) {
        query = query.eq('pursuit_id', filters.pursuitId);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbBidPackage);
    } catch (error) {
      console.error('Error fetching bid packages:', error);
      throw error;
    }
  }

  async fetchBidPackageById(id: string): Promise<BidPackage | null> {
    try {
      const { data, error } = await supabase
        .from('bid_packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapDbBidPackage(data) : null;
    } catch (error) {
      console.error('Error fetching bid package:', error);
      throw error;
    }
  }

  async createBidPackage(bidPackage: Partial<BidPackage>): Promise<BidPackage> {
    try {
      const { data, error } = await supabase
        .from('bid_packages')
        .insert({
          pursuit_id: bidPackage.pursuitId,
          project_id: bidPackage.projectId,
          name: bidPackage.name,
          trade: bidPackage.trade,
          csi_division: bidPackage.csiDivision,
          scope_of_work: bidPackage.scopeOfWork,
          budget_amount: bidPackage.budgetAmount,
          issue_date: bidPackage.issueDate,
          due_date: bidPackage.dueDate,
          pre_bid_date: bidPackage.preBidDate,
          status: bidPackage.status || 'draft',
          notes: bidPackage.description,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbBidPackage(data);
    } catch (error) {
      console.error('Error creating bid package:', error);
      throw error;
    }
  }


  async updateBidPackage(id: string, updates: Partial<BidPackage>): Promise<BidPackage> {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.trade !== undefined) dbUpdates.trade = updates.trade;
      if (updates.csiDivision !== undefined) dbUpdates.csi_division = updates.csiDivision;
      if (updates.scopeOfWork !== undefined) dbUpdates.scope_of_work = updates.scopeOfWork;
      if (updates.budgetAmount !== undefined) dbUpdates.budget_amount = updates.budgetAmount;
      if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.preBidDate !== undefined) dbUpdates.pre_bid_date = updates.preBidDate;
      if (updates.awardDate !== undefined) dbUpdates.award_date = updates.awardDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.awardedVendorId !== undefined) dbUpdates.awarded_vendor_id = updates.awardedVendorId;
      if (updates.awardedVendorName !== undefined) dbUpdates.awarded_vendor_name = updates.awardedVendorName;
      if (updates.awardedAmount !== undefined) dbUpdates.awarded_amount = updates.awardedAmount;

      const { data, error } = await supabase
        .from('bid_packages')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbBidPackage(data);
    } catch (error) {
      console.error('Error updating bid package:', error);
      throw error;
    }
  }

  async deleteBidPackage(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('bid_packages').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bid package:', error);
      throw error;
    }
  }


  // ---------- BID RESPONSES ----------

  async fetchBidResponses(bidPackageId: string): Promise<BidResponse[]> {
    try {
      const { data, error } = await supabase
        .from('bid_responses')
        .select('*')
        .eq('bid_package_id', bidPackageId)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbBidResponse);
    } catch (error) {
      console.error('Error fetching bid responses:', error);
      throw error;
    }
  }

  async createBidResponse(response: Partial<BidResponse>): Promise<BidResponse> {
    try {
      const { data, error } = await supabase
        .from('bid_responses')
        .insert({
          bid_package_id: response.bidPackageId,
          bid_invitation_id: response.bidInvitationId,
          vendor_id: response.vendorId,
          vendor_name: response.vendorName,
          base_amount: response.baseBid,
          alternate_amounts: response.alternateBids,
          total_amount: response.totalBid,
          exclusions: response.exclusions,
          clarifications: response.clarifications,
          status: response.status || 'received',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbBidResponse(data);
    } catch (error) {
      console.error('Error creating bid response:', error);
      throw error;
    }
  }



  // ---------- TAKEOFFS ----------

  async fetchTakeoffs(estimateId?: string): Promise<Takeoff[]> {
    try {
      let query = supabase.from('takeoffs').select('*');
      
      if (estimateId) {
        query = query.eq('estimate_id', estimateId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbTakeoff);
    } catch (error) {
      console.error('Error fetching takeoffs:', error);
      throw error;
    }
  }

  async createTakeoff(takeoff: Partial<Takeoff>): Promise<Takeoff> {
    try {
      const { data, error } = await supabase
        .from('takeoffs')
        .insert({
          estimate_id: takeoff.estimateId,
          name: takeoff.name,
          item_description: takeoff.item || takeoff.description,
          source_file_id: takeoff.sourceFileId,
          source_file_name: takeoff.sourceFileName,
          source_page: takeoff.sourcePage,
          quantity: takeoff.quantity,
          unit: takeoff.unit,
          location: takeoff.location,
          area: takeoff.area,
          notes: takeoff.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbTakeoff(data);
    } catch (error) {
      console.error('Error creating takeoff:', error);
      throw error;
    }
  }

  async deleteTakeoff(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('takeoffs').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting takeoff:', error);
      throw error;
    }
  }



  // ---------- SUMMARY / ANALYTICS ----------

  async getEstimatingSummary(): Promise<EstimatingSummary> {
    try {
      const { data: pursuits, error: pursuitsError } = await supabase
        .from('pursuits')
        .select('*');

      if (pursuitsError) throw pursuitsError;

      const activePursuits = (pursuits || []).filter(p => 
        !['won', 'lost', 'no-go', 'cancelled'].includes(p.go_no_go_decision || '')
      );
      const wonPursuits = (pursuits || []).filter(p => p.go_no_go_decision === 'won');
      const decidedPursuits = (pursuits || []).filter(p => 
        p.go_no_go_decision && p.go_no_go_decision !== 'pending'
      );
      
      const totalPipelineValue = activePursuits.reduce(
        (sum, p) => sum + (parseFloat(p.estimated_value) || 0), 
        0
      );
      
      const weightedPipelineValue = activePursuits.reduce(
        (sum, p) => sum + ((parseFloat(p.estimated_value) || 0) * ((parseFloat(p.win_probability) || 0) / 100)), 
        0
      );

      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const upcomingDeadlines = activePursuits.filter(p => {
        if (!p.bid_due_date) return false;
        const due = new Date(p.bid_due_date);
        return due >= now && due <= twoWeeks;
      }).length;

      const { data: bidPackages } = await supabase
        .from('bid_packages')
        .select('id')
        .in('status', ['draft', 'issued', 'bidding']);

      return {
        totalPursuits: (pursuits || []).length,
        activePursuits: activePursuits.length,
        totalPipelineValue,
        weightedPipelineValue,
        winRate: decidedPursuits.length > 0 ? (wonPursuits.length / decidedPursuits.length) * 100 : 0,
        averageBidValue: activePursuits.length > 0 ? totalPipelineValue / activePursuits.length : 0,
        upcomingDeadlines,
        pendingBids: (bidPackages || []).length,
      };
    } catch (error) {
      console.error('Error fetching estimating summary:', error);
      throw error;
    }
  }


  // ---------- RECALCULATE ESTIMATE TOTALS ----------

  async recalculateEstimateTotals(estimateId: string): Promise<Estimate> {
    try {
      const items = await this.fetchEstimateItems(estimateId);
      const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
      
      const estimate = await this.fetchEstimateById(estimateId);
      if (!estimate) throw new Error('Estimate not found');
      
      const overheadAmount = subtotal * (estimate.overheadPercent / 100);
      const profitAmount = (subtotal + overheadAmount) * (estimate.profitPercent / 100);
      const contingencyAmount = subtotal * (estimate.contingencyPercent / 100);
      const total = subtotal + overheadAmount + profitAmount + contingencyAmount;
      
      return this.updateEstimate(estimateId, {
        subtotal,
        overheadAmount,
        profitAmount,
        contingencyAmount,
        total,
      });
    } catch (error) {
      console.error('Error recalculating estimate:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const estimatingService = new EstimatingService();
