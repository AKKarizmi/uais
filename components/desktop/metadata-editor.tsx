"use client";
import { useState } from "react";
import Link from "next/link";
import { demoRepository, reviewDemoDocument } from "@/lib/operations/service";
import type { Student, Doc, Employee } from "@/lib/operations/types";
import {
  basicPaths,
  canonicalDocuments,
  choices,
  fieldLabel,
  getPath,
  groupFor,
  metadataFor,
  parseScalar,
  saveMetadataBatch,
  scalarFields,
  setPath,
} from "@/lib/desktop/metadata";
import { useDemoState } from "@/components/operations/demo-state";
import * as seed from "@/lib/operations/mock";

export function StudentDocuments({
  student,
  compact = false,
}: {
  student: Student;
  compact?: boolean;
}) {
  const [docs] = useDemoState<Doc[]>("documents", seed.documents);
  const [message, setMessage] = useState("");
  const metadata = metadataFor(student);
  return (
    <section className="desktop-card student-documents">
      <h2>
        Documents <span className="desktop-muted">37 categories</span>
      </h2>
      <p className="desktop-muted">
        File references are separate from review metadata. No files are stored
        or opened in this demo.
      </p>
      <div className={`document-scroll ${compact ? "compact" : ""}`}>
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Files</th>
              <th>Directory / reference</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {canonicalDocuments.map(([key, definition]) => {
              const value = getPath(metadata, `documents.${key}`) as {
                files: string[];
                preferred_file: string | null;
              };
              const review = docs.find(
                (d) => d.studentId === student.id && d.category === key,
              );
              return (
                <tr key={key}>
                  <td>
                    {fieldLabel(key)}
                    {value?.preferred_file && (
                      <small>Preferred: {value.preferred_file}</small>
                    )}
                  </td>
                  <td>{value?.files?.length ?? 0}</td>
                  <td>
                    <code>{definition.directory}</code>
                  </td>
                  <td>
                    {review ? (
                      <select
                        aria-label={`Review ${key}`}
                        disabled={
                          !!student.lock.ownerId &&
                          student.lock.ownerId !== "emp-1"
                        }
                        value={review.status}
                        onChange={(e) =>
                          setMessage(
                            reviewDemoDocument(
                              demoRepository,
                              review.id,
                              e.target.value as Doc["status"],
                              "emp-1",
                            ).message,
                          )
                        }
                      >
                        {[
                          "Missing",
                          "Uploaded",
                          "Pending Review",
                          "Verified",
                          "Rejected",
                        ].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      "Not reviewed"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="desktop-muted">
        {student.documentsVerified}/{student.documentsRequired} required reviews
        verified (demo workflow). File counts are metadata counts, not
        verification evidence.
      </p>
      {!compact && (
        <div className="desktop-toolbar">
          <button className="desktop-button" disabled>
            Add files · backend required
          </button>
          <button className="desktop-button" disabled>
            Set preferred file
          </button>
          <button className="desktop-button" disabled>
            Open folder · Desktop only
          </button>
          <Link href="/documents" className="desktop-button">
            Document control
          </Link>
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
export function MetadataEditor({ student }: { student: Student }) {
  const [tab, setTab] = useState("Basic Fields");
  const [draft, setDraft] = useState(() => metadataFor(student));
  const [json, setJson] = useState(() =>
    JSON.stringify(metadataFor(student), null, 2),
  );
  const [expert, setExpert] = useState(false);
  const [message, setMessage] = useState("");
  const [employees] = useDemoState<Employee[]>("employees", seed.employees);
  const [baseRevision, setBaseRevision] = useState(student.revision ?? 1);
  const locked = !!student.lock.ownerId && student.lock.ownerId !== "emp-1";
  const stale = baseRevision !== (student.revision ?? 1);
  const tabs = [
    "Basic Fields",
    "Advanced Fields",
    "Documents",
    "Advanced JSON",
  ];
  function reload() {
    const value = metadataFor(student);
    setDraft(value);
    setJson(JSON.stringify(value, null, 2));
    setBaseRevision(student.revision ?? 1);
    setMessage("Loaded current demo revision.");
  }
  function save() {
    let metadata = draft;
    if (tab === "Advanced JSON") {
      if (!expert) return;
      try {
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error("Expected a metadata object.");
        metadata = parsed;
      } catch (e) {
        setMessage(`Invalid JSON: ${(e as Error).message}`);
        return;
      }
    }
    const result = saveMetadataBatch(demoRepository, [
      { id: student.id, revision: baseRevision, metadata },
    ]);
    setMessage(result.message);
    if (result.ok) {
      const current = demoRepository
        .read("students")
        .find((s) => s.id === student.id)!;
      setBaseRevision(current.revision ?? 1);
      setDraft(metadataFor(current));
      setJson(JSON.stringify(metadataFor(current), null, 2));
    }
  }
  function field(path: string) {
    const definition = scalarFields.find((f) => f.metadata_path === path)!;
    const value = getPath(draft, path);
    const id = `metadata-${path}`;
    const update = (text: string) => {
      const next = structuredClone(draft);
      try {
        setPath(next, path, parseScalar(path, text));
        setMessage("");
      } catch {
        setPath(next, path, text);
      }
      setDraft(next);
      setJson(JSON.stringify(next, null, 2));
    };
    return (
      <label key={path} htmlFor={id}>
        {fieldLabel(path)}
        <small>{path}</small>
        {definition.field_type === "boolean" ? (
          <select
            id={id}
            disabled={locked || stale}
            value={value === null ? "" : value ? "yes" : "no"}
            onChange={(e) => update(e.target.value)}
          >
            <option value="">Not specified</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        ) : definition.field_type === "textarea" ? (
          <textarea
            id={id}
            disabled={locked || stale}
            value={String(value ?? "")}
            onChange={(e) => update(e.target.value)}
          />
        ) : (
          <>
            <input
              id={id}
              disabled={locked || stale}
              type={
                definition.field_type === "date"
                  ? "date"
                  : path.endsWith("email")
                    ? "email"
                    : "text"
              }
              list={choices[path] ? `${id}-choices` : undefined}
              value={String(value ?? "")}
              onChange={(e) => update(e.target.value)}
            />
            {choices[path] && (
              <datalist id={`${id}-choices`}>
                {choices[path].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </datalist>
            )}
          </>
        )}
      </label>
    );
  }
  const advanced = scalarFields.filter(
    (f) => !basicPaths.includes(f.metadata_path),
  );
  const groups = [...new Set(advanced.map((f) => groupFor(f.metadata_path)))];
  return (
    <section className="metadata-editor desktop-card">
      <header>
        <div>
          <h2>Student metadata — {student.code}</h2>
          <p className="desktop-muted">
            Desktop schema 1.1 · Revision {student.revision ?? 1} · 141
            canonical definitions · Empty fields mean not specified.
          </p>
        </div>
        <button className="desktop-button" onClick={reload}>
          Reload current revision
        </button>
      </header>
      <div className={`desktop-notice ${locked || stale ? "warning" : ""}`}>
        {locked
          ? `Read-only: demo lock held by ${employees.find((e) => e.id === student.lock.ownerId)?.name ?? student.lock.ownerId}.`
          : stale
            ? "This record changed while you were editing (412). Reload and reconcile your draft."
            : "Demo editor: optimistic revisions and lock cues are simulated. Server authentication, permissions, leases and durable backups are not connected."}
      </div>
      <div
        role="tablist"
        aria-label="Student metadata tabs"
        className="desktop-tabs"
      >
        {tabs.map((name, i) => (
          <button
            key={name}
            id={`metadata-tab-${i}`}
            role="tab"
            aria-selected={tab === name}
            aria-controls={`metadata-panel-${i}`}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 3
                      : (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                setTab(tabs[next]);
                document.getElementById(`metadata-tab-${next}`)?.focus();
              }
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`metadata-panel-${tabs.indexOf(tab)}`}
        aria-labelledby={`metadata-tab-${tabs.indexOf(tab)}`}
      >
        {tab === "Basic Fields" && (
          <div className="desktop-form fields">{basicPaths.map(field)}</div>
        )}
        {tab === "Advanced Fields" && (
          <div>
            {groups.map((g) => (
              <details className="metadata-group" key={g} open>
                <summary>{g}</summary>
                <div className="desktop-form fields">
                  {advanced
                    .filter((f) => groupFor(f.metadata_path) === g)
                    .map((f) => field(f.metadata_path))}
                </div>
              </details>
            ))}
          </div>
        )}
        {tab === "Documents" && <StudentDocuments student={student} />}
        {tab === "Advanced JSON" && (
          <div className="desktop-form">
            <p>
              Expert tool for the same canonical metadata. IDs, schema,
              revision, timestamps, types and document references are validated.
              File metadata is read-only. JSON cannot grant permissions or
              bypass locks.
            </p>
            <label className="inline-label">
              <input
                type="checkbox"
                checked={expert}
                disabled={locked || stale}
                onChange={(e) => setExpert(e.target.checked)}
              />
              Enable expert demo editing
            </label>
            <textarea
              aria-label="Advanced JSON metadata"
              className="json-editor"
              readOnly={!expert || locked || stale}
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
          </div>
        )}
      </div>
      <footer className="desktop-toolbar">
        <p role="status" className="desktop-error">
          {message}
        </p>
        <button
          className="desktop-button primary"
          disabled={
            locked ||
            stale ||
            tab === "Documents" ||
            (tab === "Advanced JSON" && !expert)
          }
          onClick={save}
        >
          Save demo metadata
        </button>
      </footer>
    </section>
  );
}
