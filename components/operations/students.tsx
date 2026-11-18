"use client";
import { PaginatedTable } from "./table";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  LockKeyhole,
  LockOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Student, StudentStatus } from "@/lib/operations/types";

import {
  APP_STATUSES,
  trimName,
  initials,
  Pill,
  Avatar,
  Field,
  Panel,
  Empty,
} from "./shared";
import type { OperationsContext } from "./workspace";
export function StudentDetails(ctx: OperationsContext, s: Student) {
  const {
    tab,
    setTab,
    fieldGroups,
    router,
    applications,
    tasks,
    employees,
    documents,
    activity,
    employee,
    uni,
    isLockedOther,
    editStudent,
    lockStudent,
    notify,
    canonicalFields,
    canonicalDocs,
    rowButton,
  } = ctx;
  const editable = !isLockedOther(s);
  const docs = documents.filter((d) => d.studentId === s.id);
  const studentTasks = tasks.filter((t) => t.studentId === s.id);
  const studentApps = applications.filter((a) => a.studentId === s.id);
  const docReady = docs.filter((d) => d.status === "Verified").length;
  return (
    <div className="detail-area">
      <button className="link-back" onClick={() => router.push("/students")}>
        <ArrowLeft size={15} /> All students
      </button>
      <div className="detail-heading">
        <div>
          <div className="title-line">
            <h1>{trimName(s)}</h1>
            <Pill>{s.status}</Pill>
          </div>
          <div className="detail-sub">
            {s.code} · {s.nationality} · {s.email}
          </div>
        </div>
        <span className="avatar avatar-large">{initials(trimName(s))}</span>
      </div>
      <div className={`lock-banner ${s.lock.ownerId ? "lock-active" : ""}`}>
        <LockKeyhole size={18} />
        <div>
          <strong>
            {s.lock.ownerId
              ? `Editing lock held by ${employee(s.lock.ownerId)}`
              : "Student available for editing"}
          </strong>
          <p>
            {s.lock.ownerId
              ? `Last heartbeat: ${s.lock.heartbeat ?? "Unknown"} · Demonstration only`
              : "Acquire a lock before beginning an application session. Server leases will enforce this in Connected Mode."}
          </p>
        </div>
        <button
          className="btn btn-light"
          onClick={() => lockStudent(s.id)}
          disabled={isLockedOther(s)}
        >
          {s.lock.ownerId ? "Release my lock" : "Acquire lock"}
        </button>
      </div>
      <div className="detail-grid">
        <div>
          <nav className="tabs" aria-label="Student details tabs">
            {[
              "Basic Fields",
              "Advanced Fields",
              "Documents",
              "Applications",
              "Assigned Tasks",
              "Activity History",
            ].map((k) => (
              <button
                key={k}
                className={tab === k ? "active" : ""}
                onClick={() => setTab(k)}
              >
                {k}
              </button>
            ))}
          </nav>
          {tab === "Basic Fields" && (
            <Panel
              title="Basic information"
              sub="Editable demonstration fields; actual required-field policy will be configured later."
            >
              <div className="fields-grid">
                <Field label="First name">
                  <input
                    value={s.firstName}
                    onChange={(e) =>
                      editStudent(s.id, { firstName: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={s.lastName}
                    onChange={(e) =>
                      editStudent(s.id, { lastName: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={s.email}
                    onChange={(e) =>
                      editStudent(s.id, { email: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={s.phone}
                    onChange={(e) =>
                      editStudent(s.id, { phone: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Nationality">
                  <input
                    value={s.nationality}
                    onChange={(e) =>
                      editStudent(s.id, { nationality: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Assigned employee">
                  <select
                    value={s.assignedTo ?? ""}
                    onChange={(e) =>
                      editStudent(s.id, { assignedTo: e.target.value || null })
                    }
                    disabled={!editable}
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
                </Field>
                <Field label="Application stage">
                  <select
                    value={s.status}
                    onChange={(e) =>
                      editStudent(s.id, {
                        status: e.target.value as StudentStatus,
                      })
                    }
                    disabled={!editable}
                  >
                    {APP_STATUSES.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Consent on file (tri-state)">
                  <select
                    value={
                      s.consent === null ? "unknown" : s.consent ? "yes" : "no"
                    }
                    onChange={(e) =>
                      editStudent(s.id, {
                        consent:
                          e.target.value === "unknown"
                            ? null
                            : e.target.value === "yes",
                      })
                    }
                    disabled={!editable}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              </div>
              <div className="section-divider" />
              <h3>Canonical fields reference</h3>
              <p className="hint">
                This reference displays the real Desktop field definitions;
                values are placeholders until the server adapter is implemented.
              </p>
              <div className="field-reference">
                {canonicalFields.slice(0, 16).map((f) => (
                  <div key={f.canonical_name}>
                    <span>{f.canonical_name.replace(/_/g, " ")}</span>
                    <small>
                      {f.metadata_path} · {f.field_type}
                    </small>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === "Advanced Fields" && (
            <Panel
              title="Canonical metadata catalog"
              sub={`${canonicalFields.length} verified UAIS Desktop field definitions — schema 1.0`}
            >
              <div className="field-reference">
                {fieldGroups.map((g) => (
                  <details className="metadata-group" key={g}>
                    <summary>
                      {g.replace(/_/g, " ")}{" "}
                      <small>
                        {canonicalFields.filter((f) => f.section === g).length}{" "}
                        fields
                      </small>
                    </summary>
                    {canonicalFields
                      .filter((f) => f.section === g)
                      .map((f) => (
                        <div className="metadata-line" key={f.canonical_name}>
                          <strong>{f.canonical_name.replace(/_/g, " ")}</strong>
                          <span>{f.metadata_path}</span>
                          <Pill tone="neutral">{f.field_type}</Pill>
                        </div>
                      ))}
                  </details>
                ))}
              </div>
              <p className="hint">
                The editor is read-only until canonical serialization and
                validation are connected by Codex.
              </p>
            </Panel>
          )}
          {tab === "Documents" && (
            <Panel
              title="Document checklist"
              sub={`${canonicalDocs.length} document categories defined by the UAIS Desktop schema.`}
            >
              <PaginatedTable>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Reviewer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canonicalDocs.map((category) => {
                      const doc = docs.find((d) => d.category === category);
                      return (
                        <tr key={category}>
                          <td>{category.replace(/_/g, " ")}</td>
                          <td>
                            <Pill>{doc?.status ?? "Missing"}</Pill>
                          </td>
                          <td>{doc ? employee(doc.reviewer) : "—"}</td>
                          <td>
                            {rowButton("Details", () =>
                              notify(
                                `Document category: ${category}. Real upload/review requires secure API.`,
                              ),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PaginatedTable>
            </Panel>
          )}
          {tab === "Applications" && (
            <Panel
              title="Applications"
              sub="Submission status must be verified by authorized staff."
            >
              <PaginatedTable>
                <table>
                  <thead>
                    <tr>
                      <th>University</th>
                      <th>Program</th>
                      <th>Intake</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentApps.map((a) => (
                      <tr key={a.id}>
                        <td>{uni(a.universityId)?.name}</td>
                        <td>{a.program}</td>
                        <td>{a.intake}</td>
                        <td>
                          <Pill>{a.status}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PaginatedTable>
              {!studentApps.length && (
                <Empty text="No applications for this student." />
              )}
            </Panel>
          )}
          {tab === "Assigned Tasks" && (
            <Panel title="Student task queue">
              <PaginatedTable>
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Owner</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentTasks.map((t) => (
                      <tr key={t.id}>
                        <td>{t.title}</td>
                        <td>{employee(t.employeeId)}</td>
                        <td>
                          <Pill>{t.priority}</Pill>
                        </td>
                        <td>
                          <Pill>{t.status}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PaginatedTable>
              {!studentTasks.length && (
                <Empty text="No tasks assigned for this student." />
              )}
            </Panel>
          )}
          {tab === "Activity History" && (
            <Panel title="Student activity">
              <div className="timeline">
                {activity
                  .filter((a) => a.object === s.code)
                  .map((a) => (
                    <div key={a.id}>
                      <b>{a.by}</b> {a.action}
                      <small>{a.when}</small>
                    </div>
                  ))}
              </div>
            </Panel>
          )}
        </div>
        <aside className="aside-stack">
          <Panel
            title="Application readiness"
            sub="Illustrative checks; not approval to submit."
          >
            <div className="progress-line">
              <div
                style={{
                  width: `${Math.round((s.documentsVerified / s.documentsRequired) * 100)}%`,
                }}
              />
            </div>
            <div className="readiness-stat">
              <strong>
                {Math.round((s.documentsVerified / s.documentsRequired) * 100)}%
              </strong>
              <span>
                {s.documentsVerified}/{s.documentsRequired} required demo
                documents verified
              </span>
            </div>
            <ul className="check-list">
              <li>
                <CheckCircle2 size={15} />
                Student profile exists
              </li>
              <li>
                <CheckCircle2 size={15} />
                Assigned officer: {employee(s.assignedTo)}
              </li>
              <li>
                <CircleAlert size={15} />
                Document requirements need formal policies
              </li>
            </ul>
            <button
              className="btn btn-light wide"
              onClick={() => setTab("Documents")}
            >
              Review documents <ArrowRight size={15} />
            </button>
          </Panel>
          <Panel title="Case summary">
            <div className="kv">
              <span>Active applications</span>
              <strong>{studentApps.length}</strong>
            </div>
            <div className="kv">
              <span>Open tasks</span>
              <strong>
                {studentTasks.filter((x) => x.status !== "Done").length}
              </strong>
            </div>
            <div className="kv">
              <span>Verified documents</span>
              <strong>{docReady}</strong>
            </div>
            <div className="kv">
              <span>Last updated</span>
              <strong>{s.updated}</strong>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
export function StudentsFeature(ctx: OperationsContext) {
  const { searchStudents } = ctx;
  const {
    setTab,
    viewColumns,
    selection,
    setSelection,
    beginWork,
    router,
    detail,
    students,
    employees,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    setModal,
    isLockedOther,
    editStudent,
  } = ctx;
  if (detail) return StudentDetails(ctx, detail);
  return (
    <>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Search students"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, ID or email…"
          />
        </label>
        <select
          aria-label="Filter by application status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          {APP_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          className="btn btn-light"
          onClick={() => setModal("student-columns")}
        >
          <SlidersHorizontal size={15} />
          Columns
        </button>
        <span className="toolbar-count">{searchStudents.length} students</span>
      </div>
      {selection.length > 0 && (
        <div className="selection-bar">
          <strong>{selection.length} selected</strong>
          <button
            className="btn btn-light btn-sm"
            onClick={() => setModal("bulk-assignment")}
          >
            Assign employee
          </button>
          <button
            className="btn btn-light btn-sm"
            onClick={() => {
              setSelection([]);
            }}
          >
            Clear selection
          </button>
        </div>
      )}
      <Panel
        title="Student directory"
        sub="Cells support controlled demo updates; locks prevent conflicting edits in this session."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select visible students"
                    checked={
                      searchStudents.length > 0 &&
                      searchStudents.every((s) => selection.includes(s.id))
                    }
                    onChange={(e) =>
                      setSelection(
                        e.target.checked ? searchStudents.map((s) => s.id) : [],
                      )
                    }
                  />
                </th>
                <th>Student</th>
                <th>Student ID</th>
                {viewColumns.email && <th>Email</th>}
                {viewColumns.nationality && <th>Nationality</th>}
                {viewColumns.assignment && <th>Assigned to</th>}
                {viewColumns.status && <th>Status</th>}
                {viewColumns.documents && <th>Documents</th>}
                {viewColumns.lock && <th>Lock</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${trimName(s)}`}
                      checked={selection.includes(s.id)}
                      onChange={(e) =>
                        setSelection((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((x) => x !== s.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="inline-profile"
                      onClick={() => {
                        router.push(`/students/${s.id}`);
                        setTab("Basic Fields");
                      }}
                    >
                      <Avatar name={trimName(s)} size="sm" />
                      <strong>{trimName(s)}</strong>
                    </button>
                  </td>
                  <td className="mono">{s.code}</td>
                  {viewColumns.email && <td className="muted">{s.email}</td>}
                  {viewColumns.nationality && <td>{s.nationality}</td>}
                  {viewColumns.assignment && (
                    <td>
                      <select
                        className="table-select"
                        aria-label={`Assign ${trimName(s)}`}
                        value={s.assignedTo ?? ""}
                        disabled={isLockedOther(s)}
                        onChange={(e) =>
                          editStudent(s.id, {
                            assignedTo: e.target.value || null,
                          })
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
                    </td>
                  )}
                  {viewColumns.status && (
                    <td>
                      <select
                        className="table-select"
                        aria-label={`${trimName(s)} application status`}
                        value={s.status}
                        disabled={isLockedOther(s)}
                        onChange={(e) =>
                          editStudent(s.id, {
                            status: e.target.value as StudentStatus,
                          })
                        }
                      >
                        {APP_STATUSES.map((st) => (
                          <option key={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  {viewColumns.documents && (
                    <td>
                      <div className="mini-meter">
                        <span
                          style={{
                            width: `${(s.documentsVerified / s.documentsRequired) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        {s.documentsVerified}/{s.documentsRequired}
                      </small>
                    </td>
                  )}
                  {viewColumns.lock && (
                    <td>
                      {s.lock.ownerId ? (
                        <Pill>Locked</Pill>
                      ) : (
                        <Pill tone="good">Available</Pill>
                      )}
                    </td>
                  )}
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-light btn-sm"
                        onClick={() => beginWork(s)}
                      >
                        {s.lock.ownerId ? (
                          <Eye size={14} />
                        ) : (
                          <LockOpen size={14} />
                        )}{" "}
                        {s.lock.ownerId ? "View" : "Work"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
        {!searchStudents.length && (
          <Empty text="No students match your filters." />
        )}
        <div className="panel-bottom">
          <span>
            Showing {searchStudents.length} of {students.length} fictional
            students
          </span>
          <span>Server collaboration planned · no real data connected</span>
        </div>
      </Panel>
    </>
  );
}
