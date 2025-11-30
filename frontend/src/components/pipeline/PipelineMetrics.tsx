import { useMemo } from 'react';
import type { PipelineProject } from '@/types/pipeline.types';

interface Props {
  projects: PipelineProject[];
}

export function PipelineMetrics({ projects }: Props) {
  const stalledProjects = useMemo(() => {
    return projects.filter(p => p.isStalled);
  }, [projects]);

  const totalValue = useMemo(() => {
    return projects.reduce((sum, p) => sum + p.value, 0);
  }, [projects]);

  const weightedValue = useMemo(() => {
    return projects.reduce((sum, p) => {
      const probability = p.winProbability ?? 100;
      return sum + (p.value * probability / 100);
    }, 0);
  }, [projects]);

  const formattedTotalValue = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(totalValue);
  }, [totalValue]);

  const formattedWeightedValue = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(weightedValue);
  }, [weightedValue]);

  const stalledPercentage = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round((stalledProjects.length / projects.length) * 100);
  }, [stalledProjects.length, projects.length]);

  const averageCycleTime = useMemo(() => {
    if (projects.length === 0) return 0;
    
    const totalDays = projects.reduce(
      (sum, p) => sum + p.daysInStage, 
      0
    );
    
    return Math.round(totalDays / projects.length);
  }, [projects]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Projects */}
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Projects</p>
            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Value</p>
            <p className="text-2xl font-bold text-slate-900">{formattedTotalValue}</p>
          </div>
        </div>
      </div>

      {/* Weighted Value */}
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Weighted Value</p>
            <p className="text-2xl font-bold text-slate-900">{formattedWeightedValue}</p>
          </div>
        </div>
      </div>

      {/* Average Cycle Time */}
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Avg Cycle Time</p>
            <p className="text-2xl font-bold text-slate-900">{averageCycleTime}d</p>
          </div>
        </div>
      </div>

      {/* Stalled Projects */}
      <div className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${stalledPercentage > 20 ? 'border-l-4 border-orange-500' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Stalled</p>
            <p className="text-2xl font-bold text-slate-900">
              {stalledProjects.length}
              <span className="text-sm font-medium text-slate-500 ml-1">({stalledPercentage}%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}