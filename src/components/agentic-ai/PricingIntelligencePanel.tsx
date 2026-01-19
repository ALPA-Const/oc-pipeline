'use client';

import React, { useState, useEffect } from 'react';
import {
  MarketPriceIndex,
  GeographicCostFactor,
  VolatilityBuffer,
  EscalationClause,
  TrendDirection,
  basisPointsToPercent,
  getTrendIcon,
} from '@/types/agentic-ai';
import {
  marketPriceApi,
  geographicCostApi,
  volatilityBufferApi,
  escalationClauseApi,
  pricingIntelligenceAgent,
  PricingIntelligenceOutput,
} from '@/api/pricing-intelligence';

// =============================================================================
// TYPES
// =============================================================================

interface PricingIntelligencePanelProps {
  estimateId: string;
  projectZipCode?: string;
  onAnalysisComplete?: (result: PricingIntelligenceOutput) => void;
}

interface MarketIndexCardProps {
  index: MarketPriceIndex;
}

interface GeoCostCardProps {
  factor: GeographicCostFactor;
}

interface VolatilityAlertProps {
  buffer: VolatilityBuffer;
}

interface EscalationRecommendationProps {
  clause: EscalationClause;
}

// =============================================================================
// TREND INDICATOR
// =============================================================================

const TrendIndicator: React.FC<{ direction: TrendDirection; changeBp: number }> = ({
  direction,
  changeBp,
}) => {
  const changePercent = basisPointsToPercent(changeBp);
  const icon = getTrendIcon(direction);
  
  const colorMap: Record<TrendDirection, string> = {
    up: 'text-red-500',
    down: 'text-green-500',
    stable: 'text-gray-500',
    volatile: 'text-orange-500',
  };
  
  const bgMap: Record<TrendDirection, string> = {
    up: 'bg-red-50',
    down: 'bg-green-50',
    stable: 'bg-gray-50',
    volatile: 'bg-orange-50',
  };
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bgMap[direction]}`}>
      <span className={`text-lg ${colorMap[direction]}`}>{icon}</span>
      <span className={`text-sm font-medium ${colorMap[direction]}`}>
        {direction === 'down' ? '' : direction === 'stable' ? '' : '+'}
        {changePercent.toFixed(1)}%
      </span>
    </div>
  );
};

// =============================================================================
// MARKET INDEX CARD
// =============================================================================

const MarketIndexCard: React.FC<MarketIndexCardProps> = ({ index }) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };
  
  const volatilityPercent = basisPointsToPercent(index.volatility_score);
  
  const categoryIcons: Record<string, string> = {
    steel: '🏗️',
    copper: '🔌',
    lumber: '🪵',
    concrete: '🧱',
    fuel: '⛽',
    asphalt: '🛣️',
    gypsum: '📦',
    electrical: '💡',
    hvac: '❄️',
    plumbing: '🚰',
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[index.category] || '📊'}</span>
          <div>
            <h4 className="font-medium text-gray-900 capitalize">{index.category}</h4>
            <p className="text-xs text-gray-500">{index.index_name}</p>
          </div>
        </div>
        <TrendIndicator direction={index.trend_direction} changeBp={index.change_30d_bp} />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">Current Price</div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(index.current_price_cents)}
          </div>
          <div className="text-xs text-gray-400">per {index.unit}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Volatility</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  volatilityPercent > 30 ? 'bg-red-500' :
                  volatilityPercent > 15 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(volatilityPercent, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium">{volatilityPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        Last updated: {new Date(index.effective_date).toLocaleDateString()}
        {index.source && <span className="ml-2">• {index.source}</span>}
      </div>
    </div>
  );
};

// =============================================================================
// GEOGRAPHIC COST CARD
// =============================================================================

const GeoCostCard: React.FC<GeoCostCardProps> = ({ factor }) => {
  const laborFactor = basisPointsToPercent(factor.labor_factor_bp) / 100;
  const materialFactor = basisPointsToPercent(factor.material_factor_bp) / 100;
  const equipmentFactor = basisPointsToPercent(factor.equipment_factor_bp) / 100;
  
  const formatFactor = (f: number) => {
    const diff = (f - 1) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };
  
  const getFactorColor = (f: number) => {
    if (f > 1.1) return 'text-red-600';
    if (f > 1.05) return 'text-orange-600';
    if (f < 0.95) return 'text-green-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-gray-900">
              {factor.city || 'Location'}, {factor.state}
            </h4>
            <p className="text-xs text-gray-500">ZIP: {factor.zip_code} • {factor.region}</p>
          </div>
        </div>
        {factor.prevailing_wage_required && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            Davis-Bacon
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="text-xs text-gray-500">Labor</div>
          <div className={`text-lg font-bold ${getFactorColor(laborFactor)}`}>
            {formatFactor(laborFactor)}
          </div>
        </div>
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="text-xs text-gray-500">Material</div>
          <div className={`text-lg font-bold ${getFactorColor(materialFactor)}`}>
            {formatFactor(materialFactor)}
          </div>
        </div>
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="text-xs text-gray-500">Equipment</div>
          <div className={`text-lg font-bold ${getFactorColor(equipmentFactor)}`}>
            {formatFactor(equipmentFactor)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-blue-100 text-xs text-gray-500">
        Data source: {factor.data_source} • Updated: {new Date(factor.effective_date).toLocaleDateString()}
      </div>
    </div>
  );
};

// =============================================================================
// VOLATILITY ALERT
// =============================================================================

const VolatilityAlert: React.FC<VolatilityAlertProps> = ({ buffer }) => {
  const bufferPercent = basisPointsToPercent(buffer.buffer_percent_bp);
  
  return (
    <div className={`p-3 rounded-lg border ${
      bufferPercent > 20 ? 'bg-red-50 border-red-200' :
      bufferPercent > 10 ? 'bg-yellow-50 border-yellow-200' :
      'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className={`w-5 h-5 ${
            bufferPercent > 20 ? 'text-red-500' :
            bufferPercent > 10 ? 'text-yellow-500' :
            'text-green-500'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <div>
            <div className="font-medium text-gray-900 capitalize">{buffer.material_category}</div>
            <div className="text-sm text-gray-600">{buffer.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${
            bufferPercent > 20 ? 'text-red-600' :
            bufferPercent > 10 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            +{bufferPercent.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Buffer</div>
        </div>
      </div>
      {buffer.calculation_basis && (
        <p className="mt-2 text-xs text-gray-500 italic">{buffer.calculation_basis}</p>
      )}
    </div>
  );
};

// =============================================================================
// ESCALATION RECOMMENDATION
// =============================================================================

const EscalationRecommendation: React.FC<EscalationRecommendationProps> = ({ clause }) => {
  const basePercent = basisPointsToPercent(clause.base_escalation_rate_bp);
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{clause.clause_name}</h4>
          <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-500">Base Rate</div>
              <div className="text-lg font-bold text-amber-700">{basePercent.toFixed(1)}%</div>
            </div>
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-500">Index</div>
              <div className="text-sm font-medium text-gray-700">{clause.index_reference}</div>
            </div>
          </div>
          
          {clause.trigger_conditions && (
            <div className="mt-3 text-sm">
              <span className="font-medium text-gray-700">Trigger: </span>
              <span className="text-gray-600">{JSON.stringify(clause.trigger_conditions)}</span>
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>{new Date(clause.effective_start).toLocaleDateString()}</span>
            <span>→</span>
            <span>{clause.effective_end ? new Date(clause.effective_end).toLocaleDateString() : 'Ongoing'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN PRICING INTELLIGENCE PANEL
// =============================================================================

export const PricingIntelligencePanel: React.FC<PricingIntelligencePanelProps> = ({
  estimateId,
  projectZipCode,
  onAnalysisComplete,
}) => {
  const [marketIndices, setMarketIndices] = useState<MarketPriceIndex[]>([]);
  const [geoFactor, setGeoFactor] = useState<GeographicCostFactor | null>(null);
  const [volatilityBuffers, setVolatilityBuffers] = useState<VolatilityBuffer[]>([]);
  const [escalationClauses, setEscalationClauses] = useState<EscalationClause[]>([]);
  const [analysis, setAnalysis] = useState<PricingIntelligenceOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'geo' | 'volatility' | 'escalation'>('market');

  // Fetch market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [indices, volatiles, clauses] = await Promise.all([
          marketPriceApi.list(),
          marketPriceApi.getVolatileMaterials(2000), // 20% threshold
          escalationClauseApi.getByEstimate(estimateId),
        ]);
        setMarketIndices(indices);
        setVolatilityBuffers(volatiles.map(v => ({
          id: v.id,
          material_category: v.category,
          buffer_percent_bp: v.volatility_score,
          description: `${v.index_name} showing ${basisPointsToPercent(v.volatility_score).toFixed(0)}% volatility`,
          calculation_basis: `Based on 30-day price movement: ${basisPointsToPercent(v.change_30d_bp).toFixed(1)}%`,
          effective_date: v.effective_date,
          auto_calculated: true,
          created_at: v.created_at,
          updated_at: v.updated_at,
        })));
        setEscalationClauses(clauses);
        
        if (projectZipCode) {
          const geo = await geographicCostApi.getByZipCode(projectZipCode);
          setGeoFactor(geo);
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [estimateId, projectZipCode]);

  // Run full analysis
  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const result = await pricingIntelligenceAgent.analyze({
        estimate_id: estimateId,
        zip_code: projectZipCode,
        project_duration_months: 12, // Default
        include_volatility: true,
        include_escalation: true,
      });
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError('Failed to run pricing analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate summary
  const volatileCount = marketIndices.filter(m => m.trend_direction === 'volatile').length;
  const upTrendCount = marketIndices.filter(m => m.trend_direction === 'up').length;
  const avgVolatility = marketIndices.length > 0
    ? marketIndices.reduce((sum, m) => sum + m.volatility_score, 0) / marketIndices.length
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Pricing Intelligence
            </h3>
            <p className="text-sm text-gray-500">Real-time market data and cost analysis</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Run Analysis
              </>
            )}
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{marketIndices.length}</div>
            <div className="text-xs text-gray-500">Indices</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{upTrendCount}</div>
            <div className="text-xs text-gray-500">Rising</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">{volatileCount}</div>
            <div className="text-xs text-gray-500">Volatile</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-700">
              {basisPointsToPercent(avgVolatility).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Avg Vol</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {[
            { id: 'market', label: 'Market Indices', count: marketIndices.length },
            { id: 'geo', label: 'Geographic Factors', count: geoFactor ? 1 : 0 },
            { id: 'volatility', label: 'Volatility Alerts', count: volatilityBuffers.length },
            { id: 'escalation', label: 'Escalation', count: escalationClauses.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Analysis Results Banner */}
        {analysis && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Analysis Complete</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Geo Adjustment:</span>
                <span className="ml-2 font-medium">
                  {analysis.geographic_adjustment
                    ? `${((basisPointsToPercent(analysis.geographic_adjustment.labor_factor_bp) / 100 - 1) * 100).toFixed(1)}% labor`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Volatility Buffer:</span>
                <span className="ml-2 font-medium">
                  +{basisPointsToPercent(analysis.total_volatility_buffer_bp).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Escalation:</span>
                <span className="ml-2 font-medium">
                  +{basisPointsToPercent(analysis.escalation_factor_bp).toFixed(1)}%
                </span>
              </div>
            </div>
            {analysis.market_alerts && analysis.market_alerts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <span className="text-sm font-medium text-green-800">Alerts: </span>
                <span className="text-sm text-green-700">{analysis.market_alerts.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Market Indices Tab */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketIndices.map((index) => (
              <MarketIndexCard key={index.id} index={index} />
            ))}
          </div>
        )}

        {/* Geographic Tab */}
        {activeTab === 'geo' && (
          <div>
            {geoFactor ? (
              <GeoCostCard factor={geoFactor} />
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <p className="text-gray-500">
                  {projectZipCode
                    ? 'No geographic data available for this ZIP code'
                    : 'Enter a project ZIP code to see geographic cost factors'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Volatility Tab */}
        {activeTab === 'volatility' && (
          <div className="space-y-3">
            {volatilityBuffers.length > 0 ? (
              volatilityBuffers.map((buffer) => (
                <VolatilityAlert key={buffer.id} buffer={buffer} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No volatility alerts. All materials within normal ranges.</p>
              </div>
            )}
          </div>
        )}

        {/* Escalation Tab */}
        {activeTab === 'escalation' && (
          <div className="space-y-4">
            {escalationClauses.length > 0 ? (
              escalationClauses.map((clause) => (
                <EscalationRecommendation key={clause.id} clause={clause} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No escalation clauses configured. Run analysis to generate recommendations.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingIntelligencePanel;
