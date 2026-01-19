'use client';

import React, { useState, useEffect } from 'react';
import {
  EstimateConfidenceScore,
  LineItemConfidenceScore,
  basisPointsToPercent,
  formatConfidence,
  getConfidenceLevel,
  getConfidenceColor,
} from '@/types/agentic-ai';
import { confidenceApi } from '@/api/confidence-scoring';

// =============================================================================
// TYPES
// =============================================================================

interface ConfidenceScoreCardProps {
  estimateId: string;
  onScoreCalculated?: (score: EstimateConfidenceScore) => void;
  compact?: boolean;
}

interface ConfidenceBreakdownProps {
  score: EstimateConfidenceScore;
}

interface LineItemConfidenceRowProps {
  item: LineItemConfidenceScore;
}

interface ConfidenceGaugeProps {
  score: number; // basis points (0-10000)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// =============================================================================
// CONFIDENCE GAUGE COMPONENT
// =============================================================================

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const percent = basisPointsToPercent(score);
  const level = getConfidenceLevel(score);
  const colorClass = getConfidenceColor(score);
  
  const sizeClasses = {
    sm: { container: 'w-16 h-16', text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-base' },
  };
  
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  const colorMap: Record<string, string> = {
    'text-red-600': '#dc2626',
    'text-orange-500': '#f97316',
    'text-yellow-500': '#eab308',
    'text-green-500': '#22c55e',
    'text-green-600': '#16a34a',
  };
  
  return (
    <div className={`relative ${sizeClasses[size].container} flex items-center justify-center`}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={colorMap[colorClass] || '#22c55e'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${sizeClasses[size].text} ${colorClass}`}>
          {percent.toFixed(0)}%
        </span>
        {showLabel && (
          <span className={`${sizeClasses[size].label} text-gray-500 uppercase tracking-wide`}>
            {level}
          </span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// FACTOR BAR COMPONENT
// =============================================================================

interface FactorBarProps {
  label: string;
  score: number; // basis points
  weight: number; // basis points (percentage weight)
  description?: string;
}

const FactorBar: React.FC<FactorBarProps> = ({ label, score, weight, description }) => {
  const percent = basisPointsToPercent(score);
  const weightPercent = basisPointsToPercent(weight);
  const colorClass = getConfidenceColor(score);
  
  const bgColorMap: Record<string, string> = {
    'text-red-600': 'bg-red-500',
    'text-orange-500': 'bg-orange-500',
    'text-yellow-500': 'bg-yellow-500',
    'text-green-500': 'bg-green-500',
    'text-green-600': 'bg-green-600',
  };
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">({weightPercent}% weight)</span>
        </div>
        <span className={`text-sm font-semibold ${colorClass}`}>
          {percent.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${bgColorMap[colorClass] || 'bg-green-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
};

// =============================================================================
// CONFIDENCE BREAKDOWN COMPONENT
// =============================================================================

const ConfidenceBreakdown: React.FC<ConfidenceBreakdownProps> = ({ score }) => {
  const factors = [
    {
      label: 'Data Completeness',
      score: score.data_completeness_score,
      weight: score.data_completeness_weight,
      description: 'Line items with complete quantities, units, and descriptions',
    },
    {
      label: 'Pricing Accuracy',
      score: score.pricing_accuracy_score,
      weight: score.pricing_accuracy_weight,
      description: 'Unit costs within historical benchmarks and market rates',
    },
    {
      label: 'Scope Coverage',
      score: score.scope_coverage_score,
      weight: score.scope_coverage_weight,
      description: 'All required CSI divisions and spec sections addressed',
    },
    {
      label: 'Historical Alignment',
      score: score.historical_alignment_score,
      weight: score.historical_alignment_weight,
      description: 'Pricing aligned with similar projects in your database',
    },
    {
      label: 'Market Freshness',
      score: score.market_freshness_score,
      weight: score.market_freshness_weight,
      description: 'Pricing data current within 30 days',
    },
    {
      label: 'Risk Assessment',
      score: score.risk_assessment_score,
      weight: score.risk_assessment_weight,
      description: 'Risks identified, quantified, and mitigated',
    },
  ];
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
      {factors.map((factor) => (
        <FactorBar key={factor.label} {...factor} />
      ))}
    </div>
  );
};

// =============================================================================
// LINE ITEM CONFIDENCE ROW
// =============================================================================

const LineItemConfidenceRow: React.FC<LineItemConfidenceRowProps> = ({ item }) => {
  const percent = basisPointsToPercent(item.overall_confidence);
  const colorClass = getConfidenceColor(item.overall_confidence);
  
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-3 text-sm text-gray-900">{item.line_item_id}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${colorClass}`}>{percent.toFixed(0)}%</span>
        </div>
      </td>
      <td className="py-2 px-3 text-sm text-gray-600">
        {basisPointsToPercent(item.quantity_confidence).toFixed(0)}%
      </td>
      <td className="py-2 px-3 text-sm text-gray-600">
        {basisPointsToPercent(item.unit_cost_confidence).toFixed(0)}%
      </td>
      <td className="py-2 px-3 text-sm text-gray-600">
        {basisPointsToPercent(item.source_reliability).toFixed(0)}%
      </td>
      <td className="py-2 px-3">
        {item.flags && item.flags.length > 0 ? (
          <div className="flex gap-1">
            {item.flags.slice(0, 2).map((flag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {flag}
              </span>
            ))}
            {item.flags.length > 2 && (
              <span className="text-xs text-gray-500">+{item.flags.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
};

// =============================================================================
// MAIN CONFIDENCE SCORE CARD
// =============================================================================

export const ConfidenceScoreCard: React.FC<ConfidenceScoreCardProps> = ({
  estimateId,
  onScoreCalculated,
  compact = false,
}) => {
  const [score, setScore] = useState<EstimateConfidenceScore | null>(null);
  const [lineItems, setLineItems] = useState<LineItemConfidenceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showLineItems, setShowLineItems] = useState(false);

  // Fetch existing score
  useEffect(() => {
    const fetchScore = async () => {
      try {
        setLoading(true);
        const data = await confidenceApi.estimate.get(estimateId);
        setScore(data);
        if (data) {
          const items = await confidenceApi.lineItem.getByEstimate(estimateId);
          setLineItems(items);
        }
      } catch (err) {
        console.error('Error fetching confidence score:', err);
        // Score might not exist yet, that's okay
      } finally {
        setLoading(false);
      }
    };
    
    fetchScore();
  }, [estimateId]);

  // Calculate/recalculate score
  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      const result = await confidenceApi.calculateFull(estimateId);
      setScore(result.estimate);
      setLineItems(result.lineItems);
      onScoreCalculated?.(result.estimate);
    } catch (err) {
      console.error('Error calculating confidence:', err);
      setError('Failed to calculate confidence score');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (compact && score) {
    return (
      <div className="flex items-center gap-3">
        <ConfidenceGauge score={score.overall_confidence} size="sm" showLabel={false} />
        <div>
          <div className={`text-lg font-bold ${getConfidenceColor(score.overall_confidence)}`}>
            {formatConfidence(score.overall_confidence)}
          </div>
          <div className="text-xs text-gray-500 uppercase">
            {getConfidenceLevel(score.overall_confidence)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Confidence Score</h3>
          <p className="text-sm text-gray-500">AI-calculated estimate reliability</p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {score ? 'Recalculate' : 'Calculate'}
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {score ? (
          <>
            {/* Main Score */}
            <div className="flex flex-col items-center mb-6">
              <ConfidenceGauge score={score.overall_confidence} size="lg" />
              <p className="mt-3 text-sm text-gray-600 text-center max-w-sm">
                Based on {score.line_items_analyzed} line items analyzed
              </p>
              {score.last_calculated_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(score.last_calculated_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Toggle Breakdown */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <span>{showBreakdown ? 'Hide' : 'Show'} Score Breakdown</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showBreakdown && <ConfidenceBreakdown score={score} />}

            {/* Line Items Toggle */}
            {lineItems.length > 0 && (
              <>
                <button
                  onClick={() => setShowLineItems(!showLineItems)}
                  className="w-full flex items-center justify-between py-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 border-t border-gray-200 pt-4"
                >
                  <span>{showLineItems ? 'Hide' : 'Show'} Line Item Details ({lineItems.length})</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${showLineItems ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showLineItems && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item) => (
                          <LineItemConfidenceRow key={item.id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* No Score Yet */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Score Calculated</h4>
            <p className="text-sm text-gray-500 mb-4">
              Click "Calculate" to analyze this estimate's reliability
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceScoreCard;
