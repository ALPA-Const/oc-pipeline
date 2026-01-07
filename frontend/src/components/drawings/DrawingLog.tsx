/* ============================================================
   DrawingLog.tsx — Project Drawing Log View
   ------------------------------------------------------------
   OC Pipeline | Federal-Grade Construction Management SaaS
   
   Features:
   - Comprehensive drawing list with filtering
   - Discipline-based organization (A, S, M, E, P)
   - Revision history tracking
   - Quick search and faceted filters
   - Integration with DrawingUploadWizard
   
   Compliance: NIST 800-171 | SOC 2 Type II
   ============================================================ */

import React, { useState, useMemo } from "react";
import DrawingUploadWizard from "./DrawingUploadWizard";

/* =========================
   Type Definitions
   ========================= */

type DisciplineCode = "A" | "S" | "M" | "E" | "P" | "C" | "L" | "G" | "T" | "X";

interface DisciplineInfo {
  code: DisciplineCode;
  name: string;
  color: string;
}

const DISCIPLINE_MAP: Record<string, DisciplineInfo> = {
  A: { code: "A", name: "Architectural", color: "#3B82F6" },
  S: { code: "S", name: "Structural", color: "#EF4444" },
  M: { code: "M", name: "Mechanical", color: "#22C55E" },
  E: { code: "E", name: "Electrical", color: "#F59E0B" },
  P: { code: "P", name: "Plumbing", color: "#8B5CF6" },
  C: { code: "C", name: "Civil", color: "#06B6D4" },
  L: { code: "L", name: "Landscape", color: "#10B981" },
  G: { code: "G", name: "General", color: "#6B7280" },
  T: { code: "T", name: "Telecommunications", color: "#EC4899" },
  X: { code: "X", name: "Other", color: "#78716C" },
};


interface DrawingSet {
  id: string;
  name: string;
  date: string;
  drawing_count: number;
}

interface DrawingRevision {
  id: string;
  revision_number: string;
  uploaded_at: string;
  uploaded_by: string;
  status: "private" | "published";
}

interface Drawing {
  id: string;
  drawing_number: string;
  title: string;
  discipline: DisciplineInfo;
  current_revision: string;
  revisions: DrawingRevision[];
  set_id: string;
  set_name: string;
  last_updated: string;
  status: "private" | "published";
  thumbnail_url?: string;
}

interface DrawingLogProps {
  projectId: string;
  projectName: string;
}


/* =========================
   Mock Data for Development
   ========================= */

const MOCK_DRAWING_SETS: DrawingSet[] = [
  { id: "set-1", name: "50% SD Set", date: "2024-10-15", drawing_count: 24 },
  { id: "set-2", name: "90% CD Set", date: "2024-11-20", drawing_count: 87 },
  { id: "set-3", name: "IFC Set", date: "2024-12-01", drawing_count: 112 },
];

function generateMockDrawings(): Drawing[] {
  const drawings: Drawing[] = [];
  const disciplines = ["A", "S", "M", "E", "P"];
  const archTitles = [
    "Cover Sheet", "Site Plan", "First Floor Plan", "Second Floor Plan",
    "Roof Plan", "Building Elevations", "Building Sections", "Wall Sections",
    "Door Schedule", "Window Schedule", "Interior Elevations", "Ceiling Plan",
    "Finish Schedule", "Detail Sheet 1", "Detail Sheet 2"
  ];
  const structTitles = [
    "Foundation Plan", "Foundation Details", "First Floor Framing",
    "Second Floor Framing", "Roof Framing", "Column Schedule",
    "Beam Schedule", "Structural Details", "Connection Details"
  ];
  const mechTitles = [
    "HVAC Floor Plan - Level 1", "HVAC Floor Plan - Level 2",
    "Ductwork Details", "Equipment Schedule", "Control Diagrams",
    "Mechanical Details", "Piping Diagram"
  ];
  const elecTitles = [
    "Lighting Plan - Level 1", "Lighting Plan - Level 2",
    "Power Plan - Level 1", "Power Plan - Level 2",
    "Panel Schedule", "One-Line Diagram", "Electrical Details"
  ];
  const plumbTitles = [
    "Plumbing Floor Plan - Level 1", "Plumbing Floor Plan - Level 2",
    "Riser Diagram", "Fixture Schedule", "Plumbing Details"
  ];

  let id = 1;
  const addDrawings = (prefix: string, titles: string[]) => {
    titles.forEach((title, idx) => {
      const num = String(idx + 101).padStart(3, "0");
      const drawingNum = `${prefix}-${num}`;
      drawings.push({
        id: `dwg-${id++}`,
        drawing_number: drawingNum,
        title: title,
        discipline: DISCIPLINE_MAP[prefix] || DISCIPLINE_MAP["X"],
        current_revision: Math.random() > 0.7 ? "1" : "0",
        revisions: [
          {
            id: `rev-${id}-0`,
            revision_number: "0",
            uploaded_at: "2024-11-20",
            uploaded_by: "Bill Asmar",
            status: "published",
          },
        ],
        set_id: "set-3",
        set_name: "IFC Set",
        last_updated: "2024-12-15",
        status: "published",
      });
    });
  };

  addDrawings("A", archTitles);
  addDrawings("S", structTitles);
  addDrawings("M", mechTitles);
  addDrawings("E", elecTitles);
  addDrawings("P", plumbTitles);

  return drawings;
}


/* =========================
   Main Component
   ========================= */

export default function DrawingLog({ projectId, projectName }: DrawingLogProps) {
  const NAVY = "#00205B";
  const GREEN = "#009A44";

  // State
  const [drawings, setDrawings] = useState<Drawing[]>(generateMockDrawings);
  const [drawingSets] = useState<DrawingSet[]>(MOCK_DRAWING_SETS);
  const [uploadWizardOpen, setUploadWizardOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [filterSet, setFilterSet] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Computed
  const filteredDrawings = useMemo(() => {
    return drawings.filter((d) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !d.drawing_number.toLowerCase().includes(q) &&
          !d.title.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Discipline filter
      if (filterDiscipline !== "all" && d.discipline.code !== filterDiscipline) {
        return false;
      }
      // Set filter
      if (filterSet !== "all" && d.set_id !== filterSet) {
        return false;
      }
      return true;
    });
  }, [drawings, searchQuery, filterDiscipline, filterSet]);

  // Stats
  const disciplineStats = useMemo(() => {
    return Object.values(DISCIPLINE_MAP)
      .map((disc) => ({
        ...disc,
        count: drawings.filter((d) => d.discipline.code === disc.code).length,
      }))
      .filter((d) => d.count > 0);
  }, [drawings]);

  const totalDrawings = drawings.length;


  /* =========================
     Render
     ========================= */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #003380 100%)`,
        padding: "24px 32px",
        color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
              📐 Drawing Log
            </h1>
            <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: "14px" }}>
              {projectName} • {totalDrawings} Total Drawings
            </p>
          </div>
          <button
            onClick={() => setUploadWizardOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: GREEN,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📤 Upload Drawings
          </button>
        </div>


        {/* Discipline Pills */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
          {disciplineStats.map((d) => (
            <div
              key={d.code}
              onClick={() => setFilterDiscipline(filterDiscipline === d.code ? "all" : d.code)}
              style={{
                padding: "6px 14px",
                backgroundColor: filterDiscipline === d.code ? d.color : "rgba(255,255,255,0.15)",
                border: `1px solid ${filterDiscipline === d.code ? d.color : "rgba(255,255,255,0.3)"}`,
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {d.name} ({d.count})
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        padding: "16px 32px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "200px", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="🔍 Search drawings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

