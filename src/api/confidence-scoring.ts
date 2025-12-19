/**
 * OC Pipeline - Confidence Scoring API
 * 
 * AI-calculated confidence scores (1-100%) for estimates and line items
 * Based on data completeness, pricing accuracy, scope coverage,
 * historical alignment, market data freshness, and risk assessment
 */

import { supabase } from '../lib/supabase';
import Decimal from 'decimal.js';
import type {
  EstimateConfidenceScore,
  LineItemConfidenceScore,
  ConfidenceFactorBreakdown,
  LowConfidenceItem,
  ConfidenceRecommendation,
  ConfidenceScoreRequest,
} from '../types/agentic-ai';

// =====================================================
// ESTIMATE CONFIDENCE SCORES
// =====================================================

export const estimateConfidenceApi = {
  /**
   * Get confidence score for an estimate
   */
  async get(estimateId: string): Promise<EstimateConfidenceScore | null> {
    const { data, error } = await supabase
      .from('estimate_confidence_scores')
      .select('*')
      .eq('estimate_id', estimateId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Calculate and store confidence score
   */
  async calculate(estimateId: string): Promise<EstimateConfidenceScore> {
    // Get estimate with line items
    const { data: estimate, error: estError } = await supabase
      .from('estimates')
      .select(`
        *,
        line_items(*)
      `)
      .eq('id', estimateId)
      .single();

    if (estError) throw estError;

    const lineItems = estimate.line_items || [];
    const factors: ConfidenceFactorBreakdown[] = [];
    const lowConfidenceItems: LowConfidenceItem[] = [];
    const recommendations: ConfidenceRecommendation[] = [];

    // ===== 1. Data Completeness Score (20% weight) =====
    const completenessChecks = lineItems.map(item => ({
      hasQuantity: item.quantity > 0,
      hasUnitCost: item.unit_cost > 0,
      hasDescription: !!item.description && item.description.length > 10,
      hasCsiCode: !!item.csi_code_id,
      hasUnit: !!item.unit_of_measure,
    }));

    const completeItems = completenessChecks.filter(
      c => c.hasQuantity && c.hasUnitCost && c.hasDescription && c.hasUnit
    ).length;

    const dataCompletenessScore = lineItems.length > 0
      ? Math.round((completeItems / lineItems.length) * 10000)
      : 0;

    factors.push({
      factor_name: 'Data Completeness',
      score: dataCompletenessScore,
      weight: 20,
      notes: `${completeItems} of ${lineItems.length} line items have complete data`,
    });

    if (dataCompletenessScore < 8000) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Complete missing data in line items (description, CSI codes, units)',
        potential_impact: 'Could improve confidence by 10-20%',
      });
    }

    // ===== 2. Pricing Accuracy Score (25% weight) =====
    // Check for deviation alerts
    const { data: deviationAlerts } = await supabase
      .from('deviation_alerts')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('is_acknowledged', false);

    const criticalAlerts = (deviationAlerts || []).filter(a => a.severity === 'critical').length;
    const warningAlerts = (deviationAlerts || []).filter(a => a.severity === 'warning').length;

    const pricingAccuracyScore = Math.max(
      0,
      10000 - (criticalAlerts * 2000) - (warningAlerts * 500)
    );

    factors.push({
      factor_name: 'Pricing Accuracy',
      score: pricingAccuracyScore,
      weight: 25,
      notes: `${criticalAlerts} critical, ${warningAlerts} warning price deviations from benchmarks`,
    });

    if (pricingAccuracyScore < 7000) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Review flagged pricing anomalies - verify or document justification',
        potential_impact: 'Resolving anomalies could improve confidence by 15-25%',
      });
    }

    // ===== 3. Scope Coverage Score (15% weight) =====
    // Check for invisible scope items
    const { data: invisibleScope } = await supabase
      .from('invisible_scope_items')
      .select('*')
      .eq('estimate_id', estimateId);

    const includedScope = (invisibleScope || []).filter(s => s.included_in_estimate).length;
    const totalScope = (invisibleScope || []).length;

    const scopeCoverageScore = totalScope > 0
      ? Math.round((includedScope / totalScope) * 10000)
      : 8000; // Default if no invisible scope detected

    factors.push({
      factor_name: 'Scope Coverage',
      score: scopeCoverageScore,
      weight: 15,
      notes: totalScope > 0
        ? `${includedScope} of ${totalScope} identified scope items included`
        : 'No invisible scope items detected - may need manual review',
    });

    if (scopeCoverageScore < 7000) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Include identified invisible scope items in estimate',
        potential_impact: 'Adding scope items improves completeness by 10-15%',
      });
    }

    // ===== 4. Historical Alignment Score (15% weight) =====
    // Based on how well this estimate aligns with past won/lost bids
    const { data: benchmarks } = await supabase
      .from('historical_benchmarks')
      .select('*')
      .eq('is_active', true);

    let alignedItems = 0;
    for (const item of lineItems) {
      if (!item.csi_code_id) continue;
      
      const { data: csiCode } = await supabase
        .from('csi_codes')
        .select('code')
        .eq('id', item.csi_code_id)
        .single();

      if (!csiCode) continue;

      const benchmark = benchmarks?.find(
        b => b.csi_code === csiCode.code && b.unit_of_measure === item.unit_of_measure
      );

      if (benchmark) {
        const deviation = Math.abs(
          new Decimal(item.unit_cost)
            .minus(benchmark.avg_unit_cost)
            .div(benchmark.avg_unit_cost)
            .times(100)
            .toNumber()
        );

        if (deviation < 15) alignedItems++;
      }
    }

    const historicalAlignmentScore = lineItems.length > 0
      ? Math.min(10000, Math.round((alignedItems / lineItems.length) * 10000) + 2000) // Bonus for having benchmarks
      : 5000;

    factors.push({
      factor_name: 'Historical Alignment',
      score: historicalAlignmentScore,
      weight: 15,
      notes: `${alignedItems} line items align with historical benchmarks`,
    });

    // ===== 5. Market Data Freshness Score (10% weight) =====
    // Check how recent the market price data is
    const { data: marketIndices } = await supabase
      .from('market_price_indices')
      .select('last_updated')
      .eq('is_active', true);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const freshIndices = (marketIndices || []).filter(
      m => new Date(m.last_updated) > oneWeekAgo
    ).length;
    const staleIndices = (marketIndices || []).filter(
      m => new Date(m.last_updated) < oneMonthAgo
    ).length;

    const totalIndices = (marketIndices || []).length;
    const marketFreshnessScore = totalIndices > 0
      ? Math.round(((freshIndices * 10000) + ((totalIndices - freshIndices - staleIndices) * 7000)) / totalIndices)
      : 6000;

    factors.push({
      factor_name: 'Market Data Freshness',
      score: marketFreshnessScore,
      weight: 10,
      notes: `${freshIndices} of ${totalIndices} market indices updated within 7 days`,
    });

    if (marketFreshnessScore < 6000) {
      recommendations.push({
        priority: 'low',
        recommendation: 'Update market price indices for volatile materials',
        potential_impact: 'Fresh market data improves pricing confidence by 5-10%',
      });
    }

    // ===== 6. Risk Assessment Score (15% weight) =====
    // Based on red team review results
    const { data: latestReview } = await supabase
      .from('red_team_reviews')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const riskAssessmentScore = latestReview
      ? Math.max(0, 10000 - latestReview.overall_risk_score)
      : 5000; // Default if no review conducted

    factors.push({
      factor_name: 'Risk Assessment',
      score: riskAssessmentScore,
      weight: 15,
      notes: latestReview
        ? `Based on Red-Team Review (${latestReview.total_risks_identified} risks identified)`
        : 'No Red-Team Review conducted - recommend running risk audit',
    });

    if (!latestReview) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Run Red-Team Review to identify hidden risks',
        potential_impact: 'Risk assessment provides 15% of confidence score',
      });
    }

    // ===== Calculate Overall Confidence =====
    const overallConfidence = Math.round(
      factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0)
    );

    // ===== Identify Low Confidence Items =====
    for (const item of lineItems) {
      // Check if this item has confidence issues
      const issues: string[] = [];

      if (!item.quantity || item.quantity <= 0) issues.push('missing quantity');
      if (!item.unit_cost || item.unit_cost <= 0) issues.push('missing unit cost');
      if (!item.description) issues.push('missing description');
      if (!item.csi_code_id) issues.push('missing CSI code');

      // Check for deviation
      const deviation = deviationAlerts?.find(a => a.line_item_id === item.id);
      if (deviation?.severity === 'critical') issues.push('critical price deviation');

      if (issues.length > 0) {
        const itemConfidence = Math.max(0, 10000 - (issues.length * 2000));
        if (itemConfidence < 6000) {
          lowConfidenceItems.push({
            line_item_id: item.id,
            description: item.description || 'Unnamed item',
            confidence: itemConfidence,
            reason: issues.join(', '),
          });
        }
      }
    }

    // ===== Store Results =====
    const scoreData = {
      estimate_id: estimateId,
      overall_confidence: overallConfidence,
      data_completeness_score: dataCompletenessScore,
      pricing_accuracy_score: pricingAccuracyScore,
      scope_coverage_score: scopeCoverageScore,
      historical_alignment_score: historicalAlignmentScore,
      market_data_freshness_score: marketFreshnessScore,
      risk_assessment_score: riskAssessmentScore,
      factors_breakdown: factors,
      low_confidence_items: lowConfidenceItems,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      calculated_at: new Date().toISOString(),
      ai_model_version: 'oc-pipeline-confidence-v1.0',
    };

    const { data, error } = await supabase
      .from('estimate_confidence_scores')
      .upsert(scoreData, { onConflict: 'estimate_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get confidence level text
   */
  getConfidenceLevel(score: number): {
    level: 'high' | 'medium' | 'low' | 'very_low';
    label: string;
    description: string;
  } {
    if (score >= 8000) {
      return {
        level: 'high',
        label: 'High Confidence',
        description: 'Estimate is well-documented with validated pricing and complete scope coverage.',
      };
    }
    if (score >= 6000) {
      return {
        level: 'medium',
        label: 'Medium Confidence',
        description: 'Estimate is reasonably complete but may have some gaps or unverified pricing.',
      };
    }
    if (score >= 4000) {
      return {
        level: 'low',
        label: 'Low Confidence',
        description: 'Estimate has significant gaps in data, pricing, or scope that should be addressed.',
      };
    }
    return {
      level: 'very_low',
      label: 'Very Low Confidence',
      description: 'Estimate requires substantial work before submission. Multiple critical issues identified.',
    };
  },
};

// =====================================================
// LINE ITEM CONFIDENCE SCORES
// =====================================================

export const lineItemConfidenceApi = {
  /**
   * Get confidence score for a line item
   */
  async get(lineItemId: string): Promise<LineItemConfidenceScore | null> {
    const { data, error } = await supabase
      .from('line_item_confidence_scores')
      .select('*')
      .eq('line_item_id', lineItemId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get all confidence scores for an estimate's line items
   */
  async getByEstimate(estimateId: string): Promise<LineItemConfidenceScore[]> {
    const { data: lineItems } = await supabase
      .from('line_items')
      .select('id')
      .eq('estimate_id', estimateId);

    if (!lineItems || lineItems.length === 0) return [];

    const { data, error } = await supabase
      .from('line_item_confidence_scores')
      .select('*')
      .in('line_item_id', lineItems.map(l => l.id));

    if (error) throw error;
    return data || [];
  },

  /**
   * Calculate confidence score for a line item
   */
  async calculate(lineItemId: string): Promise<LineItemConfidenceScore> {
    // Get line item details
    const { data: lineItem, error: liError } = await supabase
      .from('line_items')
      .select(`
        *,
        csi_code:csi_codes(code, name)
      `)
      .eq('id', lineItemId)
      .single();

    if (liError) throw liError;

    const dataSources: LineItemConfidenceScore['data_sources'] = [];
    const flags: LineItemConfidenceScore['flags'] = [];
    let basisOfEstimate = '';

    // ===== Quantity Confidence =====
    let quantityConfidence = 5000; // Default 50%

    // Check if linked to AI takeoff
    const { data: takeoffElement } = await supabase
      .from('ai_takeoff_elements')
      .select('*')
      .eq('linked_line_item_id', lineItemId)
      .single();

    if (takeoffElement) {
      quantityConfidence = takeoffElement.detection_confidence;
      dataSources.push({
        type: 'drawing',
        reference: `Sheet ${takeoffElement.sheet_id}, Grid ${takeoffElement.grid_reference || 'N/A'}`,
        confidence: takeoffElement.detection_confidence,
      });
      basisOfEstimate += `Quantity derived from AI takeoff (${(takeoffElement.detection_confidence / 100).toFixed(0)}% confidence). `;
    } else if (lineItem.quantity > 0) {
      quantityConfidence = 6000; // Manual entry
      dataSources.push({
        type: 'manual',
        reference: 'Manual entry',
        confidence: 6000,
      });
      basisOfEstimate += 'Quantity manually entered. ';
      flags.push({
        type: 'missing_source',
        message: 'Quantity not linked to drawing takeoff',
        severity: 'info',
      });
    } else {
      quantityConfidence = 0;
      flags.push({
        type: 'missing_source',
        message: 'No quantity specified',
        severity: 'critical',
      });
    }

    // ===== Unit Cost Confidence =====
    let unitCostConfidence = 5000;

    // Check against benchmarks
    if (lineItem.csi_code?.code) {
      const { data: benchmark } = await supabase
        .from('historical_benchmarks')
        .select('*')
        .eq('csi_code', lineItem.csi_code.code)
        .eq('is_active', true)
        .single();

      if (benchmark && benchmark.avg_unit_cost > 0) {
        const deviation = Math.abs(
          new Decimal(lineItem.unit_cost)
            .minus(benchmark.avg_unit_cost)
            .div(benchmark.avg_unit_cost)
            .times(100)
            .toNumber()
        );

        if (deviation < 10) {
          unitCostConfidence = 9000;
          dataSources.push({
            type: 'historical',
            reference: `Historical benchmark (${benchmark.sample_count} samples)`,
            confidence: 9000,
          });
          basisOfEstimate += `Unit cost aligns with historical data (within ${deviation.toFixed(1)}%). `;
        } else if (deviation < 20) {
          unitCostConfidence = 7000;
          dataSources.push({
            type: 'historical',
            reference: `Historical benchmark - ${deviation.toFixed(1)}% variance`,
            confidence: 7000,
          });
          basisOfEstimate += `Unit cost deviates ${deviation.toFixed(1)}% from historical average. `;
        } else {
          unitCostConfidence = 4000;
          flags.push({
            type: 'price_deviation',
            message: `Unit cost deviates ${deviation.toFixed(1)}% from benchmark`,
            severity: deviation > 30 ? 'critical' : 'warning',
          });
          basisOfEstimate += `⚠️ Unit cost significantly deviates from benchmarks. `;
        }
      }
    }

    // Check market data
    const { data: marketIndex } = await supabase
      .from('market_price_indices')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (marketIndex && marketIndex.length > 0) {
      dataSources.push({
        type: 'market',
        reference: 'Current market indices applied',
        confidence: 7500,
      });
    }

    // ===== Source Reliability =====
    const sourceReliability = dataSources.length > 0
      ? Math.round(dataSources.reduce((sum, s) => sum + s.confidence, 0) / dataSources.length)
      : 3000;

    // ===== Overall Confidence =====
    const confidenceScore = Math.round(
      (quantityConfidence * 0.4) +
      (unitCostConfidence * 0.4) +
      (sourceReliability * 0.2)
    );

    // Add flags for low confidence
    if (confidenceScore < 4000) {
      flags.push({
        type: 'low_confidence',
        message: 'Overall confidence below threshold - requires review',
        severity: 'warning',
      });
    }

    // AI notes
    const aiNotes = flags.length > 0
      ? `${flags.length} issue(s) identified: ${flags.map(f => f.message).join('; ')}`
      : 'No significant issues identified.';

    // ===== Store Results =====
    const scoreData = {
      line_item_id: lineItemId,
      confidence_score: confidenceScore,
      quantity_confidence: quantityConfidence,
      unit_cost_confidence: unitCostConfidence,
      source_reliability: sourceReliability,
      basis_of_estimate: basisOfEstimate.trim() || null,
      data_sources: dataSources,
      flags: flags,
      ai_notes: aiNotes,
      calculated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('line_item_confidence_scores')
      .upsert(scoreData, { onConflict: 'line_item_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Calculate confidence for all line items in an estimate
   */
  async calculateForEstimate(estimateId: string): Promise<{
    calculated: number;
    failed: number;
    averageConfidence: number;
  }> {
    const { data: lineItems } = await supabase
      .from('line_items')
      .select('id')
      .eq('estimate_id', estimateId);

    if (!lineItems || lineItems.length === 0) {
      return { calculated: 0, failed: 0, averageConfidence: 0 };
    }

    let calculated = 0;
    let failed = 0;
    let totalConfidence = 0;

    for (const item of lineItems) {
      try {
        const score = await this.calculate(item.id);
        totalConfidence += score.confidence_score;
        calculated++;
      } catch (err) {
        failed++;
      }
    }

    return {
      calculated,
      failed,
      averageConfidence: calculated > 0 ? Math.round(totalConfidence / calculated) : 0,
    };
  },
};

// =====================================================
// COMBINED CONFIDENCE API
// =====================================================

export const confidenceApi = {
  estimate: estimateConfidenceApi,
  lineItem: lineItemConfidenceApi,

  /**
   * Full confidence calculation for an estimate (including all line items)
   */
  async calculateFull(request: ConfidenceScoreRequest): Promise<{
    estimateScore: EstimateConfidenceScore;
    lineItemStats: {
      calculated: number;
      failed: number;
      averageConfidence: number;
    };
  }> {
    // Calculate line item confidence first
    const lineItemStats = await lineItemConfidenceApi.calculateForEstimate(request.estimate_id);

    // Then calculate estimate confidence
    const estimateScore = await estimateConfidenceApi.calculate(request.estimate_id);

    return {
      estimateScore,
      lineItemStats,
    };
  },
};

export default confidenceApi;
