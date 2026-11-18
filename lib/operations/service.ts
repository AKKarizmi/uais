import * as seed from "./mock";
import type {
  Student,
  University,
  Application,
  Task,
  Employee,
  Doc,
  Activity,
  TaskStatus,
  DocumentStatus,
} from "./types";

export type Collections = {
  students: Student[];
  universities: University[];
  applications: Application[];
  tasks: Task[];
  employees: Employee[];
  documents: Doc[];
  activity: Activity[];
};
export interface DemoRepository {
  readonly mode: "demo";
  read<K extends keyof Collections>(key: K): Collections[K];
  replace<K extends keyof Collections>(key: K, value: Collections[K]): void;
  subscribe(key: keyof Collections, listener: () => void): () => void;
}
export function createDemoRepository(): DemoRepository {
  const data: Collections = structuredClone({
    students: seed.students,
    universities: seed.universities,
    applications: seed.applications,
    tasks: seed.tasks,
    employees: seed.employees,
    documents: seed.documents,
    activity: seed.activity,
  });
  const listeners = new Map<keyof Collections, Set<() => void>>();
  return {
    mode: "demo",
    read: (key) => data[key],
    replace: (key, value) => {
      data[key] = value;
      listeners.get(key)?.forEach((listener) => listener());
    },
    subscribe(key, listener) {
      const collection = listeners.get(key) ?? new Set();
      listeners.set(key, collection);
      collection.add(listener);
      return () => {
        collection.delete(listener);
      };
    },
  };
}
export const demoRepository = createDemoRepository();

export type DemoActionResult = { ok: boolean; message: string };
export const TASK_STATUSES: readonly TaskStatus[] = [
  "To do",
  "In progress",
  "Blocked",
  "Done",
];
export const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  "Missing",
  "Uploaded",
  "Pending Review",
  "Verified",
  "Rejected",
];

// These are mock workflow checks, never authorization or server validation.
export function updateDemoTaskStatus(
  repository: DemoRepository,
  taskId: string,
  status: TaskStatus,
  employeeId?: string,
): DemoActionResult {
  const task = repository.read("tasks").find((t) => t.id === taskId);
  if (!TASK_STATUSES.includes(status) || !task)
    return { ok: false, message: "Demo task or status not found." };
  if (
    employeeId &&
    (!repository
      .read("employees")
      .some((e) => e.id === employeeId && e.active) ||
      task.employeeId !== employeeId)
  )
    return {
      ok: false,
      message: "Select the active demo employee assigned to this task.",
    };
  repository.replace(
    "tasks",
    repository
      .read("tasks")
      .map((t) => (t.id === taskId ? { ...t, status } : t)),
  );
  return {
    ok: true,
    message: `Demo task updated to ${status}. Changes last until refresh.`,
  };
}

export function reviewDemoDocument(
  repository: DemoRepository,
  documentId: string,
  status: DocumentStatus,
  employeeId: string,
): DemoActionResult {
  const doc = repository.read("documents").find((d) => d.id === documentId);
  const student = repository
    .read("students")
    .find((s) => s.id === doc?.studentId);
  if (!doc || !student || !DOCUMENT_STATUSES.includes(status))
    return {
      ok: false,
      message: "Demo document, student or status not found.",
    };
  if (
    !repository.read("employees").some((e) => e.id === employeeId && e.active)
  )
    return { ok: false, message: "Select an active demo employee." };
  if (student.lock.ownerId && student.lock.ownerId !== employeeId)
    return {
      ok: false,
      message:
        "Another demo employee holds this student lock. No review was changed.",
    };
  repository.replace(
    "documents",
    repository
      .read("documents")
      .map((d) =>
        d.id === documentId
          ? { ...d, status, reviewer: employeeId, updated: "Demo session" }
          : d,
      ),
  );
  if (doc.required) {
    const delta =
      Number(status === "Verified") - Number(doc.status === "Verified");
    repository.replace(
      "students",
      repository
        .read("students")
        .map((s) =>
          s.id === student.id
            ? {
                ...s,
                documentsVerified: Math.max(
                  0,
                  Math.min(s.documentsRequired, s.documentsVerified + delta),
                ),
              }
            : s,
        ),
    );
  }
  return {
    ok: true,
    message:
      "Demo document metadata updated. No file was uploaded or reviewed by a server.",
  };
}

export class ApiError extends Error {
  constructor(public status: number) {
    super(
      status === 409
        ? "Another session holds this record. Reload before editing."
        : status === 412
          ? "The record changed. Reload and reconcile your edits."
          : status === 401
            ? "Authentication required."
            : status === 403
              ? "The server denied this operation."
              : "The request failed.",
    );
  }
}
// Transport foundation only. DTOs and live wiring await an implemented OpenAPI contract.
// No environment flag can switch the demo UI into live mode.
export function createApiTransport(fetcher: typeof fetch = fetch) {
  return async function request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PATCH";
      body?: unknown;
      etag?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<{ data: T; etag: string | null }> {
    if (!path.startsWith("/api/v1/"))
      throw new Error("Expected a same-origin UAIS API path");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    if (options.etag) headers["If-Match"] = options.etag;
    const response = await fetcher(path, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
    if (!response.ok) throw new ApiError(response.status);
    return {
      data:
        response.status === 204
          ? (undefined as T)
          : ((await response.json()) as T),
      etag: response.headers.get("ETag"),
    };
  };
}
