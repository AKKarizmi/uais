"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, FolderOpen, Globe, Video } from "lucide-react";
import { DesktopFrame } from "./frame";
import { useDemoState } from "@/components/operations/demo-state";
import * as seed from "@/lib/operations/mock";
import type { Student, University, Portal } from "@/lib/operations/types";
import {
  canonicalFields,
  getPath,
  metadataFor,
  validateMetadata,
} from "@/lib/desktop/metadata";
import { portalSeeds } from "@/lib/desktop/universities";
const seededPortals = portalSeeds(seed.universities);
export function DesktopDashboard() {
  const [students] = useDemoState<Student[]>("students", seed.students);
  const [universities] = useDemoState<University[]>(
    "universities",
    seed.universities,
  );
  const [portals] = useDemoState<Portal[]>("portals", seededPortals);
  const metrics = [
    {
      name: "Students",
      value: students.length,
      detail: "Student records indexed",
      Icon: FolderOpen,
      href: "/students",
      tone: "blue",
    },
    {
      name: "Universities",
      value: universities.length,
      detail: "University records",
      Icon: Building2,
      href: "/universities",
      tone: "violet",
    },
    {
      name: "Portals",
      value: portals.length,
      detail: "Registered portal entries",
      Icon: Globe,
      href: "/universities",
      tone: "cyan",
    },
    {
      name: "Recordings",
      value: 0,
      detail: "No Desktop recordings connected",
      Icon: Video,
      href: "/recorder",
      tone: "green",
    },
  ];
  return (
    <DesktopFrame
      title="Dashboard"
      subtitle="Intelligent admissions workspace."
    >
      <div className="desktop-metrics">
        {metrics.map(({ name, value, detail, Icon, href, tone }) => (
          <Link
            href={href}
            key={name}
            className={`desktop-card desktop-metric ${tone}`}
          >
            <div>
              <span>{name}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
            <Icon size={24} />
          </Link>
        ))}
      </div>
      <section className="desktop-card workflow-card">
        <h2>Recommended build workflow</h2>
        <p>
          Keep student records structured, register portals, then continue
          capture and analysis in UAIS Desktop.
        </p>
        <div className="desktop-workflow">
          {[
            {
              name: "Students",
              text: "Create a record and prepare canonical metadata.",
              href: "/students",
            },
            {
              name: "Universities",
              text: "Register universities and their admission portals.",
              href: "/universities",
            },
            {
              name: "Record",
              text: "Inspect registrations; capture is owned by Desktop.",
              href: "/recorder",
            },
            {
              name: "Analyze",
              text: "Inspect field resolution and metadata diagnostics.",
              href: "/system-resolver",
            },
          ].map((s, i) => (
            <Link key={s.name} href={s.href}>
              <span>{i + 1}</span>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="desktop-card">
        <h2>Quick actions</h2>
        <div className="desktop-toolbar">
          <Link className="desktop-button primary" href="/students">
            Add / open students
          </Link>
          <Link className="desktop-button" href="/universities">
            Manage universities
          </Link>
          <Link className="desktop-button success" href="/recorder">
            Inspect Recorder metadata
          </Link>
          <Link className="desktop-button" href="/system-resolver">
            Open System & Resolver
          </Link>
        </div>
      </section>
      <section className="desktop-card">
        <h2>Web operations</h2>
        <p>Collaboration and admissions workflows extend the Desktop core.</p>
        <div className="desktop-toolbar">
          <Link className="desktop-button" href="/admin">
            Admin analytics dashboard
          </Link>
          <Link className="desktop-button" href="/manager-workspace">
            Manager Workspace
          </Link>
          <Link className="desktop-button" href="/employee-workspace">
            Employee Workspace
          </Link>
          <Link className="desktop-button" href="/track-application">
            Application tracking
          </Link>
        </div>
      </section>
    </DesktopFrame>
  );
}
export function RecorderWorkspace() {
  const [universities] = useDemoState<University[]>(
    "universities",
    seed.universities,
  );
  const [portals] = useDemoState<Portal[]>("portals", seededPortals);
  const [id, setId] = useState(seededPortals[0]?.id ?? "");
  const selected = portals.find((p) => p.id === id);
  return (
    <DesktopFrame
      title="Recorder"
      subtitle="Registered portals, recording metadata, mapping and workflow status."
    >
      <div className="desktop-tabs">
        <span>Recording inspector</span>
      </div>
      <section className="desktop-card">
        <h2>Recorder session</h2>
        <p>
          UAIS Desktop owns OD-Recorder, browser automation and future autofill.
          This Web inspector reads fictional registration metadata.
        </p>
        <div className="desktop-form">
          <label>
            Registered portal
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">Select a portal</option>
              {portals.map((p) => (
                <option key={p.id} value={p.id}>
                  {universities.find((u) => u.id === p.universityId)?.name} —{" "}
                  {p.name}
                  {!p.active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <dl className="student-summary">
              <dt>University</dt>
              <dd>
                {universities.find((u) => u.id === selected.universityId)?.name}
              </dd>
              <dt>Portal</dt>
              <dd>{selected.url}</dd>
              <dt>Purpose / family</dt>
              <dd>
                {selected.purpose} / {selected.family} ({selected.familySource})
              </dd>
              <dt>Recording metadata</dt>
              <dd>{selected.recordingStatus}</dd>
              <dt>Automation / mapping</dt>
              <dd>{selected.automationStatus} · Artifact not connected</dd>
              <dt>Last recorded session</dt>
              <dd>Unavailable — Desktop recording storage is not connected</dd>
            </dl>
          ) : (
            <p>No portal selected. Register a portal in Universities first.</p>
          )}
        </div>
      </section>
      <section className="desktop-card">
        <h2>Recorder status</h2>
        <div className="desktop-notice">
          Unavailable on Web. No browser session, recording artifact or
          automation worker is connected.
        </div>
        <div className="desktop-toolbar">
          <button className="desktop-button" disabled>
            Open browser · Desktop only
          </button>
          <button className="desktop-button success" disabled>
            Start recording · Desktop only
          </button>
          <button className="desktop-button" disabled>
            Stop / save · Desktop only
          </button>
        </div>
      </section>
      <section className="desktop-card">
        <h2>Session log</h2>
        <p className="desktop-muted">
          No Web capture session. Continue recording and analysis in UAIS
          Desktop.
        </p>
      </section>
    </DesktopFrame>
  );
}
export function ResolverWorkspace() {
  const [students] = useDemoState<Student[]>("students", seed.students);
  const [studentId, setStudentId] = useState(seed.students[0]?.id ?? "");
  const [key, setKey] = useState("first_name");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");
  const student = students.find((s) => s.id === studentId);
  return (
    <DesktopFrame
      title="System & Resolver"
      subtitle="Index maintenance, canonical field resolution, and diagnostics."
    >
      <section className="desktop-card">
        <h2>System tools</h2>
        <p>
          Demo student index: {students.length} records in memory. Desktop
          SQLite, Students, data and recordings directories are not connected.
        </p>
        <div className="desktop-toolbar">
          <button
            className="desktop-button primary"
            onClick={() =>
              setMessage(
                `Demo index inspected: ${students.length} unique records, ${new Set(students.map((s) => s.code)).size} unique IDs. No Desktop index was changed.`,
              )
            }
          >
            Rebuild / inspect demo index
          </button>
          <button className="desktop-button" disabled>
            Open Students · Desktop only
          </button>
          <button className="desktop-button" disabled>
            Open data · Desktop only
          </button>
          <button className="desktop-button" disabled>
            Open recordings · Desktop only
          </button>
          <button
            className="desktop-button"
            onClick={() => {
              if (!student) return;
              const errors = validateMetadata(metadataFor(student), student);
              setMessage(
                errors.length
                  ? errors.join(" ")
                  : `${student.code}: 141 canonical definitions and 37 document directories validated. File existence and backend permissions are unavailable.`,
              );
            }}
          >
            Validate selected metadata
          </button>
        </div>
        <p role="status">{message}</p>
      </section>
      <section className="desktop-card">
        <h2>Student Resolver test</h2>
        <p>
          Inspect where a canonical key resolves in the selected fictional
          record.
        </p>
        <div className="desktop-form">
          <label>
            Student
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setResult(null);
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Canonical field
            <input
              list="resolver-keys"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setResult(null);
              }}
            />
            <datalist id="resolver-keys">
              {canonicalFields.map((f) => (
                <option key={f.canonical_name}>{f.canonical_name}</option>
              ))}
            </datalist>
          </label>
          <button
            className="desktop-button primary"
            disabled={!student}
            onClick={() => {
              const f = canonicalFields.find((f) => f.canonical_name === key);
              if (!f || !student) {
                setResult({ error: "Unknown canonical field or student." });
                return;
              }
              setResult({
                canonical_name: f.canonical_name,
                kind: f.field_type,
                metadata_path: f.metadata_path,
                source: "Fictional in-memory schema 1.1 metadata",
                value:
                  f.field_type === "upload"
                    ? "Unavailable — no authenticated file service. Desktop resolves only explicit preferred files; no newest-file fallback."
                    : (getPath(metadataFor(student), f.metadata_path) ?? null),
              });
            }}
          >
            Resolve
          </button>
        </div>
        {result && (
          <pre className="resolver-result" aria-label="Resolver result">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </section>
    </DesktopFrame>
  );
}
