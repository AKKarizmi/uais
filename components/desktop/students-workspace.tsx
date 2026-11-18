"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopFrame } from "./frame";
import { Spreadsheet, type CellChange, type GridColumn } from "./spreadsheet";
import { MetadataEditor, StudentDocuments } from "./metadata-editor";
import { ImportDialog } from "./import-dialog";
import { useDemoState } from "@/components/operations/demo-state";
import { Modal } from "@/components/operations/shared";
import * as seed from "@/lib/operations/mock";
import type { Student, Employee } from "@/lib/operations/types";
import { demoRepository } from "@/lib/operations/service";
import {
  basicPaths,
  fieldLabel,
  getPath,
  groupFor,
  metadataFor,
  parseScalar,
  saveMetadataBatch,
  scalarFields,
  setPath,
  studentDisplayName,
  updateStudentWorkflow,
} from "@/lib/desktop/metadata";
import { downloadWorkbook, studentWorkbook } from "@/lib/desktop/spreadsheets";
import { newStudent } from "@/lib/desktop/imports";

export function StudentsWorkspace({ studentId }: { studentId?: string }) {
  const [students, setStudents] = useDemoState<Student[]>(
    "students",
    seed.students,
  );
  const [employees] = useDemoState<Employee[]>("employees", seed.employees);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seed.students[0]?.id ?? "");
  const [modal, setModal] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportPaths, setExportPaths] = useState(
    scalarFields.map((f) => f.metadata_path),
  );
  const router = useRouter();
  const selected = students.find((s) => s.id === (studentId ?? selectedId));
  const rows = students.filter((s) =>
    `${s.code} ${studentDisplayName(s)} ${s.firstName} ${s.lastName} ${s.email} ${getPath(metadataFor(s), "passport.number") ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const defaults = [
    "id",
    "name",
    "contact.email",
    "passport.number",
    "education.highest_degree",
  ];
  const columns: GridColumn<Student>[] = [
    { key: "id", label: "Student ID", width: 175, value: (s) => s.code },
    {
      key: "name",
      label: "Name",
      width: 170,
      value: (s) => studentDisplayName(s),
    },
    ...scalarFields.map((f) => ({
      key: f.metadata_path,
      label:
        f.metadata_path === "passport.number"
          ? "Passport"
          : fieldLabel(f.metadata_path),
      width: 190,
      editable: true,
      value: (s: Student) => getPath(metadataFor(s), f.metadata_path),
    })),
  ];
  const presets: Record<string, string[]> = {
    "Basic fields": ["id", "name", ...basicPaths],
  };
  scalarFields.forEach((f) => {
    const g = groupFor(f.metadata_path);
    presets[g] ??= ["id", "name"];
    presets[g].push(f.metadata_path);
  });
  function commit(changes: CellChange<Student>[]) {
    try {
      const map = new Map<
        string,
        { id: string; revision: number; metadata: Record<string, unknown> }
      >();
      for (const c of changes) {
        if (["id", "name"].includes(c.key))
          throw new Error(
            "Identity summary columns are read-only; edit First name / Last name / Full name canonical fields.",
          );
        let item = map.get(c.row.id);
        if (!item) {
          item = {
            id: c.row.id,
            revision: c.row.revision ?? 1,
            metadata: metadataFor(c.row),
          };
          map.set(c.row.id, item);
        }
        setPath(item.metadata, c.key, parseScalar(c.key, c.text));
      }
      return saveMetadataBatch(demoRepository, [...map.values()]);
    } catch (e) {
      return {
        ok: false,
        message: `${(e as Error).message} No cells changed.`,
      };
    }
  }
  function lock() {
    if (!selected) return;
    if (selected.lock.ownerId && selected.lock.ownerId !== "emp-1") {
      setMessage("Another demo employee holds this lock (409).");
      return;
    }
    setStudents(
      students.map((s) =>
        s.id === selected.id
          ? {
              ...s,
              lock: s.lock.ownerId
                ? { ownerId: null, acquiredAt: null, heartbeat: null }
                : {
                    ownerId: "emp-1",
                    acquiredAt: new Date().toISOString(),
                    heartbeat: "just now",
                  },
            }
          : s,
      ),
    );
  }
  const locked = !!selected?.lock.ownerId && selected.lock.ownerId !== "emp-1";
  const info = selected && (
    <>
      <h2>{studentDisplayName(selected)}</h2>
      <dl className="student-summary">
        <dt>Student ID</dt>
        <dd>{selected.code}</dd>
        <dt>Email</dt>
        <dd>{selected.email || "Not specified"}</dd>
        <dt>Nationality</dt>
        <dd>{selected.nationality || "Not specified"}</dd>
        <dt>Passport</dt>
        <dd>
          {String(
            getPath(metadataFor(selected), "passport.number") ??
              "Not specified",
          )}
        </dd>
        <dt>Highest degree</dt>
        <dd>{selected.degree || "Not specified"}</dd>
        <dt>Revision</dt>
        <dd>{selected.revision ?? 1}</dd>
        <dt>Lock</dt>
        <dd>
          {selected.lock.ownerId
            ? `Held by ${employees.find((e) => e.id === selected.lock.ownerId)?.name ?? selected.lock.ownerId} (demo)`
            : "Available (demo)"}
        </dd>
      </dl>
      <div className="desktop-toolbar">
        <button className="desktop-button" onClick={lock} disabled={locked}>
          {selected.lock.ownerId ? "Release my demo lock" : "Acquire demo lock"}
        </button>
        <Link
          className="desktop-button primary"
          href={`/students/${selected.id}`}
        >
          Open metadata
        </Link>
      </div>
      <label className="desktop-assignment">
        Assigned employee
        <select
          disabled={locked}
          value={selected.assignedTo ?? ""}
          onChange={(e) =>
            setMessage(
              updateStudentWorkflow(
                demoRepository,
                selected.id,
                selected.revision ?? 1,
                { assignedTo: e.target.value || null },
              ).message,
            )
          }
        >
          <option value="">Unassigned</option>
          {employees
            .filter((e) => e.active)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
      </label>
      <label className="desktop-assignment">
        Consent on file (Web workflow)
        <select
          disabled={locked}
          value={
            selected.consent === null ? "" : selected.consent ? "yes" : "no"
          }
          onChange={(e) =>
            setMessage(
              updateStudentWorkflow(
                demoRepository,
                selected.id,
                selected.revision ?? 1,
                {
                  consent:
                    e.target.value === "" ? null : e.target.value === "yes",
                },
              ).message,
            )
          }
        >
          <option value="">Not specified</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      <label className="desktop-assignment">
        Application stage
        <select
          disabled={locked}
          value={selected.status}
          onChange={(e) =>
            setMessage(
              updateStudentWorkflow(
                demoRepository,
                selected.id,
                selected.revision ?? 1,
                { status: e.target.value as Student["status"] },
              ).message,
            )
          }
        >
          {[
            "Lead",
            "Preparing",
            "Internal Review",
            "Submitted",
            "Decision Received",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
    </>
  );
  return (
    <DesktopFrame
      title={studentId ? "Student metadata" : "Students"}
      subtitle="Reliable student metadata, document folders, and revision-ready records."
    >
      {studentId ? (
        selected ? (
          <>
            <Link className="desktop-button" href="/students">
              ← All students
            </Link>
            <MetadataEditor key={selected.id} student={selected} />
            <div className="desktop-card">
              {info}
              <h3>Web operations</h3>
              <div className="desktop-toolbar">
                <Link className="desktop-button" href="/applications">
                  Applications
                </Link>
                <Link className="desktop-button" href="/tasks">
                  Assigned tasks
                </Link>
                <Link className="desktop-button" href="/activity">
                  Activity history
                </Link>
              </div>
              <p>
                Linked applications:{" "}
                {
                  demoRepository
                    .read("applications")
                    .filter((a) => a.studentId === selected.id).length
                }{" "}
                · Assigned tasks:{" "}
                {
                  demoRepository
                    .read("tasks")
                    .filter((t) => t.studentId === selected.id).length
                }
              </p>
              <ul>
                {demoRepository
                  .read("applications")
                  .filter((a) => a.studentId === selected.id)
                  .map((a) => (
                    <li key={a.id}>
                      <Link
                        className="underline"
                        href={`/applications?record=${a.id}`}
                      >
                        {a.program} · {a.status} · {a.id}
                      </Link>
                    </li>
                  ))}
              </ul>
              <ul>
                {demoRepository
                  .read("tasks")
                  .filter((t) => t.studentId === selected.id)
                  .map((t) => (
                    <li key={t.id}>
                      {t.title} · {t.status} ·{" "}
                      {employees.find((e) => e.id === t.employeeId)?.name ??
                        "Unassigned"}
                    </li>
                  ))}
              </ul>
            </div>
          </>
        ) : (
          <p>
            Student not found. <Link href="/students">Return to students</Link>
          </p>
        )
      ) : (
        <>
          <div className="desktop-toolbar">
            <input
              className="desktop-search"
              aria-label="Search students"
              placeholder="Search students…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="desktop-button primary"
              onClick={() => {
                setName("");
                setModal("add");
              }}
            >
              Add Student
            </button>
            <button
              className="desktop-button"
              disabled={!selected}
              onClick={() => router.push(`/students/${selected!.id}`)}
            >
              Edit Metadata
            </button>
            <button
              className="desktop-button"
              disabled={!selected}
              onClick={() => setModal("record")}
            >
              Record / Folder Info
            </button>
            <button
              className="desktop-button success"
              onClick={() => setModal("import")}
            >
              Import Excel
            </button>
            <button
              className="desktop-button"
              onClick={() => setModal("export")}
            >
              Export Excel
            </button>
            <button
              className="desktop-button"
              onClick={() => {
                setQuery("");
                setMessage(
                  `Demo index refreshed: ${students.length} records. Desktop/server indexes were not modified.`,
                );
              }}
            >
              Rebuild / Refresh Index
            </button>
            <button
              className="desktop-button danger"
              disabled={!selected || locked}
              onClick={() => setModal("delete")}
            >
              Delete
            </button>
          </div>
          <div className="students-split">
            <Spreadsheet
              label="Student spreadsheet"
              rows={rows}
              columns={columns}
              defaults={defaults}
              presets={presets}
              onSelect={(s) => setSelectedId(s.id)}
              onOpen={(s) => router.push(`/students/${s.id}`)}
              onCommit={commit}
              initialSelected={selectedId}
              isReadonly={(s) => !!s.lock.ownerId && s.lock.ownerId !== "emp-1"}
            />
            <aside
              className="student-sidepanel"
              aria-label="Selected student details"
            >
              {selected ? (
                <>
                  <section className="desktop-card">{info}</section>
                  <StudentDocuments student={selected} compact />
                </>
              ) : (
                <div className="desktop-card">Select a student</div>
              )}
            </aside>
          </div>
        </>
      )}
      <p role="status">{message}</p>
      {modal === "import" && (
        <ImportDialog
          kind="students"
          onClose={() => setModal("")}
          notify={setMessage}
        />
      )}
      {modal === "add" && (
        <Modal
          title="Add fictional student"
          onClose={() => setModal("")}
          foot={
            <button
              className="desktop-button primary"
              disabled={!name.trim()}
              onClick={() => {
                const code = `STU-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
                const student = newStudent(code, name.trim());
                setStudents([...students, student]);
                setSelectedId(student.id);
                setModal("");
                setMessage(
                  `${code} created in memory. Imported Desktop IDs are never regenerated.`,
                );
              }}
            >
              Add demo student
            </button>
          }
        >
          <label className="desktop-form">
            First name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <p>
            New demo records use Desktop's STU-XXXXXXXX format. Complete the
            remaining metadata in the four-tab editor.
          </p>
        </Modal>
      )}
      {modal === "record" && selected && (
        <Modal
          title="Record and folder information"
          onClose={() => setModal("")}
        >
          <dl className="student-summary">
            <dt>Student ID</dt>
            <dd>{selected.code}</dd>
            <dt>Schema</dt>
            <dd>1.1</dd>
            <dt>Revision</dt>
            <dd>{selected.revision ?? 1}</dd>
            <dt>Storage</dt>
            <dd>
              Memory-only demo. No local Desktop record directory is connected.
            </dd>
            <dt>Document references</dt>
            <dd>
              37 exact canonical directories. Folder access requires Desktop or
              an authenticated file service.
            </dd>
          </dl>
        </Modal>
      )}
      {modal === "delete" && selected && (
        <Modal
          title={`Delete ${selected.code}?`}
          onClose={() => setModal("")}
          foot={
            <>
              <button className="desktop-button" onClick={() => setModal("")}>
                Cancel
              </button>
              <button
                className="desktop-button danger"
                onClick={() => {
                  const current = demoRepository
                    .read("students")
                    .find((s) => s.id === selected.id);
                  if (
                    current?.lock.ownerId &&
                    current.lock.ownerId !== "emp-1"
                  ) {
                    setMessage("Delete blocked by demo lock (409).");
                    setModal("");
                    return;
                  }
                  setStudents(students.filter((s) => s.id !== selected.id));
                  demoRepository.replace(
                    "applications",
                    demoRepository
                      .read("applications")
                      .filter((r) => r.studentId !== selected.id),
                  );
                  demoRepository.replace(
                    "documents",
                    demoRepository
                      .read("documents")
                      .filter((r) => r.studentId !== selected.id),
                  );
                  demoRepository.replace(
                    "tasks",
                    demoRepository
                      .read("tasks")
                      .map((t) =>
                        t.studentId === selected.id
                          ? { ...t, studentId: null }
                          : t,
                      ),
                  );
                  setSelectedId(
                    students.find((s) => s.id !== selected.id)?.id ?? "",
                  );
                  setModal("");
                  setMessage(
                    "Fictional record and linked document/application metadata deleted. Tasks retained without a student link.",
                  );
                }}
              >
                Confirm demo deletion
              </button>
            </>
          }
        >
          <p>
            Remove this fictional student, linked application and document
            metadata? Tasks will retain their content without the student link.
            No Desktop files are touched.
          </p>
        </Modal>
      )}
      {modal === "export" && (
        <Modal
          title="Export students to Excel"
          onClose={() => setModal("")}
          foot={
            <button
              className="desktop-button primary"
              disabled={busy || !exportPaths.length}
              onClick={async () => {
                setBusy(true);
                try {
                  downloadWorkbook(
                    "uais-students-fictional.xlsx",
                    await studentWorkbook(rows, exportPaths),
                  );
                  setModal("");
                  setMessage(
                    "Excel exported: Students, Field Guide, Read Me. Current search and configured scalar columns included.",
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Generating…" : "Download fictional workbook"}
            </button>
          }
        >
          <p>
            {rows.length} records matching current search. Full export has 104
            scalar fields; files and paths are excluded.
          </p>
          <button
            className="desktop-button"
            onClick={() =>
              setExportPaths(scalarFields.map((f) => f.metadata_path))
            }
          >
            All scalar fields
          </button>
          <button
            className="desktop-button"
            onClick={() => setExportPaths(basicPaths)}
          >
            Basic fields
          </button>
          <div className="export-columns">
            {scalarFields.map((f) => (
              <label key={f.metadata_path}>
                <input
                  type="checkbox"
                  checked={exportPaths.includes(f.metadata_path)}
                  onChange={(e) =>
                    setExportPaths(
                      e.target.checked
                        ? [...exportPaths, f.metadata_path]
                        : exportPaths.filter((p) => p !== f.metadata_path),
                    )
                  }
                />
                {f.canonical_name}
              </label>
            ))}
          </div>
        </Modal>
      )}
    </DesktopFrame>
  );
}
