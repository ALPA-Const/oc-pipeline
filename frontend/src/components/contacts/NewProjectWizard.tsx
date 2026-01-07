/* ============================================================
   NewProjectWizard.tsx — O'Neill Elite LOCKED Wizard
   ------------------------------------------------------------
   FINISHED implementation (works NOW without a Contact Directory):
   - Uses an in-memory "DirectoryProvider" as a temporary stand-in.
   - Supports + New Organization and + New Primary POC via mini-modals.
   - Persists as linked UUIDs in project_parties / project_contacts style.

   SOURCE-OF-TRUTH ALIGNMENT:
   - O'Neill Elite modal + inputs + universal upload patterns.  
   - Market Type swap + linked org/contact roles.             
   - Identifiers in Bid Setup; award IDs in Award Setup.      

   NOTES:
   - Market Type locks after completing Award Setup (Step 3).
   - Universal Upload moved to Active Setup (Step 4), per your directive.
   - accept attribute is corrected to: .xlsx,.csv (exactly)

   Integration later:
   - Replace the InMemoryDirectoryProvider with real API calls (same interface).
   ============================================================ */

import React, { useEffect, useMemo, useState } from "react";

/* =========================
   Types
   ========================= */

type UUID = string;

type MarketType = "Government" | "Commercial";
type WizardStepId = "Create" | "Bid Setup" | "Award Setup" | "Active Setup";

type ProjectPartyRole = "FundingAgency" | "IssuingOffice" | "Owner" | "GC" | "Architect";
type ProjectContactRole = "PrimaryPOC" | "CO" | "COR";

type Organization = { organization_id: UUID; legal_name: string };
type Contact = { contact_id: UUID; organization_id: UUID; name: string; email: string; title?: string };

type LocalDateTime = { local: string; timezone: string };

type ProjectCore = {
  name: string;
  market_type: MarketType;
  stage: "Create" | "Bid" | "Award" | "Active";

  client_organization_id?: UUID;
  primary_poc_contact_id?: UUID;

  scope_summary: string;
};

type ProjectParty = {
  organization_id: UUID;
  role: ProjectPartyRole;
  is_primary: boolean;
};

type ProjectContactLink = {
  contact_id: UUID;
  role: ProjectContactRole;
  is_primary: boolean;
};

type GovIdentifiers = {
  solicitation_id?: string;
  piid?: string;
};

type CommercialIdentifiers = {
  owner_bid_ref?: string;
  executed_contract_ref?: string;
};

type Milestones = {
  bid_due?: LocalDateTime;
  rfi_cutoff?: LocalDateTime;
  award_date?: LocalDateTime;
  ntp_date?: LocalDateTime;
};

type UploadRef = { label: string; uri: string };

export type NewProjectWizardPayload = {
  project: ProjectCore;
  parties: ProjectParty[];
  contacts: ProjectContactLink[];
  gov: GovIdentifiers;
  commercial: CommercialIdentifiers;
  milestones: Milestones;
  uploads: UploadRef[];
};

/* =========================
   Directory Provider interface
   ========================= */

export type DirectoryProvider = {
  searchOrganizations: (query: string) => Promise<Organization[]>;
  createOrganization: (legalName: string) => Promise<Organization>;

  searchContacts: (query: string, organizationId?: UUID) => Promise<Contact[]>;
  createContact: (input: { organization_id: UUID; name: string; email: string; title?: string }) => Promise<Contact>;

  getOrganizationById?: (id: UUID) => Organization | undefined;
  getContactById?: (id: UUID) => Contact | undefined;
};

/* =========================
   In-memory provider (MVP bridge)
   ========================= */

function uuid(): UUID {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
      return base
        .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query))
        .slice(0, 25);
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
   O'Neill Elite UI primitives
   ========================= */

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded-input text-white bg-[#00205B] text-[11px] font-semibold",
        "hover:opacity-95 active:opacity-90 disabled:opacity-50",
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
        "px-4 py-2 rounded-input text-white bg-[#009A44] text-[11px] font-semibold",
        "hover:opacity-95 active:opacity-90 disabled:opacity-50",
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
        "px-4 py-2 rounded-input bg-white border border-slate-300 text-[11px] font-semibold text-[#00205B]",
        "hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50",
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
        "w-full rounded-input border border-slate-300 bg-white",
        "px-[10px] py-[10px] text-[11px]",
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
        "w-full rounded-input border border-slate-300 bg-white",
        "px-[10px] py-[10px] text-[11px] min-h-[110px]",
        "focus:outline-none focus:ring-2 focus:ring-oneill-navy/20 focus:border-oneill-navy",
        props.className || "",
      ].join(" ")}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wide text-slate-600 font-extrabold mb-1">{children}</div>;
}

function GlassPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white shadow-panel rounded-panel p-4">
      <div className="text-oneill-navy font-extrabold mb-3">{title}</div>
      {children}
    </section>
  );
}

function StepRail({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <div key={s}>
            <div className={["h-2 rounded-full", i <= active ? "bg-oneill-navy" : "bg-slate-200"].join(" ")} />
            <div className="mt-2 text-[10px] uppercase font-extrabold text-oneill-navy">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardModal({
  open,
  title,
  steps,
  active,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  steps: string[];
  active: number;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-white rounded-panel shadow-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[#00205B] font-extrabold">{title}</div>
            <button className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <StepRail steps={steps} active={active} />
          <div className="p-4">{children}</div>
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">{footer}</div>
        </div>
      </div>
    </div>
  );
}

function UniversalUploadButton({ onFiles }: { onFiles: (files: FileList) => void }) {
  return (
    <label className="inline-flex items-center justify-center gap-2 cursor-pointer px-4 py-2 rounded-input bg-oneill-navy text-white text-[11px] font-semibold">
      Choose Files
      <input
        type="file"
        className="hidden"
        accept=".xlsx,.csv"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </label>
  );
}

/* =========================
   Nested mini modals for + New
   ========================= */

function EliteMiniModal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-panel shadow-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[#00205B] font-extrabold">{title}</div>
            <button className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">{footer}</div>
        </div>
      </div>
    </div>
  );
}

function CreateOrganizationModal({
  open,
  onClose,
  provider,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  provider: DirectoryProvider;
  onCreated: (org: Organization) => void;
}) {
  const [legalName, setLegalName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLegalName("");
      setSaving(false);
    }
  }, [open]);

  const canCreate = legalName.trim().length >= 3;

  return (
    <EliteMiniModal
      open={open}
      title="New Client Organization"
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>Cancel</SecondaryButton>
          <PrimaryButton
            disabled={!canCreate || saving}
            onClick={async () => {
              setSaving(true);
              const org = await provider.createOrganization(legalName);
              onCreated(org);
              setSaving(false);
              onClose();
            }}
          >
            {saving ? "Creating…" : "Create Organization"}
          </PrimaryButton>
        </>
      }
    >
      <FieldLabel>Legal Name *</FieldLabel>
      <TextInput value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g., ABC Logistics, Inc." />
      <div className="mt-2 text-[11px] text-slate-500">This will be added to the Directory.</div>
    </EliteMiniModal>
  );
}

function CreateContactModal({
  open,
  onClose,
  provider,
  organizationId,
  organizationName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  provider: DirectoryProvider;
  organizationId?: UUID;
  organizationName?: string;
  onCreated: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setTitle("");
      setSaving(false);
    }
  }, [open]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canCreate = !!organizationId && name.trim().length >= 2 && emailOk;

  return (
    <EliteMiniModal
      open={open}
      title="New Primary POC"
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>Cancel</SecondaryButton>
          <PrimaryButton
            disabled={!canCreate || saving}
            onClick={async () => {
              if (!organizationId) return;
              setSaving(true);
              const c = await provider.createContact({
                organization_id: organizationId,
                name,
                email,
                title: title || undefined,
              });
              onCreated(c);
              setSaving(false);
              onClose();
            }}
          >
            {saving ? "Creating…" : "Create Contact"}
          </PrimaryButton>
        </>
      }
    >
      <div className="text-[11px] text-slate-600 mb-3">
        Adding to Directory under:{" "}
        <span className="font-semibold text-oneill-navy">{organizationName || "Client Organization"}</span>
      </div>

      <div className="space-y-3">
        <div>
          <FieldLabel>Name *</FieldLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <FieldLabel>Email *</FieldLabel>
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        <div>
          <FieldLabel>Title (optional)</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Owner Rep / CO / PM…" />
        </div>
      </div>
    </EliteMiniModal>
  );
}

/* =========================
   Pickers (simple list + create)
   ========================= */

function OrganizationPicker({
  label,
  provider,
  selectedId,
  onPick,
  onNew,
}: {
  label: string;
  provider: DirectoryProvider;
  selectedId?: UUID;
  onPick: (org: Organization) => void;
  onNew: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Organization[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await provider.searchOrganizations(q);
      if (alive) setResults(r);
    })();
    return () => {
      alive = false;
    };
  }, [q, provider]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <SecondaryButton type="button" onClick={onNew}>+ New</SecondaryButton>
      </div>
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organizations…" />

      <div className="mt-2 border border-slate-200 rounded-panel overflow-hidden">
        <div className="max-h-40 overflow-auto">
          {results.length === 0 ? (
            <div className="p-2 text-[11px] text-slate-500">No results.</div>
          ) : (
            results.map((o) => (
              <button
                type="button"
                key={o.organization_id}
                onClick={() => onPick(o)}
                className={[
                  "w-full text-left px-3 py-2 text-[11px] border-b border-slate-100 hover:bg-slate-50",
                  selectedId === o.organization_id ? "bg-slate-50" : "",
                ].join(" ")}
              >
                <div className="text-oneill-navy font-semibold">{o.legal_name}</div>
                <div className="text-slate-500">{o.organization_id}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ContactPicker({
  label,
  provider,
  organizationId,
  organizationName,
  selectedId,
  onPick,
  onNew,
}: {
  label: string;
  provider: DirectoryProvider;
  organizationId?: UUID;
  organizationName?: string;
  selectedId?: UUID;
  onPick: (c: Contact) => void;
  onNew: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Contact[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await provider.searchContacts(q, organizationId);
      if (alive) setResults(r);
    })();
    return () => {
      alive = false;
    };
  }, [q, organizationId, provider]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <SecondaryButton type="button" onClick={onNew} disabled={!organizationId}>
          + New
        </SecondaryButton>
      </div>

      <TextInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={organizationId ? `Search contacts in ${organizationName || "Client Org"}…` : "Select Client Org first"}
        disabled={!organizationId}
      />

      <div className="mt-2 border border-slate-200 rounded-panel overflow-hidden">
        <div className="max-h-40 overflow-auto">
          {!organizationId ? (
            <div className="p-2 text-[11px] text-slate-500">Select a Client Organization to search contacts.</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-[11px] text-slate-500">No results.</div>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.contact_id}
                onClick={() => onPick(c)}
                className={[
                  "w-full text-left px-3 py-2 text-[11px] border-b border-slate-100 hover:bg-slate-50",
                  selectedId === c.contact_id ? "bg-slate-50" : "",
                ].join(" ")}
              >
                <div className="text-oneill-navy font-semibold">{c.name}</div>
                <div className="text-slate-600">{c.email}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   DateTime input
   ========================= */

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
  } catch {
    return "America/Chicago";
  }
}

function DateTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: LocalDateTime;
  onChange: (dt?: LocalDateTime) => void;
}) {
  const tz = value?.timezone || defaultTimezone();
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <TextInput type="datetime-local" value={value?.local || ""} onChange={(e) => onChange({ local: e.target.value, timezone: tz })} />
        <TextInput value={tz} onChange={(e) => onChange({ local: value?.local || "", timezone: e.target.value })} />
      </div>
    </div>
  );
}

/* =========================
   Validation (gating)
   ========================= */

type Validation = { ok: boolean; label: string };

function isComplete(validations: Validation[]) {
  return validations.every((v) => v.ok);
}

function validate(payload: NewProjectWizardPayload, step: WizardStepId): Validation[] {
  const { project, parties, contacts, gov, commercial, milestones } = payload;

  if (step === "Create") {
    return [
      { ok: !!project.market_type, label: "Market Type" },
      { ok: project.name.trim().length > 0, label: "Project Name" },
      { ok: !!project.client_organization_id, label: "Client Organization (linked)" },
      { ok: contacts.some((c) => c.role === "PrimaryPOC" && c.is_primary), label: "Primary POC (linked)" },
      { ok: project.scope_summary.trim().length >= 50, label: "Scope Summary (min 50 chars)" },
    ];
  }

  if (step === "Bid Setup") {
    if (project.market_type === "Government") {
      return [
        { ok: parties.some((p) => p.role === "FundingAgency"), label: "Funding Agency (linked)" },
        { ok: !!gov.solicitation_id?.trim(), label: "Solicitation ID" },
        { ok: true, label: "Optional: RFI cutoff / Bid due" },
      ];
    }
    return [
      { ok: parties.some((p) => p.role === "Owner"), label: "Owner (linked)" },
      { ok: parties.some((p) => p.role === "GC"), label: "GC (linked)" },
      { ok: !!commercial.owner_bid_ref?.trim(), label: "Owner Bid Reference" },
    ];
  }

  if (step === "Award Setup") {
    const base = [
      { ok: !!milestones.award_date?.local, label: "Award Date" },
      { ok: !!milestones.ntp_date?.local, label: "NTP / Start Date" },
    ];
    if (project.market_type === "Government") {
      return [{ ok: !!gov.piid?.trim(), label: "PIID" }, ...base];
    }
    return [{ ok: !!commercial.executed_contract_ref?.trim(), label: "Executed Contract Ref" }, ...base];
  }

  return [{ ok: true, label: "Ready to Create Project" }];
}

/* =========================
   Main Wizard
   ========================= */

export function NewProjectWizard({
  open,
  onClose,
  provider,
  onSaveDraft,
  onCreateProject,
}: {
  open: boolean;
  onClose: () => void;
  provider: DirectoryProvider;
  onSaveDraft?: (payload: NewProjectWizardPayload) => Promise<void> | void;
  onCreateProject: (payload: NewProjectWizardPayload) => Promise<void> | void;
}) {
  const steps: WizardStepId[] = ["Create", "Bid Setup", "Award Setup", "Active Setup"];
  const [active, setActive] = useState(0);
  const [marketTypeLocked, setMarketTypeLocked] = useState(false);

  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [pocModalOpen, setPocModalOpen] = useState(false);

  const [payload, setPayload] = useState<NewProjectWizardPayload>(() => ({
    project: {
      name: "",
      market_type: "Government",
      stage: "Create",
      scope_summary: "",
    },
    parties: [],
    contacts: [],
    gov: {},
    commercial: {},
    milestones: {},
    uploads: [],
  }));

  // Reset on open
  useEffect(() => {
    if (open) {
      setActive(0);
      setMarketTypeLocked(false);
      setPayload({
        project: { name: "", market_type: "Government", stage: "Create", scope_summary: "" },
        parties: [],
        contacts: [],
        gov: {},
        commercial: {},
        milestones: {},
        uploads: [],
      });
    }
  }, [open]);

  const step = steps[active];
  const validations = useMemo(() => validate(payload, step), [payload, step]);
  const canNext = isComplete(validations);

  const clientOrg = payload.project.client_organization_id
    ? provider.getOrganizationById?.(payload.project.client_organization_id)
    : undefined;

  function setProject(patch: Partial<ProjectCore>) {
    setPayload((prev) => ({ ...prev, project: { ...prev.project, ...patch } }));
  }

  function setMarketType(mt: MarketType) {
    if (marketTypeLocked) return;
    setProject({ market_type: mt });
  }

  function upsertParty(role: ProjectPartyRole, orgId: UUID) {
    setPayload((prev) => ({
      ...prev,
      parties: [...prev.parties.filter((p) => p.role !== role), { role, organization_id: orgId, is_primary: true }],
    }));
  }

  function upsertPrimaryPOC(contactId: UUID) {
    setPayload((prev) => ({
      ...prev,
      project: { ...prev.project, primary_poc_contact_id: contactId },
      contacts: [{ role: "PrimaryPOC", contact_id: contactId, is_primary: true }],
    }));
  }

  function goNext() {
    if (!canNext) return;
    if (step === "Award Setup") setMarketTypeLocked(true);

    const next = Math.min(active + 1, steps.length - 1);
    setActive(next);

    const stage = next === 0 ? "Create" : next === 1 ? "Bid" : next === 2 ? "Award" : "Active";
    setProject({ stage });
  }

  function goBack() {
    setActive((p) => Math.max(p - 1, 0));
  }

  function onFiles(files: FileList) {
    const names = Array.from(files).map((f) => f.name);
    setPayload((prev) => ({
      ...prev,
      uploads: [...prev.uploads, ...names.map((n) => ({ label: "Upload", uri: `upload://${encodeURIComponent(n)}` }))],
    }));
  }

  async function createProject() {
    const v1 = validate(payload, "Create");
    const v2 = validate(payload, "Bid Setup");
    const v3 = validate(payload, "Award Setup");

    if (!isComplete(v1) || !isComplete(v2) || !isComplete(v3)) return;

    await onCreateProject(payload);
    onClose();
  }

  return (
    <>
      <WizardModal
        open={open}
        title="CREATE NEW PROJECT"
        steps={["CREATE", "BID SETUP", "AWARD SETUP", "ACTIVE SETUP"]}
        active={active}
        onClose={onClose}
        footer={
          <>
            <button
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              type="button"
              onClick={() => onSaveDraft?.(payload)}
            >
              Save Draft
            </button>

            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={goBack} disabled={active === 0}>
                Back
              </SecondaryButton>

              {active < steps.length - 1 ? (
                <SuccessButton type="button" onClick={goNext} disabled={!canNext}>
                  Next Step
                </SuccessButton>
              ) : (
                <PrimaryButton type="button" onClick={createProject}>
                  Create Project
                </PrimaryButton>
              )}
            </div>
          </>
        }
      >
        <div className="space-y-4">
          {/* STEP 1: CREATE */}
          {step === "Create" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassPanel title="Market Type *">
                  <div className="inline-flex rounded-input border border-slate-300 overflow-hidden">
                    <button
                      type="button"
                      className={[
                        "px-4 py-2 text-[11px] font-semibold",
                        payload.project.market_type === "Government" ? "bg-[#00205B] text-white" : "bg-white text-[#00205B]",
                        marketTypeLocked ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      onClick={() => setMarketType("Government")}
                    >
                      Government
                    </button>
                    <button
                      type="button"
                      className={[
                        "px-4 py-2 text-[11px] font-semibold border-l border-slate-300",
                        payload.project.market_type === "Commercial" ? "bg-[#00205B] text-white" : "bg-white text-[#00205B]",
                        marketTypeLocked ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      onClick={() => setMarketType("Commercial")}
                    >
                      Commercial
                    </button>
                  </div>
                  {marketTypeLocked && (
                    <div className="mt-2 text-[11px] text-slate-500">Market Type locked after Award Setup.</div>
                  )}
                </GlassPanel>

                <GlassPanel title="Project Name *">
                  <TextInput
                    value={payload.project.name}
                    onChange={(e) => setProject({ name: e.target.value })}
                    placeholder="Project Name"
                  />
                </GlassPanel>
              </div>

              <GlassPanel title="Client Organization (linked) *">
                <OrganizationPicker
                  label="Client Organization"
                  provider={provider}
                  selectedId={payload.project.client_organization_id}
                  onNew={() => setOrgModalOpen(true)}
                  onPick={(org) => setProject({ client_organization_id: org.organization_id })}
                />
              </GlassPanel>

              <GlassPanel title="Primary POC (linked) *">
                <ContactPicker
                  label="Primary POC"
                  provider={provider}
                  organizationId={payload.project.client_organization_id}
                  organizationName={clientOrg?.legal_name}
                  selectedId={payload.project.primary_poc_contact_id}
                  onNew={() => setPocModalOpen(true)}
                  onPick={(c) => upsertPrimaryPOC(c.contact_id)}
                />
              </GlassPanel>

              <GlassPanel title="Scope Summary *">
                <TextArea
                  value={payload.project.scope_summary}
                  onChange={(e) => setProject({ scope_summary: e.target.value })}
                  placeholder="Minimum 50 characters."
                />
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{payload.project.scope_summary.length}/50 chars</span>
                  <span className={payload.project.scope_summary.length >= 50 ? "text-oneill-green font-semibold" : "text-red-500 font-semibold"}>
                    {payload.project.scope_summary.length >= 50 ? "OK" : "Too Short"}
                  </span>
                </div>
              </GlassPanel>
            </>
          )}

          {/* STEP 2: BID SETUP */}
          {step === "Bid Setup" && (
            <>
              {payload.project.market_type === "Government" ? (
                <>
                  <GlassPanel title="Funding Agency (linked) *">
                    <OrganizationPicker
                      label="Funding Agency"
                      provider={provider}
                      selectedId={payload.parties.find((p) => p.role === "FundingAgency")?.organization_id}
                      onNew={() => setOrgModalOpen(true)}
                      onPick={(org) => upsertParty("FundingAgency", org.organization_id)}
                    />
                  </GlassPanel>

                  <GlassPanel title="Solicitation ID *">
                    <TextInput
                      value={payload.gov.solicitation_id || ""}
                      onChange={(e) => setPayload((prev) => ({ ...prev, gov: { ...prev.gov, solicitation_id: e.target.value } }))}
                      placeholder="e.g., W912EQ26BA001"
                    />
                  </GlassPanel>

                  <GlassPanel title="Bid Dates (optional)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DateTimeInput
                        label="RFI Cutoff (optional)"
                        value={payload.milestones.rfi_cutoff}
                        onChange={(dt) => setPayload((prev) => ({ ...prev, milestones: { ...prev.milestones, rfi_cutoff: dt } }))}
                      />
                      <DateTimeInput
                        label="Bid Due (optional)"
                        value={payload.milestones.bid_due}
                        onChange={(dt) => setPayload((prev) => ({ ...prev, milestones: { ...prev.milestones, bid_due: dt } }))}
                      />
                    </div>
                  </GlassPanel>
                </>
              ) : (
                <>
                  <GlassPanel title="Owner (linked) *">
                    <OrganizationPicker
                      label="Owner"
                      provider={provider}
                      selectedId={payload.parties.find((p) => p.role === "Owner")?.organization_id}
                      onNew={() => setOrgModalOpen(true)}
                      onPick={(org) => upsertParty("Owner", org.organization_id)}
                    />
                  </GlassPanel>

                  <GlassPanel title="GC (linked) *">
                    <OrganizationPicker
                      label="General Contractor"
                      provider={provider}
                      selectedId={payload.parties.find((p) => p.role === "GC")?.organization_id}
                      onNew={() => setOrgModalOpen(true)}
                      onPick={(org) => upsertParty("GC", org.organization_id)}
                    />
                  </GlassPanel>

                  <GlassPanel title="Owner Bid Reference *">
                    <TextInput
                      value={payload.commercial.owner_bid_ref || ""}
                      onChange={(e) =>
                        setPayload((prev) => ({ ...prev, commercial: { ...prev.commercial, owner_bid_ref: e.target.value } }))
                      }
                      placeholder="e.g., Bid Package BP-07R"
                    />
                  </GlassPanel>
                </>
              )}
            </>
          )}

          {/* STEP 3: AWARD SETUP */}
          {step === "Award Setup" && (
            <>
              {payload.project.market_type === "Government" ? (
                <GlassPanel title="PIID (Government Award/Contract #) *">
                  <TextInput
                    value={payload.gov.piid || ""}
                    onChange={(e) => setPayload((prev) => ({ ...prev, gov: { ...prev.gov, piid: e.target.value } }))}
                    placeholder="e.g., 36C25526C00XX"
                  />
                </GlassPanel>
              ) : (
                <GlassPanel title="Executed Contract Ref (Commercial) *">
                  <TextInput
                    value={payload.commercial.executed_contract_ref || ""}
                    onChange={(e) =>
                      setPayload((prev) => ({ ...prev, commercial: { ...prev.commercial, executed_contract_ref: e.target.value } }))
                    }
                    placeholder="e.g., Contract 2026-014"
                  />
                </GlassPanel>
              )}

              <GlassPanel title="Award & Start Dates *">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DateTimeInput
                    label="Award Date"
                    value={payload.milestones.award_date}
                    onChange={(dt) => setPayload((prev) => ({ ...prev, milestones: { ...prev.milestones, award_date: dt } }))}
                  />
                  <DateTimeInput
                    label="NTP / Start Date"
                    value={payload.milestones.ntp_date}
                    onChange={(dt) => setPayload((prev) => ({ ...prev, milestones: { ...prev.milestones, ntp_date: dt } }))}
                  />
                </div>
              </GlassPanel>
            </>
          )}

          {/* STEP 4: ACTIVE SETUP */}
          {step === "Active Setup" && (
            <GlassPanel title="Universal Upload (.xlsx, .csv)">
              <div className="border border-slate-200 rounded-panel p-6 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-extrabold">
                    Universal Upload (.xlsx, .csv)
                  </div>
                  <UniversalUploadButton onFiles={onFiles} />
                  <div className="text-[11px] text-slate-500">
                    Upload bid matrices, takeoffs, schedules, checklists, etc.
                  </div>
                </div>
              </div>

              {payload.uploads.length > 0 && (
                <div className="mt-4">
                  <FieldLabel>Uploaded (references)</FieldLabel>
                  <div className="space-y-2">
                    {payload.uploads.map((u, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-panel px-3 py-2 text-[11px]">
                        <span className="font-semibold text-oneill-navy">{u.label}:</span>{" "}
                        <span className="text-slate-600">{u.uri}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>
          )}
        </div>
      </WizardModal>

      {/* + New modals */}
      <CreateOrganizationModal
        open={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        provider={provider}
        onCreated={(org) => {
          if (!payload.project.client_organization_id) {
            setProject({ client_organization_id: org.organization_id });
          }
        }}
      />

      <CreateContactModal
        open={pocModalOpen}
        onClose={() => setPocModalOpen(false)}
        provider={provider}
        organizationId={payload.project.client_organization_id}
        organizationName={clientOrg?.legal_name}
        onCreated={(c) => upsertPrimaryPOC(c.contact_id)}
      />
    </>
  );
}
