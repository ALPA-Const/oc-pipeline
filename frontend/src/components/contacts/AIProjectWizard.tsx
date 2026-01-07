/* ============================================================
   AIProjectWizard.tsx — O'Neill Elite AI-First Project Creation
   ------------------------------------------------------------
   ARCHITECTURE: Upload → Extract → Review → Link & Create
   
   KEY FEATURES:
   - Upload documents FIRST (RFP, Plans, Drawings)
   - AI extracts project metadata with confidence scores
   - Human-in-the-loop review/confirmation
   - Smart organization/contact matching
   
   FLOW:
   Step 1: UPLOAD    - Drag/drop files (PDF, XLSX, CSV, DOCX)
   Step 2: EXTRACT   - AI parses documents, extracts fields
   Step 3: REVIEW    - User confirms AI-filled fields
   Step 4: LINK      - Match orgs/contacts, then create project
   ============================================================ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* =========================
   Types
   ========================= */

type UUID = string;
type MarketType = "Government" | "Commercial";
type AIWizardStep = "upload" | "extracting" | "review" | "link";

// Confidence-scored field from AI extraction
type ExtractionField<T = string> = {
  value: T | null;
  confidence: number;      // 0.0 - 1.0
  source?: string;         // "Page 1, header" / "Section C.2"
  aiNotes?: string;        // "Combined from multiple sources"
};

// Uploaded file tracking
type UploadedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "processing" | "complete" | "error";
  extractedText?: string;
  error?: string;
};

// AI extraction result
type ExtractedProjectData = {
  // Core
  market_type: ExtractionField<MarketType>;
  project_name: ExtractionField;
  scope_summary: ExtractionField;
  
  // Location
  location_city: ExtractionField;
  location_state: ExtractionField;
  
  // Government-specific
  solicitation_id: ExtractionField;
  naics: ExtractionField;
  psc: ExtractionField;
  set_aside: ExtractionField;
  piid: ExtractionField;
  funding_agency_name: ExtractionField;
  issuing_office_name: ExtractionField;
  
  // Commercial-specific
  owner_bid_ref: ExtractionField;
  owner_name: ExtractionField;
  gc_name: ExtractionField;
  architect_name: ExtractionField;
  
  // Dates
  bid_due_date: ExtractionField;
  rfi_cutoff_date: ExtractionField;
  site_visit_date: ExtractionField;
  award_date: ExtractionField;
  
  // Detected entities for linking
  organizations_detected: Array<{
    name: string;
    role: "Agency" | "Owner" | "GC" | "AE" | "Sub";
    confidence: number;
    matchedOrgId?: UUID;
  }>;
  
  contacts_detected: Array<{
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    role: "CO" | "COR" | "POC" | "PM";
    confidence: number;
    matchedContactId?: UUID;
  }>;
};

// Wizard state
type AIWizardState = {
  step: AIWizardStep;
  files: UploadedFile[];
  extractionProgress: number;
  extractionStatus: string;
  extracted: ExtractedProjectData | null;
  userOverrides: Record<string, any>;
  linkedOrgs: Map<string, UUID>;
  linkedContacts: Map<string, UUID>;
};

// Directory provider interface (same as existing wizard)
type Organization = { organization_id: UUID; legal_name: string };
type Contact = { contact_id: UUID; organization_id: UUID; name: string; email: string; title?: string };

export type DirectoryProvider = {
  searchOrganizations: (query: string) => Promise<Organization[]>;
  createOrganization: (legalName: string) => Promise<Organization>;
  searchContacts: (query: string, organizationId?: UUID) => Promise<Contact[]>;
  createContact: (input: { organization_id: UUID; name: string; email: string; title?: string }) => Promise<Contact>;
  getOrganizationById?: (id: UUID) => Organization | undefined;
  getContactById?: (id: UUID) => Contact | undefined;
};


/* =========================
   Utility Functions
   ========================= */

function uuid(): UUID {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getConfidenceLevel(score: number): "high" | "medium" | "low" | "manual" {
  if (score >= 0.85) return "high";
  if (score >= 0.60) return "medium";
  if (score > 0) return "low";
  return "manual";
}

const CONFIDENCE_CONFIG = {
  high: {
    dots: "●●●●●",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "High confidence",
  },
  medium: {
    dots: "●●●○○",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Review recommended",
  },
  low: {
    dots: "●●○○○",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Low confidence",
  },
  manual: {
    dots: "○○○○○",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Manual entry required",
  },
};

/* =========================
   O'Neill Elite UI Primitives
   ========================= */

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded text-white bg-[#00205B] text-[11px] font-semibold",
        "hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SuccessButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded text-white bg-[#009A44] text-[11px] font-semibold",
        "hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded bg-white border border-slate-300 text-[11px] font-semibold text-[#00205B]",
        "hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded border border-slate-300 bg-white",
        "px-3 py-2 text-[11px]",
        "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#00205B]",
        props.className || "",
      ].join(" ")}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded border border-slate-300 bg-white",
        "px-3 py-2 text-[11px] min-h-[80px]",
        "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#00205B]",
        props.className || "",
      ].join(" ")}
    />
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-slate-600 font-extrabold mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </div>
  );
}

function GlassPanel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      {title && <div className="text-[#00205B] font-extrabold text-[11px] uppercase mb-3">{title}</div>}
      {children}
    </div>
  );
}


/* =========================
   Confidence Field Component
   ========================= */

function ConfidenceField({
  label,
  field,
  onOverride,
  type = "text",
  required,
}: {
  label: string;
  field: ExtractionField;
  onOverride: (value: string) => void;
  type?: "text" | "textarea" | "date";
  required?: boolean;
}) {
  const level = getConfidenceLevel(field.confidence);
  const config = CONFIDENCE_CONFIG[level];
  const pct = Math.round(field.confidence * 100);

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-3`}>
      {/* Header with label and confidence */}
      <div className="flex items-center justify-between mb-2">
        <FieldLabel required={required}>{label}</FieldLabel>
        <div className={`text-[10px] font-bold ${config.color}`}>
          {config.dots} {pct}%
        </div>
      </div>

      {/* Input field */}
      {type === "textarea" ? (
        <TextArea
          value={field.value || ""}
          onChange={(e) => onOverride(e.target.value)}
          placeholder={level === "manual" ? "Enter value manually..." : ""}
        />
      ) : type === "date" ? (
        <TextInput
          type="datetime-local"
          value={field.value || ""}
          onChange={(e) => onOverride(e.target.value)}
        />
      ) : (
        <TextInput
          value={field.value || ""}
          onChange={(e) => onOverride(e.target.value)}
          placeholder={level === "manual" ? "Enter value manually..." : ""}
        />
      )}

      {/* Source citation */}
      {field.source && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
          <span>📍</span>
          <span>Source: {field.source}</span>
        </div>
      )}

      {/* AI notes/warnings */}
      {field.aiNotes && (
        <div className={`mt-1 text-[10px] ${config.color}`}>
          ⚠️ {field.aiNotes}
        </div>
      )}
    </div>
  );
}

/* =========================
   Step Rail Component
   ========================= */

const STEPS: { id: AIWizardStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "extracting", label: "Extract" },
  { id: "review", label: "Review" },
  { id: "link", label: "Finalize" },
];

function StepRail({ currentStep }: { currentStep: AIWizardStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
      <div className="grid grid-cols-4 gap-4">
        {STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          const isExtracting = step.id === "extracting" && currentStep === "extracting";

          return (
            <div key={step.id}>
              <div
                className={[
                  "h-2 rounded-full transition-all",
                  isDone ? "bg-[#00205B]" : isActive ? "bg-[#00205B]" : "bg-slate-200",
                  isExtracting ? "animate-pulse" : "",
                ].join(" ")}
              />
              <div
                className={[
                  "mt-2 text-[10px] uppercase font-extrabold",
                  isDone || isActive ? "text-[#00205B]" : "text-slate-400",
                ].join(" ")}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* =========================
   Upload Step Component
   ========================= */

function UploadStep({
  files,
  onFilesAdded,
  onFileRemove,
  onExtract,
  onSkip,
}: {
  files: UploadedFile[];
  onFilesAdded: (files: FileList) => void;
  onFileRemove: (id: string) => void;
  onExtract: () => void;
  onSkip: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  }, [onFilesAdded]);

  const ACCEPTED_TYPES = ".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg";

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={[
          "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
          isDragging
            ? "border-[#00205B] bg-blue-50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-4xl mb-3">📄</div>
        <div className="text-[#00205B] font-bold text-sm mb-1">
          {isDragging ? "Drop files here..." : "DROP FILES HERE"}
        </div>
        <div className="text-slate-500 text-[11px] mb-3">or click to browse</div>
        <div className="text-slate-400 text-[10px]">
          Accepted: PDF, XLSX, CSV, DOCX, PNG, JPG
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={(e) => e.target.files && onFilesAdded(e.target.files)}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <GlassPanel title={`Uploaded Files (${files.length})`}>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {f.type.includes("pdf") ? "📕" : 
                     f.type.includes("sheet") || f.type.includes("csv") ? "📊" : 
                     f.type.includes("image") ? "🖼️" : "📄"}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-[#00205B]">{f.name}</div>
                    <div className="text-[10px] text-slate-500">{formatBytes(f.size)}</div>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemove(f.id)}
                  className="text-slate-400 hover:text-red-500 text-sm font-bold"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Tip */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-lg">💡</span>
        <div className="text-[11px] text-slate-700">
          <strong>Tip:</strong> Upload the main solicitation PDF for best results. 
          AI will extract project name, solicitation ID, agency, NAICS, dates, and more.
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onSkip}
          className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold"
        >
          Skip — Manual Entry
        </button>
        <PrimaryButton onClick={onExtract} disabled={files.length === 0}>
          Extract with AI ▶
        </PrimaryButton>
      </div>
    </div>
  );
}


/* =========================
   Extracting Step Component (Loading)
   ========================= */

function ExtractingStep({
  progress,
  status,
  onCancel,
}: {
  progress: number;
  status: string;
  onCancel: () => void;
}) {
  return (
    <div className="py-12 text-center space-y-6">
      <div className="text-4xl animate-bounce">🤖</div>
      <div className="text-[#00205B] font-bold text-lg uppercase">
        AI Extraction in Progress
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto">
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00205B] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-600">{progress}% complete</div>
      </div>

      {/* Status */}
      <div className="text-[11px] text-slate-500">{status}</div>

      {/* Checklist */}
      <div className="max-w-sm mx-auto text-left space-y-2">
        <StatusItem done={progress >= 20} label="Text extracted from documents" />
        <StatusItem done={progress >= 40} label="Market type detected" />
        <StatusItem done={progress >= 60} label="Parsing solicitation details" />
        <StatusItem done={progress >= 80} label="Extracting dates and locations" />
        <StatusItem done={progress >= 100} label="Identifying organizations" />
      </div>

      {/* Cancel */}
      <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
    </div>
  );
}

function StatusItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={done ? "text-green-600" : "text-slate-300"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </div>
  );
}

/* =========================
   Review Step Component
   ========================= */

function ReviewStep({
  extracted,
  userOverrides,
  onOverride,
  onBack,
  onContinue,
}: {
  extracted: ExtractedProjectData;
  userOverrides: Record<string, any>;
  onOverride: (field: string, value: any) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const getField = <T,>(key: keyof ExtractedProjectData): ExtractionField<T> => {
    const original = extracted[key] as ExtractionField<T>;
    if (userOverrides[key] !== undefined) {
      return { ...original, value: userOverrides[key] };
    }
    return original;
  };

  const marketType = getField<MarketType>("market_type").value || "Government";
  const isGov = marketType === "Government";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <span className="text-lg">🤖</span>
        <div className="text-[11px] text-slate-700">
          <strong>AI Extracted</strong> — Please review and confirm the fields below. 
          Edit any field to correct AI mistakes.
        </div>
      </div>

      {/* Market Type Toggle */}
      <GlassPanel title="Market Type">
        <div className="flex border rounded overflow-hidden">
          <button
            onClick={() => onOverride("market_type", "Government")}
            className={[
              "flex-1 py-2 text-[11px] font-bold uppercase",
              isGov ? "bg-[#00205B] text-white" : "bg-white text-[#00205B]",
            ].join(" ")}
          >
            Government
          </button>
          <button
            onClick={() => onOverride("market_type", "Commercial")}
            className={[
              "flex-1 py-2 text-[11px] font-bold uppercase border-l",
              !isGov ? "bg-[#00205B] text-white" : "bg-white text-[#00205B]",
            ].join(" ")}
          >
            Commercial
          </button>
        </div>
        {extracted.market_type.source && (
          <div className="mt-2 text-[10px] text-slate-500">
            📍 Source: {extracted.market_type.source}
          </div>
        )}
      </GlassPanel>

      {/* Core Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfidenceField
          label="Project Name"
          field={getField("project_name")}
          onOverride={(v) => onOverride("project_name", v)}
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <ConfidenceField
            label="City"
            field={getField("location_city")}
            onOverride={(v) => onOverride("location_city", v)}
          />
          <ConfidenceField
            label="State"
            field={getField("location_state")}
            onOverride={(v) => onOverride("location_state", v)}
          />
        </div>
      </div>

      {/* Scope Summary */}
      <ConfidenceField
        label="Scope Summary"
        field={getField("scope_summary")}
        onOverride={(v) => onOverride("scope_summary", v)}
        type="textarea"
        required
      />

      {/* Government-specific fields */}
      {isGov && (
        <GlassPanel title="Government Identifiers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfidenceField
              label="Solicitation ID"
              field={getField("solicitation_id")}
              onOverride={(v) => onOverride("solicitation_id", v)}
              required
            />
            <ConfidenceField
              label="Funding Agency"
              field={getField("funding_agency_name")}
              onOverride={(v) => onOverride("funding_agency_name", v)}
              required
            />
            <ConfidenceField
              label="NAICS Code"
              field={getField("naics")}
              onOverride={(v) => onOverride("naics", v)}
            />
            <ConfidenceField
              label="Set-Aside"
              field={getField("set_aside")}
              onOverride={(v) => onOverride("set_aside", v)}
            />
          </div>
        </GlassPanel>
      )}

      {/* Commercial-specific fields */}
      {!isGov && (
        <GlassPanel title="Commercial Identifiers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfidenceField
              label="Owner Bid Reference"
              field={getField("owner_bid_ref")}
              onOverride={(v) => onOverride("owner_bid_ref", v)}
              required
            />
            <ConfidenceField
              label="Owner Name"
              field={getField("owner_name")}
              onOverride={(v) => onOverride("owner_name", v)}
              required
            />
            <ConfidenceField
              label="General Contractor"
              field={getField("gc_name")}
              onOverride={(v) => onOverride("gc_name", v)}
            />
            <ConfidenceField
              label="Architect/Engineer"
              field={getField("architect_name")}
              onOverride={(v) => onOverride("architect_name", v)}
            />
          </div>
        </GlassPanel>
      )}

      {/* Dates */}
      <GlassPanel title="Key Dates">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfidenceField
            label="Bid Due Date"
            field={getField("bid_due_date")}
            onOverride={(v) => onOverride("bid_due_date", v)}
            type="date"
          />
          <ConfidenceField
            label="RFI Cutoff"
            field={getField("rfi_cutoff_date")}
            onOverride={(v) => onOverride("rfi_cutoff_date", v)}
            type="date"
          />
        </div>
      </GlassPanel>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <SecondaryButton onClick={onBack}>◀ Back to Upload</SecondaryButton>
        <SuccessButton onClick={onContinue}>Confirm & Continue ▶</SuccessButton>
      </div>
    </div>
  );
}


/* =========================
   Link Step Component
   ========================= */

function LinkStep({
  extracted,
  directory,
  linkedOrgs,
  linkedContacts,
  onLinkOrg,
  onLinkContact,
  onBack,
  onCreate,
  isCreating,
}: {
  extracted: ExtractedProjectData;
  directory: DirectoryProvider;
  linkedOrgs: Map<string, UUID>;
  linkedContacts: Map<string, UUID>;
  onLinkOrg: (role: string, orgId: UUID) => void;
  onLinkContact: (role: string, contactId: UUID) => void;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-lg">🔗</span>
        <div className="text-[11px] text-slate-700">
          <strong>Link Organizations & Contacts</strong> — Connect detected entities 
          to your directory or create new entries.
        </div>
      </div>

      {/* Detected Organizations */}
      {extracted.organizations_detected.length > 0 && (
        <GlassPanel title="Detected Organizations">
          <div className="space-y-3">
            {extracted.organizations_detected.map((org, i) => (
              <OrgMatcher
                key={i}
                detectedName={org.name}
                role={org.role}
                confidence={org.confidence}
                directory={directory}
                linkedOrgId={linkedOrgs.get(org.role)}
                onLink={(id) => onLinkOrg(org.role, id)}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Detected Contacts */}
      {extracted.contacts_detected.length > 0 && (
        <GlassPanel title="Detected Contacts">
          <div className="space-y-3">
            {extracted.contacts_detected.map((contact, i) => (
              <ContactMatcher
                key={i}
                detectedName={contact.name}
                detectedEmail={contact.email}
                detectedTitle={contact.title}
                role={contact.role}
                confidence={contact.confidence}
                directory={directory}
                linkedContactId={linkedContacts.get(contact.role)}
                onLink={(id) => onLinkContact(contact.role, id)}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* No detections fallback */}
      {extracted.organizations_detected.length === 0 && extracted.contacts_detected.length === 0 && (
        <div className="py-8 text-center">
          <div className="text-3xl mb-3">📋</div>
          <div className="text-slate-600 text-[11px]">
            No organizations or contacts were detected in the documents.
            <br />
            You can add them later from the project details page.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <SecondaryButton onClick={onBack}>◀ Back to Review</SecondaryButton>
        <SuccessButton onClick={onCreate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Project ✓"}
        </SuccessButton>
      </div>
    </div>
  );
}

/* =========================
   Organization Matcher
   ========================= */

function OrgMatcher({
  detectedName,
  role,
  confidence,
  directory,
  linkedOrgId,
  onLink,
}: {
  detectedName: string;
  role: string;
  confidence: number;
  directory: DirectoryProvider;
  linkedOrgId?: UUID;
  onLink: (id: UUID) => void;
}) {
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState(detectedName);

  // Search on mount
  useEffect(() => {
    setIsSearching(true);
    directory.searchOrganizations(detectedName).then((results) => {
      setSearchResults(results);
      setIsSearching(false);
      // Auto-link if exact match found
      const exactMatch = results.find(
        (o) => o.legal_name.toLowerCase() === detectedName.toLowerCase()
      );
      if (exactMatch && !linkedOrgId) {
        onLink(exactMatch.organization_id);
      }
    });
  }, [detectedName]);

  const linkedOrg = linkedOrgId ? directory.getOrganizationById?.(linkedOrgId) : null;

  const handleCreate = async () => {
    const org = await directory.createOrganization(newOrgName);
    onLink(org.organization_id);
    setShowCreate(false);
  };

  const level = getConfidenceLevel(confidence);
  const config = CONFIDENCE_CONFIG[level];

  return (
    <div className={`p-3 rounded-lg border ${config.border} ${config.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">{role}</span>
          <div className="text-[11px] font-semibold text-[#00205B]">
            AI detected: "{detectedName}"
          </div>
        </div>
        <div className={`text-[10px] font-bold ${config.color}`}>
          {config.dots} {Math.round(confidence * 100)}%
        </div>
      </div>

      {/* Linked org display */}
      {linkedOrg && (
        <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-300 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-[11px] font-semibold">{linkedOrg.legal_name}</span>
          </div>
          <button
            onClick={() => onLink("")}
            className="text-[10px] text-slate-500 hover:text-red-500"
          >
            Unlink
          </button>
        </div>
      )}

      {/* Search results */}
      {!linkedOrg && !showCreate && (
        <>
          {isSearching ? (
            <div className="text-[10px] text-slate-500 py-2">Searching directory...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1 mb-2">
              <div className="text-[10px] text-slate-500">Suggested matches:</div>
              {searchResults.slice(0, 3).map((org) => (
                <button
                  key={org.organization_id}
                  onClick={() => onLink(org.organization_id)}
                  className="w-full text-left p-2 text-[11px] bg-white rounded border border-slate-200 hover:border-[#00205B] hover:bg-blue-50"
                >
                  {org.legal_name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 py-2">No matches found in directory</div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="text-[10px] text-[#00205B] font-semibold hover:underline"
          >
            + Create New Organization
          </button>
        </>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="space-y-2">
          <TextInput
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="Organization name"
          />
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setShowCreate(false)} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleCreate} className="flex-1">
              Create
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================
   Contact Matcher
   ========================= */

function ContactMatcher({
  detectedName,
  detectedEmail,
  detectedTitle,
  role,
  confidence,
  directory,
  linkedContactId,
  onLink,
}: {
  detectedName: string;
  detectedEmail?: string;
  detectedTitle?: string;
  role: string;
  confidence: number;
  directory: DirectoryProvider;
  linkedContactId?: UUID;
  onLink: (id: UUID) => void;
}) {
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newContact, setNewContact] = useState({
    name: detectedName,
    email: detectedEmail || "",
    title: detectedTitle || "",
  });

  // Search on mount
  useEffect(() => {
    setIsSearching(true);
    const searchQuery = detectedEmail || detectedName;
    directory.searchContacts(searchQuery).then((results) => {
      setSearchResults(results);
      setIsSearching(false);
      // Auto-link if email match found
      if (detectedEmail) {
        const emailMatch = results.find(
          (c) => c.email.toLowerCase() === detectedEmail.toLowerCase()
        );
        if (emailMatch && !linkedContactId) {
          onLink(emailMatch.contact_id);
        }
      }
    });
  }, [detectedName, detectedEmail]);

  const linkedContact = linkedContactId ? directory.getContactById?.(linkedContactId) : null;

  const handleCreate = async () => {
    // Need an org to attach contact to - for now use a placeholder
    // In real implementation, this would prompt user to select/create org first
    const orgs = await directory.searchOrganizations("");
    let orgId = orgs[0]?.organization_id;
    if (!orgId) {
      const newOrg = await directory.createOrganization("Unassigned Organization");
      orgId = newOrg.organization_id;
    }
    const contact = await directory.createContact({
      organization_id: orgId,
      name: newContact.name,
      email: newContact.email,
      title: newContact.title || undefined,
    });
    onLink(contact.contact_id);
    setShowCreate(false);
  };

  const level = getConfidenceLevel(confidence);
  const config = CONFIDENCE_CONFIG[level];

  return (
    <div className={`p-3 rounded-lg border ${config.border} ${config.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">{role}</span>
          <div className="text-[11px] font-semibold text-[#00205B]">
            AI detected: "{detectedName}"
            {detectedEmail && (
              <span className="text-slate-500 font-normal ml-1">({detectedEmail})</span>
            )}
          </div>
        </div>
        <div className={`text-[10px] font-bold ${config.color}`}>
          {config.dots} {Math.round(confidence * 100)}%
        </div>
      </div>

      {/* Linked contact display */}
      {linkedContact && (
        <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-300 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <span className="text-[11px] font-semibold">{linkedContact.name}</span>
              <span className="text-[10px] text-slate-500 ml-2">{linkedContact.email}</span>
            </div>
          </div>
          <button
            onClick={() => onLink("")}
            className="text-[10px] text-slate-500 hover:text-red-500"
          >
            Unlink
          </button>
        </div>
      )}

      {/* Search results */}
      {!linkedContact && !showCreate && (
        <>
          {isSearching ? (
            <div className="text-[10px] text-slate-500 py-2">Searching directory...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1 mb-2">
              <div className="text-[10px] text-slate-500">Suggested matches:</div>
              {searchResults.slice(0, 3).map((c) => (
                <button
                  key={c.contact_id}
                  onClick={() => onLink(c.contact_id)}
                  className="w-full text-left p-2 text-[11px] bg-white rounded border border-slate-200 hover:border-[#00205B] hover:bg-blue-50"
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.email}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 py-2">No matches found in directory</div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="text-[10px] text-[#00205B] font-semibold hover:underline"
          >
            + Create Contact from AI Data
          </button>
        </>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="space-y-2">
          <TextInput
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            placeholder="Name"
          />
          <TextInput
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            placeholder="Email"
            type="email"
          />
          <TextInput
            value={newContact.title}
            onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
            placeholder="Title (optional)"
          />
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setShowCreate(false)} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleCreate} 
              disabled={!newContact.name || !newContact.email}
              className="flex-1"
            >
              Create
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================
   In-Memory Directory Provider (MVP Bridge)
   ========================= */

export function useInMemoryDirectoryProvider(initial?: {
  organizations?: Organization[];
  contacts?: Contact[];
}): DirectoryProvider {
  const [orgs, setOrgs] = useState<Organization[]>(initial?.organizations || []);
  const [contacts, setContacts] = useState<Contact[]>(initial?.contacts || []);

  return {
    searchOrganizations: async (q: string) => {
      const query = q.trim().toLowerCase();
      if (!query) return orgs.slice(0, 25);
      return orgs.filter((o) => o.legal_name.toLowerCase().includes(query)).slice(0, 25);
    },
    createOrganization: async (legalName: string) => {
      const org: Organization = { organization_id: uuid(), legal_name: legalName.trim() };
      setOrgs((prev) => [org, ...prev]);
      return org;
    },
    searchContacts: async (q: string, organizationId?: UUID) => {
      const query = q.trim().toLowerCase();
      let base = contacts;
      if (organizationId) base = base.filter((c) => c.organization_id === organizationId);
      if (!query) return base.slice(0, 25);
      return base.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query)).slice(0, 25);
    },
    createContact: async (input) => {
      const c: Contact = {
        contact_id: uuid(),
        organization_id: input.organization_id,
        name: input.name.trim(),
        email: input.email.trim(),
        title: input.title?.trim() || undefined,
      };
      setContacts((prev) => [c, ...prev]);
      return c;
    },
    getOrganizationById: (id) => orgs.find((o) => o.organization_id === id),
    getContactById: (id) => contacts.find((c) => c.contact_id === id),
  };
}

/* =========================
   Mock AI Extraction Service
   ========================= */

async function mockExtractFromFiles(
  files: UploadedFile[],
  onProgress: (pct: number, status: string) => void
): Promise<ExtractedProjectData> {
  // Simulate processing stages
  const stages = [
    { pct: 20, status: "Extracting text from documents...", delay: 800 },
    { pct: 40, status: "Detecting market type...", delay: 600 },
    { pct: 60, status: "Parsing solicitation details...", delay: 700 },
    { pct: 80, status: "Extracting dates and locations...", delay: 500 },
    { pct: 100, status: "Identifying organizations...", delay: 400 },
  ];

  for (const stage of stages) {
    await new Promise((r) => setTimeout(r, stage.delay));
    onProgress(stage.pct, stage.status);
  }

  // Analyze filenames for hints
  const hasGovKeywords = files.some((f) => 
    /solicitation|rfq|rfp|36c|fa\d|w\d|va\s|dod|gsa/i.test(f.name)
  );

  // Return mock extraction based on file hints
  if (hasGovKeywords) {
    return createMockGovExtraction(files);
  } else {
    return createMockCommercialExtraction(files);
  }
}

function createMockGovExtraction(files: UploadedFile[]): ExtractedProjectData {
  const fileName = files[0]?.name || "Unknown";
  
  // Try to extract solicitation ID from filename
  const solMatch = fileName.match(/(36C\d+[A-Z]\d+|FA\d+-\d+-[A-Z]-\d+|W\d+[A-Z]+-\d+-\d+)/i);
  const solId = solMatch ? solMatch[1].toUpperCase() : null;

  return {
    market_type: { value: "Government", confidence: 0.95, source: "Document header analysis" },
    project_name: { 
      value: "VA Medical Center Renovation - Building 1A", 
      confidence: 0.85, 
      source: "Page 1, title block",
      aiNotes: "Extracted from cover page - verify accuracy"
    },
    scope_summary: { 
      value: "Complete renovation of existing medical facility including HVAC upgrades, electrical modernization, and ADA compliance improvements. Work to be performed in occupied space with infection control requirements.", 
      confidence: 0.70, 
      source: "Section C - Statement of Work",
      aiNotes: "AI-summarized from multiple paragraphs"
    },
    location_city: { value: "Columbus", confidence: 0.80, source: "Address block" },
    location_state: { value: "OH", confidence: 0.85, source: "Address block" },
    solicitation_id: { 
      value: solId || "36C25526Q0042", 
      confidence: solId ? 0.98 : 0.75, 
      source: "Document header" 
    },
    naics: { value: "236220", confidence: 0.82, source: "Section B, Commercial Items" },
    psc: { value: "Z2JZ", confidence: 0.75, source: "SF1449 Block 6" },
    set_aside: { value: "SDVOSB", confidence: 0.92, source: "Block 10, Set-Aside designation" },
    piid: { value: null, confidence: 0, source: undefined },
    funding_agency_name: { 
      value: "Department of Veterans Affairs", 
      confidence: 0.95, 
      source: "Letterhead and Block 7" 
    },
    issuing_office_name: { 
      value: "Network Contracting Office 10", 
      confidence: 0.78, 
      source: "Block 9" 
    },
    owner_bid_ref: { value: null, confidence: 0, source: undefined },
    owner_name: { value: null, confidence: 0, source: undefined },
    gc_name: { value: null, confidence: 0, source: undefined },
    architect_name: { value: null, confidence: 0, source: undefined },
    bid_due_date: { 
      value: "2025-01-15T14:00", 
      confidence: 0.90, 
      source: "Block 8, Offer Due Date" 
    },
    rfi_cutoff_date: { 
      value: "2025-01-08T14:00", 
      confidence: 0.65, 
      source: "Section L, Instructions",
      aiNotes: "Date inferred from '7 days prior to bid due'"
    },
    site_visit_date: { 
      value: "2024-12-20T10:00", 
      confidence: 0.88, 
      source: "Amendment 001" 
    },
    award_date: { value: null, confidence: 0, source: undefined },
    organizations_detected: [
      { name: "Department of Veterans Affairs", role: "Agency", confidence: 0.95 },
      { name: "Network Contracting Office 10", role: "Agency", confidence: 0.78 },
    ],
    contacts_detected: [
      { 
        name: "John Smith", 
        title: "Contracting Officer", 
        email: "john.smith@va.gov", 
        role: "CO", 
        confidence: 0.85 
      },
      { 
        name: "Sarah Johnson", 
        title: "Contract Specialist", 
        email: "sarah.johnson@va.gov", 
        role: "POC", 
        confidence: 0.72 
      },
    ],
  };
}

function createMockCommercialExtraction(files: UploadedFile[]): ExtractedProjectData {
  return {
    market_type: { value: "Commercial", confidence: 0.88, source: "Document format analysis" },
    project_name: { 
      value: "Metro Office Tower - Tenant Improvements", 
      confidence: 0.82, 
      source: "Cover sheet",
    },
    scope_summary: { 
      value: "Interior build-out of floors 12-15 including open office layout, conference rooms, break areas, and IT infrastructure. LEED Gold certification targeted.", 
      confidence: 0.68, 
      source: "Project Description section",
      aiNotes: "Summarized from bid documents"
    },
    location_city: { value: "Chicago", confidence: 0.85, source: "Project address" },
    location_state: { value: "IL", confidence: 0.90, source: "Project address" },
    solicitation_id: { value: null, confidence: 0, source: undefined },
    naics: { value: null, confidence: 0, source: undefined },
    psc: { value: null, confidence: 0, source: undefined },
    set_aside: { value: null, confidence: 0, source: undefined },
    piid: { value: null, confidence: 0, source: undefined },
    funding_agency_name: { value: null, confidence: 0, source: undefined },
    issuing_office_name: { value: null, confidence: 0, source: undefined },
    owner_bid_ref: { value: "ITB-2025-0042", confidence: 0.75, source: "Bid package header" },
    owner_name: { value: "Sterling Development Group", confidence: 0.88, source: "Owner letterhead" },
    gc_name: { value: "Turner Construction", confidence: 0.70, source: "Bid instructions" },
    architect_name: { value: "Gensler", confidence: 0.82, source: "Drawing title block" },
    bid_due_date: { value: "2025-01-22T16:00", confidence: 0.92, source: "Bid instructions" },
    rfi_cutoff_date: { value: "2025-01-15T12:00", confidence: 0.78, source: "Bid instructions" },
    site_visit_date: { value: null, confidence: 0, source: undefined },
    award_date: { value: null, confidence: 0, source: undefined },
    organizations_detected: [
      { name: "Sterling Development Group", role: "Owner", confidence: 0.88 },
      { name: "Turner Construction", role: "GC", confidence: 0.70 },
      { name: "Gensler", role: "AE", confidence: 0.82 },
    ],
    contacts_detected: [
      { 
        name: "Michael Chen", 
        title: "Project Manager", 
        email: "mchen@sterlingdev.com", 
        role: "PM", 
        confidence: 0.75 
      },
    ],
  };
}


/* =========================
   Main Wizard Component
   ========================= */

type AIProjectWizardProps = {
  open: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
  directoryProvider?: DirectoryProvider;
};

export function AIProjectWizard({
  open,
  onClose,
  onProjectCreated,
  directoryProvider: externalProvider,
}: AIProjectWizardProps) {
  // Use provided directory or create in-memory fallback
  const inMemoryProvider = useInMemoryDirectoryProvider();
  const directory = externalProvider || inMemoryProvider;

  // Wizard state
  const [step, setStep] = useState<AIWizardStep>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState("");
  const [extracted, setExtracted] = useState<ExtractedProjectData | null>(null);
  const [userOverrides, setUserOverrides] = useState<Record<string, any>>({});
  const [linkedOrgs, setLinkedOrgs] = useState<Map<string, UUID>>(new Map());
  const [linkedContacts, setLinkedContacts] = useState<Map<string, UUID>>(new Map());
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("upload");
      setFiles([]);
      setExtracted(null);
      setUserOverrides({});
      setLinkedOrgs(new Map());
      setLinkedContacts(new Map());
      setExtractionProgress(0);
    }
  }, [open]);

  // Handle file additions
  const handleFilesAdded = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: uuid(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Handle file removal
  const handleFileRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Start AI extraction
  const handleExtract = useCallback(async () => {
    setStep("extracting");
    setExtractionProgress(0);

    try {
      const result = await mockExtractFromFiles(files, (pct, status) => {
        setExtractionProgress(pct);
        setExtractionStatus(status);
      });
      setExtracted(result);
      setStep("review");
    } catch (error) {
      console.error("Extraction failed:", error);
      setStep("upload");
      // TODO: Show error toast
    }
  }, [files]);

  // Skip to manual entry
  const handleSkipToManual = useCallback(() => {
    // Create empty extraction for manual entry
    setExtracted(createEmptyExtraction());
    setStep("review");
  }, []);

  // Handle field override
  const handleOverride = useCallback((field: string, value: any) => {
    setUserOverrides((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle org linking
  const handleLinkOrg = useCallback((role: string, orgId: UUID) => {
    setLinkedOrgs((prev) => {
      const next = new Map(prev);
      if (orgId) {
        next.set(role, orgId);
      } else {
        next.delete(role);
      }
      return next;
    });
  }, []);

  // Handle contact linking
  const handleLinkContact = useCallback((role: string, contactId: UUID) => {
    setLinkedContacts((prev) => {
      const next = new Map(prev);
      if (contactId) {
        next.set(role, contactId);
      } else {
        next.delete(role);
      }
      return next;
    });
  }, []);

  // Create project
  const handleCreate = useCallback(async () => {
    if (!extracted) return;

    setIsCreating(true);

    try {
      // Build final payload (merge AI extraction + user overrides)
      const getValue = (key: keyof ExtractedProjectData) => {
        if (userOverrides[key] !== undefined) return userOverrides[key];
        const field = extracted[key] as ExtractionField;
        return field?.value || null;
      };

      const projectId = uuid();

      // TODO: Replace with real API call
      console.log("Creating project:", {
        id: projectId,
        name: getValue("project_name"),
        market_type: getValue("market_type"),
        scope_summary: getValue("scope_summary"),
        solicitation_id: getValue("solicitation_id"),
        funding_agency: getValue("funding_agency_name"),
        bid_due_date: getValue("bid_due_date"),
        linked_orgs: Object.fromEntries(linkedOrgs),
        linked_contacts: Object.fromEntries(linkedContacts),
      });

      // Simulate API delay
      await new Promise((r) => setTimeout(r, 500));

      onProjectCreated?.(projectId);
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  }, [extracted, userOverrides, linkedOrgs, linkedContacts, onProjectCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-[#00205B] font-extrabold text-sm uppercase">
              AI-Powered Project Creation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Step Rail */}
        <StepRail currentStep={step} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "upload" && (
            <UploadStep
              files={files}
              onFilesAdded={handleFilesAdded}
              onFileRemove={handleFileRemove}
              onExtract={handleExtract}
              onSkip={handleSkipToManual}
            />
          )}

          {step === "extracting" && (
            <ExtractingStep
              progress={extractionProgress}
              status={extractionStatus}
              onCancel={() => setStep("upload")}
            />
          )}

          {step === "review" && extracted && (
            <ReviewStep
              extracted={extracted}
              userOverrides={userOverrides}
              onOverride={handleOverride}
              onBack={() => setStep("upload")}
              onContinue={() => setStep("link")}
            />
          )}

          {step === "link" && extracted && (
            <LinkStep
              extracted={extracted}
              directory={directory}
              linkedOrgs={linkedOrgs}
              linkedContacts={linkedContacts}
              onLinkOrg={handleLinkOrg}
              onLinkContact={handleLinkContact}
              onBack={() => setStep("review")}
              onCreate={handleCreate}
              isCreating={isCreating}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Helper: Empty Extraction (for manual entry)
   ========================= */

function createEmptyExtraction(): ExtractedProjectData {
  const empty = <T,>(v: T | null = null): ExtractionField<T> => ({
    value: v,
    confidence: 0,
    source: undefined,
  });

  return {
    market_type: { value: "Government", confidence: 0.5, source: "Default selection" },
    project_name: empty(),
    scope_summary: empty(),
    location_city: empty(),
    location_state: empty(),
    solicitation_id: empty(),
    naics: empty(),
    psc: empty(),
    set_aside: empty(),
    piid: empty(),
    funding_agency_name: empty(),
    issuing_office_name: empty(),
    owner_bid_ref: empty(),
    owner_name: empty(),
    gc_name: empty(),
    architect_name: empty(),
    bid_due_date: empty(),
    rfi_cutoff_date: empty(),
    site_visit_date: empty(),
    award_date: empty(),
    organizations_detected: [],
    contacts_detected: [],
  };
}

export default AIProjectWizard;

