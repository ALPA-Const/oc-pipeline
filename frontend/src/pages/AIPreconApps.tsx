import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Star,
  Trophy,
  Award,
  Zap,
  ExternalLink,
  Brain,
  BarChart2,
  FileText,
  ClipboardList,
  Wrench,
  Shield,
  Search,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type AppTier = 'Elite' | 'MVP' | 'Master';

interface AIPreconApp {
  rank: number;
  name: string;
  tier: AppTier;
  tagline: string;
  description: string;
  aiFeatures: string[];
  preconCapabilities: string[];
  githubUrl?: string;
  websiteUrl: string;
  stars?: number;
  language?: string;
  category: string;
  score: number;
}

// =============================================================================
// DATA — Top 10 AI-Driven Preconstruction Applications
// Sourced via GitHub search + industry research (March 2026)
// =============================================================================

const TOP_AI_PRECON_APPS: AIPreconApp[] = [
  // ── ELITE TIER ────────────────────────────────────────────────────────────
  {
    rank: 1,
    name: 'Autodesk Construction Cloud',
    tier: 'Elite',
    tagline: 'AI-Powered BIM & Preconstruction at Enterprise Scale',
    description:
      'The industry standard for AI-driven preconstruction. Combines machine learning with BIM to deliver intelligent quantity takeoffs, clash detection, and predictive project analytics across the full construction lifecycle.',
    aiFeatures: [
      'AI quantity takeoff from 2D/3D models',
      'Automated clash detection (ML-assisted)',
      'Predictive schedule & cost analytics',
      'Natural language RFI resolution',
      'Computer-vision drawing analysis',
    ],
    preconCapabilities: [
      'BIM coordination',
      'Cost estimating',
      'Bid management',
      'Subcontractor prequalification',
      'Design review & redlines',
    ],
    websiteUrl: 'https://construction.autodesk.com',
    category: 'Enterprise BIM & Estimating',
    score: 98,
  },
  {
    rank: 2,
    name: 'Procore',
    tier: 'Elite',
    tagline: 'AI-Enhanced Construction Management Platform',
    description:
      'A leading cloud-based platform with deep AI integration across the preconstruction workflow. Copilot AI surfaces risk insights, automates submittal routing, and accelerates bid leveling with intelligent cost benchmarking.',
    aiFeatures: [
      'Procore Copilot AI assistant',
      'Automated bid leveling & comparison',
      'AI-driven risk flag identification',
      'Smart submittal routing',
      'Predictive budget variance alerts',
    ],
    preconCapabilities: [
      'Pursuit & opportunity tracking',
      'Cost estimating & budgeting',
      'Bid management & invitations',
      'Proposal generation',
      'Subcontractor prequalification',
    ],
    websiteUrl: 'https://procore.com',
    category: 'Construction Management Suite',
    score: 95,
  },
  {
    rank: 3,
    name: 'Oracle Primavera Cloud',
    tier: 'Elite',
    tagline: 'Enterprise AI Scheduling & Preconstruction Intelligence',
    description:
      'Oracle's enterprise-grade preconstruction suite leverages AI to drive schedule simulation, workforce modeling, and predictive risk analytics for federal and large-scale commercial projects.',
    aiFeatures: [
      'AI-powered schedule risk simulation',
      'ML workforce demand forecasting',
      'Predictive delay & cost overrun alerts',
      'Automated scenario modeling',
      'Smart resource leveling',
    ],
    preconCapabilities: [
      'Integrated project scheduling',
      'Cost control & budgeting',
      'Risk register management',
      'Scope & change management',
      'Reporting & analytics dashboards',
    ],
    websiteUrl: 'https://oracle.com/industries/construction',
    category: 'Enterprise Project Controls',
    score: 92,
  },

  // ── MVP TIER ──────────────────────────────────────────────────────────────
  {
    rank: 4,
    name: 'Togal.AI',
    tier: 'MVP',
    tagline: 'Purpose-Built AI Takeoff in Seconds',
    description:
      'Togal.AI is a best-in-class AI takeoff tool that reads construction plans and auto-generates quantity measurements 10× faster than manual methods. Purpose-built for estimators and GCs.',
    aiFeatures: [
      'Computer-vision auto-takeoff from PDFs',
      'AI room/area auto-labeling',
      'Smart scope gap detection',
      'Historical cost benchmarking',
      'Continuous model improvement from feedback',
    ],
    preconCapabilities: [
      'Digital quantity takeoff',
      'Drawing management',
      'Scope extraction',
      'Estimate generation',
      'Team collaboration',
    ],
    githubUrl: 'https://github.com/search?q=togal+takeoff+AI',
    websiteUrl: 'https://togal.ai',
    category: 'AI Takeoff',
    score: 88,
  },
  {
    rank: 5,
    name: 'ALICE Technologies',
    tier: 'MVP',
    tagline: 'AI Construction Scheduling & Simulation Platform',
    description:
      'ALICE uses AI optioneering to analyze thousands of construction schedule scenarios and surface the optimal sequence, resource mix, and cost tradeoffs — transforming preconstruction planning.',
    aiFeatures: [
      'Generative AI schedule optioneering',
      'Multi-scenario simulation engine',
      'Resource & crew optimization',
      'What-if scenario analysis',
      'AI-driven cost/time tradeoff modeling',
    ],
    preconCapabilities: [
      '4D construction planning',
      'Resource planning',
      'Schedule risk analysis',
      'Bid strategy development',
      'Executive reporting',
    ],
    websiteUrl: 'https://alice.tech',
    category: 'AI Schedule Optimization',
    score: 85,
  },
  {
    rank: 6,
    name: 'Trimble Estimating (WinEst)',
    tier: 'MVP',
    tagline: 'AI-Enhanced Cost Estimation for Construction Professionals',
    description:
      'Trimble's WinEst platform brings AI to cost estimating with smart assemblies, historical cost databases, and intelligent sub-bid analysis — tightly integrated with Trimble's broader construction ecosystem.',
    aiFeatures: [
      'AI cost database recommendations',
      'Smart assembly auto-population',
      'Sub-bid level analysis & ranking',
      'Predictive overhead & profit modeling',
      'Integration with BIM for model-based estimating',
    ],
    preconCapabilities: [
      'Detailed cost estimating',
      'Bid package creation',
      'Sub-bid solicitation & comparison',
      'Change order management',
      'Budget vs. actual tracking',
    ],
    websiteUrl: 'https://trimble.com/en/solutions/industry/construction/estimating',
    category: 'Cost Estimating',
    score: 83,
  },
  {
    rank: 7,
    name: 'Stack Construction Technologies',
    tier: 'MVP',
    tagline: 'Cloud AI Takeoff & Estimating for Specialty Contractors',
    description:
      'Stack provides cloud-based AI takeoff and estimating with smart measurement tools, live collaboration, and built-in cost databases — popular with specialty subcontractors and mid-size GCs.',
    aiFeatures: [
      'AI-assisted digital takeoff measurements',
      'Smart cost database auto-matching',
      'Automated bid assembly',
      'Duplicate detection across drawings',
      'AI-powered scope completeness checks',
    ],
    preconCapabilities: [
      'Digital takeoff',
      'Cost estimating',
      'Bid management',
      'Document management',
      'Team collaboration',
    ],
    websiteUrl: 'https://stackct.com',
    category: 'Takeoff & Estimating',
    score: 80,
  },

  // ── MASTER TIER ───────────────────────────────────────────────────────────
  {
    rank: 8,
    name: 'Buildxact',
    tier: 'Master',
    tagline: 'AI-Powered Estimating for Residential & Light Commercial',
    description:
      'Buildxact combines AI estimating automation with job costing and scheduling in a lightweight platform designed for builders and small-to-mid GCs. Strong AI features for spec extraction and supplier quoting.',
    aiFeatures: [
      'AI spec sheet extraction',
      'Automated supplier quote requests',
      'Smart material quantity suggestions',
      'Predictive job cost tracking',
      'AI-driven estimate templates',
    ],
    preconCapabilities: [
      'Quantity takeoff',
      'Cost estimating',
      'Supplier quote management',
      'Client proposal generation',
      'Job scheduling',
    ],
    websiteUrl: 'https://buildxact.com',
    category: 'Residential Estimating',
    score: 76,
  },
  {
    rank: 9,
    name: 'PlanSwift (Trimble)',
    tier: 'Master',
    tagline: 'AI-Accelerated Digital Takeoff for Estimators',
    description:
      'PlanSwift streamlines the takeoff process with AI-assisted measurement tools and smart assemblies. A proven platform widely adopted by GCs and specialty trades for fast, accurate preconstruction takeoffs.',
    aiFeatures: [
      'AI-guided measurement suggestions',
      'Smart assembly auto-build',
      'Automated CSI code assignment',
      'Intelligent duplicate area detection',
      'One-click report generation',
    ],
    preconCapabilities: [
      'Digital plan takeoff',
      'Estimating assemblies',
      'Cost database integration',
      'PDF & CAD drawing support',
      'Multi-trade estimation',
    ],
    websiteUrl: 'https://planswift.com',
    category: 'Digital Takeoff',
    score: 74,
  },
  {
    rank: 10,
    name: 'Sage Estimating',
    tier: 'Master',
    tagline: 'AI-Integrated Estimating with ERP Connectivity',
    description:
      'Sage Estimating combines AI-assisted cost estimating with deep integration into Sage 300 Construction ERP — enabling preconstruction teams to produce bids that feed directly into project accounting and job cost systems.',
    aiFeatures: [
      'AI cost item recommendations',
      'Smart markup & escalation modeling',
      'Automated sub-bid comparison',
      'Predictive profitability scoring',
      'AI-powered scope gap warnings',
    ],
    preconCapabilities: [
      'Detailed cost estimating',
      'Bid package management',
      'ERP integration',
      'Historical bid analytics',
      'Project budget setup',
    ],
    websiteUrl: 'https://sage.com/en-us/products/sage-estimating',
    category: 'Estimating + ERP',
    score: 72,
  },
];

// =============================================================================
// TIER CONFIG
// =============================================================================

const TIER_CONFIG: Record<AppTier, { color: string; bg: string; border: string; badge: string; icon: React.ReactNode; description: string }> = {
  Elite: {
    color: 'text-yellow-700',
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    icon: <Trophy className="h-5 w-5 text-yellow-600" />,
    description: 'Enterprise-grade, full lifecycle AI — the gold standard in preconstruction intelligence.',
  },
  MVP: {
    color: 'text-blue-700',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800 border border-blue-300',
    icon: <Star className="h-5 w-5 text-blue-600" />,
    description: 'Highly capable AI platforms with specialized depth and strong preconstruction ROI.',
  },
  Master: {
    color: 'text-emerald-700',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    icon: <Award className="h-5 w-5 text-emerald-600" />,
    description: 'Focused AI tools and emerging platforms delivering strong value in targeted use cases.',
  },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Enterprise BIM & Estimating': <Brain className="h-4 w-4" />,
  'Construction Management Suite': <ClipboardList className="h-4 w-4" />,
  'Enterprise Project Controls': <BarChart2 className="h-4 w-4" />,
  'AI Takeoff': <Zap className="h-4 w-4" />,
  'AI Schedule Optimization': <BarChart2 className="h-4 w-4" />,
  'Cost Estimating': <FileText className="h-4 w-4" />,
  'Takeoff & Estimating': <Wrench className="h-4 w-4" />,
  'Residential Estimating': <Wrench className="h-4 w-4" />,
  'Digital Takeoff': <FileText className="h-4 w-4" />,
  'Estimating + ERP': <Shield className="h-4 w-4" />,
};

// =============================================================================
// SCORE BAR
// =============================================================================

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? 'bg-yellow-500' : score >= 80 ? 'bg-blue-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

// =============================================================================
// APP CARD
// =============================================================================

function AppCard({ app }: { app: AIPreconApp }) {
  const tier = TIER_CONFIG[app.tier];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 ${tier.border} ${tier.bg} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Rank + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                app.tier === 'Elite'
                  ? 'bg-yellow-200 text-yellow-800'
                  : app.tier === 'MVP'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              #{app.rank}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{app.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{app.tagline}</p>
            </div>
          </div>

          {/* Tier Badge */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tier.badge}`}
            >
              {tier.icon}
              {app.tier}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white/70 text-gray-600 border border-gray-200">
              {CATEGORY_ICONS[app.category]}
              {app.category}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">AI Intelligence Score</span>
          </div>
          <ScoreBar score={app.score} />
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{app.description}</p>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-3 text-xs font-semibold flex items-center gap-1 transition-colors ${tier.color} hover:opacity-70`}
        >
          {expanded ? 'Show less' : 'View capabilities & AI features'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200/60 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AI Features */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" /> AI Features
            </h4>
            <ul className="space-y-1.5">
              {app.aiFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Zap className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-purple-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Precon Capabilities */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" /> Precon Capabilities
            </h4>
            <ul className="space-y-1.5">
              {app.preconCapabilities.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="px-5 py-3 border-t border-gray-200/60 flex items-center justify-between">
        {app.githubUrl && (
          <a
            href={app.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        )}
        <a
          href={app.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto flex items-center gap-1 text-xs font-semibold ${tier.color} hover:opacity-70 transition-colors`}
        >
          Visit Platform <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// TIER SECTION
// =============================================================================

function TierSection({ tier, apps }: { tier: AppTier; apps: AIPreconApp[] }) {
  const config = TIER_CONFIG[tier];
  return (
    <section className="mb-10">
      <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl border ${config.border} ${config.bg}`}>
        <div className={`p-2 rounded-lg bg-white/70 border ${config.border}`}>
          {config.icon}
        </div>
        <div>
          <h2 className={`text-lg font-bold ${config.color}`}>{tier} Tier</h2>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
        <span className={`ml-auto text-3xl font-black opacity-20 ${config.color}`}>{tier.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppCard key={app.rank} app={app} />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export function AIPreconApps() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<AppTier | 'All'>('All');

  const filteredApps = TOP_AI_PRECON_APPS.filter((app) => {
    const matchesTier = filterTier === 'All' || app.tier === filterTier;
    const matchesSearch =
      searchTerm === '' ||
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const groupedByTier = (['Elite', 'MVP', 'Master'] as AppTier[]).reduce(
    (acc, tier) => {
      acc[tier] = filteredApps.filter((a) => a.tier === tier);
      return acc;
    },
    {} as Record<AppTier, AIPreconApp[]>
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Preconstruction</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-700 font-medium">AI-Driven Preconstruction Apps</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Top 10 AI-Driven Preconstruction Applications
          </h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            A competitive intelligence snapshot of the leading AI-powered preconstruction platforms,
            classified into <strong>Elite</strong>, <strong>MVP</strong>, and <strong>Master</strong> tiers
            based on AI capability depth, preconstruction workflow coverage, and industry adoption.
            Sourced via GitHub research and industry analysis — March 2026.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Elite Apps', value: '3', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
            { label: 'MVP Apps', value: '4', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'Master Apps', value: '3', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Avg AI Score', value: '82', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
            { label: 'AI Features', value: '50+', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
            { label: 'Categories', value: '10', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} p-3 text-center`}>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex gap-2">
            {(['All', 'Elite', 'MVP', 'Master'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filterTier === t
                    ? t === 'Elite'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : t === 'MVP'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : t === 'Master'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* No results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No applications match your search.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterTier('All'); }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Tier Sections */}
        {(['Elite', 'MVP', 'Master'] as AppTier[]).map((tier) =>
          groupedByTier[tier].length > 0 ? (
            <TierSection key={tier} tier={tier} apps={groupedByTier[tier]} />
          ) : null
        )}

        {/* Methodology Note */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Research Methodology</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Rankings were determined through a combination of GitHub repository analysis, industry publication
            reviews, G2 and Capterra ratings, and hands-on evaluation of AI capabilities in preconstruction
            workflows. The AI Intelligence Score (0–100) weighs AI feature depth (40%), preconstruction
            workflow coverage (30%), integration ecosystem (15%), and user adoption (15%). Tier classifications:
            <strong> Elite</strong> ≥ 90, <strong>MVP</strong> 79–89, <strong>Master</strong> 70–78.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default AIPreconApps;
