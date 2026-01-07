import { supabase } from '@/lib/supabase';

// Types - matching your actual database schema
export interface Pursuit {
  id: string;
  workspace_id: string;  // Your DB uses workspace_id (not organization_id)
  pipeline_id?: string;
  project_id?: string;
  solicitation_number: string;
  title: string;
  description?: string;
  agency: string;
  contracting_office?: string;
  location_city?: string;
  location_state?: string;
  location_address?: string;
  estimated_value: number;
  bid_due_date: string;  // Your DB uses bid_due_date (not response_date)
  posted_date?: string;
  stage: PursuitStage;  // Your DB uses stage (not status)
  set_aside_type: string;  // Your DB uses set_aside_type (not set_aside)
  naics_code: string;
  naics_description?: string;
  psc_code?: string;
  win_probability: number;
  project_type?: string;
  contract_type?: string;
  period_of_performance?: string;
  place_of_performance?: string;
  poc_name?: string;
  poc_email?: string;
  poc_phone?: string;
  incumbent?: string;
  estimated_start_date?: string;
  bonding_required: boolean;
  security_clearance?: string;
  site_visit_date?: string;
  questions_due_date?: string;
  notes?: string;
  sam_gov_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Stage values matching your database
export type PursuitStage = 
  | 'identified' 
  | 'tracking' 
  | 'go' 
  | 'no_go' 
  | 'bidding' 
  | 'submitted' 
  | 'won' 
  | 'lost' 
  | 'cancelled';

export interface PursuitFilters {
  stage?: PursuitStage | 'all';
  agency?: string | 'all';
  set_aside_type?: string | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  workspace_id?: string;
}

export interface PursuitMetrics {
  total_pursuits: number;
  total_value: number;
  weighted_value: number;
  avg_win_rate: number;
  due_this_week: number;
  due_this_month: number;
  by_stage: Record<PursuitStage, number>;
}

export interface CreatePursuitInput {
  workspace_id: string;
  pipeline_id?: string;
  solicitation_number: string;
  title: string;
  description?: string;
  agency: string;
  contracting_office?: string;
  location_city?: string;
  location_state?: string;
  location_address?: string;
  estimated_value: number;
  bid_due_date: string;
  posted_date?: string;
  set_aside_type: string;
  naics_code: string;
  naics_description?: string;
  psc_code?: string;
  project_type?: string;
  contract_type?: string;
  period_of_performance?: string;
  place_of_performance?: string;
  poc_name?: string;
  poc_email?: string;
  poc_phone?: string;
  incumbent?: string;
  estimated_start_date?: string;
  bonding_required?: boolean;
  security_clearance?: string;
  site_visit_date?: string;
  questions_due_date?: string;
  notes?: string;
  sam_gov_url?: string;
}

export interface UpdatePursuitInput extends Partial<CreatePursuitInput> {
  stage?: PursuitStage;
  win_probability?: number;
}

export interface GoNoGoDecision {
  pursuit_id: string;
  decision: 'go' | 'no_go';
  notes?: string;
  decided_by: string;
}

// Active stages for filtering
const ACTIVE_STAGES: PursuitStage[] = ['identified', 'tracking', 'go', 'bidding', 'submitted'];

// Pursuits Service
class PursuitsService {
  /**
   * Get all pursuits with optional filtering
   */
  async getPursuits(filters?: PursuitFilters): Promise<Pursuit[]> {
    let query = supabase
      .from('pursuits')
      .select('*')
      .order('bid_due_date', { ascending: true });

    if (filters?.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id);
    }

    if (filters?.stage && filters.stage !== 'all') {
      query = query.eq('stage', filters.stage);
    }

    if (filters?.agency && filters.agency !== 'all') {
      query = query.eq('agency', filters.agency);
    }

    if (filters?.set_aside_type && filters.set_aside_type !== 'all') {
      query = query.eq('set_aside_type', filters.set_aside_type);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,solicitation_number.ilike.%${filters.search}%,agency.ilike.%${filters.search}%`
      );
    }

    if (filters?.date_from) {
      query = query.gte('bid_due_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('bid_due_date', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pursuits:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single pursuit by ID
   */
  async getPursuitById(id: string): Promise<Pursuit | null> {
    const { data, error } = await supabase
      .from('pursuits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pursuit:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new pursuit
   */
  async createPursuit(input: CreatePursuitInput): Promise<Pursuit> {
    const { data: userData } = await supabase.auth.getUser();
    
    const pursuitData = {
      ...input,
      stage: 'identified' as PursuitStage,
      win_probability: 0,
      bonding_required: input.bonding_required ?? false,
      created_by: userData.user?.id,
      updated_by: userData.user?.id,
    };

    const { data, error } = await supabase
      .from('pursuits')
      .insert(pursuitData)
      .select()
      .single();

    if (error) {
      console.error('Error creating pursuit:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an existing pursuit
   */
  async updatePursuit(id: string, input: UpdatePursuitInput): Promise<Pursuit> {
    const { data: userData } = await supabase.auth.getUser();

    const updateData = {
      ...input,
      updated_by: userData.user?.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pursuits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pursuit:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a pursuit
   */
  async deletePursuit(id: string): Promise<void> {
    const { error } = await supabase
      .from('pursuits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pursuit:', error);
      throw error;
    }
  }

  /**
   * Make a Go/No-Go decision on a pursuit
   */
  async makeGoNoGoDecision(decision: GoNoGoDecision): Promise<Pursuit> {
    const newStage: PursuitStage = decision.decision === 'go' ? 'go' : 'no_go';
    const winProbability = decision.decision === 'go' ? 30 : 0;

    // Update the pursuit
    const pursuit = await this.updatePursuit(decision.pursuit_id, {
      stage: newStage,
      win_probability: winProbability,
      notes: decision.notes,
    });

    // Log the decision
    await this.logDecision(decision);

    // If it's a "Go" decision, optionally trigger estimate creation
    if (decision.decision === 'go') {
      await this.createEstimateFromPursuit(decision.pursuit_id);
    }

    return pursuit;
  }

  /**
   * Log a Go/No-Go decision
   */
  private async logDecision(decision: GoNoGoDecision): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pursuit_decisions').insert({
      pursuit_id: decision.pursuit_id,
      decision: decision.decision,
      notes: decision.notes,
      decided_by: userData.user?.id,
      decided_by_name: userData.user?.email,
    });

    if (error) {
      console.error('Error logging decision:', error);
    }
  }

  /**
   * Create an estimate record from a pursuit (triggered on Go decision)
   */
  private async createEstimateFromPursuit(pursuitId: string): Promise<void> {
    const pursuit = await this.getPursuitById(pursuitId);
    if (!pursuit) return;

    const { data: userData } = await supabase.auth.getUser();

    // Check if estimates table exists and has the expected columns
    const estimateData = {
      pursuit_id: pursuitId,
      workspace_id: pursuit.workspace_id,
      project_id: pursuit.project_id,
      title: pursuit.title,
      status: 'draft',
      budget: pursuit.estimated_value,
      created_by: userData.user?.id,
    };

    const { error } = await supabase
      .from('estimates')
      .insert(estimateData);

    if (error) {
      console.error('Error creating estimate from pursuit:', error);
      // Don't throw - this is a side effect
    }
  }

  /**
   * Log an activity for a pursuit
   */
  async logActivity(
    pursuitId: string,
    activity: {
      type: 'stage_change' | 'note' | 'document' | 'meeting' | 'update';
      description: string;
    }
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('pursuit_activities').insert({
      pursuit_id: pursuitId,
      activity_type: activity.type,
      description: activity.description,
      user_id: userData.user?.id,
      user_name: userData.user?.email,
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get activities for a pursuit
   */
  async getActivities(pursuitId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pursuit_activities')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get pursuit metrics/dashboard data
   */
  async getMetrics(workspaceId?: string): Promise<PursuitMetrics> {
    let query = supabase.from('pursuits').select('*');
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data: pursuits } = await query;
    
    if (!pursuits) {
      return {
        total_pursuits: 0,
        total_value: 0,
        weighted_value: 0,
        avg_win_rate: 0,
        due_this_week: 0,
        due_this_month: 0,
        by_stage: {} as Record<PursuitStage, number>,
      };
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activePursuits = pursuits.filter((p) => ACTIVE_STAGES.includes(p.stage));

    const totalValue = activePursuits.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const weightedValue = activePursuits.reduce(
      (sum, p) => sum + (p.estimated_value || 0) * ((p.win_probability || 0) / 100),
      0
    );

    const wonPursuits = pursuits.filter((p) => p.stage === 'won');
    const decidedPursuits = pursuits.filter((p) => ['won', 'lost'].includes(p.stage));
    const avgWinRate = decidedPursuits.length > 0
      ? Math.round((wonPursuits.length / decidedPursuits.length) * 100)
      : 0;

    const dueThisWeek = activePursuits.filter((p) => {
      if (!p.bid_due_date) return false;
      const dueDate = new Date(p.bid_due_date);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    }).length;

    const dueThisMonth = activePursuits.filter((p) => {
      if (!p.bid_due_date) return false;
      const dueDate = new Date(p.bid_due_date);
      return dueDate >= now && dueDate <= oneMonthFromNow;
    }).length;

    const byStage = pursuits.reduce((acc, p) => {
      acc[p.stage] = (acc[p.stage] || 0) + 1;
      return acc;
    }, {} as Record<PursuitStage, number>);

    return {
      total_pursuits: activePursuits.length,
      total_value: totalValue,
      weighted_value: weightedValue,
      avg_win_rate: avgWinRate,
      due_this_week: dueThisWeek,
      due_this_month: dueThisMonth,
      by_stage: byStage,
    };
  }

  /**
   * Get unique agencies from all pursuits (for filter dropdown)
   */
  async getAgencies(workspaceId?: string): Promise<string[]> {
    let query = supabase
      .from('pursuits')
      .select('agency')
      .order('agency');

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching agencies:', error);
      return [];
    }

    const uniqueAgencies = [...new Set(data?.map((d) => d.agency).filter(Boolean) || [])];
    return uniqueAgencies;
  }

  /**
   * Get pursuits due soon
   */
  async getPursuitsDueSoon(days: number = 7, workspaceId?: string): Promise<Pursuit[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('pursuits')
      .select('*')
      .in('stage', ACTIVE_STAGES)
      .gte('bid_due_date', now.toISOString())
      .lte('bid_due_date', futureDate.toISOString())
      .order('bid_due_date', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pursuits due soon:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Calculate days until due for a pursuit
   */
  calculateDaysUntilDue(bidDueDate: string): number {
    const now = new Date();
    const due = new Date(bidDueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get team members for a pursuit
   */
  async getTeamMembers(pursuitId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pursuit_team')
      .select('*')
      .eq('pursuit_id', pursuitId);

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add team member to pursuit
   */
  async addTeamMember(pursuitId: string, member: { user_id?: string; member_name: string; role: string; is_lead?: boolean }): Promise<void> {
    const { error } = await supabase.from('pursuit_team').insert({
      pursuit_id: pursuitId,
      ...member,
    });

    if (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  /**
   * Get documents for a pursuit
   */
  async getDocuments(pursuitId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pursuit_documents')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  }
}

// Export singleton instance
export const pursuitsService = new PursuitsService();
export default pursuitsService;
