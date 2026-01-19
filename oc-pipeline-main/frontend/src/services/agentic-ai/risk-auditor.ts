/**
 * OC Pipeline - Risk Auditor Agent API
 * 
 * Red-team review, historical mirroring, ±15% deviation detection,
 * hidden killers identification
 */

import { supabase } from '../../lib/supabase';
import Decimal from 'decimal.js-light';
import type {
  RiskCategory,
  EstimateRiskMatrixItem,
  HistoricalBenchmark,
  DeviationAlert,
  RedTeamReview,
  RiskMatrixFilters,
  RiskAuditorInput,
  RiskAuditorOutput,
  RiskType,
  RiskStatus,
  RiskSeverity,
  RedTeamReviewType,
  DeviationAlertType,
} from '../types/agentic-ai';

// =====================================================
// RISK CATEGORIES
// =====================================================

export const riskCategoryApi = {
  /**
   * List all risk categories
   */
  async list(): Promise<RiskCategory[]> {
    const { data, error } = await supabase
      .from('risk_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get risk category by code
   */
  async getByCode(code: string): Promise<RiskCategory | null> {
    const { data, error } = await supabase
      .from('risk_categories')
      .select('*')
      .eq('category_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

// =====================================================
// ESTIMATE RISK MATRIX
// =====================================================

export const riskMatrixApi = {
  /**
   * Get risk matrix for an estimate
   */
  async getByEstimate(estimateId: string, filters?: Partial<RiskMatrixFilters>): Promise<EstimateRiskMatrixItem[]> {
    let query = supabase
      .from('estimate_risk_matrix')
      .select(`
        *,
        risk_category:risk_categories(*)
      `)
      .eq('estimate_id', estimateId);

    if (filters?.risk_type) {
      query = query.eq('risk_type', filters.risk_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity) {
      // Filter by risk_score ranges based on severity
      if (filters.severity === 'critical') {
        query = query.gte('risk_score', 7000);
      } else if (filters.severity === 'warning') {
        query = query.gte('risk_score', 4000).lt('risk_score', 7000);
      }
    }

    const { data, error } = await query.order('risk_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a risk item
   */
  async create(
    risk: Omit<EstimateRiskMatrixItem, 'id' | 'risk_score' | 'created_at' | 'updated_at' | 'risk_category'>
  ): Promise<EstimateRiskMatrixItem> {
    const { data, error } = await supabase
      .from('estimate_risk_matrix')
      .insert(risk)
      .select(`
        *,
        risk_category:risk_categories(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a risk item
   */
  async update(
    id: string,
    updates: Partial<EstimateRiskMatrixItem>
  ): Promise<EstimateRiskMatrixItem> {
    const { data, error } = await supabase
      .from('estimate_risk_matrix')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        risk_category:risk_categories(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get hidden killers for an estimate
   */
  async getHiddenKillers(estimateId: string): Promise<EstimateRiskMatrixItem[]> {
    return this.getByEstimate(estimateId, { risk_type: 'hidden_killer' });
  },

  /**
   * Get scope gaps for an estimate
   */
  async getScopeGaps(estimateId: string): Promise<EstimateRiskMatrixItem[]> {
    return this.getByEstimate(estimateId, { risk_type: 'scope_gap' });
  },

  /**
   * Calculate total risk exposure
   */
  async calculateExposure(estimateId: string): Promise<{
    total_exposure_low: number;
    total_exposure_mid: number;
    total_exposure_high: number;
    recommended_contingency: number;
  }> {
    const risks = await this.getByEstimate(estimateId, { status: 'open' });

    const totals = risks.reduce(
      (acc, risk) => ({
        low: acc.low + (risk.cost_impact_low || 0),
        mid: acc.mid + (risk.cost_impact_mid || 0),
        high: acc.high + (risk.cost_impact_high || 0),
        contingency: acc.contingency + (risk.contingency_recommended || 0),
      }),
      { low: 0, mid: 0, high: 0, contingency: 0 }
    );

    // Average contingency recommendation
    const avgContingency = risks.length > 0
      ? Math.round(totals.contingency / risks.length)
      : 0;

    return {
      total_exposure_low: totals.low,
      total_exposure_mid: totals.mid,
      total_exposure_high: totals.high,
      recommended_contingency: Math.max(avgContingency, 500), // Minimum 5%
    };
  },
};

// =====================================================
// HISTORICAL BENCHMARKS
// =====================================================

export const benchmarkApi = {
  /**
   * Get benchmark for a CSI code
   */
  async getByCsiCode(
    csiCode: string,
    unitOfMeasure?: string
  ): Promise<HistoricalBenchmark | null> {
    let query = supabase
      .from('historical_benchmarks')
      .select('*')
      .eq('csi_code', csiCode)
      .eq('is_active', true);

    if (unitOfMeasure) {
      query = query.eq('unit_of_measure', unitOfMeasure);
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * List all benchmarks
   */
  async list(filters?: {
    project_type?: string;
    region?: string;
  }): Promise<HistoricalBenchmark[]> {
    let query = supabase
      .from('historical_benchmarks')
      .select('*')
      .eq('is_active', true);

    if (filters?.project_type) {
      query = query.eq('project_type', filters.project_type);
    }
    if (filters?.region) {
      query = query.eq('region', filters.region);
    }

    const { data, error } = await query.order('csi_code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update benchmark from completed estimate
   */
  async updateFromEstimate(
    estimateId: string,
    wonOrLost: 'won' | 'lost'
  ): Promise<number> {
    // Get line items from estimate
    const { data: lineItems, error } = await supabase
      .from('line_items')
      .select(`
        *,
        csi_code:csi_codes(code)
      `)
      .eq('estimate_id', estimateId);

    if (error) throw error;

    let updatedCount = 0;

    for (const item of lineItems || []) {
      if (!item.csi_code?.code) continue;

      const existing = await this.getByCsiCode(
        item.csi_code.code,
        item.unit_of_measure
      );

      if (existing) {
        // Update existing benchmark
        const newSampleCount = existing.sample_count + 1;
        const newAvg = new Decimal(existing.avg_unit_cost)
          .times(existing.sample_count)
          .plus(item.unit_cost)
          .div(newSampleCount)
          .round()
          .toNumber();

        const updates: Partial<HistoricalBenchmark> = {
          avg_unit_cost: newAvg,
          sample_count: newSampleCount,
          min_unit_cost: Math.min(existing.min_unit_cost || item.unit_cost, item.unit_cost),
          max_unit_cost: Math.max(existing.max_unit_cost || item.unit_cost, item.unit_cost),
          last_updated: new Date().toISOString(),
        };

        if (wonOrLost === 'won') {
          updates.won_bid_avg = existing.won_bid_avg
            ? Math.round((existing.won_bid_avg + item.unit_cost) / 2)
            : item.unit_cost;
        } else {
          updates.lost_bid_avg = existing.lost_bid_avg
            ? Math.round((existing.lost_bid_avg + item.unit_cost) / 2)
            : item.unit_cost;
        }

        await supabase
          .from('historical_benchmarks')
          .update(updates)
          .eq('id', existing.id);

        updatedCount++;
      } else {
        // Create new benchmark
        await supabase.from('historical_benchmarks').insert({
          csi_code: item.csi_code.code,
          material_description: item.description,
          unit_of_measure: item.unit_of_measure,
          avg_unit_cost: item.unit_cost,
          min_unit_cost: item.unit_cost,
          max_unit_cost: item.unit_cost,
          sample_count: 1,
          won_bid_avg: wonOrLost === 'won' ? item.unit_cost : null,
          lost_bid_avg: wonOrLost === 'lost' ? item.unit_cost : null,
        });

        updatedCount++;
      }
    }

    return updatedCount;
  },
};

// =====================================================
// DEVIATION ALERTS
// =====================================================

export const deviationAlertApi = {
  /**
   * Get alerts for an estimate
   */
  async getByEstimate(estimateId: string): Promise<DeviationAlert[]> {
    const { data, error } = await supabase
      .from('deviation_alerts')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledged(estimateId: string): Promise<DeviationAlert[]> {
    const { data, error } = await supabase
      .from('deviation_alerts')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('is_acknowledged', false)
      .order('severity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Acknowledge an alert
   */
  async acknowledge(
    alertId: string,
    userId: string,
    notes?: string
  ): Promise<DeviationAlert> {
    const { data, error } = await supabase
      .from('deviation_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check for price deviations (±15% threshold)
   */
  async checkDeviations(
    estimateId: string,
    thresholdBasisPoints: number = 1500
  ): Promise<DeviationAlert[]> {
    // Get line items with CSI codes
    const { data: lineItems, error } = await supabase
      .from('line_items')
      .select(`
        *,
        csi_code:csi_codes(code)
      `)
      .eq('estimate_id', estimateId);

    if (error) throw error;

    const alerts: DeviationAlert[] = [];

    for (const item of lineItems || []) {
      if (!item.csi_code?.code) continue;

      const benchmark = await benchmarkApi.getByCsiCode(
        item.csi_code.code,
        item.unit_of_measure
      );

      if (!benchmark || benchmark.avg_unit_cost === 0) continue;

      // Calculate deviation in basis points
      const deviation = new Decimal(item.unit_cost)
        .minus(benchmark.avg_unit_cost)
        .div(benchmark.avg_unit_cost)
        .times(10000)
        .round()
        .toNumber();

      // Check if exceeds threshold
      if (Math.abs(deviation) > thresholdBasisPoints) {
        const alertType: DeviationAlertType = deviation > 0 ? 'price_high' : 'price_low';
        const severity: RiskSeverity = Math.abs(deviation) > 3000 ? 'critical' : 'warning';

        // Check if alert already exists
        const { data: existing } = await supabase
          .from('deviation_alerts')
          .select('id')
          .eq('estimate_id', estimateId)
          .eq('line_item_id', item.id)
          .eq('alert_type', alertType)
          .single();

        if (!existing) {
          const { data: newAlert, error: insertError } = await supabase
            .from('deviation_alerts')
            .insert({
              estimate_id: estimateId,
              line_item_id: item.id,
              benchmark_id: benchmark.id,
              alert_type: alertType,
              deviation_percent: deviation,
              threshold_percent: thresholdBasisPoints,
              current_value: item.unit_cost,
              benchmark_value: benchmark.avg_unit_cost,
              severity,
              ai_explanation: `Unit cost of $${(item.unit_cost / 100).toFixed(2)} deviates ${(Math.abs(deviation) / 100).toFixed(1)}% from historical average of $${(benchmark.avg_unit_cost / 100).toFixed(2)}. ${
                deviation > 0
                  ? 'Consider reviewing pricing or documenting justification.'
                  : 'Price may be too aggressive - verify completeness of scope.'
              }`,
            })
            .select()
            .single();

          if (!insertError && newAlert) {
            alerts.push(newAlert);
          }
        }
      }
    }

    return alerts;
  },
};

// =====================================================
// RED TEAM REVIEWS
// =====================================================

export const redTeamReviewApi = {
  /**
   * Get reviews for an estimate
   */
  async getByEstimate(estimateId: string): Promise<RedTeamReview[]> {
    const { data, error } = await supabase
      .from('red_team_reviews')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get latest completed review
   */
  async getLatestCompleted(estimateId: string): Promise<RedTeamReview | null> {
    const { data, error } = await supabase
      .from('red_team_reviews')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Start a new review
   */
  async startReview(
    estimateId: string,
    reviewType: RedTeamReviewType,
    userId: string
  ): Promise<RedTeamReview> {
    const { data, error } = await supabase
      .from('red_team_reviews')
      .insert({
        estimate_id: estimateId,
        review_type: reviewType,
        initiated_by: userId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Complete a review
   */
  async completeReview(
    reviewId: string,
    results: Partial<RedTeamReview>
  ): Promise<RedTeamReview> {
    const { data, error } = await supabase
      .from('red_team_reviews')
      .update({
        ...results,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// =====================================================
// RISK AUDITOR AGENT
// =====================================================

export const riskAuditorAgent = {
  /**
   * Run full risk audit (Red-Team Review)
   */
  async runAudit(input: RiskAuditorInput): Promise<RiskAuditorOutput> {
    const { estimate_id, review_type, include_historical_comparison, deviation_threshold } = input;

    // Start the review
    const review = await redTeamReviewApi.startReview(
      estimate_id,
      review_type,
      'system' // AI-initiated
    );

    // 1. Check for price deviations
    const deviationAlerts = await deviationAlertApi.checkDeviations(
      estimate_id,
      deviation_threshold
    );

    // 2. Get existing risks
    const existingRisks = await riskMatrixApi.getByEstimate(estimate_id);

    // 3. Identify hidden killers
    const hiddenKillers = await this.identifyHiddenKillers(estimate_id);

    // 4. Detect scope gaps
    const scopeGaps = await this.detectScopeGaps(estimate_id);

    // 5. Calculate overall risk score
    const criticalCount = existingRisks.filter(r => r.risk_score >= 7000).length + 
      deviationAlerts.filter(a => a.severity === 'critical').length;
    const warningCount = existingRisks.filter(r => r.risk_score >= 4000 && r.risk_score < 7000).length +
      deviationAlerts.filter(a => a.severity === 'warning').length;

    const overallRiskScore = Math.min(
      10000,
      criticalCount * 1500 + warningCount * 500 + hiddenKillers.length * 1000 + scopeGaps.length * 800
    );

    // 6. Calculate recommended contingency
    const exposure = await riskMatrixApi.calculateExposure(estimate_id);
    const recommendedContingency = Math.max(
      exposure.recommended_contingency,
      overallRiskScore > 7000 ? 1000 : overallRiskScore > 4000 ? 750 : 500
    );

    // 7. Generate executive summary
    const riskRating = overallRiskScore >= 7000 ? 'critical' :
      overallRiskScore >= 4000 ? 'high' :
      overallRiskScore >= 2000 ? 'medium' : 'low';

    const executiveSummary = this.generateExecutiveSummary({
      riskRating,
      criticalCount,
      hiddenKillerCount: hiddenKillers.length,
      scopeGapCount: scopeGaps.length,
      priceAnomalyCount: deviationAlerts.length,
      recommendedContingency,
    });

    // 8. Generate action items
    const actionItems = this.generateActionItems({
      hiddenKillers,
      scopeGaps,
      deviationAlerts,
      existingRisks,
    });

    // 9. Complete the review
    await redTeamReviewApi.completeReview(review.id, {
      overall_risk_score: overallRiskScore,
      total_risks_identified: existingRisks.length + hiddenKillers.length,
      critical_risks_count: criticalCount,
      hidden_killers_count: hiddenKillers.length,
      scope_gaps_count: scopeGaps.length,
      price_anomalies_count: deviationAlerts.length,
      recommended_contingency: recommendedContingency,
      executive_summary: executiveSummary,
      detailed_findings: [
        ...hiddenKillers.map(hk => ({
          category: 'Hidden Killer',
          severity: 'critical' as RiskSeverity,
          description: hk.risk_name,
          recommendation: hk.mitigation_strategy || 'Review and mitigate',
          estimated_impact: hk.cost_impact_mid,
        })),
        ...scopeGaps.map(sg => ({
          category: 'Scope Gap',
          severity: 'warning' as RiskSeverity,
          description: sg.description,
          recommendation: 'Add missing scope items',
          estimated_impact: sg.estimated_cost,
        })),
      ],
      ai_model_version: 'oc-pipeline-risk-auditor-v1.0',
    });

    return {
      review_id: review.id,
      overall_risk_score: overallRiskScore,
      risk_rating: riskRating,
      risks_identified: existingRisks,
      hidden_killers: hiddenKillers,
      scope_gaps: scopeGaps,
      price_anomalies: deviationAlerts,
      recommended_contingency: recommendedContingency,
      executive_summary: executiveSummary,
      action_items: actionItems,
    };
  },

  /**
   * Identify hidden killers (high-impact, often-missed risks)
   */
  async identifyHiddenKillers(estimateId: string): Promise<Array<{
    risk_name: string;
    description: string;
    potential_impact: number;
    probability: number;
    mitigation: string;
  }>> {
    const hiddenKillers: Array<{
      risk_name: string;
      description: string;
      potential_impact: number;
      probability: number;
      mitigation: string;
    }> = [];

    // Get estimate details
    const { data: estimate } = await supabase
      .from('estimates')
      .select('*, line_items(*)')
      .eq('id', estimateId)
      .single();

    if (!estimate) return hiddenKillers;

    // Check for common hidden killers

    // 1. Liquidated Damages (if not addressed in markups)
    const { data: markups } = await supabase
      .from('markups')
      .select('*')
      .eq('estimate_id', estimateId)
      .ilike('name', '%liquidated%');

    if (!markups || markups.length === 0) {
      hiddenKillers.push({
        risk_name: 'Liquidated Damages Not Addressed',
        description: 'No provision for liquidated damages found in estimate. Federal contracts often include significant LD clauses.',
        potential_impact: Math.round(estimate.total_cost * 0.05), // 5% of total
        probability: 3000, // 30%
        mitigation: 'Review contract for LD terms and add appropriate contingency or schedule buffer.',
      });
    }

    // 2. Bonding Costs (if estimate is large)
    if (estimate.total_cost > 50000000) { // > $500K
      const { data: bondingMarkup } = await supabase
        .from('markups')
        .select('*')
        .eq('estimate_id', estimateId)
        .ilike('name', '%bond%');

      if (!bondingMarkup || bondingMarkup.length === 0) {
        hiddenKillers.push({
          risk_name: 'Bonding Costs Not Included',
          description: 'Large contract value but no bonding costs identified. Federal projects typically require performance and payment bonds.',
          potential_impact: Math.round(estimate.total_cost * 0.02), // ~2% for bonding
          probability: 8000, // 80%
          mitigation: 'Add bonding costs at approximately 1.5-2.5% of contract value.',
        });
      }
    }

    // 3. Prevailing Wage Verification
    if (estimate.project_type === 'federal') {
      hiddenKillers.push({
        risk_name: 'Davis-Bacon Compliance Verification',
        description: 'Federal project requires Davis-Bacon prevailing wage rates. Labor rates should be verified against current DOL wage determinations.',
        potential_impact: Math.round(estimate.total_cost * 0.03), // 3% potential impact
        probability: 4000, // 40%
        mitigation: 'Verify all labor rates against current DOL wage determination for project location.',
      });
    }

    // 4. Mobilization/Demobilization
    const { data: mobilization } = await supabase
      .from('line_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .or('description.ilike.%mobilization%,description.ilike.%demob%');

    if (!mobilization || mobilization.length === 0) {
      hiddenKillers.push({
        risk_name: 'Mobilization/Demobilization Not Addressed',
        description: 'No mobilization or demobilization costs identified. These are often required as separate CLINs in federal contracts.',
        potential_impact: Math.round(estimate.total_cost * 0.025), // 2.5%
        probability: 6000, // 60%
        mitigation: 'Add mobilization/demobilization line items per solicitation requirements.',
      });
    }

    // Create risk matrix entries for each hidden killer
    for (const hk of hiddenKillers) {
      const hiddenCategory = await riskCategoryApi.getByCode('HIDDEN');
      
      await riskMatrixApi.create({
        estimate_id: estimateId,
        risk_category_id: hiddenCategory?.id || null,
        risk_name: hk.risk_name,
        risk_description: hk.description,
        risk_type: 'hidden_killer',
        impact_score: 8000,
        probability_score: hk.probability,
        cost_impact_low: Math.round(hk.potential_impact * 0.5),
        cost_impact_mid: hk.potential_impact,
        cost_impact_high: Math.round(hk.potential_impact * 1.5),
        schedule_impact_days: 0,
        mitigation_strategy: hk.mitigation,
        mitigation_cost: 0,
        contingency_recommended: 500,
        owner_id: null,
        status: 'open',
        source: 'ai_detected',
        ai_confidence: 7500,
      });
    }

    return hiddenKillers;
  },

  /**
   * Detect scope gaps
   */
  async detectScopeGaps(estimateId: string): Promise<Array<{
    description: string;
    missing_items: string[];
    estimated_cost: number;
  }>> {
    const scopeGaps: Array<{
      description: string;
      missing_items: string[];
      estimated_cost: number;
    }> = [];

    // Get existing invisible scope items
    const { data: invisibleScope } = await supabase
      .from('invisible_scope_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('included_in_estimate', false);

    if (invisibleScope && invisibleScope.length > 0) {
      const totalMissingCost = invisibleScope.reduce(
        (sum, item) => sum + (item.estimated_total_cost || 0),
        0
      );

      scopeGaps.push({
        description: `${invisibleScope.length} invisible scope items detected but not included in estimate`,
        missing_items: invisibleScope.map(i => i.item_description),
        estimated_cost: totalMissingCost,
      });
    }

    return scopeGaps;
  },

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(params: {
    riskRating: string;
    criticalCount: number;
    hiddenKillerCount: number;
    scopeGapCount: number;
    priceAnomalyCount: number;
    recommendedContingency: number;
  }): string {
    const { riskRating, criticalCount, hiddenKillerCount, scopeGapCount, priceAnomalyCount, recommendedContingency } = params;

    return `
**Risk Assessment: ${riskRating.toUpperCase()}**

This estimate has undergone automated Red-Team Review analysis. 

**Key Findings:**
- ${criticalCount} critical risk${criticalCount !== 1 ? 's' : ''} identified requiring immediate attention
- ${hiddenKillerCount} potential "Hidden Killer${hiddenKillerCount !== 1 ? 's' : ''}" detected
- ${scopeGapCount} scope gap${scopeGapCount !== 1 ? 's' : ''} identified
- ${priceAnomalyCount} pricing anomal${priceAnomalyCount !== 1 ? 'ies' : 'y'} flagged (±15% from benchmarks)

**Recommendation:**
A contingency of ${(recommendedContingency / 100).toFixed(1)}% is recommended based on the identified risk profile.

${riskRating === 'critical' || riskRating === 'high' 
  ? '⚠️ This estimate requires senior management review before submission.' 
  : '✓ Risk profile is within acceptable parameters.'}
    `.trim();
  },

  /**
   * Generate action items
   */
  generateActionItems(params: {
    hiddenKillers: Array<{ risk_name: string; mitigation: string }>;
    scopeGaps: Array<{ description: string }>;
    deviationAlerts: DeviationAlert[];
    existingRisks: EstimateRiskMatrixItem[];
  }): Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    responsible_party: string;
    due_date: string;
  }> {
    const actions: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      responsible_party: string;
      due_date: string;
    }> = [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Hidden killers = high priority
    for (const hk of params.hiddenKillers) {
      actions.push({
        priority: 'high',
        action: `Address Hidden Killer: ${hk.risk_name} - ${hk.mitigation}`,
        responsible_party: 'Lead Estimator',
        due_date: tomorrow.toISOString().split('T')[0],
      });
    }

    // Critical deviations = high priority
    const criticalDeviations = params.deviationAlerts.filter(a => a.severity === 'critical');
    if (criticalDeviations.length > 0) {
      actions.push({
        priority: 'high',
        action: `Review ${criticalDeviations.length} critical pricing deviation(s) - verify accuracy or document justification`,
        responsible_party: 'Lead Estimator',
        due_date: tomorrow.toISOString().split('T')[0],
      });
    }

    // Scope gaps = medium priority
    for (const gap of params.scopeGaps) {
      actions.push({
        priority: 'medium',
        action: `Resolve scope gap: ${gap.description}`,
        responsible_party: 'Estimating Team',
        due_date: nextWeek.toISOString().split('T')[0],
      });
    }

    // Open risks = medium priority
    const openRisks = params.existingRisks.filter(r => r.status === 'open');
    if (openRisks.length > 3) {
      actions.push({
        priority: 'medium',
        action: `Review and disposition ${openRisks.length} open risk items`,
        responsible_party: 'Project Manager',
        due_date: nextWeek.toISOString().split('T')[0],
      });
    }

    return actions;
  },
};

export default {
  riskCategory: riskCategoryApi,
  riskMatrix: riskMatrixApi,
  benchmark: benchmarkApi,
  deviationAlert: deviationAlertApi,
  redTeamReview: redTeamReviewApi,
  riskAuditor: riskAuditorAgent,
};
