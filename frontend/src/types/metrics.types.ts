/**
 * Executive Dashboard Metrics Types
 * Standardized metric response format with parameters and metadata
 */

export interface MetricResponse<T = number> {
  metric: string;
  value: T;
  window: 'rolling_90d' | 'fiscal_ytd' | 'current_month' | 'all_time';
  params: Record<string, string | number | boolean | Record<string, unknown>>;
  as_of: string; // ISO 8601 UTC timestamp
  source: string;
  reason?: string; // For null/n/a values
  samples?: number; // Number of data points used
}

export interface FilterParams {
  state?: string;
  stage?: string;
  set_aside?: string;
  status?: string;
  include_options?: boolean;
  include_loi?: boolean;
}

export interface AwardedYTDMetric extends MetricResponse<number> {
  metric: 'awarded_ytd';
  params: {
    fiscal_year: number;
    include_loi: boolean;
  };
}

export interface PipelineValueMetric extends MetricResponse<number> {
  metric: 'pipeline_value';
  params: {
    include_options: boolean;
    stage?: string;
  };
}

export interface MonthlyAwardPaceMetric extends MetricResponse<number> {
  metric: 'monthly_award_pace';
  params: {
    window_days: 90;
  };
}

export interface ProjectedFYEndMetric extends MetricResponse<number> {
  metric: 'projected_fy_end';
  params: {
    awarded_ytd: number;
    monthly_award_pace: number;
    months_remaining: number;
  };
}

export interface ProjectsNeededMetric extends MetricResponse<number> {
  metric: 'projects_needed';
  params: {
    target_fy: number;
    awarded_ytd: number;
    avg_award_size_90d: number;
  };
}

export interface WinRateMetric extends MetricResponse<number> {
  metric: 'win_rate';
  params: {
    window_days: 90;
    awards_count: number;
    losses_count: number;
  };
}

export interface AvgPipelineVelocityMetric extends MetricResponse<number | null> {
  metric: 'avg_pipeline_velocity';
  params: {
    window_days: 90;
    min_samples: 5;
  };
}

export interface CapacityMetric extends MetricResponse<number | null> {
  metric: 'capacity_if_all_bids_win';
  params: {
    total_planned_hours: number;
    available_hours: number;
  };
}

export interface GeographicDistribution extends MetricResponse<GeographicPoint[]> {
  metric: 'geographic_distribution';
  params: {
    filters: string | number | boolean | Record<string, unknown>;
  };
}

export interface GeographicPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  value: number;
  status: string;
  state: string;
  stage: string;
}

export interface SparklineData {
  month: string;
  value: number;
}

export interface MetricWithTrend<T = number> extends MetricResponse<T> {
  trend: SparklineData[];
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

export interface WhatIfParams {
  win_rate: number; // 0.1 to 0.9
  avg_award_size: number; // currency
}

export interface WhatIfResults {
  projects_needed: MetricResponse<number>;
  projected_fy_end: MetricResponse<number>;
  capacity_if_all_win: MetricResponse<number | null>;
  is_simulated: true;
}

export interface MetricsHealthCheck {
  last_qa_run: string;
  last_audit_run: string;
  anomalies_detected: number;
  status: 'healthy' | 'warning' | 'error';
}