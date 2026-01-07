/* ============================================================
   DrawingUploadWizard.tsx — AI-Powered Drawing Management
   ------------------------------------------------------------
   OC Pipeline | Federal-Grade Construction Management SaaS
   
   Features:
   - Multi-page PDF auto-splitting
   - CV/OCR title block extraction
   - Discipline prefix mapping (A, S, M, E, P)
   - 98% confidence threshold with HITL fallback
   - Drawing Set versioning
   - Revision conflict detection
   
   Compliance: NIST 800-171 | SOC 2 Type II
   ============================================================ */

import React, { useState, useCallback, useRef } from "react";

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

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
  page_count?: number;
}

interface ExtractedDrawing {
  id: string;
  source_file_id: string;
  page_number: number;
  drawing_number: string;
  title: string;
  revision: string;
  discipline: DisciplineInfo;
  confidence: number;
  needs_review: boolean;
  thumbnail_url?: string;
  status: "extracted" | "reviewed" | "published";
  is_duplicate: boolean;
  existing_drawing_id?: string;
}

interface DrawingUploadWizardProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onDrawingsPublished?: (drawings: ExtractedDrawing[]) => void;
}


/* =========================
   Utility Functions
   ========================= */

function uuid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseDiscipline(drawingNumber: string): DisciplineInfo {
  const prefix = drawingNumber.charAt(0).toUpperCase();
  return DISCIPLINE_MAP[prefix] || DISCIPLINE_MAP["X"];
}

function parseRevision(drawingNumber: string, hasRevisionInNumber: boolean): string {
  if (!hasRevisionInNumber) return "0";
  const revMatch = drawingNumber.match(/[-\s]?R(?:EV)?\.?\s*(\d+)/i);
  return revMatch ? revMatch[1] : "0";
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.98) return "#22C55E";
  if (confidence >= 0.90) return "#F59E0B";
  if (confidence >= 0.80) return "#F97316";
  return "#EF4444";
}


/* =========================
   Mock Data for Development
   ========================= */

const MOCK_DRAWING_SETS: DrawingSet[] = [
  { id: "set-1", name: "50% SD Set", date: "2024-10-15", drawing_count: 24 },
  { id: "set-2", name: "90% CD Set", date: "2024-11-20", drawing_count: 87 },
  { id: "set-3", name: "IFC Set", date: "2024-12-01", drawing_count: 112 },
];

const MOCK_DRAWING_NUMBERS = [
  "A-101", "A-102", "A-103", "A-201", "A-202", "A-301",
  "S-101", "S-201", "S-301", "S-401",
  "M-101", "M-201", "M-301",
  "E-101", "E-201", "E-301", "E-401",
  "P-101", "P-201", "P-301",
];

const MOCK_TITLES = [
  "First Floor Plan", "Second Floor Plan", "Third Floor Plan",
  "Building Section A", "Building Section B", "Wall Section Details",
  "Foundation Plan", "Roof Framing Plan", "Column Schedule",
  "HVAC Floor Plan", "Ductwork Details", "Equipment Schedule",
  "Lighting Plan", "Power Plan", "Panel Schedule", "One-Line Diagram",
  "Plumbing Floor Plan", "Riser Diagram", "Fixture Schedule",
];


/* =========================
   Mock AI Extraction (Simulates CV/OCR Pipeline)
   ========================= */

async function simulateAIExtraction(
  file: UploadedFile,
  revisionInNumber: boolean,
  onProgress: (stage: string, percent: number) => void
): Promise<ExtractedDrawing[]> {
  const pageCount = Math.floor(Math.random() * 8) + 3; // 3-10 pages per PDF
  const drawings: ExtractedDrawing[] = [];

  // Stage 1: Document Splitting
  onProgress("Splitting PDF pages...", 10);
  await new Promise((r) => setTimeout(r, 800));

  // Stage 2: Title Block Detection
  onProgress("Detecting title blocks (CV)...", 30);
  await new Promise((r) => setTimeout(r, 1000));

  // Stage 3: OCR Extraction
  onProgress("Extracting metadata (OCR)...", 50);
  await new Promise((r) => setTimeout(r, 1200));

  // Stage 4: Generate mock extracted drawings
  for (let i = 0; i < pageCount; i++) {
    const drawingNum = MOCK_DRAWING_NUMBERS[Math.floor(Math.random() * MOCK_DRAWING_NUMBERS.length)];
    const title = MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)];
    const confidence = 0.85 + Math.random() * 0.15; // 85%-100%
    const isDuplicate = Math.random() < 0.15; // 15% chance duplicate

    drawings.push({
      id: uuid(),
      source_file_id: file.id,
      page_number: i + 1,
      drawing_number: drawingNum + (revisionInNumber && Math.random() > 0.5 ? "-R1" : ""),
      title: title,
      revision: parseRevision(drawingNum, revisionInNumber),
      discipline: parseDiscipline(drawingNum),
      confidence: confidence,
      needs_review: confidence < 0.98,
      status: "extracted",
      is_duplicate: isDuplicate,
      existing_drawing_id: isDuplicate ? `existing-${uuid()}` : undefined,
    });
    onProgress(`Extracting page ${i + 1}/${pageCount}...`, 50 + ((i + 1) / pageCount) * 40);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Stage 5: Validation
  onProgress("Validating extractions...", 95);
  await new Promise((r) => setTimeout(r, 500));

  onProgress("Complete", 100);
  return drawings;
}


/* =========================
   Main Component
   ========================= */

export default function DrawingUploadWizard({
  open,
  onClose,
  projectId,
  projectName,
  onDrawingsPublished,
}: DrawingUploadWizardProps) {
  // Step: 1=Config, 2=Upload, 3=Processing, 4=Review, 5=Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Configuration
  const [drawingSets] = useState<DrawingSet[]>(MOCK_DRAWING_SETS);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [createNewSet, setCreateNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDate, setNewSetDate] = useState(new Date().toISOString().split("T")[0]);
  const [revisionInNumber, setRevisionInNumber] = useState(false);
  const [drawingArea, setDrawingArea] = useState("Area 01");

  // Step 2: Upload
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Processing
  const [processingStage, setProcessingStage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Step 4: Review
  const [extractedDrawings, setExtractedDrawings] = useState<ExtractedDrawing[]>([]);
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [filterReview, setFilterReview] = useState<string>("all");
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);

  // Step 5: Publish
  const [publishProgress, setPublishProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);


  /* =========================
     Brand Colors
     ========================= */
  const NAVY = "#00205B";
  const GREEN = "#009A44";

  /* =========================
     File Handlers
     ========================= */
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({
        id: uuid(),
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: "pending" as const,
      }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };


  /* =========================
     Processing Handler
     ========================= */
  const startProcessing = async () => {
    setStep(3);
    const allDrawings: ExtractedDrawing[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];

      // Update file status
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "processing" as const } : f))
      );

      // Run AI extraction
      const drawings = await simulateAIExtraction(file, revisionInNumber, (stage, percent) => {
        setProcessingStage(`File ${i + 1}/${files.length}: ${stage}`);
        setProcessingProgress(((i / files.length) + (percent / 100) / files.length) * 100);
      });

      allDrawings.push(...drawings);

      // Update file status to complete
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "complete" as const, page_count: drawings.length } : f
        )
      );
    }

    setExtractedDrawings(allDrawings);
    setStep(4);
  };


  /* =========================
     Review Handlers
     ========================= */
  const updateDrawing = (id: string, updates: Partial<ExtractedDrawing>) => {
    setExtractedDrawings((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, needs_review: false, status: "reviewed" as const } : d))
    );
    setEditingDrawingId(null);
  };

  const markReviewed = (id: string) => {
    setExtractedDrawings((prev) =>
      prev.map((d) => (d.id === id ? { ...d, needs_review: false, status: "reviewed" as const } : d))
    );
  };

  const filteredDrawings = extractedDrawings.filter((d) => {
    if (filterDiscipline !== "all" && d.discipline.code !== filterDiscipline) return false;
    if (filterReview === "needs_review" && !d.needs_review) return false;
    if (filterReview === "duplicates" && !d.is_duplicate) return false;
    if (filterReview === "reviewed" && d.status !== "reviewed") return false;
    return true;
  });

  /* =========================
     Publish Handler
     ========================= */
  const publishDrawings = async () => {
    setStep(5);
    setIsPublishing(true);
    
    for (let i = 0; i < extractedDrawings.length; i++) {
      setPublishProgress(((i + 1) / extractedDrawings.length) * 100);
      await new Promise((r) => setTimeout(r, 100));
    }

    setExtractedDrawings((prev) => prev.map((d) => ({ ...d, status: "published" as const })));
    setIsPublishing(false);
    onDrawingsPublished?.(extractedDrawings);
  };


  /* =========================
     Validation & Stats
     ========================= */
  const canProceedStep1 = (selectedSetId || (createNewSet && newSetName.trim())) ? true : false;
  const canProceedStep2 = files.length > 0;
  const needsReviewCount = extractedDrawings.filter((d) => d.needs_review).length;
  const duplicateCount = extractedDrawings.filter((d) => d.is_duplicate).length;
  const highConfidenceCount = extractedDrawings.filter((d) => d.confidence >= 0.98).length;

  const disciplineStats = Object.values(DISCIPLINE_MAP).map((disc) => ({
    ...disc,
    count: extractedDrawings.filter((d) => d.discipline.code === disc.code).length,
  })).filter((d) => d.count > 0);

  /* =========================
     Reset on Close
     ========================= */
  const handleClose = () => {
    setStep(1);
    setFiles([]);
    setExtractedDrawings([]);
    setSelectedSetId(null);
    setCreateNewSet(false);
    setNewSetName("");
    setProcessingProgress(0);
    setPublishProgress(0);
    onClose();
  };

  if (!open) return null;


  /* =========================
     Modal Overlay & Container
     ========================= */
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        width: "100%",
        maxWidth: step === 4 ? "1200px" : "700px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #003380 100%)`,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "20px", fontWeight: 600 }}>
              📐 Drawing Upload Wizard
            </h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
              {projectName} • AI-Powered Extraction
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ✕ Close
          </button>
        </div>


        {/* Step Indicator */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}>
          {[
            { num: 1, label: "Configure" },
            { num: 2, label: "Upload" },
            { num: 3, label: "Processing" },
            { num: 4, label: "Review" },
            { num: 5, label: "Publish" },
          ].map((s) => (
            <div
              key={s.num}
              style={{
                flex: 1,
                padding: "12px 16px",
                textAlign: "center",
                borderBottom: step === s.num ? `3px solid ${GREEN}` : "3px solid transparent",
                backgroundColor: step === s.num ? "#fff" : "transparent",
                color: step >= s.num ? NAVY : "#9ca3af",
                fontWeight: step === s.num ? 600 : 400,
                fontSize: "13px",
              }}
            >
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: step >= s.num ? GREEN : "#e5e7eb",
                color: step >= s.num ? "#fff" : "#6b7280",
                fontSize: "12px",
                fontWeight: 600,
                marginRight: "8px",
              }}>
                {step > s.num ? "✓" : s.num}
              </span>
              {s.label}
            </div>
          ))}
        </div>


        {/* Content Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>

          {/* ========== STEP 1: CONFIGURATION ========== */}
          {step === 1 && (
            <div>
              <h3 style={{ margin: "0 0 20px", color: NAVY, fontSize: "18px" }}>
                Step 1: Drawing Set Configuration
              </h3>

              {/* Drawing Area */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#374151" }}>
                  Drawing Area
                </label>
                <select
                  value={drawingArea}
                  onChange={(e) => setDrawingArea(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value="Area 01">Area 01 (Default)</option>
                  <option value="Area 02">Area 02</option>
                  <option value="Area 03">Area 03</option>
                </select>
              </div>


              {/* Select Existing Set or Create New */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#374151" }}>
                  Drawing Set
                </label>
                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <button
                    onClick={() => { setCreateNewSet(false); setSelectedSetId(null); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: !createNewSet ? `2px solid ${GREEN}` : "1px solid #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: !createNewSet ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                      fontWeight: !createNewSet ? 600 : 400,
                    }}
                  >
                    📁 Select Existing Set
                  </button>
                  <button
                    onClick={() => { setCreateNewSet(true); setSelectedSetId(null); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: createNewSet ? `2px solid ${GREEN}` : "1px solid #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: createNewSet ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                      fontWeight: createNewSet ? 600 : 400,
                    }}
                  >
                    ➕ Create New Set
                  </button>
                </div>


                {/* Existing Sets List */}
                {!createNewSet && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {drawingSets.map((set) => (
                      <div
                        key={set.id}
                        onClick={() => setSelectedSetId(set.id)}
                        style={{
                          padding: "12px 16px",
                          border: selectedSetId === set.id ? `2px solid ${GREEN}` : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          backgroundColor: selectedSetId === set.id ? "#f0fdf4" : "#fff",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, color: NAVY }}>{set.name}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>{set.date}</div>
                        </div>
                        <div style={{
                          backgroundColor: "#e5e7eb",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}>
                          {set.drawing_count} drawings
                        </div>
                      </div>
                    ))}
                  </div>
                )}


                {/* New Set Form */}
                {createNewSet && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        placeholder="Set Name (e.g., '100% CD Set')"
                        value={newSetName}
                        onChange={(e) => setNewSetName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="date"
                        value={newSetDate}
                        onChange={(e) => setNewSetDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>


              {/* Advanced: Revision in Number */}
              <div style={{
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={revisionInNumber}
                    onChange={(e) => setRevisionInNumber(e.target.checked)}
                    style={{ marginRight: "12px", width: "18px", height: "18px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: NAVY }}>
                      Drawing Number Contains Revision
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      Enable if numbers include revision suffix (e.g., A-101-R1, A-101 Rev 2)
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}


          {/* ========== STEP 2: UPLOAD FILES ========== */}
          {step === 2 && (
            <div>
              <h3 style={{ margin: "0 0 20px", color: NAVY, fontSize: "18px" }}>
                Step 2: Upload Drawing PDFs
              </h3>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? GREEN : "#d1d5db"}`,
                  borderRadius: "12px",
                  padding: "40px",
                  textAlign: "center",
                  backgroundColor: isDragging ? "#f0fdf4" : "#f9fafb",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
                <div style={{ fontSize: "16px", fontWeight: 500, color: NAVY, marginBottom: "8px" }}>
                  Drop PDF files here or click to browse
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Multi-page PDFs will be automatically split into individual drawings
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>


              {/* File List */}
              {files.length > 0 && (
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: NAVY, marginBottom: "12px" }}>
                    {files.length} file(s) ready for processing
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 16px",
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ fontSize: "24px", marginRight: "12px" }}>📄</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: NAVY }}>{file.name}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>{formatBytes(file.size)}</div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "18px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ========== STEP 3: PROCESSING ========== */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>🤖</div>
              <h3 style={{ margin: "0 0 8px", color: NAVY, fontSize: "20px" }}>
                AI Processing in Progress
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                {processingStage || "Initializing..."}
              </p>

              {/* Progress Bar */}
              <div style={{
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto 24px",
                backgroundColor: "#e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${processingProgress}%`,
                  height: "12px",
                  backgroundColor: GREEN,
                  transition: "width 0.3s ease",
                }} />
              </div>

              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                {Math.round(processingProgress)}% complete
              </div>

              {/* Pipeline Stages */}
              <div style={{
                marginTop: "32px",
                display: "flex",
                justifyContent: "center",
                gap: "40px",
                fontSize: "12px",
                color: "#9ca3af",
              }}>
                <div style={{ color: processingProgress >= 10 ? GREEN : undefined }}>✓ Split Pages</div>
                <div style={{ color: processingProgress >= 30 ? GREEN : undefined }}>✓ Detect Title Blocks</div>
                <div style={{ color: processingProgress >= 50 ? GREEN : undefined }}>✓ OCR Extract</div>
                <div style={{ color: processingProgress >= 95 ? GREEN : undefined }}>✓ Validate</div>
              </div>
            </div>
          )}


          {/* ========== STEP 4: REVIEW ========== */}
          {step === 4 && (
            <div>
              {/* Stats Bar */}
              <div style={{
                display: "flex",
                gap: "16px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}>
                <div style={{
                  padding: "12px 20px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: GREEN }}>
                    {extractedDrawings.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Drawings</div>
                </div>
                <div style={{
                  padding: "12px 20px",
                  backgroundColor: highConfidenceCount === extractedDrawings.length ? "#f0fdf4" : "#fef3c7",
                  borderRadius: "8px",
                  border: `1px solid ${highConfidenceCount === extractedDrawings.length ? "#bbf7d0" : "#fcd34d"}`,
                }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: highConfidenceCount === extractedDrawings.length ? GREEN : "#f59e0b" }}>
                    {highConfidenceCount}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>High Confidence (≥98%)</div>
                </div>


                {needsReviewCount > 0 && (
                  <div style={{
                    padding: "12px 20px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
                      {needsReviewCount}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Needs Review</div>
                  </div>
                )}
                {duplicateCount > 0 && (
                  <div style={{
                    padding: "12px 20px",
                    backgroundColor: "#fef9c3",
                    borderRadius: "8px",
                    border: "1px solid #fde047",
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#ca8a04" }}>
                      {duplicateCount}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Duplicates/Revisions</div>
                  </div>
                )}
              </div>


              {/* Filters */}
              <div style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}>
                <select
                  value={filterDiscipline}
                  onChange={(e) => setFilterDiscipline(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="all">All Disciplines</option>
                  {disciplineStats.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name} ({d.count})
                    </option>
                  ))}
                </select>
                <select
                  value={filterReview}
                  onChange={(e) => setFilterReview(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="needs_review">Needs Review ({needsReviewCount})</option>
                  <option value="duplicates">Duplicates ({duplicateCount})</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>


              {/* Drawings Table */}
              <div style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: NAVY, color: "#fff" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Drawing #</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Title</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Discipline</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Rev</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Confidence</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrawings.map((drawing, idx) => (
                      <tr
                        key={drawing.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#fff" : "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: NAVY }}>
                          {drawing.drawing_number}
                          {drawing.is_duplicate && (
                            <span style={{
                              marginLeft: "8px",
                              backgroundColor: "#fef3c7",
                              color: "#b45309",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 600,
                            }}>
                              REVISION
                            </span>
                          )}
                        </td>


                        <td style={{ padding: "12px 16px" }}>{drawing.title}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{
                            backgroundColor: drawing.discipline.color,
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}>
                            {drawing.discipline.code}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>{drawing.revision}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{
                            color: getConfidenceColor(drawing.confidence),
                            fontWeight: 600,
                          }}>
                            {(drawing.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {drawing.needs_review ? (
                            <span style={{
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}>
                              REVIEW
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: "#f0fdf4",
                              color: GREEN,
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}>
                              ✓ OK
                            </span>
                          )}
                        </td>


                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => setEditingDrawingId(drawing.id)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#f3f4f6",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              ✏️ Edit
                            </button>
                            {drawing.needs_review && (
                              <button
                                onClick={() => markReviewed(drawing.id)}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: GREEN,
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                ✓ Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* ========== STEP 5: PUBLISH ========== */}
          {step === 5 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              {isPublishing ? (
                <>
                  <div style={{ fontSize: "64px", marginBottom: "20px" }}>📤</div>
                  <h3 style={{ margin: "0 0 8px", color: NAVY, fontSize: "20px" }}>
                    Publishing Drawings...
                  </h3>
                  <div style={{
                    width: "100%",
                    maxWidth: "400px",
                    margin: "20px auto",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${publishProgress}%`,
                      height: "12px",
                      backgroundColor: GREEN,
                      transition: "width 0.1s ease",
                    }} />
                  </div>
                  <p style={{ color: "#6b7280" }}>
                    {Math.round(publishProgress)}% complete
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
                  <h3 style={{ margin: "0 0 8px", color: GREEN, fontSize: "24px" }}>
                    Publication Complete!
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                    {extractedDrawings.length} drawings have been published to the Drawing Log.
                  </p>


                  {/* Summary by Discipline */}
                  <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: "24px",
                  }}>
                    {disciplineStats.map((d) => (
                      <div
                        key={d.code}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: d.color,
                          color: "#fff",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {d.name}: {d.count}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleClose}
                    style={{
                      padding: "12px 32px",
                      backgroundColor: GREEN,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close & View Drawing Log
                  </button>
                </>
              )}
            </div>
          )}

        </div>


        {/* Footer Navigation */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            {step > 1 && step < 5 && !isPublishing && (
              <button
                onClick={() => setStep((s) => (s > 1 ? (s - 1) as any : s))}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ← Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                style={{
                  padding: "10px 24px",
                  backgroundColor: canProceedStep1 ? GREEN : "#d1d5db",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: canProceedStep1 ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Next: Upload Files →
              </button>
            )}


            {step === 2 && (
              <button
                onClick={startProcessing}
                disabled={!canProceedStep2}
                style={{
                  padding: "10px 24px",
                  backgroundColor: canProceedStep2 ? GREEN : "#d1d5db",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: canProceedStep2 ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                🤖 Start AI Processing →
              </button>
            )}

            {step === 4 && (
              <button
                onClick={publishDrawings}
                style={{
                  padding: "10px 24px",
                  backgroundColor: GREEN,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                📤 Publish {extractedDrawings.length} Drawings →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
