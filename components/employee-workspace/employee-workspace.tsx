"use client";
import { WorkSection } from "@/components/operations/work-section";
import { useDemoContext } from "@/components/demo/use-demo-context";
import { demoContextStore } from "@/lib/demo/context";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import {
  WorkspacePreview,
  previewDisclaimer,
} from "@/components/dashboard/workspace-preview";
import {
  KpiCard,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useDemoState } from "@/components/operations/demo-state";
import { PaginatedTable } from "@/components/operations/table";
import * as seed from "@/lib/operations/mock";
import {
  demoRepository,
  updateDemoTaskStatus,
  reviewDemoDocument,
  TASK_STATUSES,
  DOCUMENT_STATUSES,
} from "@/lib/operations/service";
import {
  demoDate,
  selectEmployeeWorkspace,
  studentReadiness,
  studentPriority,
  priorityRank,
} from "@/lib/operations/employee-workspace";
import type {
  Student,
  TaskStatus,
  DocumentStatus,
} from "@/lib/operations/types";
import type { PreviewState } from "@/lib/mock/operations";

type SortKey =
  | "code"
  | "nationality"
  | "applications"
  | "name"
  | "status"
  | "documents"
  | "readiness"
  | "priority"
  | "updated";
const studentName = (s?: Student) =>
  s ? `${s.firstName} ${s.lastName}` : "Student unavailable";
export default function EmployeeWorkspace({
  initialEmployeeId,
}: {
  initialEmployeeId?: string;
}) {
  const context = useDemoContext();
  const employeeId = initialEmployeeId ?? context.employeeId;
  const setEmployeeId = (id: string) => demoContextStore.selectEmployee(id);
  const [state, setState] = useState<PreviewState>("ready");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: "name",
    ascending: true,
  });
  const [notice, setNotice] = useState("");
  const [students] = useDemoState("students", seed.students);
  const [employees] = useDemoState("employees", seed.employees);
  const [tasks] = useDemoState("tasks", seed.tasks);
  const [documents] = useDemoState("documents", seed.documents);
  const [applications] = useDemoState("applications", seed.applications);
  const model = selectEmployeeWorkspace(
    { students, employees, tasks, documents, applications },
    employeeId,
  );
  const selected = model.employee;
  const findStudent = (id: string | null) => students.find((s) => s.id === id);
  const priority = (s: Student) => studentPriority(s.id, tasks);
  function sortValue(s: Student, key: SortKey): string | number {
    if (key === "applications")
      return applications.filter((a) => a.studentId === s.id).length;
    if (key === "name") return studentName(s);
    if (key === "documents")
      return s.documentsRequired > 0
        ? s.documentsVerified / s.documentsRequired
        : -1;
    if (key === "readiness") return studentReadiness(s);
    if (key === "priority") {
      const p = priority(s);
      return p ? priorityRank[p] : 0;
    }
    if (key === "updated") return demoDate(s.updated) ?? -Infinity;
    return s[key];
  }
  const filtered = model.students
    .filter((s) =>
      `${s.code} ${studentName(s)} ${s.status} ${priority(s) ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const av = sortValue(a, sort.key),
        bv = sortValue(b, sort.key);
      const comparison =
        typeof av === "number" && typeof bv === "number"
          ? av === bv
            ? 0
            : av < bv
              ? -1
              : 1
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return (
        (comparison || a.id.localeCompare(b.id)) * (sort.ascending ? 1 : -1)
      );
    });
  const changeTask = (id: string, status: TaskStatus) =>
    setNotice(
      updateDemoTaskStatus(demoRepository, id, status, employeeId).message,
    );
  const changeDocument = (id: string, status: DocumentStatus) =>
    setNotice(
      reviewDemoDocument(demoRepository, id, status, employeeId).message,
    );
  const sortHeading = (key: SortKey, label: string) => (
    <th
      scope="col"
      aria-sort={
        sort.key === key
          ? sort.ascending
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        className="inline-flex min-h-9 items-center gap-1 text-left"
        onClick={() =>
          setSort({ key, ascending: sort.key === key ? !sort.ascending : true })
        }
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span aria-hidden="true">
          {sort.key === key ? (sort.ascending ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
  return (
    <AppShell state={state} setState={setState}>
      {() => (
        <div className="dashboard-content employee-workspace">
          <div className="page-eyebrow">
            <span>YOUR FICTIONAL WORKDAY</span>
            <WorkspacePreview />
          </div>
          <div className="page-heading">
            <div>
              <h1>Employee Workspace</h1>
              <p>
                Assigned cases, next actions, and document reviews in one place.
              </p>
            </div>
            <Button variant="outline" render={<Link href="/admin" />}>
              Admin Dashboard
              <ArrowUpRight />
            </Button>
          </div>
          <Card className="mb-5">
            <CardContent className="space-y-3">
              <label className="flex flex-wrap items-center gap-3 font-medium">
                Preview workspace as:
                <select
                  className="min-h-10 max-w-full rounded-md border bg-background px-3"
                  aria-label="Preview workspace as"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setQuery("");
                    setNotice("");
                  }}
                >
                  <option value="">Choose a fictional employee</option>
                  {employeeId &&
                    !employees.some((e) => e.id === employeeId && e.active) && (
                      <option value={employeeId}>
                        Unavailable demo employee
                      </option>
                    )}
                  {employees
                    .filter((e) => e.active)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} · {e.team}
                      </option>
                    ))}
                </select>
              </label>
              <p className="text-sm text-muted-foreground">
                {previewDisclaimer} This selection filters fictional data; it is
                not an account switch.
              </p>
              <p className="text-xs text-muted-foreground">
                Demo snapshot: November 14, 2026 (UTC date). Upcoming means
                within 7 days of this fixed snapshot. Readiness describes
                document counts only, not eligibility or permission to submit.
              </p>
            </CardContent>
          </Card>
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-md border bg-background p-3 text-sm"
            >
              {notice}
            </p>
          )}
          {state === "loading" ? (
            <p role="status">Loading Employee Workspace preview…</p>
          ) : state === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Employee Workspace error preview</AlertTitle>
              <AlertDescription>
                No network request failed.{" "}
                <Button variant="outline" onClick={() => setState("ready")}>
                  Restore workspace
                </Button>
              </AlertDescription>
            </Alert>
          ) : state === "empty" ? (
            <EmptyState
              title="No demo work in this preview"
              description="Restore the workspace using the profile menu."
            />
          ) : (
            <>
              {!selected && (
                <Alert>
                  <AlertTitle>
                    {employeeId
                      ? "Demo employee unavailable"
                      : "Choose a demo employee"}
                  </AlertTitle>
                  <AlertDescription>
                    {employeeId
                      ? "This ID is missing or inactive. No employee data is shown."
                      : "Choose an active fictional employee to see assigned work."}
                  </AlertDescription>
                </Alert>
              )}
              <section
                aria-label="Employee summary"
                className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <KpiCard
                  label="My Assigned Students"
                  value={model.students.length}
                  note="Assigned in shared demo state"
                  icon={GraduationCap}
                />
                <KpiCard
                  label="My Pending Tasks"
                  value={model.pendingTasks.length}
                  note="All statuses except Done"
                  icon={ClipboardList}
                />
                <KpiCard
                  label="Documents Awaiting Review"
                  value={model.awaitingReview.length}
                  note="Uploaded or pending review"
                  icon={FileCheck2}
                />
                <KpiCard
                  label="Upcoming Deadlines"
                  value={model.upcoming}
                  note="Tasks and applications · next 7 days"
                  icon={CalendarDays}
                />
              </section>
              <div className="grid gap-5">
                <WorkSection
                  title="Daily Work Queue"
                  description="Overdue work first, then upcoming deadlines, missing documents, and application follow-ups."
                >
                  {model.queue.length ? (
                    <ul className="divide-y">
                      {model.queue.map((item) => (
                        <li key={item.id} className="py-3">
                          <Link
                            className="flex min-h-11 items-center justify-between gap-3 rounded-md hover:bg-muted focus-visible:outline-2"
                            href={item.href}
                          >
                            <div>
                              <span className="text-xs text-muted-foreground">
                                {item.kind}
                              </span>
                              <p className="font-medium">{item.title}</p>
                              <small className="text-muted-foreground">
                                {item.detail}
                              </small>
                            </div>
                            <ArrowUpRight
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      title="No queued work"
                      description="No matching actions for this demo employee."
                    />
                  )}
                </WorkSection>
                <WorkSection
                  title="My Students"
                  description="Shared student profiles assigned to the selected fictional employee."
                >
                  <label className="mb-4 flex items-center gap-2 rounded-md border bg-background px-3">
                    <Search className="size-4" aria-hidden="true" />
                    <input
                      className="min-h-10 w-full bg-transparent outline-none"
                      aria-label="Search my students"
                      placeholder="Search by ID, name, status, or priority"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <PaginatedTable key={`${employeeId}-${query}`}>
                    <table>
                      <caption className="sr-only">
                        Students assigned to{" "}
                        {selected?.name ?? "no selected employee"}
                      </caption>
                      <thead>
                        <tr>
                          {sortHeading("code", "Student ID")}
                          {sortHeading("name", "Student name")}
                          {sortHeading("nationality", "Nationality")}
                          {sortHeading("status", "Application status")}
                          {sortHeading(
                            "applications",
                            "University applications",
                          )}
                          {sortHeading("documents", "Document completeness")}
                          {sortHeading("readiness", "Readiness")}
                          {sortHeading("priority", "Priority")}
                          {sortHeading("updated", "Last updated")}
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => (
                          <tr key={s.id}>
                            <td>{s.code}</td>
                            <td>{studentName(s)}</td>
                            <td>{s.nationality}</td>
                            <td>
                              <StatusBadge>{s.status}</StatusBadge>
                            </td>
                            <td>
                              {
                                applications.filter((a) => a.studentId === s.id)
                                  .length
                              }
                            </td>
                            <td>
                              {s.documentsVerified}/{s.documentsRequired}{" "}
                              verified
                            </td>
                            <td>{studentReadiness(s)}</td>
                            <td>{priority(s) ?? "No pending task"}</td>
                            <td>{s.updated}</td>
                            <td>
                              <Button
                                variant="outline"
                                size="sm"
                                render={
                                  <Link
                                    href={`/students/${s.id}`}
                                    aria-label={`Open student ${studentName(s)}`}
                                  />
                                }
                              >
                                Open Student
                                <ArrowUpRight />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PaginatedTable>
                </WorkSection>
                <WorkSection
                  id="my-tasks"
                  title="My Tasks"
                  description="Changes update the same fictional tasks used by the existing Tasks screen."
                  action={
                    <Link href="/tasks" className="text-sm underline">
                      All tasks
                    </Link>
                  }
                >
                  <PaginatedTable key={employeeId}>
                    <table>
                      <caption className="sr-only">
                        Tasks assigned to{" "}
                        {selected?.name ?? "no selected employee"}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Task title</th>
                          <th scope="col">Linked student</th>
                          <th scope="col">Priority</th>
                          <th scope="col">Due date</th>
                          <th scope="col">Status</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.tasks.map((t) => (
                          <tr key={t.id}>
                            <td>{t.title}</td>
                            <td>
                              {t.studentId
                                ? studentName(findStudent(t.studentId))
                                : "Administration"}
                            </td>
                            <td>{t.priority}</td>
                            <td>{t.due}</td>
                            <td>
                              <select
                                className="min-h-9 rounded border bg-background px-2"
                                aria-label={`Status of ${t.title}`}
                                value={t.status}
                                onChange={(e) =>
                                  changeTask(t.id, e.target.value as TaskStatus)
                                }
                              >
                                {TASK_STATUSES.map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={t.status === "Done"}
                                  aria-label={`Mark complete: ${t.title}`}
                                  onClick={() => changeTask(t.id, "Done")}
                                >
                                  {t.status === "Done"
                                    ? "Completed"
                                    : "Mark complete"}
                                </Button>
                                {t.studentId && findStudent(t.studentId) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    render={
                                      <Link
                                        href={`/students/${t.studentId}`}
                                        aria-label={`View student for ${t.title}`}
                                      />
                                    }
                                  >
                                    View student
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PaginatedTable>
                </WorkSection>
                <WorkSection
                  title="Document Reviews"
                  description="Documents for assigned students. Demo locks are workflow cues, not backend validation."
                  action={
                    <Link href="/documents" className="text-sm underline">
                      Open Documents screen
                    </Link>
                  }
                >
                  <PaginatedTable key={employeeId}>
                    <table>
                      <caption className="sr-only">
                        Documents for students assigned to{" "}
                        {selected?.name ?? "no selected employee"}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Student</th>
                          <th scope="col">Document</th>
                          <th scope="col">Status</th>
                          <th scope="col">Requirement</th>
                          <th scope="col">Last update</th>
                          <th scope="col">Review metadata</th>
                          <th scope="col">Lock cue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.documents.map((d) => {
                          const student = findStudent(d.studentId),
                            locked = Boolean(
                              student?.lock.ownerId &&
                              student.lock.ownerId !== employeeId,
                            ),
                            owner = employees.find(
                              (e) => e.id === student?.lock.ownerId,
                            );
                          return (
                            <tr key={d.id}>
                              <td>
                                <Link
                                  className="underline"
                                  href={`/students/${d.studentId}`}
                                >
                                  {studentName(student)}
                                </Link>
                              </td>
                              <td>{d.category.replaceAll("_", " ")}</td>
                              <td>
                                <StatusBadge>{d.status}</StatusBadge>
                              </td>
                              <td>{d.required ? "Required" : "Optional"}</td>
                              <td>{d.updated}</td>
                              <td>
                                <select
                                  className="min-h-9 rounded border bg-background px-2 disabled:opacity-50"
                                  aria-label={`Review ${d.id}`}
                                  disabled={locked || !selected}
                                  value={d.status}
                                  onChange={(e) =>
                                    changeDocument(
                                      d.id,
                                      e.target.value as DocumentStatus,
                                    )
                                  }
                                >
                                  {DOCUMENT_STATUSES.map((status) => (
                                    <option key={status}>{status}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                {locked
                                  ? `Read-only: demo lock held by ${owner?.name ?? "another employee"}`
                                  : student?.lock.ownerId
                                    ? "Held by selected demo employee"
                                    : "No demo lock"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </PaginatedTable>
                </WorkSection>
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
