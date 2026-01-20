import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Hammer, 
  Building, 
  CheckCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipelineType } from '@/types/pipeline.types';

// Lazy load pipeline views for better performance
const OpportunityPipeline = lazy(() => import('@/views/OpportunityPipeline'));
const PreconstructionPipeline = lazy(() => import('@/views/PreconstructionPipeline'));
const ExecutionPipeline = lazy(() => import('@/views/ExecutionPipeline'));
const CloseoutPipeline = lazy(() => import('@/views/CloseoutPipeline'));

const pipelineTypes = [
  {
    id: PipelineType.OPPORTUNITY,
    name: 'Opportunity',
    description: 'Track opportunities from lead generation to contract award',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['Lead Generation', 'Proposal', 'Negotiation', 'Award'],
  },
  {
    id: PipelineType.PRECONSTRUCTION,
    name: 'Preconstruction',
    description: 'Manage design, estimating, and preconstruction activities',
    icon: Hammer,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['Planning', 'Design', 'Permitting', 'Ready to Build'],
  },
  {
    id: PipelineType.EXECUTION,
    name: 'Execution',
    description: 'Track active construction projects through completion',
    icon: Building,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: ['Mobilization', 'Construction', 'Punch List', 'Substantial Completion'],
  },
  {
    id: PipelineType.CLOSEOUT,
    name: 'Closeout',
    description: 'Manage final inspections, documentation, and warranty',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['Final Inspection', 'Documentation', 'Warranty Period', 'Complete'],
  },
];

function PipelineOverview({ onSelectPipeline }: { onSelectPipeline: (type: PipelineType) => void }) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive project pipeline tracking across all construction phases
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pipeline Overview
              </CardTitle>
              <CardDescription>
                Select a pipeline type below to view and manage projects
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Pipeline Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelineTypes.map((pipeline) => {
              const Icon = pipeline.icon;
              return (
                <Card 
                  key={pipeline.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onSelectPipeline(pipeline.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${pipeline.bgColor} p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 ${pipeline.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{pipeline.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {pipeline.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Key Stages:</p>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>About Pipeline Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                The Pipeline Management module provides comprehensive tracking of construction projects
                across all phases, from initial opportunity through final closeout.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Opportunity Pipeline:</strong> Track and manage potential projects from lead generation through contract award</li>
                <li><strong>Preconstruction Pipeline:</strong> Manage design, permitting, and preparation activities</li>
                <li><strong>Execution Pipeline:</strong> Monitor active construction projects through substantial completion</li>
                <li><strong>Closeout Pipeline:</strong> Handle final inspections, documentation, and warranty periods</li>
              </ul>
              <p className="pt-2">
                Each pipeline includes drag-and-drop Kanban boards, detailed metrics, analytics, 
                and export capabilities to streamline project management workflows.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Pipeline() {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineType | null>(null);

  if (!selectedPipeline) {
    return <PipelineOverview onSelectPipeline={setSelectedPipeline} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Pipeline Type Selector */}
      <div className="bg-white border-b">
        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSelectedPipeline(null)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                selectedPipeline === null
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            {pipelineTypes.map((pipeline) => (
              <button
                key={pipeline.id}
                onClick={() => setSelectedPipeline(pipeline.id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  selectedPipeline === pipeline.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {pipeline.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline View Content */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pipeline...</p>
            </div>
          </div>
        }>
          {selectedPipeline === PipelineType.OPPORTUNITY && <OpportunityPipeline />}
          {selectedPipeline === PipelineType.PRECONSTRUCTION && <PreconstructionPipeline />}
          {selectedPipeline === PipelineType.EXECUTION && <ExecutionPipeline />}
          {selectedPipeline === PipelineType.CLOSEOUT && <CloseoutPipeline />}
        </Suspense>
      </div>
    </div>
  );
}
