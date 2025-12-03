/**
 * Admin Pipeline Page
 * Main table view with filters, sorting, and bulk actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjects,
  getStatusBreakdown,
  bulkUpdateProjects,
  deleteProject,
} from '@/services/pipeline-admin.service';
import {
  ProjectFilters,
  ProjectRow,
  PaginationParams,
  ProjectStatus,
} from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Filter,
  Download,
  Upload,
  BarChart3,
  Plus,
  MoreVertical,
  Flag,
  Edit,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/pipeline';

export default function AdminPipeline() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 25,
    sort: 'created_at:desc',
  });

  // Load data
  useEffect(() => {
    loadProjects();
  }, [filters, pagination]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await getProjects(filters, pagination);
      setProjects(response.rows);
      setTotal(response.total);
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to load projects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk actions
  const handleBulkFlag = async () => {
    try {
      await bulkUpdateProjects(Array.from(selectedIds), { flagged: true });
      toast.success(`Flagged ${selectedIds.size} projects`);
      setSelectedIds(new Set());
      loadProjects();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to flag projects: ${err.message}`);
    }
  };

  const handleBulkUnflag = async () => {
    try {
      await bulkUpdateProjects(Array.from(selectedIds), { flagged: false });
      toast.success(`Unflagged ${selectedIds.size} projects`);
      setSelectedIds(new Set());
      loadProjects();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to unflag projects: ${err.message}`);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    try {
      await bulkUpdateProjects(Array.from(selectedIds), { status: status as ProjectStatus });
      toast.success(`Updated status for ${selectedIds.size} projects`);
      setSelectedIds(new Set());
      loadProjects();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleBulkExport = () => {
    // Export selected projects
    const selectedProjects = projects.filter((p) => selectedIds.has(p.id));
    // TODO: Implement export
    toast.info('Export feature coming soon');
  };

  // Row actions
  const handleEdit = (id: string) => {
    navigate(`/admin/pipeline/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      toast.success('Project deleted');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      loadProjects();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to delete project: ${err.message}`);
    }
  };

  const handleToggleFlag = async (id: string, currentFlag: boolean) => {
    try {
      await bulkUpdateProjects([id], { flagged: !currentFlag });
      toast.success(currentFlag ? 'Unflagged project' : 'Flagged project');
      loadProjects();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to update flag: ${err.message}`);
    }
  };

  // Filter handlers
  const updateFilter = (key: keyof ProjectFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({});
    setPagination({ page: 1, pageSize: 25, sort: 'created_at:desc' });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Pagination
  const totalPages = Math.ceil(total / pagination.pageSize);
  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.page < totalPages;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pipeline Administration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage projects, import data, and view analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/pipeline/analytics')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/pipeline/import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => navigate('/admin/pipeline/create')}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search by name..."
                    value={filters.search || ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      updateFilter('status', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Bidding">Bidding</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Awarded">Awarded</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pre-Solicitation">
                        Pre-Solicitation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agency */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agency</label>
                  <Input
                    placeholder="Filter by agency..."
                    value={filters.agency || ''}
                    onChange={(e) => updateFilter('agency', e.target.value)}
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select
                    value={filters.dateRange || 'all'}
                    onValueChange={(value) =>
                      updateFilter('dateRange', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="30days">Next 30 days</SelectItem>
                      <SelectItem value="90days">Next 90 days</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value Range</label>
                  <Select
                    value={filters.valueRange || 'all'}
                    onValueChange={(value) =>
                      updateFilter('valueRange', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All values" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All values</SelectItem>
                      <SelectItem value="<1M">&lt; $1M</SelectItem>
                      <SelectItem value="1-5M">$1M - $5M</SelectItem>
                      <SelectItem value="5-10M">$5M - $10M</SelectItem>
                      <SelectItem value="10-25M">$10M - $25M</SelectItem>
                      <SelectItem value=">25M">&gt; $25M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Flagged */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flagged Only</label>
                  <Select
                    value={
                      filters.flagged === undefined
                        ? 'all'
                        : filters.flagged
                        ? 'yes'
                        : 'no'
                    }
                    onValueChange={(value) =>
                      updateFilter(
                        'flagged',
                        value === 'all' ? undefined : value === 'yes' ? 'true' : 'false'
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      <SelectItem value="yes">Flagged only</SelectItem>
                      <SelectItem value="no">Not flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedIds.size} project{selectedIds.size > 1 ? 's' : ''}{' '}
                  selected
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkFlag}>
                    <Flag className="h-4 w-4 mr-1" />
                    Flag
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkUnflag}>
                    Unflag
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange('Bidding')}
                      >
                        Bidding
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange('Submitted')}
                      >
                        Submitted
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange('Awarded')}
                      >
                        Awarded
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange('Lost')}
                      >
                        Lost
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" variant="outline" onClick={handleBulkExport}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          projects.length > 0 &&
                          selectedIds.size === projects.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Set Aside</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Loading projects...</p>
                      </TableCell>
                    </TableRow>
                  ) : projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <p className="text-gray-600">No projects found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(project.id)}
                            onCheckedChange={() => toggleSelect(project.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell>{project.agency || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.status}</Badge>
                        </TableCell>
                        <TableCell>{project.setAside || '-'}</TableCell>
                        <TableCell>{project.manager || '-'}</TableCell>
                        <TableCell>
                          {project.dueDate
                            ? new Date(project.dueDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {project.value
                            ? formatCurrency(project.value, true)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleFlag(project.id, project.flagged)
                            }
                          >
                            <Flag
                              className={`h-4 w-4 ${
                                project.flagged
                                  ? 'fill-orange-500 text-orange-500'
                                  : 'text-gray-400'
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(project.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(project.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, total)} of{' '}
                {total} projects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={!canGoPrevious}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}