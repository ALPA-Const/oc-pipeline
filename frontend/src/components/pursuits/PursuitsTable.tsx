// ============================================================
// ENHANCED PURSUITS TABLE - GOVTRIBE STYLE
// Pipeline progress tracking with "Not Interested" exclusion
// ============================================================

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Ban,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { supabase } from '@/lib/supabase';


// ============================================================
// PIPELINE STAGES (GovTribe Style)
// ============================================================

export const PIPELINE_STAGES = [
  { value: 'triage', label: 'Triage', color: 'bg-gray-100 text-gray-800' },
  { value: 'sources_sought', label: 'Sources Sought', color: 'bg-blue-100 text-blue-800' },
  { value: 'pre_solicitation', label: 'Pre-Solicitation', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'solicitation', label: 'Solicitation', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'bidding', label: 'Bidding', color: 'bg-purple-100 text-purple-800' },
  { value: 'submitted', label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'evaluation', label: 'Evaluation', color: 'bg-orange-100 text-orange-800' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
  { value: 'loss', label: 'Loss', color: 'bg-red-100 text-red-800' },
  { value: 'complete', label: 'Complete', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-slate-200 text-slate-600' },
] as const;

export const SET_ASIDE_OPTIONS = [
  { value: '8a', label: '8(a)' },
  { value: 'SDVOSB', label: 'SDVOSB' },
  { value: 'VOSB', label: 'VOSB' },
  { value: 'HUBZone', label: 'HUBZone' },
  { value: 'WOSB', label: 'WOSB' },
  { value: 'EDWOSB', label: 'EDWOSB' },
  { value: 'small_business', label: 'Small Business' },
  { value: 'full_open', label: 'Full & Open' },
];


// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
};

const getStageInfo = (stage: string) => {
  return PIPELINE_STAGES.find(s => s.value === stage) || PIPELINE_STAGES[0];
};

const getSetAsideBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'SDVOSB': 'bg-purple-100 text-purple-800',
    '8a': 'bg-blue-100 text-blue-800',
    'HUBZone': 'bg-orange-100 text-orange-800',
    'WOSB': 'bg-pink-100 text-pink-800',
    'EDWOSB': 'bg-pink-100 text-pink-800',
    'small_business': 'bg-green-100 text-green-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};


// ============================================================
// TYPES
// ============================================================

interface Pursuit {
  id: string;
  name: string;
  solicitation_number?: string;
  agency?: string;
  contracting_office?: string;
  estimated_value?: number;
  set_aside_type?: string;
  naics_code?: string;
  bid_due_date?: string;
  stage?: string;
  status?: string;
  win_probability?: number;
  source?: string;
  source_url?: string;
  notes?: string;
  created_at?: string;
}

interface PursuitsTableProps {
  onRefresh?: () => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PursuitsTable({ onRefresh }: PursuitsTableProps) {
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [setAsideFilter, setSetAsideFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Not Interested Dialog
  const [notInterestedId, setNotInterestedId] = useState<string | null>(null);
  const [notInterestedName, setNotInterestedName] = useState('');


  // Fetch pursuits (excluding "not_interested")
  const fetchPursuits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pursuits')
        .select('*')
        .neq('stage', 'not_interested')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPursuits(data || []);
    } catch (error) {
      console.error('Error fetching pursuits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPursuits();
  }, []);

  // Update pursuit stage
  const updateStage = async (id: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('pursuits')
        .update({ stage: newStage, status: newStage })
        .eq('id', id);

      if (error) throw error;
      
      // If marking as not_interested, remove from list
      if (newStage === 'not_interested') {
        setPursuits(prev => prev.filter(p => p.id !== id));
      } else {
        setPursuits(prev => prev.map(p => 
          p.id === id ? { ...p, stage: newStage, status: newStage } : p
        ));
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };


  // Confirm "Not Interested" - permanently excludes
  const confirmNotInterested = async () => {
    if (!notInterestedId) return;
    await updateStage(notInterestedId, 'not_interested');
    setNotInterestedId(null);
    setNotInterestedName('');
  };

  // Delete pursuit
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pursuit permanently?')) return;
    try {
      const { error } = await supabase
        .from('pursuits')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setPursuits(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Filter pursuits
  const filteredPursuits = pursuits.filter(p => {
    const matchesSearch = !search || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.solicitation_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.agency?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
    const matchesSetAside = setAsideFilter === 'all' || p.set_aside_type === setAsideFilter;
    
    return matchesSearch && matchesStage && matchesSetAside;
  });

  const activeFilters = [stageFilter, setAsideFilter].filter(f => f !== 'all').length;


  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, solicitation #, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className={activeFilters > 0 ? 'border-blue-500' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {activeFilters > 0 && `(${activeFilters})`}
        </Button>
        
        <Button variant="ghost" size="icon" onClick={fetchPursuits}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Stage:</span>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {PIPELINE_STAGES.filter(s => s.value !== 'not_interested').map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Set-Aside:</span>
                <Select value={setAsideFilter} onValueChange={setSetAsideFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {SET_ASIDE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilters > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStageFilter('all');
                    setSetAsideFilter('all');
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[35%]">Name</TableHead>
                <TableHead className="w-[15%]">Stage</TableHead>
                <TableHead>Set-Aside</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Est. Value</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading pursuits...
                  </TableCell>
                </TableRow>
              ) : filteredPursuits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {search || activeFilters > 0 
                      ? 'No pursuits match your filters' 
                      : 'No pursuits yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPursuits.map((pursuit) => {
                  const stageInfo = getStageInfo(pursuit.stage || 'triage');
                  return (
                    <TableRow key={pursuit.id} className="hover:bg-gray-50">

                      {/* Name Column */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm line-clamp-1">
                            {pursuit.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {pursuit.agency && <span>{pursuit.agency}</span>}
                            {pursuit.solicitation_number && (
                              <span className="text-gray-400">
                                #{pursuit.solicitation_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Stage Dropdown */}
                      <TableCell>
                        <Select
                          value={pursuit.stage || 'triage'}
                          onValueChange={(value) => {
                            if (value === 'not_interested') {
                              setNotInterestedId(pursuit.id);
                              setNotInterestedName(pursuit.name);
                            } else {
                              updateStage(pursuit.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className={`h-7 text-xs ${stageInfo.color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map(stage => (
                              <SelectItem key={stage.value} value={stage.value}>
                                <span className={stage.value === 'not_interested' ? 'text-red-600' : ''}>
                                  {stage.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>


                      {/* Set-Aside */}
                      <TableCell>
                        {pursuit.set_aside_type ? (
                          <Badge className={`text-xs ${getSetAsideBadgeColor(pursuit.set_aside_type)}`}>
                            {pursuit.set_aside_type}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="text-sm">
                        {formatDate(pursuit.bid_due_date)}
                      </TableCell>

                      {/* Est. Value */}
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(pursuit.estimated_value)}
                      </TableCell>

                      {/* Win % */}
                      <TableCell className="text-sm">
                        {pursuit.win_probability ? `${pursuit.win_probability}%` : '-'}
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            {pursuit.source_url && (
                              <DropdownMenuItem asChild>
                                <a 
                                  href={pursuit.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View on SAM.gov
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={() => {
                                setNotInterestedId(pursuit.id);
                                setNotInterestedName(pursuit.name);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Not Interested
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(pursuit.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      {/* Not Interested Confirmation Dialog */}
      <AlertDialog open={!!notInterestedId} onOpenChange={() => setNotInterestedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Not Interested?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{notInterestedName}"</strong> will be permanently removed from your pipeline.
              <br /><br />
              This opportunity will not appear in future imports or searches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={confirmNotInterested}
            >
              <Ban className="w-4 h-4 mr-2" />
              Not Interested
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredPursuits.length} of {pursuits.length} pursuits
      </div>
    </div>
  );
}

export default PursuitsTable;
