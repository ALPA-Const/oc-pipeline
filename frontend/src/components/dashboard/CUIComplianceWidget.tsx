/**
 * OC Pipeline - CUI Compliance Widget
 * CMMC Level 2 compliance status for federal construction projects
 */

import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileCheck,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export interface CUIComplianceData {
  overallScore: number;
  status: 'compliant' | 'at-risk' | 'non-compliant';
  documentsSecured: number;
  documentsTotal: number;
  pendingReviews: number;
  expiringCertifications: number;
  lastAudit: string;
  nextAuditDue: string;
  controlsStatus: {
    accessControl: 'pass' | 'warning' | 'fail';
    awareness: 'pass' | 'warning' | 'fail';
    auditLog: 'pass' | 'warning' | 'fail';
    incidentResponse: 'pass' | 'warning' | 'fail';
    riskAssessment: 'pass' | 'warning' | 'fail';
  };
}

interface CUIComplianceWidgetProps {
  data: CUIComplianceData | null;
  loading?: boolean;
  onViewDetails?: () => void;
}

const statusConfig = {
  compliant: {
    icon: ShieldCheck,
    label: 'Compliant',
    bg: 'bg-green-900/30',
    border: 'border-green-700',
    text: 'text-green-400',
    ring: 'ring-green-500',
  },
  'at-risk': {
    icon: ShieldAlert,
    label: 'At Risk',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700',
    text: 'text-yellow-400',
    ring: 'ring-yellow-500',
  },
  'non-compliant': {
    icon: ShieldX,
    label: 'Non-Compliant',
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    text: 'text-red-400',
    ring: 'ring-red-500',
  },
};

const controlStatusIcon = {
  pass: { icon: ShieldCheck, color: 'text-green-400' },
  warning: { icon: ShieldAlert, color: 'text-yellow-400' },
  fail: { icon: ShieldX, color: 'text-red-400' },
};

export default function CUIComplianceWidget({
  data,
  loading,
  onViewDetails
}: CUIComplianceWidgetProps) {
  if (loading) {
    return <CUIComplianceWidgetSkeleton />;
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-slate-500" />
          <h3 className="text-lg font-semibold text-white">CUI Compliance</h3>
        </div>
        <p className="text-slate-400 text-sm">
          No CUI compliance data available. This widget displays CMMC Level 2 compliance status for federal projects.
        </p>
      </div>
    );
  }

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;
  const docsPercentage = Math.round((data.documentsSecured / data.documentsTotal) * 100);

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg} ${config.border} border`}>
              <StatusIcon className={`w-5 h-5 ${config.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">CUI Compliance</h3>
              <p className="text-xs text-slate-400">CMMC Level 2</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.border} border ${config.text}`}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Overall Compliance Score</span>
          <span className={`text-2xl font-bold ${config.text}`}>{data.overallScore}%</span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              data.status === 'compliant'
                ? 'from-green-600 to-green-400'
                : data.status === 'at-risk'
                  ? 'from-yellow-600 to-yellow-400'
                  : 'from-red-600 to-red-400'
            } transition-all duration-500`}
            style={{ width: `${data.overallScore}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-b border-slate-700 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-700">
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Documents Secured</p>
            <p className="text-sm font-semibold text-white">
              {data.documentsSecured}/{data.documentsTotal} ({docsPercentage}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-900/30 border border-purple-700">
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Pending Reviews</p>
            <p className="text-sm font-semibold text-white">{data.pendingReviews}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-700">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Expiring Certs</p>
            <p className="text-sm font-semibold text-white">{data.expiringCertifications}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-900/30 border border-cyan-700">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Next Audit</p>
            <p className="text-sm font-semibold text-white">{data.nextAuditDue}</p>
          </div>
        </div>
      </div>

      {/* Controls Status */}
      <div className="p-6 border-b border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Control Families</h4>
        <div className="space-y-2">
          {Object.entries(data.controlsStatus).map(([control, status]) => {
            const { icon: Icon, color } = controlStatusIcon[status];
            const controlLabels: Record<string, string> = {
              accessControl: 'Access Control (AC)',
              awareness: 'Awareness & Training (AT)',
              auditLog: 'Audit & Accountability (AU)',
              incidentResponse: 'Incident Response (IR)',
              riskAssessment: 'Risk Assessment (RA)',
            };
            return (
              <div key={control} className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-400">{controlLabels[control]}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          View Full Compliance Report
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CUIComplianceWidgetSkeleton() {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-lg" />
            <div>
              <div className="w-28 h-5 bg-slate-700 rounded mb-1" />
              <div className="w-20 h-3 bg-slate-700 rounded" />
            </div>
          </div>
          <div className="w-20 h-6 bg-slate-700 rounded-full" />
        </div>
      </div>
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="w-40 h-4 bg-slate-700 rounded" />
          <div className="w-12 h-6 bg-slate-700 rounded" />
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full" />
      </div>
      <div className="p-6 border-b border-slate-700 grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-lg" />
            <div>
              <div className="w-20 h-3 bg-slate-700 rounded mb-1" />
              <div className="w-12 h-4 bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CUIComplianceWidget, CUIComplianceWidgetSkeleton };

