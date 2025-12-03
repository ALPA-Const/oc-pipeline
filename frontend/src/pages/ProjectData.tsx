/**
 * Project Data Page
 * Source of truth for all dashboard data
 * Route: /project-data
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Home, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SchemaPanel } from '@/components/project-data/SchemaPanel';
import { ProjectDataTable } from '@/components/project-data/ProjectDataTable';
import { projectDataService } from '@/services/project-data.service';
import type { FieldSchema, ProjectDataRecord, ProjectDataFilters } from '@/types/project-data.types';
import { DROPDOWN_VALUES } from '@/types/project-data.types';
import { toast } from 'sonner';

export default function ProjectData() {
  const navigate = useNavigate();
  const [schema, setSchema] = useState<FieldSchema[]>([]);
  const [data, setData] = useState<ProjectDataRecord[]>([]);
  const [filters, setFilters] = useState<ProjectDataFilters>({});
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | undefined>();

  useEffect(() => {
    loadData();
    trackEvent('projectdata_schema_viewed');
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadData();
    }
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [schemaResponse, dataResponse] = await Promise.all([
        projectDataService.getSchema(),
        projectDataService.getProjectData(filters, 1, 1000),
      ]);

      setSchema(schemaResponse.fields);
      setData(dataResponse.data);
      
      console.log('✅ Project data loaded:', dataResponse.data.length, 'records');
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await projectDataService.generateTemplate({ format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `project-data-template_${date}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Template exported as ${format.toUpperCase()}`);
      trackEvent('projectdata_export', { format });
    } catch (error) {
      console.error('Error exporting template:', error);
      toast.error('Failed to export template');
    }
  };

  const handleAddNewProject = () => {
    trackEvent('projectdata_add_clicked');
    // Navigate to intake form
    navigate('/intake/new');
  };

  const handleFilterChange = (type: keyof ProjectDataFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value === 'all' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const trackEvent = (event: string, data?: Record<string, string>) => {
    console.log(`📊 Event: ${event}`, data);
    // TODO: Send to analytics
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 hover:text-blue-600"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Project Data</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Project Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Source of truth for all dashboards
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => handleExportTemplate('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV Template
            </Button>
            <Button onClick={() => handleExportTemplate('xlsx')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export XLSX Template
            </Button>
            <Button onClick={handleAddNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Project
            </Button>
          </div>
        </div>

        {/* Schema Panel */}
        <SchemaPanel fields={schema} loading={loading} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Quick Filters:</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>

          <Select
            value={filters['Pipeline Status'] || 'all'}
            onValueChange={(value) => handleFilterChange('Pipeline Status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pipeline Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {DROPDOWN_VALUES['Pipeline Status'].map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters['JV'] || 'all'}
            onValueChange={(value) => handleFilterChange('JV', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="JV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All JV</SelectItem>
              {DROPDOWN_VALUES['JV'].map((jv) => (
                <SelectItem key={jv} value={jv}>
                  {jv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters['Set Aside'] || 'all'}
            onValueChange={(value) => handleFilterChange('Set Aside', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Set Aside" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Set-Asides</SelectItem>
              {DROPDOWN_VALUES['Set Aside'].map((setAside) => (
                <SelectItem key={setAside} value={setAside}>
                  {setAside}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Records Count */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {data.length} {data.length === 1 ? 'Record' : 'Records'}
          </h2>
        </div>

        {/* Table */}
        <ProjectDataTable data={data} loading={loading} highlightId={highlightId} />
      </div>
    </div>
  );
}