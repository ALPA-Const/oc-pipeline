import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin, DollarSign, Building2 } from 'lucide-react';

// Fix for default marker icons in Leaflet
interface IconDefault extends L.Icon.Default {
  _getIconUrl?: () => string;
}

delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MarkerClusterGroupOptions {
  chunkedLoading: boolean;
  spiderfyOnMaxZoom: boolean;
  showCoverageOnHover: boolean;
  zoomToBoundsOnClick: boolean;
  maxClusterRadius: number;
}

interface LeafletWithMarkerCluster {
  markerClusterGroup: (options: MarkerClusterGroupOptions) => L.LayerGroup;
}

/**
 * Configuration props for GeoMapTemplate_Standard component
 * 
 * @interface GeoMapTemplateProps
 * @property {string} title - Title displayed in the card header (default: "Geographic Project Distribution")
 * @property {string} data_source - Supabase table or view name (default: "v_pipeline_projects_map")
 * @property {string} latitude_field - Field name for latitude coordinate (default: "lat")
 * @property {string} longitude_field - Field name for longitude coordinate (default: "lng")
 * @property {string} label_field - Field name for marker label/title (default: "name")
 * @property {string} stage_field - Field name for stage/status (default: "stage_id")
 * @property {string} value_field - Field name for numeric value used for marker sizing (default: "value")
 * @property {string} city_field - Field name for city (default: "project_city")
 * @property {string} state_field - Field name for state (default: "project_state")
 * @property {string} agency_field - Field name for agency/organization (default: "agency")
 * @property {string} set_aside_field - Field name for set-aside type (default: "set_aside")
 * @property {Record<string, string>} stage_colors - Custom color mapping for stages (optional)
 * @property {Record<string, string>} stage_labels - Custom label mapping for stages (optional)
 * @property {[number, number]} map_center - Map center coordinates [lat, lng] (default: [39.8283, -98.5795] - USA center)
 * @property {number} map_zoom - Initial zoom level (default: 4)
 * @property {number} map_height - Map height in pixels (default: 600)
 * @property {boolean} enable_clustering - Enable marker clustering (default: true)
 * @property {boolean} enable_state_filter - Show state filter dropdown (default: true)
 * @property {boolean} enable_stage_filter - Show stage filter dropdown (default: true)
 * @property {boolean} enable_set_aside_filter - Show set-aside filter dropdown (default: true)
 * @property {string} select_query - Custom Supabase select query (default: "*")
 * 
 * @example
 * // Basic usage with defaults
 * <GeoMapTemplate_Standard />
 * 
 * @example
 * // Custom configuration for different data source
 * <GeoMapTemplate_Standard
 *   title="Construction Sites Map"
 *   data_source="construction_sites"
 *   latitude_field="site_lat"
 *   longitude_field="site_lng"
 *   label_field="site_name"
 *   stage_field="construction_phase"
 *   value_field="budget_amount"
 * />
 */
export interface GeoMapTemplateProps {
  title?: string;
  data_source?: string;
  latitude_field?: string;
  longitude_field?: string;
  label_field?: string;
  stage_field?: string;
  value_field?: string;
  city_field?: string;
  state_field?: string;
  agency_field?: string;
  set_aside_field?: string;
  stage_colors?: Record<string, string>;
  stage_labels?: Record<string, string>;
  map_center?: [number, number];
  map_zoom?: number;
  map_height?: number;
  enable_clustering?: boolean;
  enable_state_filter?: boolean;
  enable_stage_filter?: boolean;
  enable_set_aside_filter?: boolean;
  select_query?: string;
}

// Default stage color mapping
const DEFAULT_STAGE_COLORS: Record<string, string> = {
  opp_proposal: '#ef4444', // Red - bidding
  bidding: '#ef4444',
  opp_negotiation: '#eab308', // Yellow - submitted
  submitted: '#eab308',
  opp_award: '#22c55e', // Green - awarded
  awarded: '#22c55e',
  opp_lost: '#9ca3af', // Gray - lost
  lost: '#9ca3af',
  archived: '#9ca3af',
  opp_lead_gen: '#60a5fa', // Blue - pre-solicitation/joint venture
  joint_venture: '#60a5fa',
  pre_solicitation: '#60a5fa',
};

// Default stage labels
const DEFAULT_STAGE_LABELS: Record<string, string> = {
  opp_proposal: 'Bidding',
  bidding: 'Bidding',
  opp_negotiation: 'Submitted',
  submitted: 'Submitted',
  opp_award: 'Awarded',
  awarded: 'Awarded',
  opp_lost: 'Lost',
  lost: 'Lost',
  archived: 'Archived',
  opp_lead_gen: 'Pre-Solicitation',
  joint_venture: 'Joint Venture',
  pre_solicitation: 'Pre-Solicitation',
};

// Create custom marker icon
const createCustomIcon = (color: string, size: number) => {
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// MarkerCluster component
function MarkerClusterGroup({ children }: { children: React.ReactNode }) {
  const map = useMap();

  useEffect(() => {
    const leafletWithCluster = L as unknown as LeafletWithMarkerCluster;
    const markerClusterGroup = leafletWithCluster.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
    });

    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map]);

  return <>{children}</>;
}

/**
 * GeoMapTemplate_Standard - A reusable geographic map visualization component
 * 
 * This template provides a flexible, configurable map widget that can be used across
 * different dashboards and data sources. It supports filtering, color-coding by stage,
 * dynamic marker sizing, and interactive popups.
 * 
 * @component
 * @param {GeoMapTemplateProps} props - Configuration props for the map
 * @returns {JSX.Element} Rendered map component
 */
export default function GeoMapTemplate_Standard({
  title = 'Geographic Project Distribution',
  data_source = 'v_pipeline_projects_map',
  latitude_field = 'lat',
  longitude_field = 'lng',
  label_field = 'name',
  stage_field = 'stage_id',
  value_field = 'value',
  city_field = 'project_city',
  state_field = 'project_state',
  agency_field = 'agency',
  set_aside_field = 'set_aside',
  stage_colors = DEFAULT_STAGE_COLORS,
  stage_labels = DEFAULT_STAGE_LABELS,
  map_center = [39.8283, -98.5795],
  map_zoom = 4,
  map_height = 600,
  enable_clustering = true,
  enable_state_filter = true,
  enable_stage_filter = true,
  enable_set_aside_filter = true,
  select_query = '*',
}: GeoMapTemplateProps) {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedSetAside, setSelectedSetAside] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(data_source)
        .select(select_query);

      if (error) throw error;

      setProjects((data as unknown as Record<string, unknown>[]) || []);
    } catch (error) {
      console.error(`Error fetching map data from ${data_source}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique states for filter
  const states = useMemo(() => {
    const uniqueStates = [...new Set(projects.map(p => p[state_field] as string))].filter(Boolean).sort();
    return uniqueStates;
  }, [projects, state_field]);

  // Get unique stages for filter
  const stages = useMemo(() => {
    const uniqueStages = [...new Set(projects.map(p => p[stage_field] as string))].filter(Boolean);
    return uniqueStages;
  }, [projects, stage_field]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (selectedState !== 'all' && project[state_field] !== selectedState) return false;
      if (selectedStage !== 'all' && project[stage_field] !== selectedStage) return false;
      if (selectedSetAside !== 'all' && project[set_aside_field] !== selectedSetAside) return false;
      return true;
    });
  }, [projects, selectedState, selectedStage, selectedSetAside, state_field, stage_field, set_aside_field]);

  const handleReset = () => {
    setSelectedState('all');
    setSelectedStage('all');
    setSelectedSetAside('all');
  };

  // Calculate marker size based on project value
  const getMarkerSize = (value: number) => {
    const minSize = 20;
    const maxSize = 40;
    const values = projects.map(p => p[value_field] as number).filter(v => typeof v === 'number');
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    if (maxValue === minValue || values.length === 0) return minSize;
    
    const normalized = (value - minValue) / (maxValue - minValue);
    return minSize + (normalized * (maxSize - minSize));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${map_height}px` }}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
        
        {/* Filter Bar */}
        {(enable_state_filter || enable_stage_filter || enable_set_aside_filter) && (
          <div className="flex flex-wrap gap-3 mt-4">
            {enable_state_filter && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {enable_stage_filter && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">Stage</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage_labels[stage] || stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {enable_set_aside_filter && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">Set-Aside Type</label>
                <Select value={selectedSetAside} onValueChange={setSelectedSetAside}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="small_business">Small Business</SelectItem>
                    <SelectItem value="veteran_owned">Veteran Owned</SelectItem>
                    <SelectItem value="woman_owned">Woman Owned</SelectItem>
                    <SelectItem value="minority_owned">Minority Owned</SelectItem>
                    <SelectItem value="disadvantaged">Disadvantaged</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button variant="outline" onClick={handleReset}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          {Object.entries(stage_colors).slice(0, 5).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-sm">{stage_labels[key] || key}</span>
            </div>
          ))}
          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg overflow-hidden border" style={{ height: `${map_height}px` }}>
          <MapContainer
            center={map_center}
            zoom={map_zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredProjects.map((project, index) => {
              const lat = project[latitude_field] as number;
              const lng = project[longitude_field] as number;
              const stage = project[stage_field] as string;
              const value = project[value_field] as number;
              
              if (!lat || !lng) return null;
              
              const color = stage_colors[stage] || '#6b7280';
              const size = getMarkerSize(value);
              
              return (
                <Marker
                  key={`${project[label_field]}-${index}`}
                  position={[lat, lng]}
                  icon={createCustomIcon(color, size)}
                >
                  <Popup maxWidth={300}>
                    <div className="p-2">
                      <h3 className="font-semibold text-base mb-2">{project[label_field] as string}</h3>
                      
                      <div className="space-y-2 text-sm">
                        {project[city_field] && project[state_field] && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{project[city_field] as string}, {project[state_field] as string}</span>
                          </div>
                        )}
                        
                        {value && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatCurrency(value)}</span>
                          </div>
                        )}
                        
                        {project[agency_field] && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{project[agency_field] as string}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Badge 
                            style={{ backgroundColor: color }}
                            className="text-white"
                          >
                            {stage_labels[stage] || stage}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}