# Executive Dashboard UX Behaviors

**Version:** 1.0  
**Last Updated:** 2025-10-29  
**Owner:** UX Team

---

## Overview

This document defines the user experience behaviors for the Executive Pipeline Dashboard, including filtering, navigation, interactions, and visual feedback.

---

## Global Filtering System

### Filter Controls

**Location:** Top of dashboard, below header

**Components:**
- State dropdown (CA, TX, FL, NY, WA, AZ, NV, OR)
- Stage dropdown (Bidding, Submitted, Awarded, Lost, Pre-Solicitation)
- Set-Aside Type dropdown (Small Business, Veteran Owned, Woman Owned, HUBZone, None)
- Clear All button (appears when filters active)

**Behavior:**
1. Selecting a filter immediately updates all widgets
2. Only one filter per type can be active
3. New filter replaces existing filter of same type
4. Filter chips appear below controls showing active filters

### Filter Chips

**Visual Design:**
- Secondary badge with filter label
- X button for removal
- Hover state for interactivity

**Behavior:**
1. Clicking X removes that specific filter
2. Clicking chip body does nothing (visual only)
3. Chips auto-arrange in horizontal flow
4. "Clear all" removes all chips at once

**Example:**
```
Active filters: [State: CA] [Stage: Bidding] [Set-Aside: Small Business]
```

---

## KPI Card Interactions

### Click-to-Filter

**Clickable KPIs:**
- Projects Currently Bidding → `stage=opp_proposal`
- Bids Submitted → `stage=opp_negotiation`
- Projects Awarded → `stage=opp_award`
- Projects Lost → `stage=opp_lost`
- Pre-Solicitation Projects → `stage=opp_lead_gen`
- Joint Venture Projects → `is_joint_venture=true`

**Non-Clickable KPIs:**
- Annual Target 2026
- Amount Awarded YTD
- Remaining to Target
- Win Rate

**Visual States:**
1. **Default**: Subtle hover effect, cursor pointer
2. **Hover**: Shadow lift, scale 105%
3. **Active**: Blue ring, blue background, "✓ Filter active" text
4. **Disabled**: No hover effect, default cursor

**Behavior:**
1. Click applies filter and adds chip
2. Click again (when active) removes filter
3. Clicking different KPI replaces stage filter
4. All other widgets update immediately

### Tooltips

**Trigger:** Hover over info icon (ℹ️) in card header

**Content:**
- **Formula**: Exact calculation formula
- **Window**: Time period used (e.g., "rolling 90d")
- **Last Refresh**: Timestamp of last data update
- **Samples**: Number of data points used
- **Note**: Reason for NULL values (if applicable)

**Example:**
```
Formula: Σ(awards_last_90d) / 3
Window: rolling 90d
Last Refresh: Oct 29, 2025 10:30 AM
Samples: 45 data points
```

### Sparklines

**Display:** 6-month trend line below KPI value

**Shown For:**
- Projected FY End
- Monthly Award Pace
- Win Rate
- Avg Pipeline Velocity (when not NULL)

**Visual:**
- Green line + ↑ icon: Upward trend
- Red line + ↓ icon: Downward trend
- Gray line + — icon: Stable trend
- Percentage change displayed next to icon

---

## Dashboard Tabs

### Tab Structure

**Tabs:** Map | Table | Distribution

**Location:** Below KPI cards, above content area

**Behavior:**
1. Clicking tab switches view immediately
2. Active tab highlighted with underline
3. Tab content loads on first click (lazy loading)
4. Tab state persists during session

### Count Header

**Display:** "Showing N of M projects"

**Warning Chip:** Appears when N ≠ M
- Yellow background
- Alert icon
- Text: "X projects hidden by filters"

**Example:**
```
Showing 23 of 156 projects  [⚠ 133 projects hidden by filters]
```

### Map View

**Features:**
- Pin markers for individual projects
- Heatmap overlay for density
- Zoom controls
- Legend for colors

**Interactions:**
- Click pin → Show project details
- Drag to pan
- Scroll to zoom
- Double-click to center

**Sync Behavior:**
- Map updates when filters change
- Pin count matches filtered KPI count
- Colors match stage status

### Table View

**Features:**
- Sortable columns
- Pagination (25 per page)
- Row selection
- Export to CSV

**Columns:**
- Agency
- Bid Title
- State
- Stage
- Value
- Due Date
- Days Until Due

**Interactions:**
- Click column header to sort
- Click row to view details
- Shift+click for multi-select
- Export button downloads selected rows

### Distribution View

**Charts:**
- By State: Bar chart (top 10 states)
- By Set-Aside: Bar chart (all types)

**Dual Y-Axis:**
- Left: Project count (blue bars)
- Right: Total value in $M (green bars)

**Interactions:**
- Hover bar → Show tooltip with exact values
- Click bar → Apply filter for that category
- Switch between State/Set-Aside tabs

---

## What-If Analysis Drawer

### Opening

**Trigger:** Click "What-If Analysis" button in header

**Animation:** Slide in from right (400ms ease-out)

**Size:** 540px wide, full height

### Controls

**Win Rate Slider:**
- Range: 10% - 90%
- Step: 5%
- Default: Current 90d win rate
- Live value badge shows current selection

**Avg Award Size Input:**
- Type: Currency
- Min: $1M
- Max: $100M
- Step: $1M
- Default: Current 90d average

**Reset Button:**
- Text: "Reset to Current Values"
- Restores defaults
- Clears simulation

### Results Display

**Recalculated Metrics:**
1. Projects Needed
2. Projected FY End
3. Capacity if All Win

**Visual:**
- Card layout matching KPI cards
- "Simulated" badge on each
- Values update in real-time (300ms debounce)
- Blue accent color for simulated values

**Behavior:**
1. Adjust slider → Values update after 300ms
2. Type in input → Values update after 300ms
3. Click Reset → Instant update to defaults
4. Close drawer → Simulation cleared

### Closing

**Triggers:**
- Click X button
- Click outside drawer
- Press Escape key

**Animation:** Slide out to right (400ms ease-in)

**State:** All simulated values cleared

---

## Color System

### Semantic Colors

**Success (Green):**
- Awarded projects
- Positive trends
- On-track status
- Win rate ≥ 50%

**Warning (Yellow):**
- Moderate urgency (7-14 days)
- Behind target
- Capacity 80-100%

**Danger (Red):**
- Lost projects
- Urgent deadlines (<7 days)
- Over capacity (>100%)
- Negative trends

**Info (Blue):**
- Bidding projects
- Submitted bids
- Active filters
- Simulated values

**Neutral (Gray):**
- Inactive states
- Placeholder data
- Disabled elements

### Stage Colors

| Stage | Color | Hex |
|-------|-------|-----|
| Bidding | Blue | #3B82F6 |
| Submitted | Purple | #8B5CF6 |
| Awarded | Green | #10B981 |
| Lost | Red | #EF4444 |
| Pre-Solicitation | Gray | #94A3B8 |

---

## Responsive Behavior

### Desktop (≥1024px)

- KPI cards: 5 columns
- Full sidebar for What-If
- All features visible

### Tablet (768px - 1023px)

- KPI cards: 3 columns
- What-If drawer: 400px wide
- Simplified tooltips

### Mobile (<768px)

- KPI cards: 1 column
- What-If: Full screen modal
- Simplified table view
- Map: Reduced controls

---

## Loading States

### Initial Load

**Skeleton:**
- Gray animated pulse
- Matches card layout
- Shows for 1-3 seconds

**Spinner:**
- Centered in viewport
- Blue color
- Text: "Loading dashboard..."

### Filter Change

**Inline:**
- Subtle opacity change (100% → 70%)
- No skeleton (too jarring)
- Duration: 200-600ms

### What-If Calculation

**Indicator:**
- Small spinner in drawer
- Text: "Calculating..."
- Appears only if >300ms

---

## Error States

### Data Load Failure

**Display:**
- Red alert banner
- Error icon
- Message: "Failed to load dashboard data"
- Retry button

**Actions:**
- Click Retry → Reload data
- Click X → Dismiss (data remains stale)

### Metric Calculation Error

**Display:**
- "N/A" in KPI card
- Yellow warning icon
- Tooltip with reason

**Example:**
```
Avg Pipeline Velocity: N/A
ℹ️ Insufficient samples (3 < 5)
```

### Network Error

**Display:**
- Toast notification
- Error message
- Auto-dismiss after 5s

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. Filter controls
2. KPI cards (left to right, top to bottom)
3. Tab controls
4. Tab content
5. What-If button

**Shortcuts:**
- `Tab`: Next element
- `Shift+Tab`: Previous element
- `Enter/Space`: Activate button/link
- `Escape`: Close drawer/modal
- `Arrow keys`: Navigate dropdowns

### Screen Readers

**ARIA Labels:**
- All interactive elements labeled
- Chart data tables provided
- Loading states announced
- Error messages read aloud

**Landmarks:**
- `<header>`: Dashboard header
- `<nav>`: Filter controls
- `<main>`: KPI cards and tabs
- `<aside>`: What-If drawer

### Color Contrast

**WCAG AA Compliance:**
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

**High Contrast Mode:**
- Increased border weights
- Stronger color differentiation
- No color-only indicators

---

## Performance Targets

### Load Times

- **Initial load**: p95 ≤ 1.5s
- **Filter change**: p95 ≤ 600ms
- **Tab switch**: p95 ≤ 300ms
- **What-If update**: p95 ≤ 300ms

### Interaction Response

- **Click feedback**: ≤ 100ms
- **Hover effect**: ≤ 50ms
- **Animation duration**: 200-400ms
- **Debounce delay**: 300ms

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-29 | 1.0 | Initial UX behaviors | UX Team |

---

## References

- Metrics Definitions: `/docs/metrics/definitions.md`
- Component Library: Shadcn-UI
- Design System: Tailwind CSS