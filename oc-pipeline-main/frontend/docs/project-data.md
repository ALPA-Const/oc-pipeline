# Project Data Module Documentation

**Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Production Ready

---

## Overview

The Project Data module is the **authoritative source of truth** for all dashboard data in the ALPA Construction Pipeline Management System. It provides schema definitions, data validation, export templates, and direct access to project records.

**Key Features:**
- ✅ 26 authoritative fields in exact order
- ✅ Schema panel with field definitions
- ✅ Filterable, paginated data table
- ✅ CSV/XLSX template export with README
- ✅ Integration with New Project Intake Form
- ✅ Data validation and warning system
- ✅ Telemetry tracking

---

## Access

**URL:** `/project-data`  
**Permissions:** Admin, Precon, PM roles only  
**Navigation:** Home → Project Data card

---

## 26 Authoritative Fields (EXACT Order)

These field names and order MUST NOT be changed. All dashboards consume these exact names.

1. **Pipeline Status** (Required) - Dropdown: Bidding, Submitted, Awarded, Lost, Pre-Solicitation
2. **Job #** (Required) - Text: Internal identifier (e.g., "26-001")
3. **JV** - Dropdown: None, Sawtooth JV, Other JV
4. **Set Aside** - Dropdown: SDVOSB, 8(a), WOSB/EDWOSB, HUBZone, SB, Unrestricted
5. **Solicitation #** - Text: RFP number (e.g., "47PF0025R0048")
6. **NAICS Code** - Text: 6 digits (e.g., "236220")
7. **Bid Title** (Required) - Text: Project name
8. **Address** - Text: Project location
9. **Zip Code** - Text: 5-10 characters (treat as text)
10. **Project Status** - Dropdown: Active, On Hold, Cancelled, Complete
11. **Agency** - Text: Contracting agency (e.g., "GSA")
12. **PM** - Text: Internal project manager
13. **PreCon POC** - Text: Internal precon owner
14. **Site Visit Date/Time** - Datetime: ISO 8601 (e.g., "2025-11-03T14:00:00Z")
15. **RFI Due Date/Time** - Datetime: ISO 8601
16. **Bid Due Date/Time** (Required) - Datetime: ISO 8601 (powers countdown timers)
17. **$ Magnitude (Range)** - Dropdown: <$1M, $1–5M, $5–10M, $10–25M, >$25M
18. **POP (Period of Performance, Days)** - Number: Positive integer
19. **DTA** - Date: YYYY-MM-DD (Decision Target Award)
20. **Bid Doc Assistance** - Dropdown: None, Estimating, Scheduling, MEP, Roofing, Other
21. **Latitude** - Number: -90 to 90 (must pair with Longitude)
22. **Longitude** - Number: -180 to 180 (must pair with Latitude)
23. **POC** - Text: External point of contact
24. **Source/SAM Link** - URL: Link to opportunity
25. **Attachments** - Text: Comma-separated URLs
26. **Notes** - Long text: Additional information

---

## Page Components

### 1. Schema Panel (Collapsible)

**Location:** Top of page  
**Default State:** Collapsed  
**Content:** Table with 7 columns

| Column | Description |
|--------|-------------|
| # | Field number (1-26) |
| Field Name | Exact authoritative name |
| Type | text, datetime, date, number, dropdown, url, long_text |
| Required | Required or Optional badge |
| Allowed Values / Format | Dropdown options or validation rules |
| Example | Sample value |
| Description | Field purpose and notes |

**Interaction:**
- Click header to expand/collapse
- Shows field count badge
- Fully scrollable table

### 2. Quick Filters

**Location:** Below schema panel  
**Filters Available:**
- Pipeline Status (dropdown)
- JV (dropdown)
- Set Aside (dropdown)
- Agency (text search - future)

**Behavior:**
- Selecting filter immediately updates table
- "Clear all" button appears when filters active
- Active filter count badge displayed
- Filters persist during session

### 3. Records Table

**Location:** Below filters  
**Features:**
- All 26 columns in exact order
- Paginated (25 records per page)
- Warning tooltips for missing/invalid data
- Highlighted row for newly added projects
- Horizontal scroll for wide table

**Cell Display:**
- Missing values show "—"
- Datetime fields formatted as locale string
- Coordinates shown to 4 decimal places
- Warning icon (⚠️) with tooltip for issues

**Pagination:**
- Shows "X to Y of Z records"
- Previous/Next buttons
- Page number buttons (1, 2, 3...)
- Disabled state for first/last page

### 4. Action Buttons

**Location:** Top right header

**Export CSV Template:**
- Downloads blank CSV with 26 headers
- UTF-8 encoding
- Comma-delimited, quoted fields
- Filename: `project-data-template_YYYY-MM-DD.csv`

**Export XLSX Template:**
- Downloads Excel file with 2 sheets:
  - Sheet 1 "Template": Headers in row 1 (frozen)
  - Sheet 2 "README": Field definitions table
- Filename: `project-data-template_YYYY-MM-DD.xlsx`

**Add New Project:**
- Opens New Project Intake Form
- On submit: redirects back to /project-data
- New row highlighted in table
- Toast notification: "Project added"

**Refresh:**
- Reloads data from database
- Shows spinner during load
- Maintains current filters

---

## Data Validation

### On Write (Form Submit)

**Required Fields:**
- Pipeline Status
- Job #
- Bid Title
- Bid Due Date/Time

**Datatype Validation:**
- Text: No commas in Job #, Solicitation #
- Datetime: Must be ISO 8601 format
- Date: Must be YYYY-MM-DD format
- Number: Must be valid numeric value
- Dropdown: Must match allowed values exactly
- Coordinates: Both Latitude and Longitude required together

**Rejection Rules:**
- Missing required field → Error: "Required field X is missing"
- Invalid datetime → Error: "Invalid datetime format"
- Invalid coordinate range → Error: "Latitude must be between -90 and 90"
- Mismatched dropdown value → Warning + store as "Unspecified"

### On Read (Table Display)

**Never Crash:**
- Missing fields → Show "—"
- Invalid data → Show value + warning icon
- Unknown columns → Ignore
- Null values → Coerce to null

**Warning System:**
- Each record has `_warnings` array
- Warnings shown as tooltip on hover
- Yellow alert icon next to problematic cells
- Examples:
  - "Required field 'Job #' is missing"
  - "Invalid URL format in Source/SAM Link"
  - "Latitude provided without Longitude"

---

## Export Template Specifications

### CSV Template

**Format:**
```csv
"Pipeline Status","Job #","JV","Set Aside",...,"Notes"
```

**Encoding:** UTF-8  
**Delimiter:** Comma  
**Quotes:** All fields quoted  
**Rows:** Headers only (0 data rows)

### XLSX Template

**Sheet 1: Template**
- Row 1: Headers (frozen)
- Rows 2+: Empty (for user data entry)

**Sheet 2: README**

| Column | Content |
|--------|---------|
| Field | Authoritative field name |
| Type | Datatype (text, datetime, etc.) |
| Required | yes/no |
| Allowed Values / Format | Dropdown options or validation rules |
| Example | Sample value |
| Notes | Field description and usage notes |

**Formatting:**
- Headers bold
- Required fields highlighted in yellow
- Dropdown columns with data validation (future)
- Freeze panes on row 1

---

## Integration with New Project Intake Form

### Field Mapping

The intake form uses the same 26 field keys. No mapping required.

**Form → Database:**
```typescript
{
  'Pipeline Status': 'stage_id',
  'Job #': 'job_number',
  'Bid Title': 'name',
  'Bid Due Date/Time': 'bid_due_datetime',
  // ... exact 1:1 mapping
}
```

### Submit Flow

1. User fills out New Project Intake Form
2. Form validates all required fields
3. On submit:
   - Data written to `pipeline_projects` table
   - Record ID returned
4. Redirect to `/project-data?highlight={id}`
5. Table loads with new row highlighted
6. Toast: "Project added successfully"
7. Highlight fades after 3 seconds

---

## API Endpoints

### 1. GET /api/project-data/schema

**Purpose:** Return authoritative field definitions

**Response:**
```json
{
  "fields": [
    {
      "name": "Pipeline Status",
      "type": "dropdown",
      "required": true,
      "description": "Drives dashboards and filters",
      "example": "Bidding",
      "allowedValues": ["Bidding", "Submitted", "Awarded", "Lost", "Pre-Solicitation"]
    },
    // ... 25 more fields
  ],
  "version": "1.0.0",
  "lastUpdated": "2025-10-29T00:00:00Z"
}
```

### 2. GET /api/project-data

**Purpose:** Return paginated, filtered project records

**Query Parameters:**
- `filters[Pipeline Status]`: Filter by pipeline status
- `filters[JV]`: Filter by JV type
- `filters[Set Aside]`: Filter by set-aside type
- `filters[Agency]`: Filter by agency (partial match)
- `page`: Page number (default: 1)
- `pageSize`: Records per page (default: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "Pipeline Status": "Bidding",
      "Job #": "26-001",
      // ... all 26 fields
      "_warnings": ["Required field 'Agency' is missing"],
      "created_at": "2025-10-29T00:00:00Z",
      "updated_at": "2025-10-29T00:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 100,
  "filters": {
    "Pipeline Status": "Bidding"
  }
}
```

### 3. POST /api/project-data/template

**Purpose:** Generate export template

**Query Parameters:**
- `format`: "csv" or "xlsx"

**Response:**
- Content-Type: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="project-data-template_2025-10-29.{format}"`
- Body: File blob

---

## Telemetry Events

**Tracked Events:**

1. **projectdata_schema_viewed**
   - When: Page loads
   - Data: `{ user_id, timestamp }`

2. **projectdata_export**
   - When: User clicks export button
   - Data: `{ user_id, format: 'csv'|'xlsx', timestamp }`

3. **projectdata_add_clicked**
   - When: User clicks "Add New Project"
   - Data: `{ user_id, timestamp }`

4. **projectdata_filter_applied**
   - When: User applies filter
   - Data: `{ user_id, filter_type, filter_value, timestamp }`

**Storage:**
- Local: Browser localStorage (last 100 events)
- Server: `dashboard_events` table (90-day retention)

---

## Performance Targets

| Action | Target | Actual |
|--------|--------|--------|
| Initial page load | ≤ 800ms | TBD |
| Filter change | ≤ 400ms | TBD |
| Export template | ≤ 2s | TBD |
| Table pagination | ≤ 200ms | TBD |

**Optimization:**
- Lazy load table rows (virtualization)
- Cache schema response (1 hour TTL)
- Debounce filter changes (300ms)
- Pagination server-side

---

## Access Control

**Roles with Access:**
- Admin (full access)
- Precon (read + add)
- PM (read + add)

**Roles without Access:**
- Estimator (redirect to dashboard)
- Viewer (redirect to dashboard)

**Enforcement:**
- Frontend: Route guard checks role
- Backend: RLS policies on `pipeline_projects` table

---

## Known Limitations

1. **XLSX Generation:** Currently returns CSV fallback (requires xlsx library)
2. **Historical Data:** No audit trail for field changes
3. **Bulk Import:** No CSV/XLSX import functionality yet
4. **Agency Search:** Text search not yet implemented
5. **Column Sorting:** Table columns not sortable yet
6. **Export Filtered Data:** Export always includes all records (not filtered subset)

---

## Troubleshooting

### Table Not Loading

**Symptoms:** Spinner never stops, no data shown

**Causes:**
1. Supabase connection issue
2. Missing RLS policies
3. User lacks required role

**Solutions:**
1. Check Supabase status
2. Verify RLS policies on `pipeline_projects`
3. Check user role in auth.users

### Export Not Working

**Symptoms:** Click export, nothing happens

**Causes:**
1. Browser blocking download
2. Service error generating file
3. Missing permissions

**Solutions:**
1. Check browser console for errors
2. Allow pop-ups/downloads for site
3. Verify service role key configured

### Missing Fields in Table

**Symptoms:** Some columns show "—" for all rows

**Causes:**
1. Database migration not run
2. Field mapping incorrect
3. Data actually missing

**Solutions:**
1. Run migration_001_dashboard_fields.sql
2. Check field mapping in transformToAuthoritativeFormat()
3. Add data via intake form

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-29 | 1.0 | Initial release | DevOps Team |

---

## References

- **Schema Definition:** `src/types/project-data.types.ts`
- **Service Layer:** `src/services/project-data.service.ts`
- **UI Components:** `src/components/project-data/`
- **Database Migration:** `database/migration_001_dashboard_fields.sql`
- **Intake Form:** (To be documented)

---

## Screenshots

### Landing Page - Project Data Card
![Project Data Card](screenshots/project-data-card.png)

### Project Data Page - Full View
![Project Data Page](screenshots/project-data-page.png)

### Schema Panel - Expanded
![Schema Panel](screenshots/schema-panel.png)

### Export Templates
![Export Templates](screenshots/export-templates.png)

---

## Support

**Questions or Issues:**
- Email: devops@alpaconstruction.com
- Slack: #alpa-project-data
- Jira: Create ticket with label "project-data"

---

© 2025 ALPA Construction. All rights reserved.