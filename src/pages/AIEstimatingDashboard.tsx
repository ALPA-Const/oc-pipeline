'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConfidenceScoreCard,
  RiskAuditorPanel,
  PricingIntelligencePanel,
  DrawingViewer,
} from '@/components/agentic-ai';
import { estimateApi } from '@/api/estimates';
import { EstimateConfidenceScore, RedTeamReview, AITakeoffElement } from '@/types/agentic-ai';

// =============================================================================
// TYPES
// =============================================================================

interface AIEstimatingDashboardProps {
  estimateId?: string;
  initialTab?: 'overview' | 'drawings' | 'pricing' | 'risk';
}

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: 'Confidence score and quick actions',
  },
  {
    id: 'drawings',
    label: 'Drawing Viewer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Split-screen viewer with AI takeoff',
  },
  {
    id: 'pricing',
    label: 'Pricing Intelligence',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Market data and cost factors',
  },
  {
    id: 'risk',
    label: 'Risk Auditor',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    description: 'Red-team risk analysis',
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AIEstimatingDashboard: React.FC<AIEstimatingDashboardProps> = ({ 
  estimateId,
  initialTab = 'overview'
}) => {
  const router = useRouter();
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // AI Results State
  const [confidenceScore, setConfidenceScore] = useState<EstimateConfidenceScore | null>(null);
  const [riskReview, setRiskReview] = useState<RedTeamReview | null>(null);
  const [takeoffElements, setTakeoffElements] = useState<AITakeoffElement[]>([]);

  // Fetch estimate
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!estimateId) return;
      
      try {
        setLoading(true);
        const data = await estimateApi.get(estimateId);
        setEstimate(data);
      } catch (err) {
        console.error('Error fetching estimate:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimate();
  }, [estimateId]);

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!estimate || !estimateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Estimate Not Found</h2>
          <p className="text-gray-500 mb-4">The requested estimate could not be loaded.</p>
          <button
            onClick={() => router.push('/estimating')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Estimates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/estimating/${estimateId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{estimate.project_number}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    AI Analysis
                  </span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">{estimate.project_name}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(estimate.total_amount_cents)}
                  </div>
                </div>
                
                {confidenceScore && (
                  <div className="text-right">
                    <div className="text-gray-500">Confidence</div>
                    <div className={`font-semibold ${
                      confidenceScore.overall_confidence >= 7500 ? 'text-green-600' :
                      confidenceScore.overall_confidence >= 5000 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(confidenceScore.overall_confidence / 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                
                {riskReview && (
                  <div className="text-right">
                    <div className="text-gray-500">Critical Risks</div>
                    <div className={`font-semibold ${
                      riskReview.critical_risks_count > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {riskReview.critical_risks_count}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <button
                onClick={() => router.push(`/estimating/${estimateId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Estimate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row - Confidence + Quick Actions */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <ConfidenceScoreCard
                  estimateId={estimateId}
                  onScoreCalculated={setConfidenceScore}
                />
              </div>
              
              <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('drawings')}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Run AI Takeoff</div>
                      <div className="text-sm text-gray-500">Extract quantities from drawings</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Check Market Prices</div>
                      <div className="text-sm text-gray-500">View real-time material costs</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('risk')}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Run Risk Audit</div>
                      <div className="text-sm text-gray-500">Identify hidden killers</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => window.open(`/estimating/reports/${estimateId}/ai-summary`, '_blank')}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Generate AI Report</div>
                      <div className="text-sm text-gray-500">Export comprehensive analysis</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-lg font-semibold">AI Takeoff</h4>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {takeoffElements.length}
                </div>
                <div className="text-blue-200">Elements extracted</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h4 className="text-lg font-semibold">Market Data</h4>
                </div>
                <div className="text-3xl font-bold mb-2">
                  Live
                </div>
                <div className="text-green-200">Real-time pricing</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h4 className="text-lg font-semibold">Risk Score</h4>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {riskReview ? riskReview.total_risks_identified : '—'}
                </div>
                <div className="text-red-200">Risks identified</div>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Viewer Tab */}
        {activeTab === 'drawings' && (
          <DrawingViewer
            estimateId={estimateId}
            onTakeoffComplete={setTakeoffElements}
          />
        )}

        {/* Pricing Intelligence Tab */}
        {activeTab === 'pricing' && (
          <PricingIntelligencePanel
            estimateId={estimateId}
            projectZipCode={estimate.project_zip}
          />
        )}

        {/* Risk Auditor Tab */}
        {activeTab === 'risk' && (
          <RiskAuditorPanel
            estimateId={estimateId}
            onAuditComplete={setRiskReview}
          />
        )}
      </div>
    </div>
  );
};

export default AIEstimatingDashboard;
