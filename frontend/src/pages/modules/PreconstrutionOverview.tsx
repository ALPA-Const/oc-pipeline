/* ============================================================
   PreconstrutionOverview.tsx — 2026 Estimating Command Dashboard
   ------------------------------------------------------------
   Pursuit/Bidding Command Center for Preconstruction → Overview
   - 6 KPI Cards with goal tracking
   - 3 Tables (Bidding, Pending, Lost)
   - Excel/CSV upload
   - AI + Manual Project Wizard integration
   - Collapsible right panel
   ============================================================ */

import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  Bot,
} from "lucide-react";
import {
  NewProjectWizard,
  AIProjectWizard,
  useInMemoryDirectoryProvider,
  type NewProjectWizardPayload,
} from "../../components/contacts";
import { Button } from "@/components/ui/button";

/* =========================
   Types
   ========================= */

type ProjectStatus = "bidding" | "pending" | "won" | "lost" | "other";

type Project = {
  id: string;
  agency: string;
  title: string;
  status: ProjectStatus;
  bid: number;
  award: number;
  location: string;
  dueDate: string;
  magnitude: string;
};

/* =========================
   Utility Functions
   ========================= */

function parseStatus(raw: string): ProjectStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("bidding")) return "bidding";
  if (s.includes("pending")) return "pending";
  if (s.includes("won")) return "won";
  if (s.includes("lost")) return "lost";
  return "other";
}

function parseCurrency(raw: string | number): number {
  if (typeof raw === "number") return raw;
  return parseFloat(String(raw || 0).replace(/[$,]/g, "")) || 0;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/* =========================
   UI Components
   ========================= */

function KPICard({
  label,
  value,
  subtitle,
  borderColor,
  highlight,
  highlightColor,
}: {
  label: string;
  value: string;
  subtitle: string;
  borderColor: string;
  highlight?: boolean;
  highlightColor?: string;
}) {
  return (
    <div
      className={[
        "bg-white border border-slate-200 rounded-lg shadow-sm p-5",
        `border-t-4 ${borderColor}`,
        highlight ? "bg-orange-50/20" : "",
      ].join(" ")}
    >
      <p className={`text-[10px] font-extrabold uppercase tracking-wide ${highlightColor || "text-slate-500"}`}>
        {label}
      </p>
      <p className="text-2xl font-black text-[#00205B] mt-1">{value}</p>
      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{subtitle}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    bidding: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
    other: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function SectionHeader({ title, color }: { title: string; color: "navy" | "green" | "red" }) {
  const bg = color === "navy" ? "bg-[#00205B]" : color === "green" ? "bg-[#009A44]" : "bg-red-700";
  return (
    <div className={`${bg} px-4 py-3 text-white font-bold text-xs uppercase tracking-widest`}>
      {title}
    </div>
  );
}

function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={col} className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wide p-3 border-b-2 border-slate-200 text-left">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableCell({ children, bold, color }: { children: React.ReactNode; bold?: boolean; color?: string }) {
  return (
    <td className={`p-3 text-[11px] border-b border-slate-100 ${bold ? "font-bold" : ""} ${color || ""}`}>
      {children}
    </td>
  );
}

/* =========================
   Right Panel Component (Collapsible)
   ========================= */

function RightPanel({ 
  collapsed,
  onToggle,
  onUpload, 
  onNewProject, 
  onAICreate 
}: { 
  collapsed: boolean;
  onToggle: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewProject: () => void;
  onAICreate: () => void;
}) {
  return (
    <aside 
      className={`
        relative flex flex-col bg-[#00205B] border-l-4 border-[#009A44] transition-all duration-300
        ${collapsed ? 'w-12' : 'w-64'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-6 bg-[#009A44] text-white rounded-full p-1 shadow-lg hover:bg-[#007A34] transition z-10"
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {collapsed ? (
        /* Collapsed State - Icons Only */
        <div className="flex flex-col items-center py-6 gap-4">
          <label className="p-2 text-slate-400 hover:text-white transition cursor-pointer" title="Upload Spreadsheet">
            <Upload className="w-5 h-5" />
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls,.csv"
              onChange={onUpload}
            />
          </label>
          <button
            onClick={onAICreate}
            className="p-2 text-[#009A44] hover:text-white transition"
            title="AI Create Project"
          >
            <Bot className="w-5 h-5" />
          </button>
          <button
            onClick={onNewProject}
            className="p-2 text-slate-400 hover:text-white transition"
            title="New Project"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Expanded State - Full Content */
        <div className="p-6">
          {/* Logo */}
          <div className="bg-white p-3 rounded mb-6 text-center">
            <span className="text-[#00205B] font-extrabold text-sm tracking-tight">
              O'NEILL CONTRACTORS
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {/* Upload Spreadsheet */}
            <label className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition font-bold text-xs cursor-pointer uppercase">
              <Upload className="w-4 h-4" />
              Upload Spreadsheet
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={onUpload}
              />
            </label>

            {/* AI Create Project */}
            <button
              onClick={onAICreate}
              className="w-full flex items-center gap-3 px-4 py-3 text-white bg-[#009A44] rounded-lg font-bold text-xs uppercase hover:opacity-90"
            >
              <Bot className="w-4 h-4" />
              AI Create Project
            </button>

            {/* Manual New Project */}
            <button
              onClick={onNewProject}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition font-bold text-xs uppercase"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </nav>

          {/* Bottom Branding */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">
              OC Pipeline v1.0
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}


/* =========================
   Main Component
   ========================= */

export function PreconstrutionOverview() {
  const ANNUAL_TARGET = 30_000_000;
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const directoryProvider = useInMemoryDirectoryProvider();

  // Handle file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

      const parsed: Project[] = rows.map((r) => ({
        id: String(r["Job #"] || "N/A"),
        agency: String(r["Agency"] || "Other"),
        title: String(r["Bid Title"] || "Untitled"),
        status: parseStatus(String(r["Status"] || "")),
        bid: parseCurrency(r["ONeill Bid"] as string | number),
        award: parseCurrency(r["Winning Bid"] as string | number),
        location: String(r["Location"] || "TBD"),
        dueDate: String(r["Bid Due"] || "TBD"),
        magnitude: String(r["$ Magnitude"] || "TBD"),
      }));

      setProjects(parsed);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  // Handle wizard project creation
  function handleCreateProject(payload: NewProjectWizardPayload) {
    const newProject: Project = {
      id: `NEW-${Date.now()}`,
      agency: payload.market_type === "government" 
        ? (payload.funding_agency_name || "Federal Agency")
        : (payload.owner_name || "Private Owner"),
      title: payload.project_name,
      status: "bidding",
      bid: 0,
      award: 0,
      location: payload.site_city && payload.site_state 
        ? `${payload.site_city}, ${payload.site_state}`
        : "TBD",
      dueDate: payload.bid_due_date || "TBD",
      magnitude: "TBD",
    };
    setProjects((prev) => [...prev, newProject]);
    setWizardOpen(false);
  }


  // KPI Calculations
  const kpis = useMemo(() => {
    const bidding = projects.filter((p) => p.status === "bidding");
    const pending = projects.filter((p) => p.status === "pending");
    const won = projects.filter((p) => p.status === "won");
    const lost = projects.filter((p) => p.status === "lost");

    const totalBid = projects.reduce((sum, p) => sum + p.bid, 0);
    const moneyInBid = pending.reduce((sum, p) => sum + p.bid, 0);
    const wonTotal = won.reduce((sum, p) => sum + p.award, 0);
    const totalDecided = won.length + lost.length;
    const winRate = totalDecided > 0 ? Math.round((won.length / totalDecided) * 100) : 0;
    const remaining = Math.max(ANNUAL_TARGET - wonTotal, 0);
    const goalReached = remaining <= 0;

    return {
      totalBid,
      moneyInBid,
      activePursuits: bidding.length,
      winRate,
      pendingCount: pending.length,
      remaining,
      goalReached,
      bidding,
      pending,
      won,
      lost,
    };
  }, [projects]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-100 -m-6">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
          <h1 className="text-lg font-extrabold text-[#00205B] uppercase">
            2026 Estimating Command
          </h1>
          <span className="text-xs font-bold text-slate-500 uppercase">
            FY 2026 Revenue Goal: $30,000,000
          </span>
        </header>

        <main className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <KPICard
              label="Total Bid to Date"
              value={formatMoney(kpis.totalBid)}
              subtitle="2026 Submissions"
              borderColor="border-blue-600"
            />
            <KPICard
              label="Money in Bid"
              value={formatMoney(kpis.moneyInBid)}
              subtitle="Pending Decisions"
              borderColor="border-green-500"
            />
            <KPICard
              label="Active Pursuits"
              value={String(kpis.activePursuits)}
              subtitle="Currently Bidding"
              borderColor="border-yellow-500"
            />
            <KPICard
              label="Win Rate"
              value={`${kpis.winRate}%`}
              subtitle="YTD Performance"
              borderColor="border-purple-500"
            />
            <KPICard
              label="Pending Selections"
              value={String(kpis.pendingCount)}
              subtitle="Awaiting Owner"
              borderColor="border-red-500"
            />
            <KPICard
              label={kpis.goalReached ? "Goal Reached!" : "Remaining to Goal"}
              value={kpis.goalReached ? "✓ GOAL MET" : formatMoney(kpis.remaining)}
              subtitle="Target: $30.0M"
              borderColor={kpis.goalReached ? "border-green-500" : "border-orange-500"}
              highlight={!kpis.goalReached}
              highlightColor={kpis.goalReached ? "text-green-700" : "text-orange-700"}
            />
          </div>


          {/* Tables */}
          <div className="space-y-6">
            {/* Projects Currently Bidding */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <SectionHeader title="Projects Currently Bidding" color="navy" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <TableHead columns={["Job #", "Agency", "Project Title", "Location", "Bid Due", "Magnitude"]} />
                  <tbody>
                    {kpis.bidding.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 text-sm">
                          No active bids. Upload a spreadsheet or create a new project.
                        </td>
                      </tr>
                    ) : (
                      kpis.bidding.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <TableCell bold>{p.id}</TableCell>
                          <TableCell>{p.agency}</TableCell>
                          <TableCell>{p.title}</TableCell>
                          <TableCell>{p.location}</TableCell>
                          <TableCell>{p.dueDate}</TableCell>
                          <TableCell color="text-green-600 font-bold">{p.magnitude}</TableCell>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submitted - Pending Owner Selection */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <SectionHeader title="Submitted — Pending Owner Selection" color="green" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <TableHead columns={["Job #", "Agency", "Project Title", "O'Neill Bid", "Status"]} />
                  <tbody>
                    {kpis.pending.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                          No pending selections.
                        </td>
                      </tr>
                    ) : (
                      kpis.pending.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <TableCell bold>{p.id}</TableCell>
                          <TableCell>{p.agency}</TableCell>
                          <TableCell>{p.title}</TableCell>
                          <TableCell>${p.bid.toLocaleString()}</TableCell>
                          <TableCell>
                            <StatusPill status="pending" />
                          </TableCell>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projects Lost */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <SectionHeader title="Projects Lost" color="red" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <TableHead columns={["Job #", "Agency", "Project Title", "Our Bid", "Winning Bid", "Diff"]} />
                  <tbody>
                    {kpis.lost.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 text-sm">
                          No lost projects recorded.
                        </td>
                      </tr>
                    ) : (
                      kpis.lost.map((p) => {
                        const diff = p.award > 0 ? p.bid - p.award : 0;
                        const diffPct = p.award > 0 ? ((diff / p.award) * 100).toFixed(1) : "—";
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <TableCell bold>{p.id}</TableCell>
                            <TableCell>{p.agency}</TableCell>
                            <TableCell>{p.title}</TableCell>
                            <TableCell>${p.bid.toLocaleString()}</TableCell>
                            <TableCell>${p.award.toLocaleString()}</TableCell>
                            <TableCell color={diff > 0 ? "text-red-600" : "text-green-600"}>
                              {diff > 0 ? `+$${diff.toLocaleString()} (${diffPct}%)` : "—"}
                            </TableCell>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right Panel (Collapsible) */}
      <RightPanel
        collapsed={rightPanelCollapsed}
        onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        onUpload={handleFileUpload}
        onNewProject={() => setWizardOpen(true)}
        onAICreate={() => setAiWizardOpen(true)}
      />

      {/* New Project Wizard */}
      <NewProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        provider={directoryProvider}
        onCreateProject={handleCreateProject}
      />

      {/* AI-Powered Project Wizard */}
      <AIProjectWizard
        open={aiWizardOpen}
        onClose={() => setAiWizardOpen(false)}
        onProjectCreated={(id) => {
          console.log("AI Project Created:", id);
          setAiWizardOpen(false);
        }}
        directoryProvider={directoryProvider}
      />
    </div>
  );
}

export default PreconstrutionOverview;
