// Navigation preferences and sample selection only. Never an authenticated session.
export type PreviewRole = "admin" | "manager" | "employee";
export const roleWorkspaces: Record<PreviewRole, string> = {
  admin: "/admin",
  manager: "/manager-workspace",
  employee: "/employee-workspace",
};
export const roleDescriptions: Record<PreviewRole, string> = {
  admin:
    "Manage the organization, employees, students, universities, and operations.",
  manager:
    "Oversee admissions teams, assignments, applications, and deadlines.",
  employee:
    "Manage assigned students, documents, tasks, and daily admissions work.",
};
export type DemoContext = {
  mode: "demo";
  role: PreviewRole | null;
  employeeId: string;
  sample: { studentId: string; expiresAt: number } | null;
};
const initial: DemoContext = {
  mode: "demo",
  role: null,
  employeeId: "emp-2",
  sample: null,
};
export function createDemoContextStore() {
  let state: DemoContext = initial;
  const listeners = new Set<() => void>();
  const update = (next: DemoContext) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    enter: (role: PreviewRole) => update({ ...state, role, sample: null }),
    selectEmployee: (employeeId: string) => update({ ...state, employeeId }),
    exploreSample: (studentId: string, now = Date.now()) =>
      update({
        ...state,
        role: null,
        sample: { studentId, expiresAt: now + 10 * 60 * 1000 },
      }),
    exit: () => update({ ...initial }),
  };
}
export const demoContextStore = createDemoContextStore();
export function activeSample(context: DemoContext, now = Date.now()) {
  return context.sample && context.sample.expiresAt > now
    ? context.sample.studentId
    : null;
}
export function roleForPath(
  path: string,
  fallback: PreviewRole | null,
): PreviewRole {
  if (path === "/admin") return "admin";
  if (path === "/manager-workspace") return "manager";
  if (path === "/employee-workspace") return "employee";
  return fallback ?? "admin";
}
