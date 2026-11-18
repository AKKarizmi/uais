import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import EmployeeWorkspace from "../components/employee-workspace/employee-workspace";
import EmployeeRoute from "../app/employee-workspace/page";
import AdminDashboard from "../components/dashboard/admin-dashboard";
import OperationsWorkspace from "../components/operations/workspace";
import {
  WorkspacePreview,
  workspacePreviews,
  previewDisclaimer,
} from "../components/dashboard/workspace-preview";
import { mockOperationsService } from "../lib/mock/operations";
import { demoRepository } from "../lib/operations/service";
import * as seed from "../lib/operations/mock";

vi.mock("next/navigation", () => ({
  usePathname: () => "/employee-workspace",
  useRouter: () => ({ push: vi.fn() }),
}));
beforeEach(() => {
  demoRepository.replace("students", structuredClone(seed.students));
  demoRepository.replace("tasks", structuredClone(seed.tasks));
  demoRepository.replace("documents", structuredClone(seed.documents));
  demoRepository.replace("employees", structuredClone(seed.employees));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi
      .fn()
      .mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
it("offers real links from the keyboard-accessible Workspace Preview menu", async () => {
  render(<WorkspacePreview />);
  const trigger = screen.getByRole("button", { name: "Workspace Preview" });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  const menu = await screen.findByRole("menu");
  for (const item of workspacePreviews)
    expect(
      within(menu).getByRole("menuitem", { name: item.name }),
    ).toHaveAttribute("href", item.href);
  expect(within(menu).getByText(previewDisclaimer)).toBeInTheDocument();
  expect(screen.queryByText(/Employee.*planned/)).toBeNull();
});
it("renders the employee route, filters students/tasks/reviews and updates shared task state", () => {
  render(<EmployeeRoute />);
  expect(
    screen.getByRole("heading", { name: "Employee Workspace", level: 1 }),
  ).toBeInTheDocument();
  const students = within(screen.getByRole("region", { name: "My Students" }));
  expect(
    students.getByRole("link", { name: "Open student Maya Rahman" }),
  ).toHaveAttribute("href", "/students/stu-1");
  expect(students.queryByText("Leo Hassan")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Mark complete: Confirm university requirements",
    }),
  );
  expect(
    demoRepository.read("tasks").find((t) => t.id === "tsk-3")!.status,
  ).toBe("Done");
  expect(
    screen.getByRole("button", {
      name: "Mark complete: Confirm university requirements",
    }),
  ).toBeDisabled();
  fireEvent.change(
    screen.getByRole("combobox", { name: "Preview workspace as" }),
    { target: { value: "emp-3" } },
  );
  expect(
    students.getByRole("link", { name: "Open student Leo Hassan" }),
  ).toHaveAttribute("href", "/students/stu-2");
  expect(students.queryByText("Maya Rahman")).toBeNull();
  expect(screen.queryByLabelText("Review doc-2")).toBeNull();
  expect(
    screen.getByRole("link", {
      name: "View student for Review motivation letter",
    }),
  ).toHaveAttribute("href", "/students/stu-2");
  fireEvent.change(
    screen.getByLabelText("Status of Review motivation letter"),
    { target: { value: "In progress" } },
  );
  expect(
    demoRepository.read("tasks").find((t) => t.id === "tsk-2")!.status,
  ).toBe("In progress");
});
it("searches and sorts assigned students with accessible sort state", () => {
  render(<EmployeeWorkspace />);
  const section = within(screen.getByRole("region", { name: "My Students" }));
  fireEvent.click(
    section.getByRole("button", { name: "Sort by Student name" }),
  );
  expect(
    section.getByRole("columnheader", { name: /Student name/ }),
  ).toHaveAttribute("aria-sort", "descending");
  expect(section.getAllByRole("row")[1]).toHaveTextContent("Sofia Park");
  fireEvent.change(screen.getByLabelText("Search my students"), {
    target: { value: "Maya" },
  });
  expect(section.queryByText("Sofia Park")).toBeNull();
  expect(section.getByText("Maya Rahman")).toBeInTheDocument();
});
it("shows a genuinely empty workload for an active employee with no assignments", () => {
  render(<EmployeeWorkspace initialEmployeeId="emp-1" />);
  expect(screen.getByText("No queued work")).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "My Students" })).queryByRole(
      "link",
      { name: /Open student/ },
    ),
  ).toBeNull();
  expect(screen.queryByLabelText(/Status of /)).toBeNull();
});
it("respects a conflicting document lock and permits reviews for the selected holder", () => {
  demoRepository.replace(
    "students",
    demoRepository
      .read("students")
      .map((s) =>
        s.id === "stu-1" ? { ...s, lock: { ...s.lock, ownerId: "emp-4" } } : s,
      ),
  );
  const view = render(<EmployeeWorkspace />);
  expect(screen.getByLabelText("Review doc-2")).toBeDisabled();
  view.unmount();
  demoRepository.replace("students", structuredClone(seed.students));
  render(<EmployeeWorkspace />);
  fireEvent.change(screen.getByLabelText("Review doc-2"), {
    target: { value: "Verified" },
  });
  expect(screen.getByLabelText("Review doc-2")).toHaveValue("Verified");
  expect(
    demoRepository.read("documents").find((d) => d.id === "doc-2")!.reviewer,
  ).toBe("emp-2");
});
it.each([
  ["", "Choose a demo employee"],
  ["invalid-id", "Demo employee unavailable"],
])("handles selection %s without leaking a fallback workload", (id, title) => {
  render(<EmployeeWorkspace initialEmployeeId={id} />);
  expect(screen.getByText(title)).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "My Students" })).queryByRole(
      "link",
      { name: /Open student/ },
    ),
  ).toBeNull();
});
it("preserves admin filters, summaries, and the updated preview menu", () => {
  render(<AdminDashboard />);
  expect(
    screen.getByRole("heading", { name: "Operations overview" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Workspace Preview" }),
  ).toBeInTheDocument();
  const summary = within(
    screen.getByRole("region", { name: "Key performance indicators" }),
  );
  expect(
    summary.getByText(
      mockOperationsService
        .getDashboard({ team: "all", range: "30" })
        .students.toLocaleString("en-US"),
    ),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filter by team"), {
    target: { value: "counseling" },
  });
  expect(screen.getByLabelText("Filter by team")).toHaveValue("counseling");
  fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(screen.getByLabelText("Filter by team")).toHaveValue("all");
});
it("preserves the student portal profile selector and adds workspace navigation", () => {
  render(<OperationsWorkspace screen="student-portal" />);
  expect(screen.getByLabelText("Demo student profile")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Workspace Preview" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("A student ID alone is never a login credential."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Employee Workspace" }),
  ).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Student Portal" })).toHaveAttribute(
    "href",
    "/student-portal",
  );
});
