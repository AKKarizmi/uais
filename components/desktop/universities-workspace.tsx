"use client";
import { useState } from "react";
import { DesktopFrame } from "./frame";
import { Spreadsheet, type CellChange, type GridColumn } from "./spreadsheet";
import { ImportDialog } from "./import-dialog";
import { Modal } from "@/components/operations/shared";
import { useDemoState } from "@/components/operations/demo-state";
import * as seed from "@/lib/operations/mock";
import type { Portal, University } from "@/lib/operations/types";
import { demoRepository } from "@/lib/operations/service";
import {
  detectFamily,
  exportUniversityRows,
  portalSeeds,
  replaceUniversities,
  safeUrl,
  universityHeaders,
  universityRows,
  type UniversityRow,
} from "@/lib/desktop/universities";
import { downloadWorkbook, makeWorkbook } from "@/lib/desktop/spreadsheets";
import { csvText, downloadText } from "@/lib/operations/reports";
const seedPortals = portalSeeds(seed.universities);
const empty = {
  name: "",
  url: "",
  country: "",
  city: "",
  website: "",
  notes: "",
  portalName: "Admissions",
  purpose: "admission",
  family: "",
  familySource: "auto",
  active: true,
  portalActive: true,
  recordingStatus: "not_recorded",
  automationStatus: "none",
  portalNotes: "",
};
export function UniversitiesWorkspace() {
  const [universities] = useDemoState<University[]>(
    "universities",
    seed.universities,
  );
  const [portals] = useDemoState<Portal[]>("portals", seedPortals);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seedPortals[0]?.id ?? "");
  const [mode, setMode] = useState("");
  const [draft, setDraft] = useState(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState("");
  const allRows = universityRows(universities, portals);
  const rows = allRows.filter((r) =>
    `${r.university.name} ${r.portal?.url ?? ""} ${r.university.country} ${r.portal?.family ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const selected = allRows.find((r) => r.id === selectedId);
  const columns: GridColumn<UniversityRow>[] = [
    {
      key: "name",
      label: "University",
      width: 220,
      editable: true,
      value: (r) => r.university.name,
    },
    {
      key: "url",
      label: "Portal",
      width: 260,
      editable: true,
      value: (r) => r.portal?.url,
    },
    {
      key: "country",
      label: "Country",
      editable: true,
      value: (r) => r.university.country,
    },
    {
      key: "family",
      label: "Family",
      editable: true,
      value: (r) => r.portal?.family ?? "Unclassified",
    },
    {
      key: "recordingStatus",
      label: "Recording",
      editable: true,
      value: (r) => r.portal?.recordingStatus ?? "not_recorded",
    },
    {
      key: "automationStatus",
      label: "Automation",
      editable: true,
      value: (r) => r.portal?.automationStatus ?? "none",
    },
    {
      key: "website",
      label: "Website",
      width: 220,
      editable: true,
      value: (r) => r.university.website,
    },
    {
      key: "city",
      label: "City",
      editable: true,
      value: (r) => r.university.city,
    },
    {
      key: "notes",
      label: "University notes",
      editable: true,
      value: (r) => r.university.notes,
    },
    {
      key: "portalName",
      label: "Portal name",
      editable: true,
      value: (r) => r.portal?.name,
    },
    {
      key: "purpose",
      label: "Purpose",
      editable: true,
      value: (r) => r.portal?.purpose,
    },
    {
      key: "familySource",
      label: "Family source",
      editable: true,
      value: (r) => r.portal?.familySource,
    },
    {
      key: "active",
      label: "University active",
      editable: true,
      value: (r) => r.university.active,
    },
    {
      key: "portalActive",
      label: "Portal active",
      editable: true,
      value: (r) => r.portal?.active,
    },
    {
      key: "portalNotes",
      label: "Portal notes",
      editable: true,
      value: (r) => r.portal?.notes,
    },
  ];
  function commit(changes: CellChange<UniversityRow>[]) {
    const us = structuredClone(demoRepository.read("universities")),
      ps = structuredClone(demoRepository.read("portals"));
    try {
      for (const { row, key, text } of changes) {
        const original = demoRepository
          .read("universities")
          .find((u) => u.id === row.university.id);
        const originalPortal = demoRepository
          .read("portals")
          .find((p) => p.id === row.portal?.id);
        if (
          JSON.stringify(original) !== JSON.stringify(row.university) ||
          JSON.stringify(originalPortal) !== JSON.stringify(row.portal)
        )
          throw new Error(
            "Registry changed during editing (412). Reload and reconcile.",
          );
        const u = us.find((u) => u.id === row.university.id)!,
          p = ps.find((p) => p.id === row.portal?.id);
        const value = text.trim();
        if (["name", "country", "city", "notes", "website"].includes(key)) {
          if (key === "name" && !value)
            throw new Error("University name is required.");
          if (key === "website" && value && !safeUrl(value))
            throw new Error(
              "Website requires an HTTP(S) URL without credentials.",
            );
          Object.assign(u, { [key]: value });
        } else if (key === "active") {
          if (!/^(yes|no|true|false)$/i.test(value))
            throw new Error("Active: use Yes or No.");
          u.active = /^(yes|true)$/i.test(value);
        } else {
          if (!p)
            throw new Error(
              "This university has no portal. Use Add Portal first.",
            );
          if (key === "url") {
            if (!safeUrl(value))
              throw new Error(
                "Portal requires an HTTP(S) URL without credentials.",
              );
            p.url = value;
            if (p.familySource === "auto") p.family = detectFamily(value);
          } else if (key === "family") {
            p.family = value || "Unclassified";
            p.familySource = "manual";
          } else if (key === "familySource") {
            if (value !== "auto" && value !== "manual")
              throw new Error("Family source: use auto or manual.");
            p.familySource = value;
            if (value === "auto") p.family = detectFamily(p.url);
          } else if (key === "portalActive") {
            if (!/^(yes|no|true|false)$/i.test(value))
              throw new Error("Portal active: use Yes or No.");
            p.active = /^(yes|true)$/i.test(value);
          } else {
            if (
              key === "recordingStatus" &&
              !["not_recorded", "recorded", "needs_review"].includes(value)
            )
              throw new Error(
                "Recording: not_recorded, recorded or needs_review.",
              );
            if (
              key === "automationStatus" &&
              !["none", "mapped", "ready", "needs_review"].includes(value)
            )
              throw new Error(
                "Automation: none, mapped, ready or needs_review.",
              );
            Object.assign(p, {
              [key === "portalName"
                ? "name"
                : key === "portalNotes"
                  ? "notes"
                  : key]: value,
            });
          }
        }
      }
      if (new Set(us.map((u) => u.name.toLowerCase())).size !== us.length)
        throw new Error("Duplicate university name.");
      if (
        new Set(ps.map((p) => `${p.universityId}|${p.url}`)).size !== ps.length
      )
        throw new Error("Duplicate portal URL for a university.");
      replaceUniversities(demoRepository, us, ps);
      return {
        ok: true,
        message:
          "Demo registry updated atomically. Recording and automation are metadata only.",
      };
    } catch (e) {
      return {
        ok: false,
        message: `${(e as Error).message} No cells changed.`,
      };
    }
  }
  function openForm(next: string) {
    setError("");
    setEditSnapshot(
      JSON.stringify([
        demoRepository.read("universities"),
        demoRepository.read("portals"),
      ]),
    );
    setMode(next);
    if (next === "add" || !selected) {
      setDraft({ ...empty });
      return;
    }
    const u = selected.university,
      p = next === "portal" ? undefined : selected.portal;
    setDraft({
      name: u.name,
      country: u.country,
      city: u.city ?? "",
      website: u.website,
      notes: u.notes ?? "",
      url: p?.url ?? "",
      portalName: p?.name ?? "Admissions",
      purpose: p?.purpose ?? "admission",
      family: p?.family ?? "",
      familySource: p?.familySource ?? "auto",
      active: u.active,
      portalActive: p?.active ?? true,
      recordingStatus: p?.recordingStatus ?? "not_recorded",
      automationStatus: p?.automationStatus ?? "none",
      portalNotes: p?.notes ?? "",
    });
  }
  function save() {
    if (
      JSON.stringify([
        demoRepository.read("universities"),
        demoRepository.read("portals"),
      ]) !== editSnapshot
    ) {
      setError(
        "Registry changed while editing (412). Close and reopen this form.",
      );
      return;
    }
    if (!draft.name.trim()) {
      setError("University name is required.");
      return;
    }
    if (
      (draft.website && !safeUrl(draft.website)) ||
      (draft.url && !safeUrl(draft.url))
    ) {
      setError(
        "Website and portal must use HTTP(S) without embedded credentials.",
      );
      return;
    }
    if (mode === "portal" && !draft.url) {
      setError("Enter a portal URL.");
      return;
    }
    const us = structuredClone(universities),
      ps = structuredClone(portals);
    let u =
      mode === "add"
        ? undefined
        : us.find((u) => u.id === selected?.university.id);
    if (
      us.some(
        (other) =>
          other.id !== u?.id &&
          other.name.toLowerCase() === draft.name.trim().toLowerCase(),
      )
    ) {
      setError(
        "A university with this name already exists. Select it and Add Portal.",
      );
      return;
    }
    if (!u) {
      u = {
        id: `uni-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        country: "",
        website: "",
        portal: "",
        family: "Unclassified",
        programs: 0,
        assignedTo: "",
        intake: "",
        active: true,
        initials: draft.name.slice(0, 2).toUpperCase(),
      };
      us.push(u);
    }
    Object.assign(u, {
      name: draft.name.trim(),
      country: draft.country,
      city: draft.city,
      website: draft.website,
      notes: draft.notes,
      active: draft.active,
    });
    if (draft.url) {
      let p =
        mode === "edit"
          ? ps.find((p) => p.id === selected?.portal?.id)
          : undefined;
      if (
        ps.some(
          (other) =>
            other.universityId === u!.id &&
            other.url === draft.url &&
            other.id !== p?.id,
        )
      ) {
        setError("That portal is already registered for this university.");
        return;
      }
      if (!p) {
        p = {
          id: `portal-${crypto.randomUUID()}`,
          universityId: u.id,
          name: "",
          purpose: "",
          url: "",
          family: "",
          familySource: "auto",
          active: true,
          recordingStatus: "not_recorded",
          automationStatus: "none",
          notes: "",
        };
        ps.push(p);
      }
      Object.assign(p, {
        name: draft.portalName,
        purpose: draft.purpose || "admission",
        url: draft.url,
        family:
          draft.familySource === "auto"
            ? detectFamily(draft.url)
            : draft.family || "Unclassified",
        familySource: draft.familySource,
        active: draft.portalActive,
        recordingStatus: draft.recordingStatus,
        automationStatus: draft.automationStatus,
        notes: draft.portalNotes,
      });
      setSelectedId(p.id);
    } else if (mode === "edit" && selected?.portal) {
      setError("To remove a portal use Delete; leave the university intact.");
      return;
    } else setSelectedId(`university-${u.id}`);
    replaceUniversities(demoRepository, us, ps);
    setMode("");
    setMessage("Fictional registry saved. No portal was visited or recorded.");
  }
  return (
    <DesktopFrame
      title="Universities"
      subtitle="Manage universities and portals, including Excel/CSV interchange."
    >
      <div className="desktop-toolbar">
        <input
          className="desktop-search"
          aria-label="Search universities"
          placeholder="Search universities or portals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="desktop-button primary"
          onClick={() => openForm("add")}
        >
          Add
        </button>
        <button
          className="desktop-button"
          disabled={!selected}
          onClick={() => openForm("edit")}
        >
          Edit
        </button>
        <button
          className="desktop-button"
          disabled={!selected}
          onClick={() => openForm("portal")}
        >
          Add Portal
        </button>
        <button
          className="desktop-button success"
          onClick={() => setMode("import")}
        >
          Import
        </button>
        <button
          className="desktop-button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const data = exportUniversityRows(
                universities.filter((u) =>
                  rows.some((r) => r.university.id === u.id),
                ),
                portals,
              ).filter((r) =>
                rows.some(
                  (row) =>
                    row.university.name === r.Name &&
                    (row.portal?.url ?? "") === r.Portal,
                ),
              );
              downloadWorkbook(
                "uais-universities-fictional.xlsx",
                await makeWorkbook([
                  {
                    name: "Universities",
                    headers: universityHeaders,
                    rows: data.map((r) =>
                      universityHeaders.map((h) => r[h as keyof typeof r]),
                    ),
                  },
                ]),
              );
              setMessage(
                "Matching university/portal rows exported as literal Excel cells.",
              );
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Export Excel
        </button>
        <button
          className="desktop-button"
          onClick={() => {
            const data = exportUniversityRows(universities, portals).filter(
              (r) =>
                rows.some(
                  (row) =>
                    row.university.name === r.Name &&
                    (row.portal?.url ?? "") === r.Portal,
                ),
            );
            downloadText(
              "uais-universities-fictional.csv",
              csvText(universityHeaders, data),
              "text/csv;charset=utf-8",
            );
          }}
        >
          Export CSV
        </button>
        {selected?.portal &&
        selected.university.active &&
        selected.portal.active &&
        safeUrl(selected.portal.url) ? (
          <a
            className="desktop-button"
            href={selected.portal.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Portal ↗
          </a>
        ) : (
          <button className="desktop-button" disabled>
            Open Portal
          </button>
        )}
        <button
          className="desktop-button danger"
          disabled={!selected}
          onClick={() => setMode("delete")}
        >
          Delete
        </button>
      </div>
      <div className="desktop-notice">
        Family is detected conservatively from supported host names. Unknown
        hosts stay Unclassified. Manual overrides are preserved. Recording and
        automation columns describe demo metadata; the Web cannot run Desktop
        workflows.
      </div>
      <Spreadsheet
        label="University spreadsheet"
        rows={rows}
        columns={columns}
        defaults={[
          "name",
          "url",
          "country",
          "family",
          "recordingStatus",
          "automationStatus",
        ]}
        presets={{
          "Portal details": [
            "name",
            "url",
            "portalName",
            "purpose",
            "family",
            "familySource",
            "portalActive",
          ],
          "University details": [
            "name",
            "url",
            "country",
            "city",
            "website",
            "notes",
            "active",
          ],
        }}
        initialSelected={selectedId}
        onSelect={(r) => setSelectedId(r.id)}
        onOpen={() => openForm("edit")}
        onCommit={commit}
      />
      {selected && (
        <section className="desktop-card">
          <h2>
            {selected.university.name} ·{" "}
            {selected.university.active ? "Active" : "Inactive"}
          </h2>
          <p>
            University and portal are separate records. Registered portals:{" "}
            {
              portals.filter((p) => p.universityId === selected.university.id)
                .length
            }
            .
          </p>
          <div className="desktop-toolbar">
            {selected.university.website &&
              safeUrl(selected.university.website) && (
                <a
                  className="desktop-button"
                  href={selected.university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  University Website ↗
                </a>
              )}
            <span>
              Portal: {selected.portal?.name ?? "Not registered"} ·{" "}
              {selected.portal?.purpose ?? "—"} ·{" "}
              {selected.portal
                ? selected.portal.active
                  ? "Active"
                  : "Inactive"
                : "—"}
            </span>
          </div>
        </section>
      )}
      <p role="status">{message}</p>
      {mode === "import" && (
        <ImportDialog
          kind="universities"
          onClose={() => setMode("")}
          notify={setMessage}
        />
      )}
      {["add", "edit", "portal"].includes(mode) && (
        <Modal
          title={
            mode === "add"
              ? "Add university"
              : mode === "portal"
                ? "Add portal to university"
                : "Edit university / portal"
          }
          onClose={() => setMode("")}
          foot={
            <>
              <button className="desktop-button" onClick={() => setMode("")}>
                Cancel
              </button>
              <button className="desktop-button primary" onClick={save}>
                Save demo metadata
              </button>
            </>
          }
        >
          <div className="desktop-form fields">
            {(
              [
                ["name", "University name *"],
                ["url", "Portal URL"],
                ["country", "Country"],
                ["city", "City"],
                ["website", "University website"],
                ["notes", "University notes"],
                ["portalName", "Portal name"],
                ["purpose", "Purpose"],
                ["portalNotes", "Portal notes"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={draft[key]}
                  readOnly={
                    mode === "portal" &&
                    ["name", "country", "city", "website", "notes"].includes(
                      key,
                    )
                  }
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Family source
              <select
                value={draft.familySource}
                onChange={(e) =>
                  setDraft({ ...draft, familySource: e.target.value })
                }
              >
                <option value="auto">Auto detect</option>
                <option value="manual">Manual override</option>
              </select>
            </label>
            <label>
              Portal family
              <input
                disabled={draft.familySource === "auto"}
                value={
                  draft.familySource === "auto"
                    ? detectFamily(draft.url)
                    : draft.family
                }
                onChange={(e) => setDraft({ ...draft, family: e.target.value })}
              />
            </label>
            <label>
              Recording status
              <select
                value={draft.recordingStatus}
                onChange={(e) =>
                  setDraft({ ...draft, recordingStatus: e.target.value })
                }
              >
                {["not_recorded", "recorded", "needs_review"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Automation status
              <select
                value={draft.automationStatus}
                onChange={(e) =>
                  setDraft({ ...draft, automationStatus: e.target.value })
                }
              >
                {["none", "mapped", "ready", "needs_review"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="inline-label">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />
              University active
            </label>
            <label className="inline-label">
              <input
                type="checkbox"
                checked={draft.portalActive}
                onChange={(e) =>
                  setDraft({ ...draft, portalActive: e.target.checked })
                }
              />
              Portal active
            </label>
          </div>
          <p role="alert" className="desktop-error">
            {error}
          </p>
          <p>
            Only the name is required for a university. A portal URL is required
            when adding a portal. Imported recording/automation statuses do not
            attach a recording or enable automation.
          </p>
        </Modal>
      )}
      {mode === "delete" && selected && (
        <Modal
          title="Delete selected demo registration?"
          onClose={() => setMode("")}
          foot={
            <>
              <button className="desktop-button" onClick={() => setMode("")}>
                Cancel
              </button>
              <button
                className="desktop-button danger"
                onClick={() => {
                  if (selected.portal) {
                    replaceUniversities(
                      demoRepository,
                      universities,
                      portals.filter((p) => p.id !== selected.portal!.id),
                    );
                    setSelectedId(
                      portals.find(
                        (p) =>
                          p.universityId === selected.university.id &&
                          p.id !== selected.portal!.id,
                      )?.id ?? `university-${selected.university.id}`,
                    );
                  } else {
                    if (
                      demoRepository
                        .read("applications")
                        .some((a) => a.universityId === selected.university.id)
                    ) {
                      setMessage(
                        "University has linked applications. Remove or reassign them before deleting the university.",
                      );
                      setMode("");
                      return;
                    }
                    replaceUniversities(
                      demoRepository,
                      universities.filter(
                        (u) => u.id !== selected.university.id,
                      ),
                      portals,
                    );
                  }
                  setMode("");
                  setMessage("Selected demo registration removed.");
                }}
              >
                Confirm deletion
              </button>
            </>
          }
        >
          <p>
            {selected.portal
              ? `Remove only the portal ${selected.portal.name}? The university and its other portals remain.`
              : `Remove ${selected.university.name}? A university with linked applications cannot be deleted.`}
          </p>
        </Modal>
      )}
    </DesktopFrame>
  );
}
