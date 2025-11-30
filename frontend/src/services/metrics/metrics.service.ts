/**
 * Executive Metrics Service
 * Part A: Data Contracts and Definitions
 * 
 * All metrics return standardized responses with:
 * - value: computed metric
 * - window: time period used
 * - params: parameters used in computation
 * - as_of: UTC timestamp
 * - source: data source identifier
 */

import { supabase } from '@/lib/supabase';
import type {
  FilterParams,
  AwardedYTDMetric,
  PipelineValueMetric,
  MonthlyAwardPaceMetric,
  ProjectedFYEndMetric,
  ProjectsNeededMetric,
  WinRateMetric,
  AvgPipelineVelocityMetric,
  CapacityMetric,
  GeographicDistribution,
  GeographicPoint,
  WhatIfParams,
  WhatIfResults,
  MetricWithTrend,
  SparklineData,
  MetricResponse,
} from '@/types/metrics.types';

export class MetricsService {
  private readonly FISCAL_YEAR = 2026;
  private readonly TOTAL_CAPACITY = 30000000; // $30M
  private readonly MIN_SAMPLES_FOR_VELOCITY = 5;

  /**
   * Get current fiscal year info
   */
  private getFiscalYearInfo() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const monthsRemaining = 12 - currentMonth;
    
    return {
      fiscal_year: this.FISCAL_YEAR,
      current_month: currentMonth,
      months_remaining: monthsRemaining,
    };
  }

  /**
   * Apply filters to Supabase query
   */
  private applyFilters<T extends Record<string, unknown>>(
    query: any,
    filters: FilterParams
  ): any {
    let filteredQuery = query;
    
    if (filters.state) {
      filteredQuery = filteredQuery.eq('project_state', filters.state);
    }
    if (filters.stage) {
      filteredQuery = filteredQuery.eq('stage_id', filters.stage);
    }
    if (filters.set_aside) {
      filteredQuery = filteredQuery.eq('set_aside', filters.set_aside);
    }
    if (filters.status) {
      filteredQuery = filteredQuery.eq('status', filters.status);
    }
    return filteredQuery;
  }

  /**
   * Get last 90 days date
   */
  private getLast90Days(): string {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString();
  }

  /**
   * Get 6-month sparkline data for trends
   */
  private async getSparklineData(metric: string, filters: FilterParams = {}): Promise<SparklineData[]> {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM
        value: 0, // Will be populated by actual data
      });
    }

    // TODO: Implement actual historical data fetching
    // For now, return placeholder data
    return months;
  }

  /**
   * 1. Awarded YTD
   * Sum of executed awards within current fiscal year
   */
  async getAwardedYTD(filters: FilterParams = {}): Promise<AwardedYTDMetric> {
    const { fiscal_year } = this.getFiscalYearInfo();
    const include_loi = filters.include_loi ?? false;

    let query = supabase
      .from('pipeline_projects')
      .select('awarded_amount, value')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_award');

    query = this.applyFilters(query, filters);

    if (!include_loi) {
      query = query.neq('contract_type', 'loi');
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);

    return {
      metric: 'awarded_ytd',
      value: total,
      window: 'fiscal_ytd',
      params: {
        fiscal_year,
        include_loi,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: data.length,
    };
  }

  /**
   * 2. Pipeline Value
   * Sum of base bid values
   */
  async getPipelineValue(filters: FilterParams = {}): Promise<PipelineValueMetric> {
    const include_options = filters.include_options ?? false;

    let query = supabase
      .from('pipeline_projects')
      .select('value, options_value')
      .eq('pipeline_type', 'opportunity')
      .in('stage_id', ['opp_proposal', 'opp_negotiation']);

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    const total = data.reduce((sum, p) => {
      const baseValue = p.value || 0;
      const optionsValue = include_options ? (p.options_value || 0) : 0;
      return sum + baseValue + optionsValue;
    }, 0);

    return {
      metric: 'pipeline_value',
      value: total,
      window: 'all_time',
      params: {
        include_options,
        stage: filters.stage,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: data.length,
    };
  }

  /**
   * 3. Monthly Award Pace (rolling 90d)
   * sum(awards_last_90d) / 3
   */
  async getMonthlyAwardPace(filters: FilterParams = {}): Promise<MonthlyAwardPaceMetric> {
    const last90Days = this.getLast90Days();

    let query = supabase
      .from('pipeline_projects')
      .select('awarded_amount, value, award_date')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_award')
      .gte('award_date', last90Days);

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    const total90d = data.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);
    const monthlyPace = total90d / 3;

    return {
      metric: 'monthly_award_pace',
      value: monthlyPace,
      window: 'rolling_90d',
      params: {
        window_days: 90,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: data.length,
    };
  }

  /**
   * 4. Projected FY End
   * awarded_ytd + (monthly_award_pace * months_remaining_in_fy)
   */
  async getProjectedFYEnd(filters: FilterParams = {}): Promise<ProjectedFYEndMetric> {
    const { months_remaining } = this.getFiscalYearInfo();
    
    const awardedYTD = await this.getAwardedYTD(filters);
    const monthlyPace = await this.getMonthlyAwardPace(filters);

    const projected = awardedYTD.value + (monthlyPace.value * months_remaining);

    return {
      metric: 'projected_fy_end',
      value: projected,
      window: 'rolling_90d',
      params: {
        awarded_ytd: awardedYTD.value,
        monthly_award_pace: monthlyPace.value,
        months_remaining,
      },
      as_of: new Date().toISOString(),
      source: 'computed',
    };
  }

  /**
   * 5. Projects Needed
   * ceil((target_fy - awarded_ytd) / avg_award_size_90d)
   */
  async getProjectsNeeded(filters: FilterParams = {}): Promise<ProjectsNeededMetric> {
    // Get target from database
    const { data: targetData } = await supabase
      .from('annual_targets')
      .select('target_amount')
      .eq('year', this.FISCAL_YEAR)
      .single();

    const targetFY = targetData?.target_amount || 100000000;

    const awardedYTD = await this.getAwardedYTD(filters);
    
    // Get average award size from last 90 days
    const last90Days = this.getLast90Days();
    const { data: recentAwards } = await supabase
      .from('pipeline_projects')
      .select('awarded_amount, value')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_award')
      .gte('award_date', last90Days);

    const avgAwardSize = recentAwards && recentAwards.length > 0
      ? recentAwards.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0) / recentAwards.length
      : 20000000; // Default $20M

    const remaining = targetFY - awardedYTD.value;
    const projectsNeeded = Math.ceil(remaining / avgAwardSize);

    return {
      metric: 'projects_needed',
      value: Math.max(0, projectsNeeded),
      window: 'rolling_90d',
      params: {
        target_fy: targetFY,
        awarded_ytd: awardedYTD.value,
        avg_award_size_90d: avgAwardSize,
      },
      as_of: new Date().toISOString(),
      source: 'computed',
    };
  }

  /**
   * 6. Win Rate (90d)
   * awards_count_90d / (awards_count_90d + losses_count_90d)
   */
  async getWinRate(filters: FilterParams = {}): Promise<WinRateMetric> {
    const last90Days = this.getLast90Days();

    let query = supabase
      .from('pipeline_projects')
      .select('stage_id, updated_at')
      .eq('pipeline_type', 'opportunity')
      .in('stage_id', ['opp_award', 'opp_lost'])
      .gte('updated_at', last90Days);

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    const awards = data.filter(p => p.stage_id === 'opp_award').length;
    const losses = data.filter(p => p.stage_id === 'opp_lost').length;
    const total = awards + losses;

    const winRate = total > 0 ? (awards / total) * 100 : 0;

    return {
      metric: 'win_rate',
      value: winRate,
      window: 'rolling_90d',
      params: {
        window_days: 90,
        awards_count: awards,
        losses_count: losses,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: total,
    };
  }

  /**
   * 7. Avg Pipeline Velocity (90d)
   * Average days from "Submitted" to "Awarded" for items closed in last 90d
   * Returns null if <5 samples
   */
  async getAvgPipelineVelocity(filters: FilterParams = {}): Promise<AvgPipelineVelocityMetric> {
    const last90Days = this.getLast90Days();

    let query = supabase
      .from('pipeline_projects')
      .select('submission_date, award_date')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_award')
      .gte('award_date', last90Days)
      .not('submission_date', 'is', null)
      .not('award_date', 'is', null);

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    if (data.length < this.MIN_SAMPLES_FOR_VELOCITY) {
      return {
        metric: 'avg_pipeline_velocity',
        value: null,
        window: 'rolling_90d',
        params: {
          window_days: 90,
          min_samples: this.MIN_SAMPLES_FOR_VELOCITY,
        },
        as_of: new Date().toISOString(),
        source: 'pipeline_projects',
        reason: `Insufficient samples (${data.length} < ${this.MIN_SAMPLES_FOR_VELOCITY})`,
        samples: data.length,
      };
    }

    const durations = data.map(p => {
      const submitted = new Date(p.submission_date);
      const awarded = new Date(p.award_date);
      return Math.floor((awarded.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgDays = durations.reduce((sum, days) => sum + days, 0) / durations.length;

    return {
      metric: 'avg_pipeline_velocity',
      value: Math.round(avgDays),
      window: 'rolling_90d',
      params: {
        window_days: 90,
        min_samples: this.MIN_SAMPLES_FOR_VELOCITY,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: data.length,
    };
  }

  /**
   * 8. Capacity if All Current Bids Win
   * Σ planned_hours_current_bids / available_hours_window
   * Returns null with reason if no resource plan
   */
  async getCapacityIfAllBidsWin(filters: FilterParams = {}): Promise<CapacityMetric> {
    let query = supabase
      .from('pipeline_projects')
      .select('value, planned_hours')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_proposal');

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    // Check if we have resource planning data
    const hasResourcePlan = data.some(p => p.planned_hours != null);

    if (!hasResourcePlan) {
      return {
        metric: 'capacity_if_all_bids_win',
        value: null,
        window: 'all_time',
        params: {
          total_planned_hours: 0,
          available_hours: 0,
        },
        as_of: new Date().toISOString(),
        source: 'pipeline_projects',
        reason: 'No resource plan available for current bids',
        samples: data.length,
      };
    }

    const totalPlannedHours = data.reduce((sum, p) => sum + (p.planned_hours || 0), 0);
    const totalValue = data.reduce((sum, p) => sum + (p.value || 0), 0);
    
    // Calculate capacity as percentage of total capacity
    const capacityPercentage = (totalValue / this.TOTAL_CAPACITY) * 100;

    return {
      metric: 'capacity_if_all_bids_win',
      value: capacityPercentage,
      window: 'all_time',
      params: {
        total_planned_hours: totalPlannedHours,
        available_hours: this.TOTAL_CAPACITY,
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: data.length,
    };
  }

  /**
   * 9. Geographic Distribution
   * Return project coordinates and status filtered by same predicates
   */
  async getGeographicDistribution(filters: FilterParams = {}): Promise<GeographicDistribution> {
    let query = supabase
      .from('pipeline_projects')
      .select('id, name, project_latitude, project_longitude, value, stage_id, project_state')
      .eq('pipeline_type', 'opportunity')
      .not('project_latitude', 'is', null)
      .not('project_longitude', 'is', null);

    query = this.applyFilters(query, filters);

    const { data, error } = await query;

    if (error) throw error;

    const points: GeographicPoint[] = data.map(p => ({
      id: p.id,
      name: p.name,
      latitude: p.project_latitude,
      longitude: p.project_longitude,
      value: p.value || 0,
      status: p.stage_id,
      state: p.project_state,
      stage: p.stage_id,
    }));

    return {
      metric: 'geographic_distribution',
      value: points,
      window: 'all_time',
      params: {
        filters: JSON.stringify(filters),
      },
      as_of: new Date().toISOString(),
      source: 'pipeline_projects',
      samples: points.length,
    };
  }

  /**
   * What-If Analysis
   * Recalculate metrics with custom win rate and avg award size
   */
  async calculateWhatIf(params: WhatIfParams, filters: FilterParams = {}): Promise<WhatIfResults> {
    const { win_rate, avg_award_size } = params;

    // Get base data
    const { data: targetData } = await supabase
      .from('annual_targets')
      .select('target_amount')
      .eq('year', this.FISCAL_YEAR)
      .single();

    const targetFY = targetData?.target_amount || 100000000;
    const awardedYTD = await this.getAwardedYTD(filters);
    const { months_remaining } = this.getFiscalYearInfo();

    // Recalculate with what-if parameters
    const remaining = targetFY - awardedYTD.value;
    const projectsNeeded = Math.ceil(remaining / avg_award_size);
    
    // Adjusted monthly pace based on win rate
    const currentBids = await this.getPipelineValue(filters);
    const expectedMonthlyAwards = (currentBids.value / 3) * (win_rate / 100);
    const projectedFYEnd = awardedYTD.value + (expectedMonthlyAwards * months_remaining);

    // Capacity calculation
    const { data: biddingProjects } = await supabase
      .from('pipeline_projects')
      .select('value')
      .eq('pipeline_type', 'opportunity')
      .eq('stage_id', 'opp_proposal');

    const totalBiddingValue = biddingProjects?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
    const expectedWins = totalBiddingValue * (win_rate / 100);
    const capacityPercentage = (expectedWins / this.TOTAL_CAPACITY) * 100;

    return {
      projects_needed: {
        metric: 'projects_needed',
        value: Math.max(0, projectsNeeded),
        window: 'rolling_90d',
        params: {
          target_fy: targetFY,
          awarded_ytd: awardedYTD.value,
          avg_award_size_90d: avg_award_size,
          simulated_win_rate: win_rate,
        },
        as_of: new Date().toISOString(),
        source: 'what_if_simulation',
      },
      projected_fy_end: {
        metric: 'projected_fy_end',
        value: projectedFYEnd,
        window: 'rolling_90d',
        params: {
          awarded_ytd: awardedYTD.value,
          monthly_award_pace: expectedMonthlyAwards,
          months_remaining,
          simulated_win_rate: win_rate,
        },
        as_of: new Date().toISOString(),
        source: 'what_if_simulation',
      },
      capacity_if_all_win: {
        metric: 'capacity_if_all_bids_win',
        value: capacityPercentage,
        window: 'all_time',
        params: {
          total_bidding_value: totalBiddingValue,
          expected_wins: expectedWins,
          simulated_win_rate: win_rate,
        },
        as_of: new Date().toISOString(),
        source: 'what_if_simulation',
      },
      is_simulated: true,
    };
  }

  /**
   * Get metric with 6-month trend
   */
  async getMetricWithTrend<T = number>(
    metricFn: () => Promise<MetricResponse<T>>,
    metricName: string,
    filters: FilterParams = {}
  ): Promise<MetricWithTrend<T>> {
    const metric = await metricFn();
    const sparkline = await this.getSparklineData(metricName, filters);

    // Calculate trend
    const values = sparkline.map(s => s.value).filter(v => v > 0);
    const trendDirection = values.length >= 2
      ? values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'stable'
      : 'stable';

    const trendPercentage = values.length >= 2
      ? ((values[values.length - 1] - values[0]) / values[0]) * 100
      : 0;

    return {
      ...metric,
      trend: sparkline,
      trend_direction: trendDirection,
      trend_percentage: trendPercentage,
    };
  }
}

export const metricsService = new MetricsService();