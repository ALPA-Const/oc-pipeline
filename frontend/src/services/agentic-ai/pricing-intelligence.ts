/**
 * OC Pipeline - Pricing Intelligence Agent API
 * 
 * Market synthesis, geographic-specific costs, volatility buffers,
 * real-time market integration
 */

import { supabase } from '../../lib/supabase';
import Decimal from 'decimal.js';
import type {
  MarketPriceIndex,
  MarketPriceHistory,
  GeographicCostFactor,
  VolatilityBuffer,
  EscalationClause,
  MarketDataFilters,
  PricingIntelligenceInput,
  PricingIntelligenceOutput,
  ApplyGeographicAdjustmentRequest,
  TrendDirection,
  RiskSeverity,
} from '../types/agentic-ai';

// =====================================================
// MARKET PRICE INDICES
// =====================================================

export const marketPriceApi = {
  /**
   * List all market price indices with optional filters
   */
  async list(filters?: MarketDataFilters): Promise<MarketPriceIndex[]> {
    let query = supabase
      .from('market_price_indices')
      .select('*')
      .order('material_category', { ascending: true });

    if (filters?.material_category) {
      query = query.eq('material_category', filters.material_category);
    }
    if (filters?.commodity_code) {
      query = query.eq('commodity_code', filters.commodity_code);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single market price index
   */
  async get(id: string): Promise<MarketPriceIndex | null> {
    const { data, error } = await supabase
      .from('market_price_indices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get price history for an index
   */
  async getHistory(indexId: string, days: number = 90): Promise<MarketPriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('market_price_history')
      .select('*')
      .eq('index_id', indexId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update market price (simulates real-time feed)
   */
  async updatePrice(
    id: string,
    newValue: number,
    sourceReference?: string
  ): Promise<MarketPriceIndex> {
    // Get current index
    const current = await this.get(id);
    if (!current) throw new Error('Index not found');

    // Calculate change
    const changePercent = new Decimal(newValue)
      .minus(current.base_value)
      .div(current.base_value)
      .times(10000)
      .round()
      .toNumber();

    // Determine trend
    let trend: TrendDirection = 'stable';
    if (Math.abs(changePercent) > 500) {
      trend = changePercent > 0 ? 'up' : 'down';
    }
    if (current.volatility_score > 3000) {
      trend = 'volatile';
    }

    // Update index
    const { data, error } = await supabase
      .from('market_price_indices')
      .update({
        current_value: newValue,
        change_percent: changePercent,
        trend_direction: trend,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record history
    await supabase.from('market_price_history').insert({
      index_id: id,
      recorded_value: newValue,
      source_reference: sourceReference,
    });

    return data;
  },

  /**
   * Get volatile materials (high volatility score)
   */
  async getVolatileMaterials(threshold: number = 3000): Promise<MarketPriceIndex[]> {
    const { data, error } = await supabase
      .from('market_price_indices')
      .select('*')
      .gte('volatility_score', threshold)
      .eq('is_active', true)
      .order('volatility_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get materials with significant price changes
   */
  async getPriceAlerts(threshold: number = 500): Promise<MarketPriceIndex[]> {
    const { data, error } = await supabase
      .from('market_price_indices')
      .select('*')
      .or(`change_percent.gte.${threshold},change_percent.lte.${-threshold}`)
      .eq('is_active', true)
      .order('change_percent', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// GEOGRAPHIC COST FACTORS
// =====================================================

export const geographicCostApi = {
  /**
   * Get cost factors for a zip code
   */
  async getByZipCode(zipCode: string): Promise<GeographicCostFactor | null> {
    const { data, error } = await supabase
      .from('geographic_cost_factors')
      .select('*')
      .eq('zip_code', zipCode)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get cost factors for a state/region
   */
  async getByRegion(state: string): Promise<GeographicCostFactor[]> {
    const { data, error } = await supabase
      .from('geographic_cost_factors')
      .select('*')
      .eq('state', state)
      .eq('is_active', true)
      .order('zip_code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calculate adjusted cost with geographic factor
   */
  calculateAdjustedCost(
    baseCost: number,
    factor: GeographicCostFactor,
    costType: 'labor' | 'material' | 'equipment' | 'general'
  ): number {
    let factorValue: number;
    switch (costType) {
      case 'labor':
        factorValue = factor.labor_factor;
        break;
      case 'material':
        factorValue = factor.material_factor;
        break;
      case 'equipment':
        factorValue = factor.equipment_factor;
        break;
      default:
        factorValue = factor.general_conditions_factor;
    }

    return new Decimal(baseCost)
      .times(factorValue)
      .div(10000)
      .round()
      .toNumber();
  },

  /**
   * Check if prevailing wage applies
   */
  async checkPrevailingWage(zipCode: string): Promise<{
    required: boolean;
    rate_area: string | null;
  }> {
    const factor = await this.getByZipCode(zipCode);
    return {
      required: factor?.prevailing_wage_required || false,
      rate_area: factor?.davis_bacon_rate_area || null,
    };
  },
};

// =====================================================
// VOLATILITY BUFFERS
// =====================================================

export const volatilityBufferApi = {
  /**
   * Get volatility buffer for a material category
   */
  async getBuffer(materialCategory: string): Promise<VolatilityBuffer | null> {
    const { data, error } = await supabase
      .from('volatility_buffers')
      .select('*')
      .eq('material_category', materialCategory)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * List all active buffers
   */
  async list(): Promise<VolatilityBuffer[]> {
    const { data, error } = await supabase
      .from('volatility_buffers')
      .select('*')
      .eq('is_active', true)
      .order('material_category', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calculate buffered cost
   */
  calculateBufferedCost(baseCost: number, bufferPercent: number): number {
    return new Decimal(baseCost)
      .times(new Decimal(10000).plus(bufferPercent))
      .div(10000)
      .round()
      .toNumber();
  },

  /**
   * Update buffer based on market conditions
   */
  async recalculateBuffer(materialCategory: string): Promise<VolatilityBuffer | null> {
    // Get market index for this category
    const indices = await marketPriceApi.list({
      material_category: materialCategory,
      is_active: true,
    });

    if (indices.length === 0) return null;

    // Calculate average volatility
    const avgVolatility = new Decimal(
      indices.reduce((sum, idx) => sum + idx.volatility_score, 0)
    )
      .div(indices.length)
      .round()
      .toNumber();

    // Calculate buffer based on volatility (simplified formula)
    const newBuffer = Math.min(
      Math.round(avgVolatility * 0.5), // 50% of volatility score
      5000 // Max 50% buffer
    );

    const { data, error } = await supabase
      .from('volatility_buffers')
      .update({
        buffer_percent: newBuffer,
        last_calculated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('material_category', materialCategory)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// =====================================================
// ESCALATION CLAUSES
// =====================================================

export const escalationClauseApi = {
  /**
   * Get escalation clauses for an estimate
   */
  async getByEstimate(estimateId: string): Promise<EscalationClause[]> {
    const { data, error } = await supabase
      .from('escalation_clauses')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create escalation clause
   */
  async create(clause: Omit<EscalationClause, 'id' | 'created_at' | 'updated_at'>): Promise<EscalationClause> {
    const { data, error } = await supabase
      .from('escalation_clauses')
      .insert(clause)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Generate recommended escalation clauses based on estimate
   */
  async generateRecommendations(
    estimateId: string,
    projectDurationMonths: number
  ): Promise<Array<Omit<EscalationClause, 'id' | 'created_at' | 'updated_at'>>> {
    const recommendations: Array<Omit<EscalationClause, 'id' | 'created_at' | 'updated_at'>> = [];

    // Get volatile materials
    const volatileMaterials = await marketPriceApi.getVolatileMaterials(2500);

    // If project is long-duration or has volatile materials, recommend clauses
    if (projectDurationMonths > 12 || volatileMaterials.length > 0) {
      // Material escalation clause
      recommendations.push({
        estimate_id: estimateId,
        clause_type: 'material',
        trigger_threshold: 500, // 5%
        max_escalation: 1500, // 15%
        reference_index_id: volatileMaterials[0]?.id || null,
        base_date: new Date().toISOString().split('T')[0],
        calculation_formula: 'Base Price × (Current Index / Base Index)',
        is_active: true,
      });
    }

    // Fuel escalation for projects > 6 months
    if (projectDurationMonths > 6) {
      recommendations.push({
        estimate_id: estimateId,
        clause_type: 'fuel',
        trigger_threshold: 1000, // 10%
        max_escalation: 2000, // 20%
        reference_index_id: null,
        base_date: new Date().toISOString().split('T')[0],
        calculation_formula: 'Equipment Cost × Fuel Factor × (Current EIA Index / Base EIA Index)',
        is_active: true,
      });
    }

    return recommendations;
  },
};

// =====================================================
// PRICING INTELLIGENCE AGENT
// =====================================================

export const pricingIntelligenceAgent = {
  /**
   * Run full pricing intelligence analysis
   */
  async analyze(input: PricingIntelligenceInput): Promise<PricingIntelligenceOutput> {
    const adjustedLineItems: PricingIntelligenceOutput['adjusted_line_items'] = [];
    const marketAlerts: PricingIntelligenceOutput['market_alerts'] = [];

    // Get geographic factors
    const geoFactor = await geographicCostApi.getByZipCode(input.project_location.zip_code);

    // Get all volatility buffers
    const buffers = await volatilityBufferApi.list();
    const bufferMap = new Map(buffers.map(b => [b.material_category, b.buffer_percent]));

    // Get market alerts
    const priceAlerts = await marketPriceApi.getPriceAlerts(500);
    const volatileMarkets = await marketPriceApi.getVolatileMaterials(3000);

    // Process each line item
    let totalAdjustment = 0;

    for (const item of input.line_items) {
      const originalCost = item.base_unit_cost;

      // Geographic adjustment
      const geoAdjustment = geoFactor
        ? geographicCostApi.calculateAdjustedCost(originalCost, geoFactor, 'material') - originalCost
        : 0;

      // Volatility buffer
      const bufferPercent = bufferMap.get(item.material_category) || 0;
      const afterGeo = originalCost + geoAdjustment;
      const volatilityAdjustment = new Decimal(afterGeo)
        .times(bufferPercent)
        .div(10000)
        .round()
        .toNumber();

      // Escalation factor (simplified - based on project duration)
      const escalationFactor = Math.min(
        Math.round((input.project_duration_months / 12) * 300), // ~3% per year
        500 // Max 5%
      );
      const afterVolatility = afterGeo + volatilityAdjustment;
      const escalationAdjustment = new Decimal(afterVolatility)
        .times(escalationFactor)
        .div(10000)
        .round()
        .toNumber();

      const adjustedCost = afterVolatility + escalationAdjustment;
      totalAdjustment += (adjustedCost - originalCost) * item.quantity;

      adjustedLineItems.push({
        line_item_id: item.id,
        original_unit_cost: originalCost,
        geographic_adjustment: geoAdjustment,
        volatility_buffer: volatilityAdjustment,
        adjusted_unit_cost: adjustedCost,
        adjustment_breakdown: {
          geographic_factor: geoFactor?.material_factor || 10000,
          volatility_factor: bufferPercent,
          escalation_factor: escalationFactor,
        },
      });

      // Check if this material has alerts
      const hasAlert = priceAlerts.find(a => a.material_category === item.material_category);
      const isVolatile = volatileMarkets.find(v => v.material_category === item.material_category);

      if (hasAlert && !marketAlerts.find(a => a.material_category === item.material_category)) {
        marketAlerts.push({
          material_category: item.material_category,
          alert_type: 'price_spike',
          message: `${item.material_category} prices have changed ${(hasAlert.change_percent / 100).toFixed(1)}% recently`,
          severity: Math.abs(hasAlert.change_percent) > 1000 ? 'critical' : 'warning',
        });
      }

      if (isVolatile && !marketAlerts.find(a => 
        a.material_category === item.material_category && a.alert_type === 'price_spike'
      )) {
        marketAlerts.push({
          material_category: item.material_category,
          alert_type: 'supply_shortage',
          message: `${item.material_category} shows high market volatility (${(isVolatile.volatility_score / 100).toFixed(0)}%)`,
          severity: 'warning',
        });
      }
    }

    // Generate escalation recommendations
    const escalationRecommendations = await escalationClauseApi.generateRecommendations(
      input.estimate_id,
      input.project_duration_months
    );

    return {
      adjusted_line_items: adjustedLineItems,
      market_alerts: marketAlerts,
      escalation_recommendations: escalationRecommendations.map(r => ({
        clause_type: r.clause_type,
        trigger_threshold: r.trigger_threshold,
        max_escalation: r.max_escalation,
        rationale: `Recommended based on ${r.clause_type === 'material' ? 'volatile material markets' : 'project duration > 6 months'}`,
      })),
      total_adjustment_impact: totalAdjustment,
    };
  },

  /**
   * Apply geographic adjustments to estimate
   */
  async applyGeographicAdjustments(
    request: ApplyGeographicAdjustmentRequest
  ): Promise<{ updated_count: number; total_adjustment: number }> {
    const geoFactor = await geographicCostApi.getByZipCode(request.zip_code);
    if (!geoFactor) {
      throw new Error(`No geographic cost factors found for zip code ${request.zip_code}`);
    }

    // Get line items
    let query = supabase
      .from('line_items')
      .select('*')
      .eq('estimate_id', request.estimate_id);

    if (request.line_item_ids && request.line_item_ids.length > 0) {
      query = query.in('id', request.line_item_ids);
    }

    const { data: lineItems, error } = await query;
    if (error) throw error;

    let totalAdjustment = 0;
    let updatedCount = 0;

    for (const item of lineItems || []) {
      const adjustedCost = geographicCostApi.calculateAdjustedCost(
        item.unit_cost,
        geoFactor,
        'material'
      );

      if (adjustedCost !== item.unit_cost) {
        const { error: updateError } = await supabase
          .from('line_items')
          .update({
            unit_cost: adjustedCost,
            notes: `${item.notes || ''}\n[Geo-adjusted from ${item.unit_cost} for ${request.zip_code}]`.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (!updateError) {
          totalAdjustment += (adjustedCost - item.unit_cost) * item.quantity;
          updatedCount++;
        }
      }
    }

    return { updated_count: updatedCount, total_adjustment: totalAdjustment };
  },
};

export default {
  marketPrice: marketPriceApi,
  geographicCost: geographicCostApi,
  volatilityBuffer: volatilityBufferApi,
  escalationClause: escalationClauseApi,
  pricingIntelligence: pricingIntelligenceAgent,
};
