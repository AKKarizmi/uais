"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Users,
  GraduationCap,
  Files,
  Clock3,
  FileCheck2,
  CalendarDays,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { WorkspacePreview } from "@/components/dashboard/workspace-preview";
import { KpiCard, StatusBadge } from "@/components/dashboard/shared";
import { WorkSection } from "@/components/operations/work-section";
import { PaginatedTable } from "@/components/operations/table";
import { useOperationalData } from "@/components/operations/use-operational-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  selectManagerWorkspace,
  saveDemoTask,
} from "@/lib/operations/manager-workspace";
import { demoRepository, TASK_STATUSES } from "@/lib/operations/service";
import { demoDate, studentPriority } from "@/lib/operations/employee-workspace";
import { demoContextStore } from "@/lib/demo/context";
import type { PreviewState } from "@/lib/mock/operations";
import type { Priority, TaskStatus } from "@/lib/operations/types";
export default function ManagerWorkspace() {
  const data = useOperationalData();
  const [state, setState] = useState<PreviewState>("ready"),
    [team, setTeam] = useState("all"),
    [employee, setEmployee] = useState("all");
  const [stage, setStage] = useState("all"),
    [priority, setPriority] = useState("all"),
    [notice, setNotice] = useState(""),
    [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(""),
    [assignee, setAssignee] = useState("emp-2"),
    [student, setStudent] = useState(""),
    [due, setDue] = useState("");
  const model = selectManagerWorkspace(data, team, employee);
  const studentName = (id: string | null) => {
    const s = data.students.find((s) => s.id === id);
    return s ? `${s.firstName} ${s.lastName}` : "Administration";
  };
  const update = (id: string, patch: Parameters<typeof saveDemoTask>[1]) =>
    setNotice(saveDemoTask(demoRepository, { ...patch, id }).message);
  const applications = model.applications.filter(
    (a) =>
      (stage === "all" || a.status === stage) &&
      (priority === "all" ||
        studentPriority(a.studentId, data.tasks) === priority),
  );
  return (
    <AppShell state={state} setState={setState}>
      {() => (
        <div className="dashboard-content employee-workspace">
          <div className="page-eyebrow">
            <span>FICTIONAL TEAM OPERATIONS</span>
            <WorkspacePreview />
          </div>
          <div className="page-heading">
            <div>
              <h1>Manager Workspace</h1>
              <p>
                Coordinate admissions work. These filters do not enforce
                permissions.
              </p>
            </div>
          </div>
          <p className="rounded-md border bg-background p-3 text-sm">
            Shared operational demo · fixed November 14, 2026 snapshot. The
            Admin Dashboard retains its separate approved snapshot.
          </p>
          <div className="flex flex-wrap gap-3">
            <label>
              Team{" "}
              <select
                className="min-h-10 rounded border bg-background px-2"
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  setEmployee("all");
                }}
              >
                <option value="all">All teams</option>
                {[
                  ...new Set(
                    data.employees.filter((e) => e.active).map((e) => e.team),
                  ),
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Employee{" "}
              <select
                className="min-h-10 rounded border bg-background px-2"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              >
                <option value="all">All team members</option>
                {model.teamMembers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {notice && (
            <p role="status" className="rounded border bg-background p-3">
              {notice}
            </p>
          )}
          {state === "loading" ? (
            <p role="status">Loading manager preview…</p>
          ) : state === "error" ? (
            <div role="alert">
              Manager error preview.{" "}
              <Button onClick={() => setState("ready")}>
                Restore workspace
              </Button>
            </div>
          ) : state === "empty" ? (
            <p>No team work in this preview.</p>
          ) : (
            <>
              <section
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                aria-label="Manager summary"
              >
                {[
                  {
                    label: "Team Members",
                    value: model.members.length,
                    icon: Users,
                  },
                  {
                    label: "Assigned Students",
                    value: model.students.length,
                    icon: GraduationCap,
                  },
                  {
                    label: "Active Applications",
                    value: model.activeApplications.length,
                    icon: Files,
                  },
                  {
                    label: "Overdue Tasks",
                    value: model.overdue.length,
                    icon: Clock3,
                  },
                  {
                    label: "Documents Awaiting Review",
                    value: model.awaitingReview.length,
                    icon: FileCheck2,
                  },
                  {
                    label: "Upcoming Deadlines",
                    value: model.upcoming,
                    icon: CalendarDays,
                  },
                ].map((k) => (
                  <KpiCard
                    key={k.label}
                    {...k}
                    note="Derived from current demo filters"
                  />
                ))}
              </section>
              <WorkSection
                id="team-overview"
                title="Team Overview"
                description="Select a fictional employee to inspect their workload. Presence is not working hours."
              >
                <PaginatedTable key={`${team}-${employee}`}>
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Employee",
                          "Team",
                          "Students",
                          "Open tasks",
                          "Overdue",
                          "Presence",
                          "Workload",
                          "Actions",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {model.members.map((e) => {
                        const students = data.students.filter(
                            (s) => s.assignedTo === e.id,
                          ),
                          tasks = data.tasks.filter(
                            (t) => t.employeeId === e.id && t.status !== "Done",
                          ),
                          overdue = tasks.filter(
                            (t) =>
                              (demoDate(t.due) ?? Infinity) <
                              demoDate("2026-11-14")!,
                          ).length;
                        return (
                          <tr key={e.id}>
                            <td>{e.name}</td>
                            <td>{e.team}</td>
                            <td>{students.length}</td>
                            <td>{tasks.length}</td>
                            <td>{overdue}</td>
                            <td>
                              {e.online ? "Online (demo)" : "Offline (demo)"}
                            </td>
                            <td>
                              {tasks.length} open · {students.length} cases
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEmployee(e.id)}
                                >
                                  View workload
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  render={
                                    <Link
                                      href="/employee-workspace"
                                      onClick={() =>
                                        demoContextStore.selectEmployee(e.id)
                                      }
                                    />
                                  }
                                >
                                  Open employee workspace
                                </Button>
                                <Link href="/students" className="underline">
                                  Students
                                </Link>
                                <Link href="/tasks" className="underline">
                                  Tasks
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PaginatedTable>
              </WorkSection>
              <WorkSection
                title="Applications Overview"
                description="Recorded UAIS staff stages, not live university updates."
              >
                <div className="mb-3 flex flex-wrap gap-3">
                  <label>
                    Application status{" "}
                    <select
                      className="min-h-9 rounded border bg-background"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {[
                        "Lead",
                        "Preparing",
                        "Internal Review",
                        "Submitted",
                        "Decision Received",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority{" "}
                    <select
                      className="min-h-9 rounded border bg-background"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="all">All priorities</option>
                      {["Low", "Medium", "High", "Urgent"].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <PaginatedTable
                  key={`${team}-${employee}-${stage}-${priority}`}
                >
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Student",
                          "University",
                          "Program",
                          "Stage",
                          "Assigned employee",
                          "Last update",
                          "Outstanding action",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <Link
                              className="underline"
                              href={`/students/${a.studentId}`}
                            >
                              {studentName(a.studentId)}
                            </Link>
                          </td>
                          <td>
                            {
                              data.universities.find(
                                (u) => u.id === a.universityId,
                              )?.name
                            }
                          </td>
                          <td>
                            <Link
                              className="underline"
                              href={`/applications?record=${a.id}`}
                            >
                              {a.program}
                            </Link>
                          </td>
                          <td>
                            <StatusBadge>{a.status}</StatusBadge>
                          </td>
                          <td>
                            {data.employees.find((e) => e.id === a.owner)?.name}
                          </td>
                          <td>{a.updated}</td>
                          <td>
                            <Link
                              className="underline"
                              href={`/applications?record=${a.id}`}
                            >
                              {a.status === "Internal Review"
                                ? "Follow up on staff review"
                                : "Review application record"}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PaginatedTable>
              </WorkSection>
              <WorkSection
                title="Team Tasks"
                description="Edit fictional assignments, priority, deadlines, and statuses in the shared repository."
                action={
                  <Button
                    onClick={() => {
                      setNotice("");
                      setCreating(true);
                    }}
                  >
                    Create task
                  </Button>
                }
              >
                <PaginatedTable key={`${team}-${employee}`}>
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Task",
                          "Student",
                          "Assign to",
                          "Priority",
                          "Deadline",
                          "Status",
                          "Action",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {model.tasks.map((t) => (
                        <tr key={t.id}>
                          <td>{t.title}</td>
                          <td>
                            {t.studentId ? (
                              <Link
                                href={`/students/${t.studentId}`}
                                className="underline"
                              >
                                {studentName(t.studentId)}
                              </Link>
                            ) : (
                              "Administration"
                            )}
                          </td>
                          <td>
                            <select
                              aria-label={`Assign ${t.title}`}
                              className="min-h-9 rounded border bg-background"
                              value={t.employeeId}
                              onChange={(e) =>
                                update(t.id, { employeeId: e.target.value })
                              }
                            >
                              {data.employees
                                .filter((e) => e.active)
                                .map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td>
                            <select
                              aria-label={`Priority of ${t.title}`}
                              className="min-h-9 rounded border bg-background"
                              value={t.priority}
                              onChange={(e) =>
                                update(t.id, {
                                  priority: e.target.value as Priority,
                                })
                              }
                            >
                              {["Low", "Medium", "High", "Urgent"].map((p) => (
                                <option key={p}>{p}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              aria-label={`Deadline of ${t.title}`}
                              type="date"
                              className="min-h-9 rounded border bg-background"
                              value={
                                demoDate(t.due) === null
                                  ? ""
                                  : new Date(demoDate(t.due)!)
                                      .toISOString()
                                      .slice(0, 10)
                              }
                              onChange={(e) =>
                                update(t.id, {
                                  due: e.target.value || "Not scheduled",
                                })
                              }
                            />
                          </td>
                          <td>
                            <select
                              aria-label={`Status of ${t.title}`}
                              className="min-h-9 rounded border bg-background"
                              value={t.status}
                              onChange={(e) =>
                                update(t.id, {
                                  status: e.target.value as TaskStatus,
                                })
                              }
                            >
                              {TASK_STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={t.status === "Done"}
                              onClick={() => update(t.id, { status: "Done" })}
                              aria-label={`Complete ${t.title}`}
                            >
                              Mark completed
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PaginatedTable>
              </WorkSection>
            </>
          )}
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogContent>
              <DialogTitle>Create fictional task</DialogTitle>
              <DialogDescription>
                No notification or server assignment is sent.
              </DialogDescription>
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = saveDemoTask(demoRepository, {
                    title,
                    employeeId: assignee,
                    studentId: student || null,
                    due: due || "Not scheduled",
                  });
                  setNotice(result.message);
                  if (result.ok) {
                    setCreating(false);
                    setTitle("");
                    setDue("");
                  }
                }}
              >
                <label>
                  Task title
                  <input
                    className="block min-h-10 w-full rounded border bg-background px-2"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Assign to
                  <select
                    className="block min-h-10 w-full rounded border bg-background"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  >
                    {data.employees
                      .filter((e) => e.active)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Linked student
                  <select
                    className="block min-h-10 w-full rounded border bg-background"
                    value={student}
                    onChange={(e) => setStudent(e.target.value)}
                  >
                    <option value="">Administration</option>
                    {data.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {studentName(s.id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Deadline
                  <input
                    className="block min-h-10 w-full rounded border bg-background"
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </label>
                <Button type="submit">Create demo task</Button>
                {notice && <p role="status">{notice}</p>}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </AppShell>
  );
}
