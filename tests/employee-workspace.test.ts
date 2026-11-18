import { describe, expect, it, vi } from "vitest";
import {
  createDemoRepository,
  reviewDemoDocument,
  updateDemoTaskStatus,
} from "../lib/operations/service";
import {
  demoDate,
  selectEmployeeWorkspace,
} from "../lib/operations/employee-workspace";

function fixture() {
  const repository = createDemoRepository();
  const data = () => ({
    students: repository.read("students"),
    employees: repository.read("employees"),
    tasks: repository.read("tasks"),
    documents: repository.read("documents"),
    applications: repository.read("applications"),
  });
  return { repository, data };
}
describe("employee-specific workload from the shared repository", () => {
  it("filters all collections consistently without losing task assignments on other cases", () => {
    const { data } = fixture();
    const jamie = selectEmployeeWorkspace(data(), "emp-2");
    expect(jamie.students.map((s) => s.id)).toEqual(["stu-1", "stu-3"]);
    expect(jamie.tasks.map((t) => t.id)).toEqual(["tsk-3", "tsk-5"]);
    expect(jamie.pendingTasks).toHaveLength(1);
    expect(jamie.documents.map((d) => d.id)).toEqual([
      "doc-1",
      "doc-2",
      "doc-3",
      "doc-6",
    ]);
    expect(jamie.awaitingReview).toHaveLength(1);
    const sam = selectEmployeeWorkspace(data(), "emp-3");
    expect(sam.students.map((s) => s.id)).toEqual(["stu-2", "stu-6"]);
    expect(sam.tasks.map((t) => t.id)).toEqual(["tsk-2", "tsk-4"]);
    expect(sam.awaitingReview).toHaveLength(0);
  });
  it.each(["", "missing", "emp-5"])(
    "returns no data for empty, missing or inactive selection %s",
    (id) => {
      const { data } = fixture(),
        model = selectEmployeeWorkspace(data(), id);
      expect(model.employee).toBeNull();
      expect([
        model.students,
        model.tasks,
        model.documents,
        model.applications,
        model.queue,
      ]).toEqual([[], [], [], [], []]);
      expect(model.upcoming).toBe(0);
    },
  );
  it("prioritizes overdue work, excludes completed and unscheduled deadlines, and keeps links actionable", () => {
    const { data } = fixture(),
      model = selectEmployeeWorkspace(data(), "emp-2");
    expect(model.queue[0]).toMatchObject({
      kind: "Overdue task",
      title: "Confirm university requirements",
      href: "/tasks",
    });
    expect(
      model.queue.some((q) => q.title === "Check decision notification"),
    ).toBe(false);
    expect(model.queue.some((q) => q.kind === "Incomplete documents")).toBe(
      true,
    );
    expect(model.queue.some((q) => q.kind === "Application follow-up")).toBe(
      true,
    );
    expect(
      model.queue.every((q) =>
        /^\/(tasks|students\/|applications)/.test(q.href),
      ),
    ).toBe(true);
    const sam = selectEmployeeWorkspace(data(), "emp-3");
    expect(sam.upcoming).toBe(2);
    expect(demoDate("TBD")).toBeNull();
    expect(demoDate("Feb 31, 2026")).toBeNull();
  });
  it("recomputes metrics and queues immediately after shared task changes", () => {
    const { repository, data } = fixture(),
      listener = vi.fn();
    const unsubscribe = repository.subscribe("tasks", listener);
    expect(updateDemoTaskStatus(repository, "tsk-3", "Done", "emp-2").ok).toBe(
      true,
    );
    expect(listener).toHaveBeenCalledOnce();
    expect(selectEmployeeWorkspace(data(), "emp-2").pendingTasks).toHaveLength(
      0,
    );
    expect(
      selectEmployeeWorkspace(data(), "emp-2").queue.some(
        (q) => q.id === "task-tsk-3",
      ),
    ).toBe(false);
    expect(updateDemoTaskStatus(repository, "tsk-2", "Done", "emp-2").ok).toBe(
      false,
    );
    expect(repository.read("tasks").find((t) => t.id === "tsk-2")!.status).toBe(
      "To do",
    );
    unsubscribe();
  });
  it("rejects conflicting document locks and updates document completeness for the lock holder", () => {
    const { repository, data } = fixture();
    expect(
      reviewDemoDocument(repository, "doc-2", "Verified", "emp-1").ok,
    ).toBe(false);
    expect(
      repository.read("documents").find((d) => d.id === "doc-2")!.status,
    ).toBe("Pending Review");
    expect(
      reviewDemoDocument(repository, "doc-2", "Verified", "emp-2").ok,
    ).toBe(true);
    expect(
      selectEmployeeWorkspace(data(), "emp-2").awaitingReview,
    ).toHaveLength(0);
    expect(
      repository.read("students").find((s) => s.id === "stu-1")!
        .documentsVerified,
    ).toBe(4);
    reviewDemoDocument(repository, "doc-2", "Verified", "emp-2");
    expect(
      repository.read("students").find((s) => s.id === "stu-1")!
        .documentsVerified,
    ).toBe(4);
  });
});
