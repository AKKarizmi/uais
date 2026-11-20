import React, { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Spreadsheet } from "../components/desktop/spreadsheet";
import { MetadataEditor } from "../components/desktop/metadata-editor";
import { StudentsWorkspace } from "../components/desktop/students-workspace";
import { SidebarNav } from "../components/dashboard/app-shell";
import { UniversitiesWorkspace } from "../components/desktop/universities-workspace";
import { portalSeeds } from "../lib/desktop/universities";
import { demoRepository } from "../lib/operations/service";
import * as seed from "../lib/operations/mock";
vi.mock("next/navigation", () => ({
  usePathname: () => "/students",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../components/desktop/frame", () => ({
  DesktopFrame: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
beforeEach(() => {
  demoRepository.replace("students", structuredClone(seed.students));
  demoRepository.replace("documents", structuredClone(seed.documents));
  demoRepository.replace("universities", structuredClone(seed.universities));
  demoRepository.replace("portals", portalSeeds(seed.universities));
});
const columns = [
  { key: "id", label: "ID", value: (r: { id: string; name: string }) => r.id },
  {
    key: "name",
    label: "Name",
    editable: true,
    value: (r: { id: string; name: string }) => r.name,
  },
];
function GridHarness() {
  const [rows, setRows] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      name: `Record ${i + 1}`,
    })),
  );
  return (
    <Spreadsheet
      label="Test grid"
      rows={rows}
      columns={columns}
      defaults={["id", "name"]}
      onCommit={(changes) => {
        setRows((current) =>
          current.map((r) => ({
            ...r,
            name: changes.find((c) => c.row.id === r.id)?.text ?? r.name,
          })),
        );
        return { ok: true, message: "Saved" };
      }}
    />
  );
}
it("moves with keys, edits in place and reaches the final partial page", () => {
  render(<GridHarness />);
  const grid = screen.getByRole("grid");
  const first = within(grid).getAllByRole("gridcell")[0];
  first.focus();
  fireEvent.keyDown(first, { key: "ArrowRight" });
  expect(document.activeElement).toHaveTextContent("Record 1");
  fireEvent.keyDown(document.activeElement!, { key: "F2" });
  fireEvent.change(screen.getByLabelText("Edit Name"), {
    target: { value: "Updated" },
  });
  fireEvent.keyDown(screen.getByLabelText("Edit Name"), { key: "Enter" });
  expect(within(grid).getByText("Updated")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Rows"), { target: { value: "10" } });
  expect(within(grid).queryByText("Record 12")).toBeNull();
  fireEvent.click(screen.getByText("Last"));
  expect(within(grid).getByText("Record 12")).toBeInTheDocument();
  expect(screen.getByText("Next")).toBeDisabled();
});
it("copies a rectangular range, pastes cells and rejects overflow without partial changes", () => {
  render(<GridHarness />);
  const grid = screen.getByRole("grid");
  const cells = within(grid).getAllByRole("gridcell");
  act(() => cells[1].focus());
  fireEvent.keyDown(cells[1], { key: "ArrowDown", shiftKey: true });
  const setData = vi.fn();
  fireEvent.copy(grid, { clipboardData: { setData } });
  expect(setData).toHaveBeenCalledWith("text/plain", "Record 1\r\nRecord 2");
  act(() => cells[1].focus());
  fireEvent.paste(grid, {
    clipboardData: { getData: () => "Pasted 1\nPasted 2" },
  });
  expect(within(grid).getByText("Pasted 1")).toBeInTheDocument();
  expect(within(grid).getByText("Pasted 2")).toBeInTheDocument();
  fireEvent.paste(grid, { clipboardData: { getData: () => "Bad\tOverflow" } });
  expect(screen.getByRole("status")).toHaveTextContent("exceeds");
  expect(within(grid).getByText("Pasted 1")).toBeInTheDocument();
});
it("sorts, filters, resizes with a keyboard and bulk edits selected rows", () => {
  render(<GridHarness />);
  fireEvent.click(screen.getByLabelText("Sort Name"));
  expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  fireEvent.change(screen.getByLabelText("Filter Name"), {
    target: { value: "Record 12" },
  });
  expect(
    within(screen.getByRole("grid")).getAllByRole("gridcell"),
  ).toHaveLength(2);
  const resizer = screen.getByRole("separator", { name: "Resize Name" });
  fireEvent.keyDown(resizer, { key: "ArrowRight" });
  expect(resizer).toHaveAttribute("aria-valuenow", "176");
  fireEvent.click(screen.getByLabelText("Select all matching rows"));
  within(screen.getByRole("grid")).getAllByRole("gridcell")[1].focus();
  fireEvent.change(screen.getByLabelText("Bulk cell value"), {
    target: { value: "Bulk value" },
  });
  fireEvent.click(screen.getByText("Apply to selected rows"));
  fireEvent.change(screen.getByLabelText("Filter Name"), {
    target: { value: "Bulk value" },
  });
  expect(
    within(screen.getByRole("grid")).getByText("Bulk value"),
  ).toBeInTheDocument();
});
it("preserves the four tabs, locked readonly state and stale revision handling", () => {
  const locked = render(<MetadataEditor student={seed.students[0]} />);
  expect(screen.getByLabelText(/First name/)).toBeDisabled();
  expect(screen.getByText("Save demo metadata")).toBeDisabled();
  expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
    "Basic Fields",
    "Advanced Fields",
    "Documents",
    "Advanced JSON",
  ]);
  locked.unmount();
  const current = demoRepository.read("students")[1];
  const view = render(<MetadataEditor student={current} />);
  fireEvent.change(screen.getByLabelText(/First name/), {
    target: { value: "Canonical Leo" },
  });
  fireEvent.click(screen.getByText("Save demo metadata"));
  expect(demoRepository.read("students")[1].firstName).toBe("Canonical Leo");
  view.rerender(
    <MetadataEditor
      student={{ ...demoRepository.read("students")[1], revision: 3 }}
    />,
  );
  expect(screen.getByText("Save demo metadata")).toBeDisabled();
  expect(
    screen.getByText(/changed while you were editing/),
  ).toBeInTheDocument();
});
it("validates expert JSON rather than bypassing IDs and locks", () => {
  render(<MetadataEditor student={demoRepository.read("students")[1]} />);
  fireEvent.click(screen.getByRole("tab", { name: "Advanced JSON" }));
  fireEvent.click(screen.getByLabelText("Enable expert demo editing"));
  const input = screen.getByLabelText("Advanced JSON metadata");
  const data = JSON.parse((input as HTMLTextAreaElement).value);
  data.student_id = "CHANGED";
  fireEvent.change(input, { target: { value: JSON.stringify(data) } });
  fireEvent.click(screen.getByText("Save demo metadata"));
  expect(screen.getByRole("status")).toHaveTextContent("immutable");
  expect(demoRepository.read("students")[1].code).toBe(seed.students[1].code);
});
it("updates the selected side panel and shows all canonical document directories", () => {
  render(<StudentsWorkspace />);
  const grid = screen.getByRole("grid");
  fireEvent.click(within(grid).getByText("Leo Hassan"));
  const panel = within(
    screen.getByRole("complementary", { name: "Selected student details" }),
  );
  expect(
    panel.getByRole("heading", { name: "Leo Hassan" }),
  ).toBeInTheDocument();
  expect(panel.getByRole("link", { name: "Open metadata" })).toHaveAttribute(
    "href",
    "/students/stu-2",
  );
  expect(panel.getAllByRole("row")).toHaveLength(38);
  expect(panel.getByText("Documents/Passport")).toBeInTheDocument();
});
it("keeps the five Desktop core destinations ahead of Web operations", () => {
  render(<SidebarNav onPreview={vi.fn()} />);
  const nav = within(
    screen.getByRole("navigation", { name: "Main navigation" }),
  );
  const links = nav.getAllByRole("link");
  expect(links.slice(0, 5).map((l) => l.textContent)).toEqual([
    "Dashboard",
    "Students",
    "Universities",
    "Recorder",
    "System & Resolver",
  ]);
  expect(links[0]).toHaveAttribute("href", "/dashboard");
  expect(nav.getByRole("link", { name: "Recorder" })).toHaveAttribute(
    "href",
    "/recorder",
  );
  expect(nav.getByRole("link", { name: "Students" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
it("shows locked grid cells as readonly and prevents in-cell editing", () => {
  render(<StudentsWorkspace />);
  const cell = within(screen.getByRole("grid"))
    .getByText("maya@example.test")
    .closest("td")!;
  expect(cell).toHaveAttribute("aria-readonly", "true");
  fireEvent.keyDown(cell, { key: "F2" });
  expect(screen.queryByLabelText("Edit Email")).toBeNull();
  expect(screen.getByText(/This cell is read-only/)).toBeInTheDocument();
});
it("creates a university with two distinct portals through the actual forms", () => {
  render(<UniversitiesWorkspace />);
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  fireEvent.change(screen.getByLabelText("University name *"), {
    target: { value: "Fictional UI Institute" },
  });
  fireEvent.change(screen.getByLabelText("Portal URL"), {
    target: { value: "https://ui.dreamapply.com" },
  });
  fireEvent.change(screen.getByLabelText("University website"), {
    target: { value: "https://example.test" },
  });
  fireEvent.click(screen.getByText("Save demo metadata"));
  fireEvent.click(screen.getByRole("button", { name: "Add Portal" }));
  fireEvent.change(screen.getByLabelText("Portal URL"), {
    target: { value: "https://second.example.test" },
  });
  fireEvent.click(screen.getByText("Save demo metadata"));
  expect(
    within(screen.getByRole("grid")).getAllByText("Fictional UI Institute"),
  ).toHaveLength(2);
  expect(
    screen.getByRole("link", { name: "University Website ↗" }),
  ).toHaveAttribute("href", "https://example.test");
  expect(screen.getByRole("link", { name: "Open Portal ↗" })).toHaveAttribute(
    "href",
    "https://second.example.test",
  );
});
