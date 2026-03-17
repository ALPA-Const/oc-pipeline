/**
 * Ecosystem & Integrations
 * Curated index of related GitHub repositories and tools,
 * organized into four categories:
 *   1. Your organisation's own repos (ALPA-Const)
 *   2. Open-source construction management tools
 *   3. Scheduling & Gantt chart libraries
 *   4. Commercial platforms for reference
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Github,
  ExternalLink,
  Star,
  GitFork,
  Search,
  Building2,
  CalendarDays,
  Layers,
  Globe,
  Code2,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepoCard {
  name: string;
  fullName: string;
  description: string;
  url: string;
  language?: string;
  stars?: number;
  forks?: number;
  topics?: string[];
  isOwn?: boolean;
}

interface ToolCard {
  name: string;
  description: string;
  url: string;
  type: 'commercial' | 'open-source';
  tags: string[];
  badge?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ORG_REPOS: RepoCard[] = [
  {
    name: 'oc-pipeline',
    fullName: 'ALPA-Const/oc-pipeline',
    description: 'OC Pipeline – Construction Project Management System. Full-stack federal contractor pipeline tracker with Supabase, React, and AI estimating.',
    url: 'https://github.com/ALPA-Const/oc-pipeline',
    language: 'TypeScript',
    stars: 1,
    forks: 0,
    topics: ['construction', 'pipeline', 'react', 'supabase', 'typescript'],
    isOwn: true,
  },
  {
    name: 'Submittal-Log-Automation',
    fullName: 'ALPA-Const/Submittal-Log-Automation',
    description: 'Automated submittal log generation for construction projects. Streamlines the RFI and submittal tracking workflow.',
    url: 'https://github.com/ALPA-Const/Submittal-Log-Automation',
    language: 'TypeScript',
    stars: 1,
    forks: 1,
    topics: ['construction', 'submittal', 'automation'],
    isOwn: true,
  },
  {
    name: 'OC-Pipeline---Cost-Code-Module',
    fullName: 'ALPA-Const/OC-Pipeline---Cost-Code-Module',
    description: 'Cost Code Module for OC Pipeline. Manages CSI MasterFormat cost codes, budget line items, and financial tracking.',
    url: 'https://github.com/ALPA-Const/OC-Pipeline---Cost-Code-Module',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['cost-codes', 'construction', 'typescript'],
    isOwn: true,
  },
  {
    name: 'subtrack-mcp-server',
    fullName: 'ALPA-Const/subtrack-mcp-server',
    description: 'MCP server for subcontractor tracking and bid management integrations.',
    url: 'https://github.com/ALPA-Const/subtrack-mcp-server',
    language: 'JavaScript',
    stars: 0,
    forks: 0,
    topics: ['mcp', 'subcontractor', 'integration'],
    isOwn: true,
  },
  {
    name: 'selfhosted-supabase-mcp',
    fullName: 'ALPA-Const/selfhosted-supabase-mcp',
    description: 'Self-hosted Supabase MCP server for connecting AI agents directly to your Supabase database.',
    url: 'https://github.com/ALPA-Const/selfhosted-supabase-mcp',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['supabase', 'mcp', 'ai'],
    isOwn: true,
  },
  {
    name: 'ON-MetaGPT_Est_Assit',
    fullName: 'ALPA-Const/ON-MetaGPT_Est_Assit',
    description: "MetaGPT-powered estimating assistant for O'Neill Contractors. AI multi-agent framework for construction bid analysis.",
    url: 'https://github.com/ALPA-Const/ON-MetaGPT_Est_Assit',
    language: 'Python',
    stars: 0,
    forks: 0,
    topics: ['ai', 'estimating', 'metagpt', 'construction'],
    isOwn: true,
  },
  {
    name: 'Site_Mapper',
    fullName: 'ALPA-Const/Site_Mapper',
    description: 'Sitemap CLI for fast, automated sitemap.xml generation across construction project websites.',
    url: 'https://github.com/ALPA-Const/Site_Mapper',
    language: 'Ruby',
    stars: 0,
    forks: 0,
    topics: ['sitemap', 'cli', 'ruby'],
    isOwn: true,
  },
  {
    name: 'Orchestrator_Command_Center',
    fullName: 'ALPA-Const/Orchestrator_Command_Center',
    description: 'AI agent orchestration command center for managing multi-step construction workflow automations.',
    url: 'https://github.com/ALPA-Const/Orchestrator_Command_Center',
    language: 'JavaScript',
    stars: 0,
    forks: 0,
    topics: ['ai', 'orchestration', 'agents'],
    isOwn: true,
  },
  {
    name: 'Claude_CookBooks',
    fullName: 'ALPA-Const/Claude_CookBooks',
    description: 'Jupyter Notebook cookbook collection for using Claude AI in construction workflows — estimating, scheduling, document analysis.',
    url: 'https://github.com/ALPA-Const/Claude_CookBooks',
    language: 'Jupyter Notebook',
    stars: 0,
    forks: 0,
    topics: ['claude', 'ai', 'construction', 'notebook'],
    isOwn: true,
  },
  {
    name: 'Claude-Skills',
    fullName: 'ALPA-Const/Claude-Skills',
    description: 'Python library of reusable Claude AI skills for construction document processing, cost analysis, and compliance checking.',
    url: 'https://github.com/ALPA-Const/Claude-Skills',
    language: 'Python',
    stars: 0,
    forks: 0,
    topics: ['claude', 'ai', 'python', 'construction'],
    isOwn: true,
  },
  {
    name: 'One-Stop-AI-Shop',
    fullName: 'ALPA-Const/One-Stop-AI-Shop',
    description: 'Unified AI tool hub for construction teams. Centralizes LLM-powered workflows for estimating, scheduling, and contract review.',
    url: 'https://github.com/ALPA-Const/One-Stop-AI-Shop',
    language: 'Python',
    stars: 0,
    forks: 0,
    topics: ['ai', 'llm', 'construction'],
    isOwn: true,
  },
];

const OPEN_SOURCE_TOOLS: RepoCard[] = [
  {
    name: 'Civora-Dashboard',
    fullName: 'MiladJoodi/Civora-Dashboard',
    description: 'Construction project management system that allows teams to easily track projects, their progress, and status. Built with Next.js 15 and TypeScript with Tailwind CSS and Shadcn/UI.',
    url: 'https://github.com/MiladJoodi/Civora-Dashboard',
    language: 'TypeScript',
    stars: 15,
    forks: 0,
    topics: ['construction', 'project-management', 'nextjs', 'typescript', 'tailwindcss'],
  },
  {
    name: 'CONSTRUCTION-ERP',
    fullName: 'colmanserafin-hub/CONSTRUCTION-ERP',
    description: 'End-to-end construction ERP built with Flask (Python) + React frontend. Automates approval processes, enforces GPS-based attendance verification, and provides real-time project insights.',
    url: 'https://github.com/colmanserafin-hub/CONSTRUCTION-ERP',
    language: 'JavaScript',
    stars: 2,
    forks: 0,
    topics: ['construction', 'erp', 'flask', 'react', 'gps-tracking'],
  },
  {
    name: 'fieldops',
    fullName: 'shreyaawari28/fieldops',
    description: 'Responsive React.js web application for construction site management with JWT authentication, project tracking with status filters, and Daily Progress Report (DPR) submission.',
    url: 'https://github.com/shreyaawari28/fieldops',
    language: 'JavaScript',
    stars: 2,
    forks: 1,
    topics: ['construction', 'field-operations', 'react', 'vite', 'tailwindcss'],
  },
  {
    name: 'concrete-works-testing-rms',
    fullName: 'JoseArron/concrete-works-testing-rms',
    description: 'Management system web app to manage testing records of construction projects and automate making reports. Built with Next.js, Prisma, and Supabase.',
    url: 'https://github.com/JoseArron/concrete-works-testing-rms',
    language: 'TypeScript',
    stars: 2,
    forks: 0,
    topics: ['construction', 'testing', 'nextjs', 'supabase', 'prisma'],
  },
  {
    name: 'projtrack-portfolio-demo',
    fullName: 'SAIKO0000/projtrack-portfolio-demo',
    description: 'Engineering Management Dashboard — full-stack Next.js application for construction project management using React, TypeScript, Supabase, and modern UI components.',
    url: 'https://github.com/SAIKO0000/projtrack-portfolio-demo',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['construction', 'project-management', 'nextjs', 'supabase', 'typescript'],
  },
  {
    name: 'Management-Road-Projects',
    fullName: 'AhmedAbdulrahmansaad/Management-Road-Projects',
    description: 'Road Projects Management System — interactive dashboard using React, Vite, and Supabase. Closely mirrors the OC Pipeline tech stack.',
    url: 'https://github.com/AhmedAbdulrahmansaad/Management-Road-Projects',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['road-projects', 'react', 'vite', 'supabase', 'typescript'],
  },
  {
    name: 'Lithos.AI',
    fullName: 'Justin0504/Lithos.AI',
    description: 'SaaS platform for renewable material construction management. AI-powered blueprint generation, real-time factory monitoring, construction progress tracking, and environmental impact analysis.',
    url: 'https://github.com/Justin0504/Lithos.AI',
    language: 'TypeScript',
    stars: 6,
    forks: 0,
    topics: ['ai', 'construction', 'saas', 'react', 'typescript'],
  },
];

const GANTT_LIBRARIES: RepoCard[] = [
  {
    name: 'gantt (DHTMLX)',
    fullName: 'DHTMLX/gantt',
    description: 'GPL version of the JavaScript DHTMLX Gantt chart — the industry-standard library powering Primavera integrations. Supports critical path, baselines, task dependencies, drag-and-drop, and resource loading.',
    url: 'https://github.com/DHTMLX/gantt',
    language: 'JavaScript',
    stars: 1762,
    forks: 353,
    topics: ['gantt', 'gantt-chart', 'project-management', 'scheduling'],
  },
  {
    name: 'react-gantt (SVAR)',
    fullName: 'svar-widgets/react-gantt',
    description: 'High-performance React Gantt chart with TypeScript support and flexible timeline configuration. Supports drag-and-drop rescheduling, task dependencies, and multi-level WBS.',
    url: 'https://github.com/svar-widgets/react-gantt',
    language: 'JavaScript',
    stars: 123,
    forks: 20,
    topics: ['gantt', 'gantt-chart', 'react', 'typescript', 'scheduling', 'project-management'],
  },
  {
    name: 'gantt_chart (MPP import)',
    fullName: 'AlbertoJTD/gantt_chart',
    description: 'Upload Microsoft Project .mpp files and view the data as a Gantt chart. Built with Ruby on Rails + DHTMLX + MPXJ library for .mpp/.xer file parsing.',
    url: 'https://github.com/AlbertoJTD/gantt_chart',
    language: 'Ruby',
    stars: 4,
    forks: 2,
    topics: ['microsoft-project', 'mpp', 'mpxj', 'dhtmlx', 'gantt'],
  },
  {
    name: 'Activity-Tracker-Bryntum-Gantt-Charts',
    fullName: 'engmaryamameen/Activity-Tracker-Bryntum-Gantt-Charts',
    description: 'Project management app using Next.js, Express, MongoDB, and Bryntum Gantt with real-time task scheduling, dependency tracking, and enterprise-grade Gantt features.',
    url: 'https://github.com/engmaryamameen/Activity-Tracker-Bryntum-Gantt-Charts',
    language: 'TypeScript',
    stars: 1,
    forks: 0,
    topics: ['bryntum-gantt', 'project-management', 'nextjs', 'enterprise'],
  },
  {
    name: 'Gantt-experiment',
    fullName: 'Unnoticed6875/Gantt-experiment',
    description: 'Enhanced Gantt chart with drag-to-reschedule, auto-scheduling, and dependency management. Built with Next.js 16, React 19, Drizzle ORM, and Tailwind CSS v4.',
    url: 'https://github.com/Unnoticed6875/Gantt-experiment',
    language: 'TypeScript',
    stars: 1,
    forks: 0,
    topics: ['gantt', 'nextjs', 'react', 'drizzle', 'tailwindcss'],
  },
];

const COMMERCIAL_PLATFORMS: ToolCard[] = [
  {
    name: 'Procore',
    description: 'Industry-leading construction management platform. RFIs, submittals, drawings, budget, scheduling, and field operations. Deep federal/government project support.',
    url: 'https://www.procore.com',
    type: 'commercial',
    tags: ['scheduling', 'documents', 'budget', 'federal'],
    badge: 'Market Leader',
  },
  {
    name: 'Primavera P6 (Oracle)',
    description: 'Gold standard CPM scheduling tool for construction. Native .XER file format. Enterprise project portfolio management with critical path and resource leveling.',
    url: 'https://www.oracle.com/construction-engineering/primavera-p6/',
    type: 'commercial',
    tags: ['.xer', 'cpm', 'critical-path', 'resource-leveling', 'federal'],
    badge: 'CPM Standard',
  },
  {
    name: 'Microsoft Project',
    description: 'Widely used project scheduling with .MPP file format. Gantt charts, WBS, resource management, and Microsoft 365 integration.',
    url: 'https://www.microsoft.com/en-us/microsoft-365/project/project-management-software',
    type: 'commercial',
    tags: ['.mpp', 'gantt', 'wbs', 'microsoft-365'],
    badge: 'Industry Standard',
  },
  {
    name: 'Autodesk Construction Cloud',
    description: 'BIM 360 + PlanGrid + BuildingConnected unified. Covers estimating, design collaboration, field operations, and project management for large-scale construction.',
    url: 'https://construction.autodesk.com',
    type: 'commercial',
    tags: ['bim', 'estimating', 'field-ops', 'documents'],
    badge: 'BIM Leader',
  },
  {
    name: 'Buildertrend',
    description: 'Cloud-based construction management for residential and commercial builders. Daily logs, scheduling, budget tracking, client portal, and subcontractor management.',
    url: 'https://buildertrend.com',
    type: 'commercial',
    tags: ['scheduling', 'budget', 'client-portal', 'subcontractors'],
  },
  {
    name: 'e-Builder',
    description: 'Program management software purpose-built for owners and government agencies. Federal construction program management, budgeting, and compliance reporting.',
    url: 'https://www.trimble.com/construction-software/e-builder',
    type: 'commercial',
    tags: ['federal', 'program-management', 'government', 'compliance'],
    badge: 'Federal Focus',
  },
  {
    name: 'CoConstruct',
    description: 'Construction project management for custom home builders and remodelers. Estimating, scheduling, client communication, and selections management.',
    url: 'https://www.coconstruct.com',
    type: 'commercial',
    tags: ['scheduling', 'estimating', 'client-communication'],
  },
  {
    name: 'Viewpoint Spectrum',
    description: 'ERP system for mid-to-large construction companies. Accounting, project management, payroll, equipment, and service management in a single platform.',
    url: 'https://viewpoint.com/spectrum',
    type: 'commercial',
    tags: ['erp', 'accounting', 'payroll', 'project-management'],
  },
];

// ─── Language Badge ───────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-700',
  JavaScript: 'bg-yellow-100 text-yellow-700',
  Python: 'bg-green-100 text-green-700',
  Ruby: 'bg-red-100 text-red-700',
  'Jupyter Notebook': 'bg-purple-100 text-purple-700',
};

function LangBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  const cls = LANG_COLORS[lang] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Code2 className="h-3 w-3" />
      {lang}
    </span>
  );
}

// ─── RepoCard ─────────────────────────────────────────────────────────────────

function RepoCardItem({ repo }: { repo: RepoCard }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {repo.isOwn ? (
            <Building2 className="h-4 w-4 flex-shrink-0 text-blue-600" />
          ) : (
            <Github className="h-4 w-4 flex-shrink-0 text-gray-500" />
          )}
          <span className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700">
            {repo.name}
          </span>
          {repo.isOwn && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-semibold">
              yours
            </span>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-600 mt-0.5" />
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-3 flex-1">{repo.description}</p>

      <div className="flex items-center flex-wrap gap-2 mt-auto">
        <LangBadge lang={repo.language} />
        {typeof repo.stars === 'number' && (
          <span className="flex items-center gap-0.5 text-xs text-gray-500">
            <Star className="h-3 w-3 text-yellow-500" />
            {repo.stars.toLocaleString()}
          </span>
        )}
        {typeof repo.forks === 'number' && repo.forks > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-gray-500">
            <GitFork className="h-3 w-3" />
            {repo.forks}
          </span>
        )}
      </div>

      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {t}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="px-1.5 py-0.5 text-xs text-gray-400">
              +{repo.topics.length - 4}
            </span>
          )}
        </div>
      )}
    </a>
  );
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCardItem({ tool }: { tool: ToolCard }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-4 w-4 flex-shrink-0 text-purple-500" />
          <span className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-700">
            {tool.name}
          </span>
          {tool.badge && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">
              {tool.badge}
            </span>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-purple-600 mt-0.5" />
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-3 flex-1">{tool.description}</p>

      <div className="flex flex-wrap gap-1 mt-auto">
        {tool.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            <Tag className="h-2.5 w-2.5" />
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                {count}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Ecosystem() {
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();

  const filteredOrg = ORG_REPOS.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.topics?.some((t) => t.includes(q))
  );

  const filteredOss = OPEN_SOURCE_TOOLS.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.topics?.some((t) => t.includes(q))
  );

  const filteredGantt = GANTT_LIBRARIES.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.topics?.some((t) => t.includes(q))
  );

  const filteredCommercial = COMMERCIAL_PLATFORMS.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
  );

  const totalCount =
    filteredOrg.length +
    filteredOss.length +
    filteredGantt.length +
    filteredCommercial.length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Github className="h-7 w-7 text-gray-800" />
            <h1 className="text-2xl font-bold text-gray-900">Ecosystem & Integrations</h1>
          </div>
          <p className="text-sm text-gray-500">
            Curated index of your organization's repositories, related open-source tools, scheduling
            libraries, and commercial platforms in the construction technology space.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search repos, tools, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-5">
          {/* 1. Your Org Repos */}
          <Section
            title="ALPA-Const Organization Repos"
            subtitle="All public repositories in the ALPA-Const GitHub organization"
            icon={Building2}
            iconColor="bg-blue-100 text-blue-700"
            count={filteredOrg.length}
          >
            {filteredOrg.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No repos match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredOrg.map((r) => (
                  <RepoCardItem key={r.fullName} repo={r} />
                ))}
              </div>
            )}
          </Section>

          {/* 2. Open-Source Construction Tools */}
          <Section
            title="Open-Source Construction Management"
            subtitle="Comparable open-source projects in the construction tech space"
            icon={Layers}
            iconColor="bg-green-100 text-green-700"
            count={filteredOss.length}
          >
            {filteredOss.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No repos match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredOss.map((r) => (
                  <RepoCardItem key={r.fullName} repo={r} />
                ))}
              </div>
            )}
          </Section>

          {/* 3. Scheduling & Gantt Libraries */}
          <Section
            title="Scheduling & Gantt Chart Libraries"
            subtitle="Open-source libraries for Gantt charts, CPM scheduling, and .XER/.MPP import"
            icon={CalendarDays}
            iconColor="bg-orange-100 text-orange-700"
            count={filteredGantt.length}
          >
            {filteredGantt.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No repos match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredGantt.map((r) => (
                  <RepoCardItem key={r.fullName} repo={r} />
                ))}
              </div>
            )}
          </Section>

          {/* 4. Commercial Platforms */}
          <Section
            title="Commercial Platforms for Reference"
            subtitle="Industry-standard commercial construction management tools"
            icon={Globe}
            iconColor="bg-purple-100 text-purple-700"
            count={filteredCommercial.length}
            defaultOpen={false}
          >
            {filteredCommercial.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No tools match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCommercial.map((t) => (
                  <ToolCardItem key={t.name} tool={t} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-gray-400 text-center">
          Repository data sourced via the GitHub API · Star counts may be outdated ·{' '}
          <a
            href="https://github.com/ALPA-Const"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            View ALPA-Const on GitHub ↗
          </a>
        </p>
      </div>
    </AppLayout>
  );
}

export default Ecosystem;
