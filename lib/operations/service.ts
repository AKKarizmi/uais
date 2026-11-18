import * as seed from "./mock";
import type {
  Student,
  University,
  Application,
  Task,
  Employee,
  Doc,
  Activity,
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
  return {
    mode: "demo",
    read: (key) => data[key],
    replace: (key, value) => {
      data[key] = value;
    },
  };
}
export const demoRepository = createDemoRepository();

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
