import React from "react";
import { beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Login from "../components/demo/login";
import ManagerWorkspace from "../components/manager-workspace/manager-workspace";
import Tracker from "../components/student-tracking/tracker";
import Results from "../components/student-tracking/results";
import OperationsWorkspace from "../components/operations/workspace";
import { demoContextStore } from "../lib/demo/context";
import { demoRepository } from "../lib/operations/service";
import * as seed from "../lib/operations/mock";

it("opens an exact application record without prefix-matching another record", () => {
  demoRepository.replace("applications", [
    ...seed.applications,
    { ...seed.applications[0], id: "app-1000" },
  ]);
  render(<OperationsWorkspace screen="applications" recordFilter="app-1" />);
  expect(screen.getByLabelText("Application status app-1")).toBeInTheDocument();
  expect(screen.queryByLabelText("Application status app-1000")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Show all applications" }),
  ).toBeInTheDocument();
});
const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  path: "/manager-workspace",
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => ({ push: navigation.push }),
}));
beforeEach(() => {
  navigation.push.mockReset();
  navigation.path = "/manager-workspace";
  demoRepository.replace("students", structuredClone(seed.students));
  demoRepository.replace("tasks", structuredClone(seed.tasks));
  demoRepository.replace("documents", structuredClone(seed.documents));
  demoRepository.replace("employees", structuredClone(seed.employees));
  demoRepository.replace("applications", structuredClone(seed.applications));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
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
it.each([
  ["Admin", "/admin"],
  ["Manager", "/manager-workspace"],
  ["Employee", "/employee-workspace"],
])(
  "opens the %s demo destination without accepting credentials",
  (label, path) => {
    render(<Login />);
    fireEvent.click(screen.getByRole("radio", { name: label }));
    expect(screen.getByRole("radio", { name: label })).toBeChecked();
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Sign In/ })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Explore Demo Workspace" }),
    );
    expect(navigation.push).toHaveBeenCalledWith(path);
    expect(demoContextStore.getSnapshot().role).toBe(label.toLowerCase());
  },
);
it("updates role descriptions, validates email, and toggles only the disabled password field", () => {
  render(<Login />);
  fireEvent.click(screen.getByRole("radio", { name: "Manager" }));
  expect(
    screen.getByText(
      "Oversee admissions teams, assignments, applications, and deadlines.",
    ),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "bad" },
  });
  fireEvent.blur(screen.getByLabelText("Email address"));
  expect(screen.getByRole("status")).toHaveTextContent("Enter a valid email");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(
    screen.getByLabelText("Password", { selector: "input" }),
  ).toHaveAttribute("type", "text");
  expect(demoContextStore.getSnapshot().role).toBeNull();
});
it("filters manager teams, changes task assignment and creates a linked task", () => {
  render(<ManagerWorkspace />);
  expect(
    screen.getByRole("heading", { name: "Manager Workspace", level: 1 }),
  ).toBeInTheDocument();
  const nav = within(
    screen.getByRole("navigation", { name: "Main navigation" }),
  );
  expect(nav.queryByRole("link", { name: "Settings" })).toBeNull();
  expect(nav.getByRole("link", { name: "Team Overview" })).toHaveAttribute(
    "href",
    "/manager-workspace#team-overview",
  );
  fireEvent.change(screen.getByLabelText("Team", { selector: "select" }), {
    target: { value: "Admissions" },
  });
  expect(
    within(screen.getByRole("region", { name: "Team Overview" })).queryByText(
      "Taylor Reed",
    ),
  ).toBeNull();
  fireEvent.change(
    screen.getByLabelText("Assign Confirm university requirements"),
    { target: { value: "emp-3" } },
  );
  expect(
    demoRepository.read("tasks").find((t) => t.id === "tsk-3")!.employeeId,
  ).toBe("emp-3");
  fireEvent.change(
    screen.getByLabelText("Priority of Confirm university requirements"),
    { target: { value: "Low" } },
  );
  expect(
    demoRepository.read("tasks").find((t) => t.id === "tsk-3")!.priority,
  ).toBe("Low");
  fireEvent.click(screen.getByRole("button", { name: "Create task" }));
  fireEvent.change(screen.getByLabelText("Task title"), {
    target: { value: "Demo team follow-up" },
  });
  fireEvent.change(screen.getByLabelText("Linked student"), {
    target: { value: "stu-2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create demo task" }));
  expect(
    demoRepository.read("tasks").find((t) => t.title === "Demo team follow-up"),
  ).toMatchObject({ studentId: "stu-2" });
});
it("exits the demo without claiming server logout", () => {
  demoContextStore.enter("manager");
  render(<ManagerWorkspace />);
  const exit = screen.getByRole("link", { name: "Exit Demo" });
  exit.addEventListener("click", (event) => event.preventDefault());
  expect(exit).toHaveAttribute("href", "/login");
  fireEvent.click(exit);
  expect(demoContextStore.getSnapshot().role).toBeNull();
});
it("validates lookup fields and uses the same generic verification acknowledgment for matched/unmatched input", () => {
  const view = render(<Tracker />);
  fireEvent.click(
    screen.getByRole("button", { name: "Continue to Verification" }),
  );
  expect(screen.getByText(/Use a fictional Student ID/)).toBeInTheDocument();
  const submit = (id: string, email: string) => {
    fireEvent.change(screen.getByLabelText("Unique Student ID"), {
      target: { value: id },
    });
    fireEvent.change(screen.getByLabelText("Registered email address"), {
      target: { value: email },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Verification" }),
    );
  };
  submit("UAIS-STU-DEMO-0001", "maya@example.test");
  const matched = screen.getByRole("status").textContent;
  expect(matched).toContain("No lookup was performed and no email was sent");
  expect(screen.getByRole("button", { name: "Verify Code" })).toBeDisabled();
  expect(demoContextStore.getSnapshot().sample).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Preview expired-code state" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Expired-code example");
  view.unmount();
  render(<Tracker />);
  submit("UAIS-STU-DEMO-9999", "unknown@example.test");
  expect(screen.getByRole("status").textContent).toBe(matched);
});
it("opens corresponding fictional results only through explicit sample selection", () => {
  render(<Tracker />);
  fireEvent.change(screen.getByLabelText("Sample student"), {
    target: { value: "stu-2" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Explore Sample Student Results" }),
  );
  expect(demoContextStore.getSnapshot().sample?.studentId).toBe("stu-2");
  expect(navigation.push).toHaveBeenCalledWith("/track-application/results");
});
it.each([false, true])(
  "shows a safe access state for missing/expired sample context (expired=%s)",
  (expired) => {
    if (expired)
      demoContextStore.exploreSample("stu-1", Date.now() - 11 * 60 * 1000);
    render(<Results />);
    expect(
      screen.getByRole("heading", {
        name: "Verification or sample selection required",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("maya@example.test")).toBeNull();
  },
);
it("shows approved personal fields, requirement-aware documents, filters and honest correction feedback", () => {
  demoRepository.replace(
    "students",
    demoRepository.read("students").map((s) =>
      s.id === "stu-2"
        ? {
            ...s,
            fields: {
              ...s.fields,
              private_staff_notes: "DO-NOT-SHOW-PRIVATE-NOTES",
            },
          }
        : s,
    ),
  );
  demoContextStore.exploreSample("stu-2");
  render(<Results />);
  expect(screen.getByText("Leo Hassan")).toBeInTheDocument();
  expect(screen.queryByText("DO-NOT-SHOW-PRIVATE-NOTES")).toBeNull();
  expect(screen.getByText("Universities Applied To")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Document filter"), {
    target: { value: "Rejected" },
  });
  expect(screen.getByText("transcript")).toBeInTheDocument();
  expect(
    screen.getByText(/Rejection details are not recorded/),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Document filter"), {
    target: { value: "Missing" },
  });
  expect(screen.getByText("No matching records.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Request Correction" }));
  expect(
    screen.getByRole("status", { name: "Demo feedback" }),
  ).toHaveTextContent("No message was transmitted");
});
