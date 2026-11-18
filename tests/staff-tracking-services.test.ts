import { describe, it, expect } from "vitest";
import {
  createDemoContextStore,
  activeSample,
  roleForPath,
} from "../lib/demo/context";
import { createDemoRepository } from "../lib/operations/service";
import {
  selectManagerWorkspace,
  saveDemoTask,
} from "../lib/operations/manager-workspace";
import {
  studentFacingResults,
  validateTrackingInput,
  applicationDisplay,
} from "../lib/operations/student-facing";
function fixture() {
  const repository = createDemoRepository();
  const data = () => ({
    students: repository.read("students"),
    employees: repository.read("employees"),
    tasks: repository.read("tasks"),
    documents: repository.read("documents"),
    applications: repository.read("applications"),
    universities: repository.read("universities"),
  });
  return { repository, data };
}
describe("centralized non-authenticated demo context", () => {
  it("holds role/employee navigation preferences, expires samples and clears on exit", () => {
    const store = createDemoContextStore();
    store.enter("manager");
    store.selectEmployee("emp-3");
    expect(store.getSnapshot()).toMatchObject({
      role: "manager",
      employeeId: "emp-3",
      mode: "demo",
    });
    expect(roleForPath("/tasks", store.getSnapshot().role)).toBe("manager");
    store.exploreSample("stu-1", 1000);
    expect(activeSample(store.getSnapshot(), 1001)).toBe("stu-1");
    expect(activeSample(store.getSnapshot(), 601000)).toBeNull();
    store.exit();
    expect(store.getSnapshot().sample).toBeNull();
    expect(store.getSnapshot().role).toBeNull();
    expect(store.getServerSnapshot().sample).toBeNull();
  });
});
describe("manager selectors and shared task edits", () => {
  it("derives team summaries, handles missing selection and updates assignments consistently", () => {
    const { repository, data } = fixture();
    const admissions = selectManagerWorkspace(data(), "Admissions");
    expect(admissions.members.map((e) => e.id)).toEqual(["emp-2", "emp-3"]);
    expect(admissions.students).toHaveLength(4);
    expect(admissions.tasks).toHaveLength(4);
    expect(admissions.overdue).toHaveLength(1);
    expect(selectManagerWorkspace(data(), "Missing").students).toHaveLength(0);
    expect(
      saveDemoTask(repository, {
        id: "tsk-3",
        employeeId: "emp-3",
        priority: "High",
        due: "2026-11-21",
        status: "In progress",
      }).ok,
    ).toBe(true);
    expect(
      selectManagerWorkspace(data(), "Admissions", "emp-2").tasks.some(
        (t) => t.id === "tsk-3",
      ),
    ).toBe(false);
    expect(
      repository.read("tasks").find((t) => t.id === "tsk-3"),
    ).toMatchObject({
      employeeId: "emp-3",
      priority: "High",
      due: "2026-11-21",
      status: "In progress",
    });
  });
  it("creates tasks with actual linked IDs and rejects invalid employees/dates without saving", () => {
    const { repository } = fixture();
    const count = repository.read("tasks").length;
    expect(
      saveDemoTask(repository, {
        title: "Fictional follow-up",
        employeeId: "emp-3",
        studentId: "stu-2",
        due: "2026-11-30",
      }).ok,
    ).toBe(true);
    expect(repository.read("tasks")).toHaveLength(count + 1);
    expect(
      saveDemoTask(repository, { title: "Invalid", employeeId: "missing" }).ok,
    ).toBe(false);
    expect(
      saveDemoTask(repository, { id: "tsk-2", due: "2026-02-31" }).ok,
    ).toBe(false);
    expect(repository.read("tasks")).toHaveLength(count + 1);
  });
});
describe("student-safe selectors", () => {
  it("validates syntax without looking up IDs or emails", () => {
    expect(validateTrackingInput("bad", "bad")).toMatchObject({
      code: expect.any(String),
      email: expect.any(String),
    });
    expect(
      validateTrackingInput("UAIS-STU-DEMO-9999", "unknown@example.test"),
    ).toEqual({ code: "", email: "" });
  });
  it("separates distinct universities from individual applications", () => {
    const { repository, data } = fixture();
    const apps = data().applications.filter((a) => a.studentId === "stu-1");
    repository.replace("applications", [
      ...data().applications,
      { ...apps[0], id: "second-program", program: "Other fictional program" },
    ]);
    const result = studentFacingResults(data(), "stu-1")!;
    expect(result.applicationCount).toBe(apps.length + 1);
    expect(result.universityCount).toBe(
      new Set(apps.map((a) => a.universityId)).size,
    );
    expect(result.personal).not.toHaveProperty("fields");
    expect(result.personal).not.toHaveProperty("lock");
    expect(result).not.toHaveProperty("tasks");
    expect(studentFacingResults(data(), "unknown")).toBeNull();
  });
  it("uses explicit per-student requirements, not all 37 categories", () => {
    const { data } = fixture();
    const result = studentFacingResults(data(), "stu-1")!;
    expect(result.documents).toHaveLength(37);
    expect(result.completeness).toEqual({ verified: 1, total: 3 });
    expect(result.counts).toMatchObject({
      available: 2,
      verified: 1,
      missingRequired: 1,
      pending: 1,
    });
    expect(
      result.documents.find((d) => d.category === "personal_photo")!.required,
    ).toBe(false);
    const provisional = studentFacingResults(
      data(),
      "stu-1",
      "program-sample",
    )!;
    expect(
      provisional.documents.find((d) => d.category === "english_certificate")!
        .required,
    ).toBe(true);
    expect(studentFacingResults(data(), "stu-6")!.completeness).toBeNull();
  });
  it("handles rejected documents and exposes honest metadata rather than invented files", () => {
    const { data } = fixture();
    const result = studentFacingResults(data(), "stu-2")!;
    const rejected = result.documents.find((d) => d.status === "Rejected")!;
    expect(rejected.next).toContain("Rejection details are not recorded");
    expect(result.counts.rejected).toBe(1);
    expect(rejected).not.toHaveProperty("downloadUrl");
  });
  it.each(["Rejected", "Withdrawn", "Conditional Offer"])(
    "does not present %s as a completed successful timeline",
    (status) => {
      expect(applicationDisplay(status).step).toBeNull();
      expect(applicationDisplay(status).label).toBe(status);
    },
  );
  it("does not invent an offer outcome for the existing generic decision stage", () => {
    expect(applicationDisplay("Decision Received").label).toContain(
      "outcome not provided",
    );
    expect(applicationDisplay("Internal Review").label).toContain("UAIS staff");
  });
});
