# Executive Dashboard Metrics Definitions

**Version:** 1.0  
**Last Updated:** 2025-10-29  
**Owner:** DevOps Team

---

## Overview

This document defines all metrics displayed on the Executive Pipeline Dashboard. Each metric includes its formula, data sources, calculation window, and business logic.

**Key Principles:**
- All rates are **monthly** (not annual)
- All timestamps are **UTC**
- All windows are **rolling 90 days** unless specified
- Metrics return both values and computation parameters

---

## Metric Definitions

### 1. Awarded YTD

**Description:** Total value of executed awards within the current fiscal year.

**Formula:**
```
Awarded YTD = Σ(awarded_amount) WHERE stage_id = 'opp_award' AND fiscal_year = 2026
```

**Parameters:**
- `fiscal_year`: 2026
- `include_loi`: false (excludes Letters of Intent by default)

**Data Source:** `pipeline_projects` table

**Window:** Fiscal YTD (Jan 1 - Current Date)

**Business Rules:**
- Excludes LOIs unless `include_loi=true`
- Uses `awarded_amount` if available, falls back to `value`
- Only counts projects in `opp_award` stage

**Sample Response:**
```json
{
  "metric": "awarded_ytd",
  "value": 45000000,
  "window": "fiscal_ytd",
  "params": {
    "fiscal_year": 2026,
    "include_loi": false
  },
  "as_of": "2025-10-29T00:00:00Z",
  "source": "pipeline_projects",
  "samples": 12
}
```

---

### 2. Pipeline Value

**Description:** Sum of base bid values for active opportunities.

**Formula:**
```
Pipeline Value = Σ(value + options_value) WHERE stage_id IN ['opp_proposal', 'opp_negotiation']
```

**Parameters:**
- `include_options`: false (excludes option values by default)
- `stage`: optional filter

**Data Source:** `pipeline_projects` table

**Window:** All time (current active pipeline)

**Business Rules:**
- Includes only `opp_proposal` and `opp_negotiation` stages
- Options value included only if `include_options=true`
- Base value is always included

---

### 3. Monthly Award Pace (Rolling 90d)

**Description:** Average monthly award rate based on last 90 days.

**Formula:**
```
Monthly Award Pace = Σ(awards_last_90d) / 3
```

**Parameters:**
- `window_days`: 90

**Data Source:** `pipeline_projects` table

**Window:** Rolling 90 days

**Business Rules:**
- Divides by 3 to get monthly rate (90 days = 3 months)
- Only counts awards with `award_date` within last 90 days
- Uses `awarded_amount` if available, falls back to `value`

---

### 4. Projected FY End

**Description:** Forecasted total awards by end of fiscal year.

**Formula:**
```
Projected FY End = awarded_ytd + (monthly_award_pace × months_remaining_in_fy)
```

**Parameters:**
- `awarded_ytd`: Current YTD awards
- `monthly_award_pace`: From metric #3
- `months_remaining`: 12 - current_month

**Data Source:** Computed from metrics #1 and #3

**Window:** Rolling 90d (uses 90d pace for projection)

**Business Rules:**
- Assumes current pace continues for remainder of year
- Updates monthly as pace changes
- Conservative estimate (doesn't account for seasonality)

---

### 5. Projects Needed

**Description:** Number of projects needed to reach annual target.

**Formula:**
```
Projects Needed = CEIL((target_fy - awarded_ytd) / avg_award_size_90d)
```

**Parameters:**
- `target_fy`: Annual target from `annual_targets` table
- `awarded_ytd`: From metric #1
- `avg_award_size_90d`: Average of awards in last 90 days

**Data Source:** Computed from `annual_targets` and `pipeline_projects`

**Window:** Rolling 90d (for average calculation)

**Business Rules:**
- Rounds up to nearest whole number
- Returns 0 if target already exceeded
- Uses $20M default if no recent awards

---

### 6. Win Rate (90d)

**Description:** Percentage of opportunities won vs lost in last 90 days.

**Formula:**
```
Win Rate = (awards_count_90d / (awards_count_90d + losses_count_90d)) × 100
```

**Parameters:**
- `window_days`: 90
- `awards_count`: Count of `opp_award` in last 90d
- `losses_count`: Count of `opp_lost` in last 90d

**Data Source:** `pipeline_projects` table

**Window:** Rolling 90 days

**Business Rules:**
- Only counts projects that reached decision (awarded or lost)
- Excludes active bids (not yet decided)
- Returns 0% if no decisions in window

---

### 7. Avg Pipeline Velocity (90d)

**Description:** Average days from bid submission to award.

**Formula:**
```
Avg Pipeline Velocity = AVG(award_date - submission_date) WHERE award_date IN last_90d
```

**Parameters:**
- `window_days`: 90
- `min_samples`: 5

**Data Source:** `pipeline_projects` table

**Window:** Rolling 90 days

**Business Rules:**
- **Returns NULL if < 5 samples** (insufficient data)
- Only counts projects with both `submission_date` and `award_date`
- Excludes outliers (>365 days)
- Provides reason when NULL: "Insufficient samples (N < 5)"

**Sample Response (Insufficient Data):**
```json
{
  "metric": "avg_pipeline_velocity",
  "value": null,
  "window": "rolling_90d",
  "params": {
    "window_days": 90,
    "min_samples": 5
  },
  "as_of": "2025-10-29T00:00:00Z",
  "source": "pipeline_projects",
  "reason": "Insufficient samples (3 < 5)",
  "samples": 3
}
```

---

### 8. Capacity if All Current Bids Win

**Description:** Resource utilization if all active bids are won.

**Formula:**
```
Capacity = (Σ planned_hours_current_bids / available_hours_window) × 100
```

**Parameters:**
- `total_planned_hours`: Sum of planned hours for active bids
- `available_hours`: Total capacity ($30M equivalent)

**Data Source:** `pipeline_projects` table

**Window:** All time (current active bids)

**Business Rules:**
- **Returns NULL if no resource plan** (no `planned_hours` data)
- Only includes projects in `opp_proposal` stage
- Provides reason when NULL: "No resource plan available for current bids"
- Uses value-based calculation if hours not available

---

### 9. Geographic Distribution

**Description:** Project locations filtered by same predicates as KPIs.

**Formula:**
```
Geographic Distribution = SELECT id, name, lat, lon, value, status WHERE filters_applied
```

**Parameters:**
- `filters`: Same filters applied to all metrics

**Data Source:** `pipeline_projects` table

**Window:** All time (current projects)

**Business Rules:**
- Excludes projects without coordinates
- Applies same filters as KPI cards
- Returns array of geographic points
- Used for map and table views

---

## Standardized Response Format

All metrics follow this structure:

```typescript
{
  metric: string;           // Metric identifier
  value: number | null;     // Computed value (null if insufficient data)
  window: string;           // Time window used
  params: object;           // Parameters used in computation
  as_of: string;            // ISO 8601 UTC timestamp
  source: string;           // Data source identifier
  reason?: string;          // Explanation for null values
  samples?: number;         // Number of data points used
}
```

---

## What-If Analysis

The What-If feature recalculates three metrics with user-provided parameters:

### Input Parameters:
- `win_rate`: 10-90% (slider)
- `avg_award_size`: Currency input

### Recalculated Metrics:
1. **Projects Needed**: Uses custom `avg_award_size`
2. **Projected FY End**: Uses custom `win_rate` to adjust pace
3. **Capacity if All Win**: Uses custom `win_rate` to calculate expected wins

### Business Rules:
- All recalculated values show "Simulated" badge
- Original values remain visible for comparison
- Changes update in real-time (300ms debounce)
- Simulation resets when drawer closes

---

## Data Quality Checks

### Anomaly Detection:
1. **Velocity NULL with Submitted > 0**: Projects submitted but no velocity calculated
2. **Negative Projections**: Projected FY End < Awarded YTD
3. **Map Count Mismatch**: Geographic points ≠ KPI count
4. **Missing Coordinates**: Projects without lat/lon
5. **Stale Data**: Last update > 24 hours ago

### Nightly QA Job:
- Runs at 2 AM UTC
- Checks all anomalies
- Sends alerts if critical issues found
- Logs results to `qa_audit_log` table

---

## Caching Strategy

**Cache Key Format:**
```
{metric}:{window}:{filters_json}:{date}
```

**TTL:** 5-15 minutes (default 10 min)

**Cache Invalidation:**
- Automatic expiration after TTL
- Manual clear on data updates
- Per-metric or global clear

**Performance Targets:**
- Initial load: p95 ≤ 1.5s
- Filter change: p95 ≤ 600ms (cached)
- What-If update: p95 ≤ 300ms

---

## Known Limitations

1. **Historical Trends**: Currently placeholder data (6-month sparklines)
2. **Seasonality**: Projections don't account for seasonal patterns
3. **Resource Planning**: Limited to projects with `planned_hours` data
4. **Real-time Updates**: Cache delay of up to 15 minutes
5. **Fiscal Year**: Hardcoded to 2026 (needs annual update)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-29 | 1.0 | Initial definitions | DevOps Team |

---

## References

- API Documentation: `/docs/api/metrics-endpoints.md`
- Dashboard UX Behaviors: `/docs/ux/dashboard_behaviors.md`
- Testing Strategy: `/docs/qa/testing_strategy.md`