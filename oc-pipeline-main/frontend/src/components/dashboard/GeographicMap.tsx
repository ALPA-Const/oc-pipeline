import GeoMapTemplate_Standard from '@/templates/maps/GeoMapTemplate_Standard';

/**
 * Geographic Map component for Opportunity Dashboard
 * 
 * This component uses the GeoMapTemplate_Standard template with configuration
 * specific to the pipeline_projects data source.
 * 
 * @component
 * @returns {JSX.Element} Rendered geographic map
 */
export default function GeographicMap() {
  return (
    <GeoMapTemplate_Standard
      title="Geographic Project Distribution"
      data_source="v_pipeline_projects_map"
      latitude_field="lat"
      longitude_field="lng"
      label_field="name"
      stage_field="stage_id"
      value_field="value"
      city_field="project_city"
      state_field="project_state"
      agency_field="agency"
      set_aside_field="set_aside"
      map_center={[39.8283, -98.5795]}
      map_zoom={4}
      map_height={600}
      enable_clustering={true}
      enable_state_filter={true}
      enable_stage_filter={true}
      enable_set_aside_filter={true}
    />
  );
}