import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Target,
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Plus,
  MessageSquare,
  Paperclip,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Types - matching your actual database schema
interface PursuitDetail {
  id: string;
  solicitation_number: string;
  title: string;
  description: string;
  agency: string;
  contracting_office: string;
  location_city: string;
  location_state: string;
  location_address: string;
  estimated_value: number;
  bid_due_date: string;  // Your DB uses bid_due_date
  posted_date: string;
  stage: 'identified' | 'tracking' | 'go' | 'no_go' | 'bidding' | 'submitted' | 'won' | 'lost' | 'cancelled';
  set_aside_type: string;  // Your DB uses set_aside_type
  naics_code: string;
  naics_description: string;
  psc_code: string;
  win_probability: number;
  project_type: string;
  contract_type: string;
  period_of_performance: string;
  place_of_performance: string;
  poc_name: string;
  poc_email: string;
  poc_phone: string;
  incumbent: string;
  estimated_start_date: string;
  bonding_required: boolean;
  security_clearance: string;
  site_visit_date: string;
  questions_due_date: string;
  workspace_id: string;  // Your DB uses workspace_id
  team: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploaded_at: string;
  }>;
  activities: Array<{
    id: string;
    type: 'stage_change' | 'note' | 'document' | 'meeting';
    description: string;
    user: string;
    timestamp: string;
  }>;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Mock data
const mockPursuitDetail: PursuitDetail = {
  id: '1',
  solicitation_number: 'VA-123-24-R-0045',
  title: 'Jesse Brown VA Medical Center - HVAC Modernization',
  description:
    'Complete modernization of the heating, ventilation, and air conditioning systems at the Jesse Brown VA Medical Center. Work includes replacement of all air handling units, installation of new ductwork, upgrading building automation systems, and ensuring compliance with healthcare facility standards.',
  agency: 'Department of Veterans Affairs',
  contracting_office: 'Network Contracting Office 12',
  location_city: 'Chicago',
  location_state: 'IL',
  location_address: '820 S Damen Ave, Chicago, IL 60612',
  estimated_value: 12500000,
  bid_due_date: '2025-01-15T14:00:00Z',
  posted_date: '2024-11-01T00:00:00Z',
  stage: 'go',
  set_aside_type: 'SDVOSB',
  naics_code: '236220',
  naics_description: 'Commercial and Institutional Building Construction',
  psc_code: 'Z2DA',
  win_probability: 65,
  project_type: 'Healthcare',
  contract_type: 'Firm Fixed Price',
  period_of_performance: '18 months',
  place_of_performance: 'Jesse Brown VA Medical Center, Chicago, IL',
  poc_name: 'Sarah Mitchell',
  poc_email: 'sarah.mitchell@va.gov',
  poc_phone: '(312) 555-0142',
  incumbent: 'ABC Construction Corp',
  estimated_start_date: '2025-03-01',
  bonding_required: true,
  security_clearance: 'None required',
  site_visit_date: '2024-12-20T10:00:00Z',
  questions_due_date: '2025-01-05T14:00:00Z',
  workspace_id: '1',
  team: [
    { id: '1', name: 'Bill Asmar', role: 'Capture Manager' },
    { id: '2', name: 'Mike Johnson', role: 'Estimator' },
    { id: '3', name: 'Sarah Chen', role: 'Proposal Writer' },
  ],
  documents: [
    { id: '1', name: 'Solicitation Package.pdf', type: 'PDF', size: '4.2 MB', uploaded_at: '2024-11-02' },
    { id: '2', name: 'Drawings - Mechanical.pdf', type: 'PDF', size: '28.5 MB', uploaded_at: '2024-11-02' },
    { id: '3', name: 'Specifications.pdf', type: 'PDF', size: '12.1 MB', uploaded_at: '2024-11-02' },
    { id: '4', name: 'Site Visit Photos.zip', type: 'ZIP', size: '156 MB', uploaded_at: '2024-12-20' },
  ],
  activities: [
    {
      id: '1',
      type: 'stage_change',
      description: 'Stage changed from Tracking to Go',
      user: 'Bill Asmar',
      timestamp: '2024-12-10T14:30:00Z',
    },
    {
      id: '2',
      type: 'meeting',
      description: 'Completed site visit with VA facilities team',
      user: 'Mike Johnson',
      timestamp: '2024-12-20T16:00:00Z',
    },
    {
      id: '3',
      type: 'note',
      description: 'Confirmed SDVOSB set-aside. O\'Neill qualifies as prime.',
      user: 'Bill Asmar',
      timestamp: '2024-11-15T09:00:00Z',
    },
  ],
  notes:
    'Strong opportunity - we have past performance at Hines VA. Need to identify mechanical subcontractor. Consider partnering with Johnson Controls for BAS work.',
  created_at: '2024-11-01T00:00:00Z',
  updated_at: '2024-12-10T00:00:00Z',
};

// Stage configuration - matching your database values
const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  identified: { label: 'Identified', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  tracking: { label: 'Tracking', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  go: { label: 'Go', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  no_go: { label: 'No-Go', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  bidding: { label: 'Bidding', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  submitted: { label: 'Submitted', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  won: { label: 'Won', color: 'text-green-700', bgColor: 'bg-green-100' },
  lost: { label: 'Lost', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

const stageProgress: Record<string, number> = {
  identified: 15,
  tracking: 30,
  go: 50,
  no_go: 30,
  bidding: 65,
  submitted: 80,
  won: 100,
  lost: 100,
  cancelled: 100,
};

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const calculateDaysUntilDue = (bidDueDate: string): number => {
  const now = new Date();
  const due = new Date(bidDueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function PursuitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pursuit, setPursuit] = useState<PursuitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoNoGoOpen, setIsGoNoGoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API call - replace with actual service call
    setTimeout(() => {
      setPursuit(mockPursuitDetail);
      setIsLoading(false);
    }, 300);
  }, [id]);

  const handleGoNoGoDecision = (decision: 'go' | 'no_go') => {
    if (pursuit) {
      setPursuit({
        ...pursuit,
        stage: decision,
      });
      setIsGoNoGoOpen(false);
    }
  };

  if (isLoading || !pursuit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const daysUntilDue = calculateDaysUntilDue(pursuit.bid_due_date);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pursuits')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{pursuit.title}</h1>
              <Badge className={`${stageConfig[pursuit.stage]?.bgColor || 'bg-gray-100'} ${stageConfig[pursuit.stage]?.color || 'text-gray-700'}`}>
                {stageConfig[pursuit.stage]?.label || pursuit.stage}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="font-mono">{pursuit.solicitation_number}</span>
              <span>•</span>
              <span>{pursuit.agency}</span>
              <span>•</span>
              <Badge variant="outline">{pursuit.set_aside_type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pursuit.stage === 'tracking' && (
            <Button onClick={() => setIsGoNoGoOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Go/No-Go Decision
            </Button>
          )}
          {pursuit.stage === 'go' && (
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <FileText className="w-4 h-4 mr-2" />
              Create Estimate
            </Button>
          )}
          <Button variant="outline" size="icon">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pipeline Stage</span>
            <span className="text-sm text-gray-500 capitalize">{stageConfig[pursuit.stage]?.label || pursuit.stage}</span>
          </div>
          <Progress value={stageProgress[pursuit.stage] || 0} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Identified</span>
            <span>Tracking</span>
            <span>Go</span>
            <span>Bidding</span>
            <span>Submitted</span>
            <span>Award</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents ({pursuit.documents.length})</TabsTrigger>
              <TabsTrigger value="team">Team ({pursuit.team.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{pursuit.description}</p>
                </CardContent>
              </Card>

              {/* Key Details Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Solicitation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Contract Type</p>
                      <p className="font-medium mt-1">{pursuit.contract_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Period of Performance</p>
                      <p className="font-medium mt-1">{pursuit.period_of_performance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">NAICS Code</p>
                      <p className="font-medium mt-1">{pursuit.naics_code}</p>
                      <p className="text-sm text-gray-500">{pursuit.naics_description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">PSC Code</p>
                      <p className="font-medium mt-1">{pursuit.psc_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Incumbent</p>
                      <p className="font-medium mt-1">{pursuit.incumbent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Security Clearance</p>
                      <p className="font-medium mt-1">{pursuit.security_clearance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Bonding Required</p>
                      <p className="font-medium mt-1">{pursuit.bonding_required ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Est. Start Date</p>
                      <p className="font-medium mt-1">{formatDate(pursuit.estimated_start_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Capture Notes</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{pursuit.notes}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Documents</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pursuit.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {doc.size} • Uploaded {doc.uploaded_at}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Pursuit Team</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pursuit.team.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pursuit.activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'stage_change'
                                ? 'bg-indigo-100'
                                : activity.type === 'meeting'
                                ? 'bg-green-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            {activity.type === 'stage_change' && <TrendingUp className="w-4 h-4 text-indigo-600" />}
                            {activity.type === 'meeting' && <Users className="w-4 h-4 text-green-600" />}
                            {activity.type === 'note' && <MessageSquare className="w-4 h-4 text-gray-600" />}
                            {activity.type === 'document' && <Paperclip className="w-4 h-4 text-gray-600" />}
                          </div>
                          {index < pursuit.activities.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 -mb-4 h-full"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.user} • {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Estimated Value</span>
                </div>
                <span className="font-semibold text-lg">{formatCurrency(pursuit.estimated_value)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Win Probability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pursuit.win_probability} className="w-16 h-2" />
                  <span className="font-semibold">{pursuit.win_probability}%</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Weighted Value</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(pursuit.estimated_value * (pursuit.win_probability / 100))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Bid Due Date</span>
                </div>
                <p className="font-medium mt-1 text-red-600">{formatDateTime(pursuit.bid_due_date)}</p>
                <p className="text-sm text-red-500">{daysUntilDue} days remaining</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Questions Due</span>
                </div>
                <p className="font-medium mt-1">{formatDateTime(pursuit.questions_due_date)}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Site Visit</span>
                </div>
                <p className="font-medium mt-1">{formatDateTime(pursuit.site_visit_date)}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Posted Date</span>
                </div>
                <p className="font-medium mt-1">{formatDate(pursuit.posted_date)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Point of Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Point of Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{pursuit.poc_name}</p>
                  <p className="text-sm text-gray-500">{pursuit.contracting_office}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <a
                  href={`mailto:${pursuit.poc_email}`}
                  className="flex items-center gap-2 text-indigo-600 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {pursuit.poc_email}
                </a>
                <a
                  href={`tel:${pursuit.poc_phone}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Phone className="w-4 h-4" />
                  {pursuit.poc_phone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{pursuit.place_of_performance}</p>
                  <p className="text-sm text-gray-500 mt-1">{pursuit.location_address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Go/No-Go Decision Modal */}
      <Dialog open={isGoNoGoOpen} onOpenChange={setIsGoNoGoOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Go/No-Go Decision</DialogTitle>
            <DialogDescription>Make a pursuit decision for this opportunity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{pursuit.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{pursuit.solicitation_number}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Value</p>
                  <p className="font-medium">{formatCurrency(pursuit.estimated_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(pursuit.bid_due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Set-Aside</p>
                  <p className="font-medium">{pursuit.set_aside_type}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Decision Notes</label>
              <Textarea
                placeholder="Document your reasoning for this decision..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsGoNoGoOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGoNoGoDecision('no_go')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              No-Go
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleGoNoGoDecision('go')}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
