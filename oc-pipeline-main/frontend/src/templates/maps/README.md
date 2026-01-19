# Geographic Map Templates

A collection of reusable, configurable geographic map visualization components for displaying location-based data with interactive features, filtering, and color-coded markers.

## Available Templates

### 1. GeoMapTemplate_Standard
The base template providing core map functionality without KPI synchronization.

### 2. GeoMapTemplate_KPI_Synced (Version 22)
An enhanced template with reactive synchronization to KPI cards, featuring smooth zoom animations and automatic filtering.

### 3. GeoMapTemplate_HeatView (Version 23)
An advanced template with state-level heatmap visualization, aggregating projects by state with choropleth coloring.

---

## GeoMapTemplate_Standard

A reusable, configurable geographic map visualization component for displaying location-based data with interactive features, filtering, and color-coded markers.

### Features

- 🗺️ Interactive map with zoom, pan, and scroll controls
- 📍 Color-coded markers based on stage/status
- 📊 Dynamic marker sizing based on numeric values
- 🔍 Advanced filtering (State, Stage, Set-Aside Type)
- 💬 Interactive popups with detailed information
- 🎨 Customizable colors and labels
- 📱 Responsive design
- 🔌 Easy integration with Supabase

### Basic Usage

```tsx
import GeoMapTemplate_Standard from '@/templates/maps/GeoMapTemplate_Standard';

// Use with default configuration (pipeline_projects data)
export default function MyDashboard() {
  return (
    <div>
      <GeoMapTemplate_Standard />
    </div>
  );
}
```

---

## GeoMapTemplate_KPI_Synced (Version 22)

An enhanced map template with reactive synchronization to KPI cards. When a KPI card is clicked, the map automatically filters and smoothly zooms to show only projects matching that status.

### New Features

- 🎯 **KPI Card Synchronization**: Click any KPI card to filter the map
- ✨ **Smooth Zoom Animations**: Automatic zoom to fit filtered markers (1.5s duration)
- 🎨 **Visual Feedback**: Selected KPI cards are highlighted with ring and scale effects
- 🔔 **Active Filter Alert**: Clear indicator showing which KPI filter is active
- 🔄 **Toggle Behavior**: Click the same KPI card again to clear the filter
- 🧹 **Clear Filter Button**: Quick reset to show all projects

### Installation

```tsx
// Wrap your dashboard with MapFilterProvider
import { MapFilterProvider } from '@/contexts/MapFilterContext';
import GeoMapTemplate_KPI_Synced from '@/templates/maps/GeoMapTemplate_KPI_Synced';

export default function Dashboard() {
  return (
    <MapFilterProvider>
      <GeoMapTemplate_KPI_Synced />
    </MapFilterProvider>
  );
}
```

---

## GeoMapTemplate_HeatView (Version 23)

An advanced map template with state-level heatmap visualization. This template aggregates projects by state and displays them as a choropleth map with color intensity representing either project count or total value.

### New Features

- 🗺️ **Dual View Modes**: Toggle between detailed pin view and aggregated heatmap view
- 📊 **State-Level Aggregation**: Groups projects by state with automatic calculations
- 🎨 **Choropleth Coloring**: Color intensity based on project count or total value
- 📈 **Metric Selection**: Choose between "By Project Count" or "By Total Value ($)"
- 🖱️ **Interactive States**: Hover to see tooltips, click to filter and switch to pin view
- 📍 **Smart Legend**: Dynamic legend showing color gradient and value ranges
- 🔄 **Seamless Integration**: Works with KPI filters and all existing features

### Installation

```tsx
import { MapFilterProvider } from '@/contexts/MapFilterContext';
import GeoMapTemplate_HeatView from '@/templates/maps/GeoMapTemplate_HeatView';

export default function Dashboard() {
  return (
    <MapFilterProvider>
      <GeoMapTemplate_HeatView />
    </MapFilterProvider>
  );
}
```

### View Modes

**1. Pin View (Default)**
- Shows individual project markers with color-coding by stage
- Dynamic marker sizing based on project value
- Interactive popups with project details
- All standard filtering options available

**2. Heatmap View**
- Displays US states as colored polygons
- Color intensity represents selected metric
- Hover over states to see aggregated data
- Click states to filter and switch to pin view

### Heatmap Metrics

**By Project Count:**
- Colors states based on the number of projects
- Useful for identifying geographic concentration
- Example: California with 3 projects vs Montana with 1 project

**By Total Value ($):**
- Colors states based on sum of all project values
- Useful for identifying high-value markets
- Example: Texas with $85M total vs Nevada with $12.5M total

### Color Gradient

The heatmap uses a 5-level blue gradient:
- **#e0f3ff** (0-20%) - Very light blue for lowest values
- **#b3d9ff** (20-40%) - Light blue
- **#66b3ff** (40-60%) - Medium blue
- **#1a8cff** (60-80%) - Dark blue
- **#0066cc** (80-100%) - Very dark blue for highest values

States with zero projects are shown in light gray (#f0f0f0).

### Interactive Features

**State Hover:**
- Displays tooltip with:
  - State name
  - Project count
  - Total project value
  - Top 5 projects by value

**State Click:**
- Automatically switches to pin view
- Filters map to show only projects in that state
- Maintains other active filters (KPI, stage, set-aside)

**View Toggle:**
- Prominent "Pin View" and "Heatmap View" buttons in header
- Smooth transition between views
- Preserves all filter settings when switching

### Usage Example

```tsx
import { MapFilterProvider } from '@/contexts/MapFilterContext';
import { DashboardKPICards } from '@/components/dashboard/DashboardKPICards';
import GeoMapTemplate_HeatView from '@/templates/maps/GeoMapTemplate_HeatView';

export default function OpportunityDashboard() {
  const [kpis, setKpis] = useState([]);

  return (
    <MapFilterProvider>
      <div className="space-y-6">
        {/* KPI Cards - Clickable */}
        <DashboardKPICards kpis={kpis} />
        
        {/* Map - With heatmap view */}
        <GeoMapTemplate_HeatView 
          title="Interactive Project Map"
          default_view="heatmap"
          default_metric="value"
        />
      </div>
    </MapFilterProvider>
  );
}
```

### Custom Configuration

```tsx
<GeoMapTemplate_HeatView
  title="Construction Analytics Map"
  data_source="my_projects"
  latitude_field="lat"
  longitude_field="lng"
  label_field="project_name"
  stage_field="status"
  value_field="budget"
  state_field="state"
  default_view="heatmap"
  default_metric="count"
  zoom_animation_duration={2}
/>
```

### Props Reference (HeatView)

All props from `GeoMapTemplate_KPI_Synced` plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `default_view` | `'pins' \| 'heatmap'` | `'pins'` | Initial view mode when map loads |
| `default_metric` | `'count' \| 'value'` | `'count'` | Initial heatmap metric |

### State Aggregation Logic

The template automatically:
1. Groups all filtered projects by state
2. Calculates project count per state
3. Sums total project value per state
4. Normalizes values to 0-1 scale for coloring
5. Applies color gradient based on normalized values

### Data Requirements

Your data source must include:
- **project_state** field (string) - Full state name (e.g., "California", "Texas")
- All other fields from GeoMapTemplate_Standard

The template uses a built-in state abbreviation mapping and fetches US state GeoJSON boundaries from:
`https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json`

### Performance

- GeoJSON state boundaries are fetched once on component mount
- Aggregation calculations use React useMemo for optimization
- Smooth transitions between views without re-fetching data
- Efficient re-renders when filters change

### Use Cases

**Executive Dashboards:**
- Quick overview of geographic distribution
- Identify high-value markets
- Spot concentration patterns

**Strategic Planning:**
- Market penetration analysis
- Resource allocation decisions
- Geographic expansion opportunities

**Sales Analytics:**
- Territory performance comparison
- Pipeline value by region
- Win rate by state

### Keyboard Shortcuts

When in heatmap view:
- **Hover** over state → Show tooltip
- **Click** state → Switch to pin view and filter
- **Toggle buttons** → Switch between views

### Integration with KPI Filters

The heatmap respects all KPI filters:
1. Click "Projects Currently Bidding" KPI card
2. Heatmap updates to show only bidding projects aggregated by state
3. Color intensity reflects filtered data only
4. Legend updates to show new min/max values

### Troubleshooting

**States not showing:**
- Verify project_state field contains full state names
- Check that state names match US state GeoJSON (e.g., "California" not "CA")
- Ensure GeoJSON fetch is successful (check browser console)

**Colors not updating:**
- Verify value_field contains numeric values
- Check that aggregation calculations are working (inspect stateAggregations)
- Ensure heatmapMetric is set correctly

**Tooltips not appearing:**
- Check that states have projects (aggregation not empty)
- Verify tooltip content is rendering correctly
- Ensure Leaflet tooltip styles are loaded

---

## Shared Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Geographic Project Distribution"` | Title displayed in card header |
| `data_source` | `string` | `"v_pipeline_projects_map"` | Supabase table/view name |
| `latitude_field` | `string` | `"lat"` | Field name for latitude |
| `longitude_field` | `string` | `"lng"` | Field name for longitude |
| `label_field` | `string` | `"name"` | Field name for marker label |
| `stage_field` | `string` | `"stage_id"` | Field name for stage/status |
| `value_field` | `string` | `"value"` | Field name for numeric value |
| `city_field` | `string` | `"project_city"` | Field name for city |
| `state_field` | `string` | `"project_state"` | Field name for state |
| `agency_field` | `string` | `"agency"` | Field name for agency/organization |
| `set_aside_field` | `string` | `"set_aside"` | Field name for set-aside type |
| `stage_colors` | `Record<string, string>` | See below | Custom color mapping for stages |
| `stage_labels` | `Record<string, string>` | See below | Custom label mapping for stages |
| `map_center` | `[number, number]` | `[39.8283, -98.5795]` | Map center coordinates [lat, lng] |
| `map_zoom` | `number` | `4` | Initial zoom level (1-18) |
| `map_height` | `number` | `600` | Map height in pixels |
| `enable_clustering` | `boolean` | `true` | Enable marker clustering |
| `enable_state_filter` | `boolean` | `true` | Show state filter dropdown |
| `enable_stage_filter` | `boolean` | `true` | Show stage filter dropdown |
| `enable_set_aside_filter` | `boolean` | `true` | Show set-aside filter dropdown |
| `select_query` | `string` | `"*"` | Custom Supabase select query |
| `enable_kpi_sync` | `boolean` | `true` | Enable KPI synchronization (KPI_Synced, HeatView) |
| `zoom_animation_duration` | `number` | `1.5` | Zoom animation duration in seconds (KPI_Synced, HeatView) |
| `default_view` | `'pins' \| 'heatmap'` | `'pins'` | Initial view mode (HeatView only) |
| `default_metric` | `'count' \| 'value'` | `'count'` | Initial heatmap metric (HeatView only) |

## Default Stage Colors

```typescript
{
  opp_proposal: '#ef4444',      // Red - Bidding
  bidding: '#ef4444',
  opp_negotiation: '#eab308',   // Yellow - Submitted
  submitted: '#eab308',
  opp_award: '#22c55e',         // Green - Awarded
  awarded: '#22c55e',
  opp_lost: '#9ca3af',          // Gray - Lost
  lost: '#9ca3af',
  archived: '#9ca3af',
  opp_lead_gen: '#60a5fa',      // Blue - Pre-Solicitation
  joint_venture: '#60a5fa',
  pre_solicitation: '#60a5fa',
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- `react-leaflet` - React components for Leaflet
- `leaflet` - Interactive map library
- `leaflet.markercluster` - Marker clustering plugin
- `@/components/ui/*` - shadcn-ui components
- `@/lib/supabase` - Supabase client
- `@/contexts/MapFilterContext` - KPI filter state management

## Version History

- **Version 23 (GeoMapTemplate_HeatView)**: Added state-level heatmap visualization with choropleth coloring
- **Version 22 (GeoMapTemplate_KPI_Synced)**: Added KPI card synchronization with smooth zoom animations
- **Version 21 (GeoMapTemplate_Standard)**: Initial release with core map functionality

## Examples

See `/workspace/shadcn-ui/src/views/OpportunityDashboard.tsx` for a real-world implementation example of the HeatView template.

## Support

For issues or questions, please refer to the main project documentation or contact the development team.