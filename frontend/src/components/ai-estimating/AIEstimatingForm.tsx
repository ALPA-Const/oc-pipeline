// ============================================================
// AI AGENTIC ESTIMATING FORM
// Multi-agent estimating system for federal construction
// ============================================================

import { useState } from 'react';
import {
  Bot,
  Play,
  FileText,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { AGENTIC_SYSTEM_PROMPT } from './estimating-prompt';

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

const CONTRACT_TYPES = [
  { value: 'firm_fixed_price', label: 'Firm Fixed Price (FFP)' },
  { value: 'cost_plus_fixed_fee', label: 'Cost Plus Fixed Fee (CPFF)' },
  { value: 'cost_plus_incentive', label: 'Cost Plus Incentive Fee (CPIF)' },
  { value: 'time_materials', label: 'Time & Materials (T&M)' },
  { value: 'idiq', label: 'IDIQ' },
  { value: 'bpa', label: 'BPA' },
  { value: 'gwac', label: 'GWAC' },
];

const DELIVERY_METHODS = [
  { value: 'design_bid_build', label: 'Design-Bid-Build' },
  { value: 'design_build', label: 'Design-Build' },
  { value: 'cmar', label: 'CM at Risk (CMAR)' },
  { value: 'job_order', label: 'Job Order Contract (JOC)' },
  { value: 'best_value', label: 'Best Value' },
  { value: 'lpta', label: 'Lowest Price Technically Acceptable (LPTA)' },
];

const ESTIMATE_STAGES = [
  { value: 'rom', label: 'ROM (Rough Order of Magnitude)' },
  { value: 'conceptual', label: 'Conceptual / Schematic' },
  { value: 'design_development', label: 'Design Development' },
  { value: 'construction_documents', label: 'Construction Documents' },
  { value: 'bid_proposal', label: 'Bid / Proposal' },
  { value: 'change_order', label: 'Change Order' },
];

const LABOR_BASIS = [
  { value: 'davis_bacon', label: 'Davis-Bacon (Federal)' },
  { value: 'state_prevailing', label: 'State Prevailing Wage' },
  { value: 'union', label: 'Union Scale' },
  { value: 'open_shop', label: 'Open Shop' },
  { value: 'project_labor_agreement', label: 'Project Labor Agreement (PLA)' },
];

const RISK_PROFILES = [
  { value: 'low', label: 'Low Risk' },
  { value: 'moderate', label: 'Moderate Risk' },
  { value: 'high', label: 'High Risk' },
  { value: 'critical', label: 'Critical / Mission Essential' },
];

const AGENT_MODES = [
  { value: 'single', label: 'Single Agent (ALPHA Only)' },
  { value: 'multi', label: 'Multi-Agent (Full Team)' },
];


// ============================================================
// TYPES
// ============================================================

interface EstimateInputs {
  project_name: string;
  agency: string;
  project_location: string;
  contract_type: string;
  delivery_method: string;
  estimate_stage: string;
  pricing_date: string;
  labor_basis: string;
  wage_determination: string;
  schedule_duration_days: string;
  risk_profile: string;
  rfp_inputs: string;
  agent_mode: 'single' | 'multi';
  enable_scope_agent: boolean;
  enable_quantity_agent: boolean;
  enable_market_labor_agent: boolean;
  enable_risk_validation_agent: boolean;
}

interface AIEstimatingFormProps {
  onEstimateGenerated?: (result: string) => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AIEstimatingForm({ onEstimateGenerated }: AIEstimatingFormProps) {
  const [inputs, setInputs] = useState<EstimateInputs>({
    project_name: '',
    agency: '',
    project_location: '',
    contract_type: 'firm_fixed_price',
    delivery_method: 'design_bid_build',
    estimate_stage: 'bid_proposal',
    pricing_date: new Date().toISOString().split('T')[0],
    labor_basis: 'davis_bacon',
    wage_determination: '',
    schedule_duration_days: '',
    risk_profile: 'moderate',
    rfp_inputs: '',
    agent_mode: 'single',
    enable_scope_agent: true,
    enable_quantity_agent: true,
    enable_market_labor_agent: true,
    enable_risk_validation_agent: true,
  });

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);


  // Update input field
  const updateInput = (field: keyof EstimateInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Validate required fields
  const isValid = () => {
    return (
      inputs.project_name.trim() &&
      inputs.agency.trim() &&
      inputs.project_location.trim() &&
      inputs.rfp_inputs.trim()
    );
  };

  // Generate the full prompt
  const generatePrompt = (): string => {
    const agentConfig = inputs.agent_mode === 'multi' 
      ? `
agent_mode: MULTI
enable_scope_agent: ${inputs.enable_scope_agent}
enable_quantity_agent: ${inputs.enable_quantity_agent}
enable_market_labor_agent: ${inputs.enable_market_labor_agent}
enable_risk_validation_agent: ${inputs.enable_risk_validation_agent}
`
      : `agent_mode: SINGLE`;

    return `${AGENTIC_SYSTEM_PROMPT}

--------------------------------------------------
AGENT CONFIGURATION
--------------------------------------------------
${agentConfig}

--------------------------------------------------
PROJECT PARAMETERS
--------------------------------------------------
Project Name: ${inputs.project_name}
Agency / Client: ${inputs.agency}
Location: ${inputs.project_location}
Contract Type: ${CONTRACT_TYPES.find(c => c.value === inputs.contract_type)?.label || inputs.contract_type}
Delivery Method: ${DELIVERY_METHODS.find(d => d.value === inputs.delivery_method)?.label || inputs.delivery_method}
Estimate Stage: ${ESTIMATE_STAGES.find(e => e.value === inputs.estimate_stage)?.label || inputs.estimate_stage}
Pricing Date: ${inputs.pricing_date}
Labor Basis: ${LABOR_BASIS.find(l => l.value === inputs.labor_basis)?.label || inputs.labor_basis}
Wage Determination: ${inputs.wage_determination || 'To be determined based on location'}
Schedule Duration (days): ${inputs.schedule_duration_days || 'TBD'}
Risk Profile: ${RISK_PROFILES.find(r => r.value === inputs.risk_profile)?.label || inputs.risk_profile}

--------------------------------------------------
INPUTS PROVIDED
--------------------------------------------------
${inputs.rfp_inputs}

--------------------------------------------------
INSTRUCTIONS
--------------------------------------------------
Generate a complete estimate following the required 11-section output structure.
If information is missing, issue an RFI before proceeding.
Do NOT fabricate any quantities, prices, or data.
`;
  };


  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    const prompt = generatePrompt();
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate estimate (placeholder - would call AI API)
  const handleGenerate = async () => {
    if (!isValid()) return;
    
    setGenerating(true);
    setResult(null);

    try {
      // For now, we'll just generate the prompt
      // In production, this would call an AI API
      const prompt = generatePrompt();
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, show the generated prompt
      setResult(`PROMPT GENERATED SUCCESSFULLY\n\n${prompt}`);
      onEstimateGenerated?.(prompt);
    } catch (error) {
      console.error('Error generating estimate:', error);
      setResult('Error generating estimate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Download result as text file
  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inputs.project_name || 'estimate'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Agentic AI Estimating</CardTitle>
                <p className="text-sm text-gray-500">
                  Multi-agent system for federal construction estimates
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              {inputs.agent_mode === 'multi' ? '5 Agents Active' : 'Single Agent'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Project Name *</Label>
            <Input
              value={inputs.project_name}
              onChange={(e) => updateInput('project_name', e.target.value)}
              placeholder="e.g., VA Medical Center Renovation"
            />
          </div>
          <div>
            <Label>Agency / Client *</Label>
            <Input
              value={inputs.agency}
              onChange={(e) => updateInput('agency', e.target.value)}
              placeholder="e.g., Department of Veterans Affairs"
            />
          </div>
          <div>
            <Label>Location *</Label>
            <Input
              value={inputs.project_location}
              onChange={(e) => updateInput('project_location', e.target.value)}
              placeholder="e.g., Chicago, IL"
            />
          </div>
          <div>
            <Label>Pricing Date</Label>
            <Input
              type="date"
              value={inputs.pricing_date}
              onChange={(e) => updateInput('pricing_date', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>


      {/* Contract & Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contract & Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Contract Type</Label>
            <Select
              value={inputs.contract_type}
              onValueChange={(v) => updateInput('contract_type', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Delivery Method</Label>
            <Select
              value={inputs.delivery_method}
              onValueChange={(v) => updateInput('delivery_method', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_METHODS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimate Stage</Label>
            <Select
              value={inputs.estimate_stage}
              onValueChange={(v) => updateInput('estimate_stage', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTIMATE_STAGES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* Labor & Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Labor & Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Labor Basis</Label>
            <Select
              value={inputs.labor_basis}
              onValueChange={(v) => updateInput('labor_basis', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABOR_BASIS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Wage Determination #</Label>
            <Input
              value={inputs.wage_determination}
              onChange={(e) => updateInput('wage_determination', e.target.value)}
              placeholder="e.g., IL20240001"
            />
          </div>
          <div>
            <Label>Schedule Duration (days)</Label>
            <Input
              type="number"
              value={inputs.schedule_duration_days}
              onChange={(e) => updateInput('schedule_duration_days', e.target.value)}
              placeholder="e.g., 365"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {RISK_PROFILES.map(risk => (
              <button
                key={risk.value}
                onClick={() => updateInput('risk_profile', risk.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  inputs.risk_profile === risk.value
                    ? risk.value === 'low' ? 'border-green-500 bg-green-50'
                    : risk.value === 'moderate' ? 'border-yellow-500 bg-yellow-50'
                    : risk.value === 'high' ? 'border-orange-500 bg-orange-50'
                    : 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{risk.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Agent Configuration - Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Agent Configuration
                </CardTitle>
                {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label>Agent Mode</Label>
                <Select
                  value={inputs.agent_mode}
                  onValueChange={(v: 'single' | 'multi') => updateInput('agent_mode', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_MODES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {inputs.agent_mode === 'multi' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inputs.enable_scope_agent}
                      onChange={(e) => updateInput('enable_scope_agent', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Scope Intelligence Agent</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inputs.enable_quantity_agent}
                      onChange={(e) => updateInput('enable_quantity_agent', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Quantity & Takeoff Agent</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inputs.enable_market_labor_agent}
                      onChange={(e) => updateInput('enable_market_labor_agent', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Market & Labor Agent</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inputs.enable_risk_validation_agent}
                      onChange={(e) => updateInput('enable_risk_validation_agent', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Risk & Validation Agent</span>
                  </label>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>


      {/* RFP Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            RFP / Scope Inputs *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inputs.rfp_inputs}
            onChange={(e) => updateInput('rfp_inputs', e.target.value)}
            placeholder="Paste RFP text, specifications, drawing notes, scope narratives, or project requirements here...

Example:
- Renovate 10,000 SF medical clinic
- New HVAC system (2 AHUs, 15 tons each)
- Infection control phasing required
- Security upgrades including ballistic glass
- Davis-Bacon wages apply
- 12-month schedule"
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-2">
            Include all available project information. The AI will extract scope, identify gaps, and issue RFIs for missing data.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          disabled={!isValid() || generating}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Estimate...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Estimate
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyPrompt}
          disabled={!isValid()}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </>
          )}
        </Button>
      </div>


      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Generated Output
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm whitespace-pre-wrap font-mono">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Validation Warnings */}
      {!isValid() && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              <span>Fill in required fields: Project Name, Agency, Location, and RFP Inputs</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
