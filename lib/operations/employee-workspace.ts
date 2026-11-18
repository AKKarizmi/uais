import type { Collections } from "./service";
import type { Priority, Student } from "./types";
import { DEMO_DATE } from "./mock";

export const priorityRank: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};
const day = 86400000;
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
// Existing mock due dates are display labels. Unknown/TBD labels are unscheduled.
export function demoDate(value: string): number | null {
  const match =
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/.exec(
      value,
    );
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match && !iso) return null;
  const year = Number(match?.[3] ?? iso![1]);
  const month = match ? months.indexOf(match[1]) : Number(iso![2]) - 1;
  const date = Number(match?.[2] ?? iso![3]);
  const result = Date.UTC(year, month, date);
  const check = new Date(result);
  return check.getUTCFullYear() === year &&
    check.getUTCMonth() === month &&
    check.getUTCDate() === date
    ? result
    : null;
}
export type EmployeeData = Pick<
  Collections,
  "students" | "tasks" | "documents" | "employees" | "applications"
>;
export type WorkQueueItem = {
  id: string;
  kind:
    | "Overdue task"
    | "Upcoming deadline"
    | "Incomplete documents"
    | "Application follow-up";
  title: string;
  detail: string;
  href: string;
  rank: number;
  due: number;
};
export function studentReadiness(student: Student): string {
  if (student.documentsRequired <= 0) return "Requirements not set";
  return student.documentsVerified >= student.documentsRequired
    ? "Documents complete"
    : "Needs documents";
}
export function selectEmployeeWorkspace(
  data: EmployeeData,
  employeeId: string,
  snapshot = DEMO_DATE,
) {
  const employee =
    data.employees.find((e) => e.id === employeeId && e.active) ?? null;
  const today = demoDate(snapshot) ?? demoDate(DEMO_DATE)!;
  const students = employee
    ? data.students.filter((s) => s.assignedTo === employee.id)
    : [];
  const studentIds = new Set(students.map((s) => s.id));
  const tasks = employee
    ? data.tasks.filter((t) => t.employeeId === employee.id)
    : [];
  const documents = data.documents.filter((d) => studentIds.has(d.studentId));
  const applications = employee
    ? data.applications.filter(
        (a) => a.owner === employee.id || studentIds.has(a.studentId),
      )
    : [];
  const pendingTasks = tasks.filter((t) => t.status !== "Done");
  const awaitingReview = documents.filter(
    (d) => d.status === "Uploaded" || d.status === "Pending Review",
  );
  const queue: WorkQueueItem[] = [];
  let upcoming = 0;
  for (const task of pendingTasks) {
    const due = demoDate(task.due);
    if (due === null) continue;
    const overdue = due < today;
    if (!overdue && due > today + 7 * day) continue;
    if (!overdue) upcoming++;
    queue.push({
      id: `task-${task.id}`,
      kind: overdue ? "Overdue task" : "Upcoming deadline",
      title: task.title,
      detail: `${task.due} · ${task.priority}`,
      href: "/tasks",
      rank: overdue ? 0 : 1,
      due,
    });
  }
  for (const application of applications.filter(
    (a) => a.status !== "Decision Received",
  )) {
    const due = demoDate(application.deadline);
    if (due !== null && due >= today && due <= today + 7 * day) {
      upcoming++;
      queue.push({
        id: `deadline-${application.id}`,
        kind: "Upcoming deadline",
        title: application.program,
        detail: `Application deadline · ${application.deadline}`,
        href: "/applications",
        rank: 1,
        due,
      });
    }
    if (
      application.status === "Internal Review" ||
      application.status === "Submitted"
    )
      queue.push({
        id: `followup-${application.id}`,
        kind: "Application follow-up",
        title: application.program,
        detail: `${application.status} · ${application.id}`,
        href: "/applications",
        rank: 3,
        due: due ?? Infinity,
      });
  }
  for (const student of students.filter(
    (s) => s.documentsVerified < s.documentsRequired,
  ))
    queue.push({
      id: `documents-${student.id}`,
      kind: "Incomplete documents",
      title: `${student.firstName} ${student.lastName}`,
      detail: `${student.documentsVerified}/${student.documentsRequired} required demo documents verified`,
      href: `/students/${student.id}`,
      rank: 2,
      due: Infinity,
    });
  queue.sort(
    (a, b) => a.rank - b.rank || a.due - b.due || a.id.localeCompare(b.id),
  );
  return {
    employee,
    students,
    tasks,
    documents,
    applications,
    pendingTasks,
    awaitingReview,
    upcoming,
    queue,
    today,
  };
}
export function studentPriority(
  studentId: string,
  tasks: Collections["tasks"],
): Priority | null {
  return (
    tasks
      .filter((t) => t.studentId === studentId && t.status !== "Done")
      .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])[0]
      ?.priority ?? null
  );
}
