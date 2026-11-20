import { expect, it } from "vitest";
import { createDemoRepository } from "../lib/operations/service";
import {
  canonicalDocuments,
  canonicalFields,
  getPath,
  metadataFor,
  parseScalar,
  saveMetadataBatch,
  scalarFields,
  setPath,
  validateMetadata,
  updateStudentWorkflow,
} from "../lib/desktop/metadata";
import {
  previewStudentImport,
  previewUniversityImport,
} from "../lib/desktop/imports";
import {
  detectFamily,
  exportUniversityRows,
} from "../lib/desktop/universities";
import {
  literalCell,
  parseDelimited,
  readSpreadsheet,
  studentWorkbook,
} from "../lib/desktop/spreadsheets";
import { reportBundleHtml } from "../lib/operations/reports";

it("adapts existing fixtures to the actual Desktop paths without changing identity", () => {
  const student = createDemoRepository().read("students")[1],
    metadata = metadataFor(student);
  expect(canonicalFields).toHaveLength(141);
  expect(scalarFields).toHaveLength(104);
  expect(canonicalDocuments).toHaveLength(37);
  expect(metadata.student_id).toBe(student.code);
  expect(getPath(metadata, "identity.first_name")).toBe("Leo");
  expect(validateMetadata(metadata, student)).toEqual([]);
  canonicalFields.forEach((f) =>
    expect(getPath(metadata, f.metadata_path)).not.toBeUndefined(),
  );
});
it("retains nullable booleans and rejects invalid dates, emails and noncanonical paths", () => {
  const path = scalarFields.find(
    (f) => f.field_type === "boolean",
  )!.metadata_path;
  expect(parseScalar(path, "")).toBeNull();
  expect(parseScalar(path, "Yes")).toBe(true);
  expect(parseScalar(path, "No")).toBe(false);
  expect(() => parseScalar(path, "maybe")).toThrow();
  expect(() => parseScalar("identity.date_of_birth", "2025-02-29")).toThrow();
  expect(parseScalar("identity.date_of_birth", "2024-02-29")).toBe(
    "2024-02-29",
  );
  expect(() => parseScalar("contact.email", "bad")).toThrow();
  expect(() => setPath({}, "__proto__.polluted", true)).toThrow();
});
it("applies an entire batch or rejects every change for locks, invalid fields and stale revisions", () => {
  const repo = createDemoRepository(),
    [locked, editable] = repo.read("students");
  const metadata = metadataFor(editable);
  setPath(metadata, "identity.first_name", "Edited");
  const snapshot = JSON.stringify(repo.read("students"));
  expect(
    saveMetadataBatch(repo, [
      { id: editable.id, revision: 1, metadata },
      { id: locked.id, revision: 1, metadata: metadataFor(locked) },
    ]).message,
  ).toContain("409");
  expect(JSON.stringify(repo.read("students"))).toBe(snapshot);
  expect(
    saveMetadataBatch(repo, [{ id: editable.id, revision: 1, metadata }]).ok,
  ).toBe(true);
  expect(repo.read("students")[1]).toMatchObject({
    firstName: "Edited",
    revision: 2,
    code: editable.code,
  });
  expect(
    saveMetadataBatch(repo, [{ id: editable.id, revision: 1, metadata }])
      .message,
  ).toContain("412");
  expect(repo.read("activity")[0].action).toContain("revisions checked");
});
it("does not let Advanced JSON change an ID or impersonate a document upload", () => {
  const repo = createDemoRepository(),
    student = repo.read("students")[1],
    metadata = metadataFor(student);
  metadata.student_id = "STU-CHANGED1";
  setPath(metadata, "documents.passport.files", ["../passport.pdf"]);
  expect(validateMetadata(metadata, student).join(" ")).toMatch(/immutable/);
  expect(validateMetadata(metadata, student).join(" ")).toMatch(
    /read-only|Invalid canonical document/,
  );
});
it("preserves Desktop object sections and array relationships in expert JSON", () => {
  const student = createDemoRepository().read("students")[1],
    metadata = metadataFor(student);
  metadata.referees = { "0": {}, "1": {} };
  setPath(metadata, "education.history", {});
  const errors = validateMetadata(metadata, student).join(" ");
  expect(errors).toContain("referees must be an array");
  expect(errors).toContain("education.history must remain an array");
});
it("checks workflow assignment revisions and appends a demo audit event", () => {
  const repo = createDemoRepository();
  expect(
    updateStudentWorkflow(repo, "stu-1", 1, { assignedTo: "emp-3" }).message,
  ).toContain("409");
  expect(
    updateStudentWorkflow(repo, "stu-2", 1, { assignedTo: "emp-5" }).ok,
  ).toBe(false);
  expect(
    updateStudentWorkflow(repo, "stu-2", 1, {
      assignedTo: "emp-2",
      consent: null,
    }).ok,
  ).toBe(true);
  expect(repo.read("students")[1]).toMatchObject({
    revision: 2,
    assignedTo: "emp-2",
    consent: null,
  });
  expect(
    updateStudentWorkflow(repo, "stu-2", 1, { assignedTo: null }).message,
  ).toContain("412");
  expect(repo.read("activity")[0].action).toContain("workflow");
});
it("previews student imports with stable Desktop IDs and rejects stale or duplicate plans", () => {
  const repo = createDemoRepository();
  const rows = [
    {
      "Student ID": "STU-ABCD1234",
      first_name: "Fictional",
      last_name: "Applicant",
      email: "sample@example.test",
    },
  ];
  const plan = previewStudentImport(repo, rows);
  expect(repo.read("students")).toHaveLength(6);
  expect(plan.commit().ok).toBe(true);
  const added = repo.read("students").find((s) => s.code === "STU-ABCD1234")!;
  expect(added.id).toBe("STU-ABCD1234");
  expect(added.email).toBe("sample@example.test");
  expect(plan.commit().ok).toBe(false);
  expect(() =>
    previewStudentImport(createDemoRepository(), [rows[0], rows[0]]),
  ).toThrow(/Duplicate/);
  expect(() =>
    previewStudentImport(repo, [
      { "Student ID": added.code, Revision: "0", first_name: "Bad" },
    ]),
  ).toThrow(/Revision/);
});
it("detects only exact provider hosts/subdomains, never lookalikes", () => {
  expect(detectFamily("https://apply.dreamapply.com/form")).toBe("DreamApply");
  expect(detectFamily("https://notdreamapply.com")).toBe("Unclassified");
  expect(detectFamily("https://dreamapply.com.evil.test")).toBe("Unclassified");
  expect(detectFamily("javascript:alert(1)")).toBe("Unclassified");
});
it("imports multiple portals atomically, preserves manual family and blank optional values", () => {
  const repo = createDemoRepository();
  const rows: Record<string, string>[] = [
    {
      Name: "Fictional Institute",
      Portal: "https://a.dreamapply.com",
      Country: "Canada",
      Website: "https://example.test",
      "Portal Family": "Manual family",
    },
    {
      Name: "Fictional Institute",
      Portal: "https://unknown.example.test",
      Country: "",
      Website: "",
    },
  ];
  expect(previewUniversityImport(repo, rows).commit().ok).toBe(true);
  const u = repo
    .read("universities")
    .find((u) => u.name === "Fictional Institute")!;
  expect(u.country).toBe("Canada");
  expect(
    repo.read("portals").filter((p) => p.universityId === u.id),
  ).toHaveLength(2);
  const plan = previewUniversityImport(repo, [
    { Name: u.name, Portal: rows[0].Portal, Country: "", Website: "<CLEAR>" },
  ]);
  expect(plan.commit().ok).toBe(true);
  expect(repo.read("universities").find((x) => x.id === u.id)!.website).toBe(
    "",
  );
  expect(
    repo.read("portals").find((p) => p.url === rows[0].Portal)!.family,
  ).toBe("Manual family");
  expect(
    exportUniversityRows(
      repo.read("universities"),
      repo.read("portals"),
    ).filter((r) => r.Name === u.name),
  ).toHaveLength(2);
  expect(plan.commit().ok).toBe(false);
});
it("rejects duplicate university rows, invalid URLs and formulas before import", async () => {
  const repo = createDemoRepository();
  expect(() =>
    previewUniversityImport(repo, [
      { Name: "A", Portal: "javascript:alert(1)" },
    ]),
  ).toThrow(/HTTP/);
  expect(() =>
    previewUniversityImport(repo, [{ Name: "A" }, { Name: "A" }]),
  ).toThrow(/duplicate/);
  const fake = {
    size: 100,
    name: "test.csv",
    text: async () => "Name,Portal\r\n=HYPERLINK(1),https://example.test",
  } as File;
  await expect(readSpreadsheet(fake)).rejects.toThrow(/formula/);
  expect(parseDelimited('Name,Notes\r\n"A","line 1\nline 2"')[1]).toEqual([
    "A",
    "line 1\nline 2",
  ]);
});
it("exports a real three-sheet scalar workbook with guarded literal cells and original IDs", async () => {
  const { Workbook } = await import("exceljs");
  const repo = createDemoRepository();
  const student = { ...repo.read("students")[1], firstName: "=SUM(1,2)" };
  const buffer = await studentWorkbook([student]);
  const book = new Workbook();
  await book.xlsx.load(buffer);
  expect(book.worksheets.map((s) => s.name)).toEqual([
    "Students",
    "Field Guide",
    "Read Me",
  ]);
  const sheet = book.worksheets[0];
  expect(sheet.columnCount).toBe(107);
  expect(sheet.getCell("A2").value).toBe(student.code);
  const idx =
    scalarFields.findIndex((f) => f.canonical_name === "first_name") + 4;
  expect(sheet.getRow(2).getCell(idx).value).toBe("'=SUM(1,2)");
  expect(sheet.getRow(2).getCell(idx).formula).toBeUndefined();
  expect(literalCell(" @FORMULA")).toBe("' @FORMULA");
}, 15000);
it("generates offline escaped seven-tab reports with working tab navigation, search and sorting", () => {
  const names = [
    "Students",
    "Applications",
    "Tasks",
    "Documents",
    "Universities",
    "Employees",
    "Attendance",
  ];
  const data = Object.fromEntries(
    names.map((name) => [
      name,
      {
        columns: ["Name"],
        rows: [
          { Name: "Zulu" },
          { Name: "Alpha" },
          { Name: "<script>bad()</script>" },
        ],
      },
    ]),
  );
  const html = reportBundleHtml(data);
  expect(html).not.toContain("<script>bad()");
  expect(html).not.toMatch(/<script[^>]+src=/);
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  new Function(host.querySelector("script")!.textContent!)();
  const tabs = host.querySelectorAll<HTMLButtonElement>("[role=tab]");
  expect(tabs).toHaveLength(7);
  tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  const panel = host.querySelector<HTMLElement>("#panel-1")!;
  const input = panel.querySelector("input")!;
  input.value = "Zulu";
  input.dispatchEvent(new Event("input"));
  expect(panel.querySelector(".count")!.textContent).toBe("1 rows");
  panel.querySelector<HTMLButtonElement>("th button")!.click();
  expect(panel.querySelector("tbody tr")!.textContent).toBe(
    "<script>bad()</script>",
  );
  host.remove();
});
