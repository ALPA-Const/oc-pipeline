// ============================================================
// OC PIPELINE - AI TAKEOFF TAB COMPONENT
// Elite Agentic AI Estimator - 4 Checkpoint Workflow
// ============================================================

import { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  ChevronRight,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Download,
  Sparkles,
  Shield,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { aiTakeoffService } from '@/services/ai-takeoff.service';
import type {
  AITakeoffSession,
  AICheckpoint,
  CostRegion,
  TakeoffStatus,
} from '@/types/ai-takeoff.types';



// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: TakeoffStatus): string => {
  const colors: Record<string, string> = {
    initialized: 'bg-gray-100 text-gray-800',
    agent1_running: 'bg-blue-100 text-blue-800',
    agent1_complete: 'bg-blue-100 text-blue-800',
    checkpoint1_pending: 'bg-yellow-100 text-yellow-800',
    agent2_running: 'bg-blue-100 text-blue-800',
    agent2_complete: 'bg-blue-100 text-blue-800',
    checkpoint2_pending: 'bg-yellow-100 text-yellow-800',
    pricing_running: 'bg-purple-100 text-purple-800',
    checkpoint3_pending: 'bg-yellow-100 text-yellow-800',
    checkpoint4_pending: 'bg-orange-100 text-orange-800',
    finalized: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusDisplay = (status: TakeoffStatus): string => {
  const display: Record<string, string> = {
    initialized: 'Ready',
    agent1_running: 'Analyzing...',
    agent1_complete: 'Drawings Done',
    checkpoint1_pending: 'Review Quantities',
    agent2_running: 'Processing Specs...',
    agent2_complete: 'Specs Done',
    checkpoint2_pending: 'Review CSI Codes',
    pricing_running: 'Pricing...',
    checkpoint3_pending: 'Review Pricing',
    checkpoint4_pending: 'Final Approval',
    finalized: 'Complete',
    error: 'Error',
  };
  return display[status] || status;
};

const getRiskColor = (level: string | undefined): string => {
  if (!level) return 'bg-gray-100 text-gray-800';
  const colors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
};

const getConfidenceColor = (level: string | undefined): string => {
  if (!level) return 'bg-gray-100 text-gray-800';
  const colors: Record<string, string> = {
    HIGH: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
};

const getProgressPercent = (status: TakeoffStatus): number => {
  const progress: Record<string, number> = {
    initialized: 0,
    agent1_running: 15,
    agent1_complete: 25,
    checkpoint1_pending: 25,
    agent2_running: 40,
    agent2_complete: 50,
    checkpoint2_pending: 50,
    pricing_running: 65,
    checkpoint3_pending: 75,
    checkpoint4_pending: 90,
    finalized: 100,
    error: 0,
  };
  return progress[status] || 0;
};




// ============================================================
// CREATE SESSION DIALOG
// ============================================================

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  regions: CostRegion[];
}

function CreateSessionDialog({ open, onOpenChange, onCreated, regions }: CreateSessionDialogProps) {
  const [sessionName, setSessionName] = useState('');
  const [regionCode, setRegionCode] = useState('MIDWEST');
  const [riskValues, setRiskValues] = useState({
    projectComplexity: 5,
    specificationClarity: 5,
    marketVolatility: 5,
    subcontractorAvailability: 5,
    scheduleConstraints: 5,
    siteConditions: 5,
    regulatoryRequirements: 5,
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    
    setCreating(true);
    try {
      await aiTakeoffService.createSession({
        sessionName: sessionName.trim(),
        regionCode,
        riskAssessment: riskValues,
      });
      setSessionName('');
      onOpenChange(false);
      onCreated();
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setCreating(false);
    }
  };

  const riskFields = [
    { key: 'projectComplexity', label: 'Project Complexity' },
    { key: 'specificationClarity', label: 'Specification Clarity' },
    { key: 'marketVolatility', label: 'Market Volatility' },
    { key: 'subcontractorAvailability', label: 'Subcontractor Availability' },
    { key: 'scheduleConstraints', label: 'Schedule Constraints' },
    { key: 'siteConditions', label: 'Site Conditions' },
    { key: 'regulatoryRequirements', label: 'Regulatory Requirements' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            New AI Takeoff Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Session Name */}
          <div>
            <Label>Session Name *</Label>
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., VA Medical Center - Phase 1"
            />
          </div>

          {/* Region */}
          <div>
            <Label>Cost Region</Label>
            <Select value={regionCode} onValueChange={setRegionCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.regionCode} value={r.regionCode}>
                    {r.regionName} ({(r.adjustmentFactor * 100).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Assessment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <Label className="text-base font-semibold">Risk Assessment</Label>
            </div>
            <p className="text-sm text-gray-500">
              Rate each factor from 1 (Low Risk) to 10 (High Risk)
            </p>
            
            {riskFields.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">{label}</Label>
                  <span className="text-sm font-medium">
                    {riskValues[key as keyof typeof riskValues]}
                  </span>
                </div>
                <Slider
                  value={[riskValues[key as keyof typeof riskValues]]}
                  onValueChange={([val]) => 
                    setRiskValues(prev => ({ ...prev, [key]: val }))
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!sessionName.trim() || creating}>
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




// ============================================================
// SESSION CARD
// ============================================================

interface SessionCardProps {
  session: AITakeoffSession;
  onSelect: () => void;
  onDelete: () => void;
}

function SessionCard({ session, onSelect, onDelete }: SessionCardProps) {
  const progress = getProgressPercent(session.status);
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">{session.sessionName}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status & Progress */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <Badge className={getStatusColor(session.status)}>
              {getStatusDisplay(session.status)}
            </Badge>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold">{session.totalLineItems}</div>
            <div className="text-gray-500 text-xs">Items</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <Badge className={getRiskColor(session.riskLevel)} variant="outline">
              {session.riskLevel || 'N/A'}
            </Badge>
            <div className="text-gray-500 text-xs mt-1">Risk</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-green-600">
              {formatCurrency(session.subtotalLikely)}
            </div>
            <div className="text-gray-500 text-xs">Est. Total</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
          <span>Created {formatDate(session.createdAt)}</span>
          <span>{session.regionCode}</span>
        </div>
      </CardContent>
    </Card>
  );
}


// ============================================================
// CHECKPOINT PROGRESS
// ============================================================

interface CheckpointProgressProps {
  checkpoints: AICheckpoint[];
  currentStatus: TakeoffStatus;
}

function CheckpointProgress({ checkpoints, currentStatus }: CheckpointProgressProps) {
  const getCheckpointIcon = (cp: AICheckpoint) => {
    if (cp.status === 'approved') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (cp.status === 'in_progress') return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    if (cp.status === 'rejected') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      {checkpoints.map((cp, idx) => (
        <div key={cp.id} className="flex items-center">
          <div className="flex flex-col items-center">
            {getCheckpointIcon(cp)}
            <span className="text-xs mt-1 text-center max-w-[80px]">
              {cp.checkpointName}
            </span>
            {cp.status === 'approved' && cp.itemsCorrected > 0 && (
              <Badge variant="outline" className="text-xs mt-1">
                {cp.itemsCorrected} fixed
              </Badge>
            )}
          </div>
          {idx < checkpoints.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
}




// ============================================================
// MAIN AI TAKEOFF TAB COMPONENT
// ============================================================

interface AITakeoffTabProps {
  onRefresh?: () => void;
}

export default function AITakeoffTab({ onRefresh }: AITakeoffTabProps) {
  const [sessions, setSessions] = useState<AITakeoffSession[]>([]);
  const [regions, setRegions] = useState<CostRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AITakeoffSession | null>(null);
  const [checkpoints, setCheckpoints] = useState<AICheckpoint[]>([]);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, regionsData] = await Promise.all([
        aiTakeoffService.fetchSessions(),
        aiTakeoffService.fetchRegions(),
      ]);
      setSessions(sessionsData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading AI takeoff data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load checkpoints when session selected
  const loadSessionDetails = async (session: AITakeoffSession) => {
    try {
      const cps = await aiTakeoffService.fetchCheckpoints(session.id);
      setCheckpoints(cps);
    } catch (error) {
      console.error('Error loading checkpoints:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails(selectedSession);
    }
  }, [selectedSession]);

  // Filter sessions
  const filteredSessions = sessions.filter(s =>
    s.sessionName.toLowerCase().includes(search.toLowerCase())
  );

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this AI takeoff session? This cannot be undone.')) return;
    
    try {
      await aiTakeoffService.deleteSession(id);
      loadData();
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Stats
  const stats = {
    total: sessions.length,
    inProgress: sessions.filter(s => !['initialized', 'finalized', 'error'].includes(s.status)).length,
    completed: sessions.filter(s => s.status === 'finalized').length,
    totalValue: sessions.reduce((sum, s) => sum + (s.subtotalLikely || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Est. Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search AI takeoff sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New AI Takeoff
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading AI takeoff sessions...</span>
        </div>
      ) : selectedSession ? (
        // Session Detail View
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedSession(null)}>
            ← Back to Sessions
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-600" />
                  {selectedSession.sessionName}
                </CardTitle>
                <Badge className={getStatusColor(selectedSession.status)}>
                  {getStatusDisplay(selectedSession.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{getProgressPercent(selectedSession.status)}%</span>
                </div>
                <Progress value={getProgressPercent(selectedSession.status)} className="h-3" />
              </div>

              {/* Checkpoints */}
              {checkpoints.length > 0 && (
                <CheckpointProgress 
                  checkpoints={checkpoints} 
                  currentStatus={selectedSession.status} 
                />
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedSession.totalLineItems}</div>
                  <div className="text-sm text-gray-500">Line Items</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Badge className={getRiskColor(selectedSession.riskLevel)}>
                    {selectedSession.riskLevel || 'N/A'}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">Risk Level</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedSession.subtotalLikely)}
                  </div>
                  <div className="text-sm text-gray-500">Likely Total</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm">
                    <span className="text-red-600">{formatCurrency(selectedSession.subtotalLow)}</span>
                    {' - '}
                    <span className="text-blue-600">{formatCurrency(selectedSession.subtotalHigh)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Range (Low-High)</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedSession.status === 'initialized' && (
                  <Button className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start AI Analysis
                  </Button>
                )}
                {selectedSession.status.includes('checkpoint') && (
                  <Button className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Items
                  </Button>
                )}
                {selectedSession.status === 'finalized' && (
                  <>
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export to Excel
                    </Button>
                    <Button className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Import to Estimate
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      ) : filteredSessions.length === 0 ? (
        // Empty State
        <Card className="p-12 text-center">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'No sessions found' : 'No AI Takeoff Sessions Yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {search 
              ? 'Try adjusting your search' 
              : 'Create your first AI-powered takeoff session to get started'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Create First Session
            </Button>
          )}
        </Card>
      ) : (
        // Sessions Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={() => setSelectedSession(session)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={loadData}
        regions={regions}
      />
    </div>
  );
}
