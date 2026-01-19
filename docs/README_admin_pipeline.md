# Pipeline Administration Module

A comprehensive system for managing construction project pipelines with real-time analytics, bulk import/export, and advanced filtering capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Field Dictionary](#field-dictionary)
- [Import/Export](#importexport)
- [Analytics](#analytics)
- [Development](#development)

---

## Overview

The Pipeline Administration Module provides a complete solution for managing construction project pipelines. It includes:

- **Project Management**: CRUD operations with advanced filtering and sorting
- **Bulk Operations**: Import/export CSV/XLSX files with validation
- **Analytics Dashboard**: Real-time metrics, trends, and visualizations
- **Role-Based Access**: Admin, Precon, and PM roles with appropriate permissions

### Technology Stack

- **Frontend**: React + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Charts**: Recharts
- **File Processing**: PapaParse (CSV) + xlsx (XLSX)

---

## Features

### 1. Project Table View (`/admin/pipeline`)

- **Data Table**: Sortable, filterable table with pagination
- **Filters**: Status, Agency, Date Range, Value Range, Flagged, Search
- **Bulk Actions**: Flag/unflag, status changes, export
- **Row Actions**: Edit, delete, flag toggle
- **Selection**: Multi-select with checkbox
- **Pagination**: Configurable page size (default 25, max 100)

### 2. Import Wizard (`/admin/pipeline/import`)

- **4-Step Process**: Upload → Preview → Import → Complete
- **File Support**: CSV and XLSX formats
- **Validation**: 26-field validation with error reporting
- **Templates**: Download pre-configured templates with README
- **Upsert Logic**: Update existing projects by Job # or insert new
- **Error Tracking**: Row-level error reporting with field details

### 3. Analytics Dashboard (`/admin/pipeline/analytics`)

- **KPI Cards**: Total Projects, Active Projects, Pipeline Value, Average Margin
- **Trend Charts**: Win Rate and Profit Margin (12-month trends)
- **Status Breakdown**: Pie chart and bar chart visualizations
- **Week-over-Week Changes**: Delta indicators for all KPIs
- **Filters**: Agency and Set Aside filters

---

## Architecture

### Database Schema

```sql
CREATE TABLE projects (
  -- Core identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no TEXT,
  name TEXT NOT NULL,

  -- Classification
  agency TEXT,
  status TEXT NOT NULL DEFAULT 'Bidding',
  set_aside TEXT,
  manager TEXT,
  flagged BOOLEAN DEFAULT false,

  -- Dates
  due_date DATE,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,

  -- Financial
  value NUMERIC(14,2),

  -- Location
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  -- Extended fields (20 additional fields)
  ...
);
```

### Service Layer

**File**: `src/services/pipeline-admin.service.ts`

7 main API methods:
1. `getProjects(filters, pagination)` - List projects with filters
2. `getStatusBreakdown(filters)` - Status distribution
3. `getAnalytics(filters)` - KPIs and trends
4. `createProject(project)` - Create new project
5. `updateProject(id, updates)` - Update existing project
6. `importProjects(projects)` - Bulk import
7. `exportProjects(filters, format)` - Export to CSV/XLSX

### Type System

**File**: `src/types/admin.types.ts`

Key types:
- `Project` - Full project object
- `ProjectFilters` - Filter parameters
- `ProjectListResponse` - Paginated list response
- `AnalyticsResponse` - Analytics data structure
- `ImportResult` - Import operation result

---

## Getting Started

### Prerequisites

```bash
# Install dependencies
pnpm install

# Required packages
- @supabase/supabase-js
- papaparse
- xlsx
- recharts
- react-router-dom
```

### Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

```bash
# Run migrations
psql -d your_database -f supabase/migrations/004_projects_table.sql
psql -d your_database -f supabase/migrations/004_seed_projects.sql
```

### Run Application

```bash
# Development
pnpm run dev

# Build
pnpm run build

# Preview
pnpm run preview
```

---

## API Reference

### getProjects

Fetch projects with filters, pagination, and sorting.

```typescript
const response = await getProjects(
  {
    status: 'Bidding',
    agency: 'GSA',
    dateRange: '30days',
    valueRange: '1-5M',
    search: 'renovation',
    flagged: true,
  },
  {
    page: 1,
    pageSize: 25,
    sort: 'due_date:asc',
  }
);

// Response
{
  rows: ProjectRow[],
  total: number,
  page: number,
  pageSize: number
}
```

### getStatusBreakdown

Get project count by status.

```typescript
const breakdown = await getStatusBreakdown({ agency: 'VA' });

// Response
[
  { name: 'Bidding', value: 10 },
  { name: 'Submitted', value: 8 },
  { name: 'Awarded', value: 5 },
  ...
]
```

### getAnalytics

Get comprehensive analytics data.

```typescript
const analytics = await getAnalytics({ setAside: 'SDVOSB' });

// Response
{
  winRateTrend: [{ month: 'Jan', value: 45.2 }, ...],
  profitMarginTrend: [{ month: 'Jan', value: 12.3 }, ...],
  averageMargin: 11.5,
  totalProjects: 150,
  activeProjects: 45,
  totalPipelineValue: 125000000,
  weekOverWeekChange: {
    winRate: 2.3,
    averageMargin: 0.4,
    totalProjects: 5,
    activeProjects: 3,
    totalPipelineValue: 8500000
  }
}
```

### importProjects

Bulk import projects from parsed data.

```typescript
const result = await importProjects(parsedProjects);

// Response
{
  inserted: 25,
  updated: 10,
  failed: 2,
  errors: [
    { row: 15, field: 'Bid Due Date/Time', reason: 'Invalid datetime format' },
    ...
  ]
}
```

---

## Field Dictionary

### Required Fields (3)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| Pipeline Status | String | Current status | Must be: Bidding, Submitted, Awarded, Lost, In Progress, Pre-Solicitation |
| Job # | String | Internal tracking number | Required, unique identifier |
| Bid Due Date/Time | DateTime | Bid submission deadline | ISO format: YYYY-MM-DDTHH:MM:SS |

### Core Fields (10)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Bid Title | String | Project name | "Federal Building Renovation" |
| Agency | String | Government agency | "GSA", "VA", "DOD" |
| Set Aside | String | Contract type | "SDVOSB", "8(a)", "Small Business" |
| PM | String | Project Manager | "Jane Smith" |
| $ Magnitude (Range) | String | Value range | "<1M", "1-5M", "5-10M", "10-25M", ">25M" |
| Solicitation # | String | Government solicitation number | "GS-09P-25-ABC-001" |
| NAICS Code | String | Industry classification | "236220" |
| Address | String | Project location | "1800 F Street NW, Washington, DC" |
| Zip Code | String | Postal code | "20405" |
| PreCon POC | String | Preconstruction contact | "John Doe" |

### Extended Fields (13)

| Field | Type | Description | Format |
|-------|------|-------------|--------|
| JV | Boolean | Joint Venture | Yes/No |
| DTA | Boolean | Design-to-Award | Yes/No |
| Bid Doc Assistance | Boolean | Documentation help | Yes/No |
| Project Status | String | Current phase | Free text |
| Site Visit Date/Time | DateTime | Site visit schedule | ISO datetime |
| RFI Due Date/Time | DateTime | RFI deadline | ISO datetime |
| POP (Days) | Integer | Period of Performance | Number of days |
| Latitude | Float | GPS coordinate | -90 to 90 |
| Longitude | Float | GPS coordinate | -180 to 180 |
| POC | String | Point of Contact | Free text |
| Source/SAM Link | String | URL to source | URL |
| Attachments | String | File references | Free text |
| Notes | String | Additional notes | Free text |

### Validation Rules

1. **Required Fields**: Pipeline Status, Job #, Bid Due Date/Time must be present
2. **Coordinate Pairs**: Latitude and Longitude must both be provided or both be empty
3. **Status Enum**: Pipeline Status must match one of 6 valid values
4. **Coordinate Ranges**: Lat (-90 to 90), Lng (-180 to 180)
5. **Boolean Values**: Accept Yes/No, True/False, 1/0, Y/N (case-insensitive)
6. **DateTime Format**: ISO 8601 format (YYYY-MM-DDTHH:MM:SS) or MM/DD/YYYY HH:MM

---

## Import/Export

### Template Download

Download pre-configured templates:

```typescript
import { downloadTemplate } from '@/utils/import-parser';

// Download XLSX with README sheet
downloadTemplate('xlsx');

// Download CSV
downloadTemplate('csv');
```

### Import Process

1. **Upload File**: Select CSV or XLSX file (max 10MB)
2. **Validation**: Automatic validation of all 26 fields
3. **Preview**: Review parsed data and validation errors
4. **Import**: Upsert logic based on Job # field
5. **Results**: View inserted, updated, and failed counts

### Export Process

```typescript
import { exportProjects } from '@/services/pipeline-admin.service';

// Export with filters
const blob = await exportProjects(
  { status: 'Bidding', agency: 'GSA' },
  'xlsx'
);

// Download file
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'projects_export.xlsx';
link.click();
```

### Upsert Logic

- If `Job #` matches existing project → **UPDATE**
- If `Job #` is new or empty → **INSERT**
- All other fields are updated/inserted accordingly

---

## Analytics

### KPI Calculations

**Total Projects**: Count of all projects in database

**Active Projects**: Count of projects with status in ['Bidding', 'In Progress', 'Submitted']

**Total Pipeline Value**: Sum of `value` field for active projects

**Average Margin**: Mean of monthly profit margins (last 12 months)

### Trend Calculations

**Win Rate Trend**:
```
Win Rate = (Awarded Projects / (Awarded + Lost Projects)) × 100
```
Calculated monthly for last 12 months

**Profit Margin Trend**:
```
Margin = (Profit / Revenue) × 100
```
Calculated monthly for last 12 months

### Week-over-Week Changes

Compares current week data to previous week:
- Delta for each KPI
- Positive/negative indicators
- Percentage changes for rates

---

## Development

### Project Structure

```
src/
├── pages/admin/
│   ├── Pipeline.tsx       # Main table view
│   ├── Import.tsx         # Import wizard
│   └── Analytics.tsx      # Analytics dashboard
├── services/
│   └── pipeline-admin.service.ts  # API layer
├── types/
│   └── admin.types.ts     # Type definitions
├── utils/
│   └── import-parser.ts   # CSV/XLSX parser
└── lib/
    └── supabase.ts        # Database client
```

### Adding New Filters

1. Add filter to `ProjectFilters` type in `admin.types.ts`
2. Update `getProjects` service to handle new filter
3. Add UI control in `Pipeline.tsx` filter panel
4. Update `updateFilter` handler

### Adding New Charts

1. Import chart component from `recharts`
2. Fetch data in `Analytics.tsx` useEffect
3. Transform data to chart format
4. Add ResponsiveContainer with chart

### Performance Optimization

- **Pagination**: Enforced max 100 records per page
- **Indexes**: 8 database indexes for common queries
- **Lazy Loading**: Charts load only when visible
- **Debouncing**: Search input debounced at 300ms
- **Caching**: React Query caches API responses

---

## Troubleshooting

### Import Errors

**"Invalid datetime format"**
- Use ISO format: `2025-01-15T14:00:00`
- Or: `01/15/2025 14:00`

**"Latitude and Longitude must be provided together"**
- Provide both coordinates or leave both empty
- Check coordinate ranges: Lat (-90 to 90), Lng (-180 to 180)

**"Pipeline Status is required"**
- Ensure status column is not empty
- Use valid status: Bidding, Submitted, Awarded, Lost, In Progress, Pre-Solicitation

### Database Errors

**"Failed to fetch projects"**
- Check Supabase connection
- Verify environment variables
- Check RLS policies

**"Permission denied"**
- Verify user role (Admin, Precon, PM)
- Check RLS policies in database

### UI Issues

**Charts not displaying**
- Check data format matches Recharts requirements
- Verify data is not empty
- Check console for errors

**Filters not working**
- Clear browser cache
- Check filter values in network tab
- Verify service layer filter logic

---

## Support

For issues, questions, or feature requests:

1. Check this documentation
2. Review code comments in service files
3. Check Supabase logs for database errors
4. Review browser console for frontend errors

---

## License

Copyright © 2025 MGX Platform. All rights reserved.