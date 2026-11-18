import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createApiTransport,
  createDemoRepository,
} from "../lib/operations/service";
import fields from "../lib/operations/canonical-fields.json";
import docs from "../lib/operations/canonical-documents.json";

describe("canonical desktop definitions", () => {
  it("preserves unique names, paths and document mappings", () => {
    expect(fields.fields).toHaveLength(141);
    const names = new Set(fields.fields.map((f) => f.canonical_name));
    expect(names.size).toBe(141);
    expect(new Set(fields.fields.map((f) => f.metadata_path)).size).toBe(141);
    expect(Object.keys(docs.documents)).toHaveLength(37);
    Object.values(docs.documents).forEach((d) =>
      expect(names.has(d.legacy_canonical)).toBe(true),
    );
  });
});
describe("mock repository", () => {
  it("keeps changes in its own fictional session", () => {
    const first = createDemoRepository(),
      second = createDemoRepository();
    first.replace(
      "tasks",
      first.read("tasks").map((t) => ({ ...t, status: "Done" as const })),
    );
    expect(first.read("tasks").every((t) => t.status === "Done")).toBe(true);
    expect(second.read("tasks").some((t) => t.status !== "Done")).toBe(true);
  });
});
describe("API transport foundation", () => {
  it.each([401, 403, 409, 412, 500])(
    "exposes status %s without treating a failure as a save",
    async (status) => {
      const request = createApiTransport(
        vi.fn().mockResolvedValue(new Response("{}", { status })),
      );
      await expect(
        request("/api/v1/students/1", {
          method: "PATCH",
          etag: '"2"',
          body: {},
        }),
      ).rejects.toMatchObject({ status });
    },
  );
  it("sends revision preconditions and same-origin session credentials", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response('{"revision":3}', { headers: { ETag: '"3"' } }),
      );
    const result = await createApiTransport(fetcher)("/api/v1/students/1", {
      method: "PATCH",
      etag: '"2"',
      body: { first_name: "Demo" },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/students/1",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.objectContaining({ "If-Match": '"2"' }),
      }),
    );
    expect(result.etag).toBe('"3"');
  });
  it("does not request an external API", async () => {
    const fetcher = vi.fn();
    await expect(
      createApiTransport(fetcher)("https://example.test/api/v1/students"),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    expect(new ApiError(403).message).toContain("denied");
  });
});
