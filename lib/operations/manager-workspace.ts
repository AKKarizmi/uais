import type { Collections, DemoRepository, DemoActionResult } from "./service";
import { TASK_STATUSES } from "./service";
import { demoDate, upcomingDeadline } from "./employee-workspace";
import { DEMO_DATE } from "./mock";
import type { Task } from "./types";
type ManagerData = Pick<
  Collections,
  "students" | "employees" | "tasks" | "documents" | "applications"
>;
export function selectManagerWorkspace(
  data: ManagerData,
  team: string,
  employeeId = "all",
) {
  const teamMembers = data.employees.filter(
    (e) => e.active && (team === "all" || e.team === team),
  );
  const members = teamMembers.filter(
    (e) => employeeId === "all" || e.id === employeeId,
  );
  const ids = new Set(members.map((e) => e.id));
  const students = data.students.filter(
    (s) => s.assignedTo && ids.has(s.assignedTo),
  );
  const studentIds = new Set(students.map((s) => s.id));
  const tasks = data.tasks.filter((t) => ids.has(t.employeeId));
  const documents = data.documents.filter((d) => studentIds.has(d.studentId));
  const applications = data.applications.filter(
    (a) => ids.has(a.owner) || studentIds.has(a.studentId),
  );
  const today = demoDate(DEMO_DATE)!;
  const overdue = tasks.filter(
    (t) => t.status !== "Done" && (demoDate(t.due) ?? Infinity) < today,
  );
  const upcoming =
    tasks.filter((t) => t.status !== "Done" && upcomingDeadline(t.due, today))
      .length +
    applications.filter(
      (a) =>
        a.status !== "Decision Received" && upcomingDeadline(a.deadline, today),
    ).length;
  return {
    teamMembers,
    members,
    students,
    tasks,
    documents,
    applications,
    overdue,
    upcoming,
    activeApplications: applications.filter(
      (a) => a.status !== "Decision Received",
    ),
    awaitingReview: documents.filter(
      (d) => d.status === "Uploaded" || d.status === "Pending Review",
    ),
  };
}
export function saveDemoTask(
  repository: DemoRepository,
  patch: Partial<Task> & { id?: string },
): DemoActionResult {
  const existing = patch.id
    ? repository.read("tasks").find((t) => t.id === patch.id)
    : undefined;
  if (patch.id && !existing)
    return { ok: false, message: "Demo task not found." };
  const task: Task = {
    id: existing?.id ?? `tsk-${crypto.randomUUID()}`,
    title: patch.title ?? existing?.title ?? "",
    studentId:
      patch.studentId === undefined
        ? (existing?.studentId ?? null)
        : patch.studentId,
    employeeId: patch.employeeId ?? existing?.employeeId ?? "",
    priority: patch.priority ?? existing?.priority ?? "Medium",
    due: patch.due ?? existing?.due ?? "Not scheduled",
    status: patch.status ?? existing?.status ?? "To do",
    notes: existing?.notes ?? "",
  };
  if (!task.title.trim())
    return { ok: false, message: "Task title is required." };
  if (
    !repository
      .read("employees")
      .some((e) => e.id === task.employeeId && e.active)
  )
    return { ok: false, message: "Choose an active fictional employee." };
  if (
    task.studentId &&
    !repository.read("students").some((s) => s.id === task.studentId)
  )
    return { ok: false, message: "Choose an existing fictional student." };
  if (
    !["Low", "Medium", "High", "Urgent"].includes(task.priority) ||
    !TASK_STATUSES.includes(task.status)
  )
    return { ok: false, message: "Choose a valid priority and status." };
  if (task.due !== "Not scheduled" && demoDate(task.due) === null)
    return {
      ok: false,
      message: "Use a valid due date or leave it unscheduled.",
    };
  repository.replace(
    "tasks",
    existing
      ? repository.read("tasks").map((t) => (t.id === task.id ? task : t))
      : [task, ...repository.read("tasks")],
  );
  return {
    ok: true,
    message: existing
      ? "Demo task updated."
      : "Fictional task created. No assignment message was sent.",
  };
}
