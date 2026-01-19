import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ConfidenceScoreCard,
  RiskAuditorPanel,
  PricingIntelligencePanel,
  DrawingViewer,
} from '@/components/agentic-ai';
import { EstimateConfidenceScore, RedTeamReview, AITakeoffElement } from '@/types/agentic-ai';

// =============================================================================
// TYPES
// =============================================================================

interface Estimate {
  id: string;
  project_name: string;
  project_number: string;
  status: string;
  project_zip?: string;
  total_amount_cents: number;
  created_at: string;
  updated_at: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'AI Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    description: 'Confidence scores and quick actions',
  },
  {
    id: 'drawings',
    label: 'Drawings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    description: 'AI-powered drawing analysis',
  },
  {
    id: 'pricing',
    label: 'Pricing Intel',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Market rates and pricing analysis',
  },
  {
    id: 'risk',
    label: 'Risk Auditor',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    description: 'Risk assessment and deviations',
  },
];

// =============================================================================
// LOADING SKELETON
// =============================================================================

const AILoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
    <div className="max-w-7xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AIEstimatingDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const estimateId = id;
  const initialTab = searchParams.get('tab') as 'overview' | 'drawings' | 'pricing' | 'risk' || 'overview';

  // State
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<EstimateConfidenceScore | null>(null);
  const [riskReview, setRiskReview] = useState<RedTeamReview | null>(null);
  const [takeoffElements, setTakeoffElements] = useState<AITakeoffElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!estimateId) {
        setError('No estimate ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API calls
        // For now, using mock data to demonstrate the UI
        
        // Mock estimate data
        setEstimate({
          id: estimateId,
          project_name: 'VA Medical Center Renovation',
          project_number: 'VA-2024-001',
          status: 'in_progress',
          project_zip: '60025',
          total_amount_cents: 245000000, // $2.45M
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Mock confidence score
        setConfidenceScore({
          id: 'cs-1',
          estimate_id: estimateId,
          overall_score_bp: 8750, // 87.50%
          quantity_confidence_bp: 9200,
          pricing_confidence_bp: 8100,
          scope_confidence_bp: 8950,
          completeness_score_bp: 8800,
          historical_accuracy_bp: 9100,
          market_alignment_bp: 8400,
          risk_factor_bp: 500,
          sample_size: 45,
          methodology: 'AI_HYBRID',
          last_calculated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Mock risk review
        setRiskReview({
          id: 'rr-1',
          estimate_id: estimateId,
          reviewer_type: 'AI_AGENT',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          total_items_reviewed: 156,
          items_flagged: 12,
          critical_findings: 2,
          high_findings: 4,
          medium_findings: 6,
          low_findings: 8,
          overall_risk_level: 'MEDIUM',
          recommendations: [
            'Review concrete pricing - 15% above market average',
            'Verify electrical scope completeness',
            'Consider regional labor rate adjustments',
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Mock takeoff elements
        setTakeoffElements([
          {
            id: 'te-1',
            drawing_id: 'dwg-1',
            element_type: 'AREA',
            csi_division: 3,
            csi_code: '03 30 00',
            description: 'Cast-in-Place Concrete',
            quantity: 2500,
            unit: 'SF',
            confidence_score_bp: 9200,
            source_coordinates: { x: 100, y: 200, width: 500, height: 300 },
            extraction_method: 'AI_VISION',
            verified: true,
            verified_by: null,
            verified_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [estimateId]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleBackToEstimate = () => {
    navigate(`/preconstruction/estimates/${estimateId}`);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Confidence Score Card */}
            {confidenceScore && (
              <ConfidenceScoreCard
                score={confidenceScore}
                estimateId={estimateId || ''}
                onRefresh={() => console.log('Refresh confidence score')}
              />
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleTabChange('drawings')}
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Analyze Drawings</span>
                </button>
                <button
                  onClick={() => handleTabChange('pricing')}
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Check Pricing</span>
                </button>
                <button
                  onClick={() => handleTabChange('risk')}
                  className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Run Risk Audit</span>
                </button>
                <button
                  onClick={() => console.log('Generate report')}
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Generate Report</span>
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            {riskReview && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{riskReview.critical_findings}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{riskReview.high_findings}</div>
                    <div className="text-sm text-gray-600">High</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{riskReview.medium_findings}</div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{riskReview.low_findings}</div>
                    <div className="text-sm text-gray-600">Low</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'drawings':
        return (
          <DrawingViewer
            estimateId={estimateId || ''}
            onElementSelect={(element) => console.log('Selected element:', element)}
          />
        );

      case 'pricing':
        return (
          <PricingIntelligencePanel
            estimateId={estimateId || ''}
            zipCode={estimate?.project_zip || '60025'}
          />
        );

      case 'risk':
        return (
          <RiskAuditorPanel
            estimateId={estimateId || ''}
            review={riskReview}
            onRunAudit={() => console.log('Run audit')}
          />
        );

      default:
        return null;
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isLoading) {
    return <AILoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToEstimate}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  AI Analysis: {estimate?.project_name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-500">{estimate?.project_number}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AIEstimatingDashboard;
