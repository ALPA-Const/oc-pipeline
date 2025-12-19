'use client';

import React, { useState, useEffect } from 'react';
import {
  EstimateRiskMatrix,
  RedTeamReview,
  DeviationAlert,
  RiskType,
  RiskStatus,
  getRiskSeverityColor,
  basisPointsToPercent,
} from '@/types/agentic-ai';
import {
  riskMatrixApi,
  deviationAlertApi,
  redTeamReviewApi,
  riskAuditorAgent,
} from '@/api/risk-auditor';

// =============================================================================
// TYPES
// =============================================================================

interface RiskAuditorPanelProps {
  estimateId: string;
  onAuditComplete?: (review: RedTeamReview) => void;
}

interface RiskMatrixCardProps {
  risk: EstimateRiskMatrix;
  onUpdate?: (risk: EstimateRiskMatrix) => void;
}

interface DeviationAlertCardProps {
  alert: DeviationAlert;
  onAcknowledge?: (id: string) => void;
}

interface RedTeamSummaryProps {
  review: RedTeamReview;
}

// =============================================================================
// RISK SEVERITY BADGE
// =============================================================================

const RiskSeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colorMap: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[severity] || colorMap.info}`}>
      {severity.toUpperCase()}
    </span>
  );
};

// =============================================================================
// RISK STATUS BADGE
// =============================================================================

const RiskStatusBadge: React.FC<{ status: RiskStatus }> = ({ status }) => {
  const colorMap: Record<RiskStatus, string> = {
    identified: 'bg-gray-100 text-gray-700',
    analyzing: 'bg-blue-100 text-blue-700',
    mitigating: 'bg-yellow-100 text-yellow-700',
    mitigated: 'bg-green-100 text-green-700',
    accepted: 'bg-purple-100 text-purple-700',
    escalated: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// =============================================================================
// RISK MATRIX CARD
// =============================================================================

const RiskMatrixCard: React.FC<RiskMatrixCardProps> = ({ risk, onUpdate }) => {
  const impactPercent = basisPointsToPercent(risk.impact_score);
  const probabilityPercent = basisPointsToPercent(risk.probability_score);
  const riskScore = (impactPercent * probabilityPercent) / 100;
  
  const formatCurrency = (cents: number | null) => {
    if (cents === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <RiskTypeIcon type={risk.risk_type} />
          <div>
            <h4 className="font-medium text-gray-900">{risk.risk_type.replace(/_/g, ' ')}</h4>
            <RiskStatusBadge status={risk.status} />
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRiskSeverityColor(risk.severity)}`}>
            {riskScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Risk Score</div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
      
      {/* Impact/Probability Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Impact</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-orange-500"
                style={{ width: `${impactPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{impactPercent}%</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Probability</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${probabilityPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{probabilityPercent}%</span>
          </div>
        </div>
      </div>
      
      {/* Cost Impact */}
      <div className="bg-red-50 rounded p-2 mb-3">
        <div className="text-xs text-gray-500 mb-1">Cost Impact Range</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700">{formatCurrency(risk.cost_impact_low_cents)}</span>
          <span className="text-yellow-700 font-medium">{formatCurrency(risk.cost_impact_mid_cents)}</span>
          <span className="text-red-700">{formatCurrency(risk.cost_impact_high_cents)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Low</span>
          <span>Mid</span>
          <span>High</span>
        </div>
      </div>
      
      {/* Mitigation */}
      {risk.mitigation_strategy && (
        <div className="text-sm">
          <span className="font-medium text-gray-700">Mitigation: </span>
          <span className="text-gray-600">{risk.mitigation_strategy}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// RISK TYPE ICON
// =============================================================================

const RiskTypeIcon: React.FC<{ type: RiskType }> = ({ type }) => {
  const iconMap: Record<RiskType, JSX.Element> = {
    SCOPE: (
      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    MARKET: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    LABOR: (
      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    SCHEDULE: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    SITE: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    REGULATORY: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    HIDDEN: (
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ),
    SUBCONTRACTOR: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    MATERIAL: (
      <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    QUALITY: (
      <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    WEATHER: (
      <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  };
  
  return iconMap[type] || iconMap.HIDDEN;
};

// =============================================================================
// DEVIATION ALERT CARD
// =============================================================================

const DeviationAlertCard: React.FC<DeviationAlertCardProps> = ({ alert, onAcknowledge }) => {
  const deviationPercent = basisPointsToPercent(alert.deviation_percent);
  const isOverBudget = deviationPercent > 0;
  
  return (
    <div className={`p-3 rounded-lg border ${
      alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
      alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <svg className={`w-5 h-5 mt-0.5 ${
            alert.severity === 'critical' ? 'text-red-500' :
            alert.severity === 'warning' ? 'text-yellow-500' :
            'text-blue-500'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-medium text-gray-900">{alert.line_item_id}</div>
            <div className="text-sm text-gray-600">{alert.alert_message}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
                {isOverBudget ? '+' : ''}{deviationPercent.toFixed(1)}% from benchmark
              </span>
              <RiskSeverityBadge severity={alert.severity} />
            </div>
          </div>
        </div>
        {!alert.acknowledged_at && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// RED TEAM SUMMARY
// =============================================================================

const RedTeamSummary: React.FC<RedTeamSummaryProps> = ({ review }) => {
  const formatCurrency = (cents: number | null) => {
    if (cents === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-semibold">Red Team Review</h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          review.status === 'completed' ? 'bg-green-500' :
          review.status === 'in_progress' ? 'bg-yellow-500' :
          'bg-gray-500'
        }`}>
          {review.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      {/* Executive Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Executive Summary</h4>
        <p className="text-gray-200">{review.executive_summary}</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {review.total_risks_identified}
          </div>
          <div className="text-xs text-gray-400">Risks Found</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {review.critical_risks_count}
          </div>
          <div className="text-xs text-gray-400">Critical</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {formatCurrency(review.total_exposure_cents)}
          </div>
          <div className="text-xs text-gray-400">Exposure</div>
        </div>
      </div>
      
      {/* Recommended Contingency */}
      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Recommended Contingency</div>
            <div className="text-xl font-bold text-white">
              {basisPointsToPercent(review.recommended_contingency_percent).toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Amount</div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(review.recommended_contingency_cents)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Findings */}
      {review.detailed_findings && review.detailed_findings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Key Findings</h4>
          <ul className="space-y-2">
            {review.detailed_findings.slice(0, 5).map((finding: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-1">•</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Timestamps */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
        <span>Started: {new Date(review.started_at).toLocaleString()}</span>
        {review.completed_at && (
          <span>Completed: {new Date(review.completed_at).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN RISK AUDITOR PANEL
// =============================================================================

export const RiskAuditorPanel: React.FC<RiskAuditorPanelProps> = ({
  estimateId,
  onAuditComplete,
}) => {
  const [risks, setRisks] = useState<EstimateRiskMatrix[]>([]);
  const [alerts, setAlerts] = useState<DeviationAlert[]>([]);
  const [review, setReview] = useState<RedTeamReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'alerts' | 'review'>('risks');

  // Fetch existing data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [riskData, alertData, reviewData] = await Promise.all([
          riskMatrixApi.getByEstimate(estimateId),
          deviationAlertApi.getByEstimate(estimateId),
          redTeamReviewApi.getLatestCompleted(estimateId),
        ]);
        setRisks(riskData);
        setAlerts(alertData);
        setReview(reviewData);
      } catch (err) {
        console.error('Error fetching risk data:', err);
        setError('Failed to load risk data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [estimateId]);

  // Run full audit
  const handleRunAudit = async () => {
    try {
      setRunning(true);
      setError(null);
      const result = await riskAuditorAgent.runAudit({
        estimate_id: estimateId,
        include_hidden_killers: true,
        include_scope_gaps: true,
        include_price_anomalies: true,
      });
      
      setReview(result.review);
      setRisks(result.risks);
      setAlerts(result.deviations);
      setActiveTab('review');
      onAuditComplete?.(result.review);
    } catch (err) {
      console.error('Error running audit:', err);
      setError('Failed to run risk audit');
    } finally {
      setRunning(false);
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await deviationAlertApi.acknowledge(alertId, 'Reviewed and acknowledged');
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Calculate summary stats
  const criticalRisks = risks.filter(r => r.severity === 'critical').length;
  const highRisks = risks.filter(r => r.severity === 'high').length;
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged_at).length;
  const totalExposure = risks.reduce((sum, r) => sum + (r.cost_impact_mid_cents || 0), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
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
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Risk Auditor
            </h3>
            <p className="text-sm text-gray-500">AI-powered red-team risk analysis</p>
          </div>
          <button
            onClick={handleRunAudit}
            disabled={running}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running Audit...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Run Full Audit
              </>
            )}
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{criticalRisks}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">{highRisks}</div>
            <div className="text-xs text-gray-500">High</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{unacknowledgedAlerts}</div>
            <div className="text-xs text-gray-500">Alerts</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-700">
              ${(totalExposure / 100).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Exposure</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {[
            { id: 'risks', label: 'Risk Matrix', count: risks.length },
            { id: 'alerts', label: 'Deviation Alerts', count: unacknowledgedAlerts },
            { id: 'review', label: 'Red Team Review', count: review ? 1 : 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
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

        {/* Risk Matrix Tab */}
        {activeTab === 'risks' && (
          <div>
            {risks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {risks.map((risk) => (
                  <RiskMatrixCard key={risk.id} risk={risk} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No risks identified yet. Run an audit to analyze.</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <DeviationAlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledgeAlert}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No deviation alerts. All items within benchmarks.</p>
              </div>
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div>
            {review ? (
              <RedTeamSummary review={review} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p>No red team review completed. Click "Run Full Audit" to start.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAuditorPanel;
