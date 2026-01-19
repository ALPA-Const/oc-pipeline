// =====================================================
// OC PIPELINE - AI ESTIMATING DASHBOARD PAGE
// Next.js App Router Page Component
// Federal-Grade Agentic AI Cost Estimating
// =====================================================

import { Suspense } from 'react';
import { Metadata } from 'next';
import AIEstimatingDashboard from '@/pages/AIEstimatingDashboard';
import { PageSkeleton } from '@/components/Skeletons';

// =====================================================
// METADATA
// =====================================================

export const metadata: Metadata = {
  title: 'AI Analysis | OC Pipeline',
  description: 'AI-powered cost estimating with real-time market intelligence, confidence scoring, and risk analysis',
  openGraph: {
    title: 'AI Analysis | OC Pipeline',
    description: 'Federal-grade AI estimating with automated takeoffs, pricing intelligence, and risk auditing',
  },
};

// =====================================================
// PAGE COMPONENT
// =====================================================

interface AIPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AIPage({ params, searchParams }: AIPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  return (
    <Suspense fallback={<AILoadingSkeleton />}>
      <AIEstimatingDashboard 
        estimateId={id}
        initialTab={tab as 'overview' | 'drawings' | 'pricing' | 'risk' | undefined}
      />
    </Suspense>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function AILoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="h-64 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="col-span-2 space-y-4">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
