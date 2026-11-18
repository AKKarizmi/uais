"use client";
import { StudentsFeature } from "./students";
import { StudentPortalFeature } from "./studentPortal";
import { SettingsFeature } from "./settings";
import { ReportsFeature } from "./reports";
import { ActivityFeature } from "./activity";
import { AttendanceFeature } from "./attendance";
import { EmployeesFeature } from "./employees";
import { DocumentsFeature } from "./documents";
import { TasksFeature } from "./tasks";
import { ApplicationsFeature } from "./applications";
import { UniversitiesFeature } from "./universities";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import type { PreviewState } from "@/lib/mock/operations";
import { useDemoState } from "./demo-state";
import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
  UserPlus,
} from "lucide-react";
import {
  applications as seedApplications,
  activity as seedActivity,
  documents as seedDocuments,
  employees as seedEmployees,
  students as seedStudents,
  tasks as seedTasks,
  universities as seedUniversities,
} from "@/lib/operations/mock";
import type {
  Activity,
  Application,
  Doc,
  Employee,
  Role,
  Screen,
  Student,
  Task,
  University,
} from "@/lib/operations/types";
import {
  csvText,
  downloadText,
  reportHtml,
  type ReportRow,
} from "@/lib/operations/reports";
import fieldsCatalog from "@/lib/operations/canonical-fields.json";
import documentsCatalog from "@/lib/operations/canonical-documents.json";

import {
  trimName,
  initials,
  validUrl,
  Avatar,
  Field,
  Modal,
  PageHead,
  Empty,
} from "./shared";
export function useOperationsModel({
  screen,
  studentId,
  recordFilter,
}: {
  screen: Screen;
  studentId?: string;
  recordFilter?: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewState>("ready");

  const [role, setRole] = useState<Role>("superuser");

  const [query, setQuery] = useState("");
  const [students, setStudents] = useDemoState<Student[]>(
    "students",
    seedStudents,
  );
  const [universities, setUniversities] = useDemoState<University[]>(
    "universities",
    seedUniversities,
  );
  const [applications, setApplications] = useDemoState<Application[]>(
    "applications",
    seedApplications,
  );
  const [tasks, setTasks] = useDemoState<Task[]>("tasks", seedTasks);
  const [employees, setEmployees] = useDemoState<Employee[]>(
    "employees",
    seedEmployees,
  );
  const [documents, setDocuments] = useDemoState<Doc[]>(
    "documents",
    seedDocuments,
  );
  const [activity, setActivity] = useDemoState<Activity[]>(
    "activity",
    seedActivity,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const studentDetail = studentId ?? null;
  const [tab, setTab] = useState("Basic Fields");
  const [selection, setSelection] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [reportType, setReportType] = useState("Students");
  const [reportQuery, setReportQuery] = useState("");
  const [taskView, setTaskView] = useState<"table" | "board">("table");
  const [studentPortalId, setStudentPortalId] = useState("stu-1");
  const [dark, setDark] = useState(false);

  const [viewColumns, setViewColumns] = useState({
    email: true,
    nationality: true,
    assignment: true,
    status: true,
    documents: true,
    lock: true,
  });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const activeEmployee = "emp-1";
  const notify = (s: string) => {
    setMessage(s);
  };
  const log = (action: string, object: string) =>
    setActivity((a) => [
      {
        id: `evt-${Date.now()}`,
        by: "Alex Morgan (demo)",
        action,
        object,
        when: "just now",
      },
      ...a,
    ]);
  const employee = (id: string | null | undefined) =>
    employees.find((e) => e.id === id)?.name ?? "Unassigned";
  const stu = (id: string | null | undefined) =>
    students.find((s) => s.id === id);
  const uni = (id: string | null | undefined) =>
    universities.find((u) => u.id === id);
  const isLockedOther = (s: Student) =>
    Boolean(s.lock.ownerId && s.lock.ownerId !== activeEmployee);
  const editStudent = (id: string, patch: Partial<Student>) => {
    const s = stu(id);
    if (!s) return;
    if (
      (patch.firstName !== undefined && !patch.firstName.trim()) ||
      (patch.lastName !== undefined && !patch.lastName.trim())
    ) {
      notify("Name must not be empty.");
      return;
    }
    if (isLockedOther(s)) {
      notify(
        `${s.code} is locked by ${employee(s.lock.ownerId)}. No change saved.`,
      );
      return;
    }
    const fields = { ...s.fields, ...(patch.fields ?? {}) };
    if (patch.firstName !== undefined) fields.first_name = patch.firstName;
    if (patch.lastName !== undefined) fields.last_name = patch.lastName;
    setStudents((a) =>
      a.map((x) =>
        x.id === id ? { ...x, ...patch, fields, updated: "Today" } : x,
      ),
    );
    log("edited student (demo)", s.code);
  };
  const lockStudent = (id: string) => {
    const s = stu(id);
    if (!s) return;
    if (isLockedOther(s)) {
      notify(
        `Cannot acquire lock: ${employee(s.lock.ownerId)} holds this record.`,
      );
      return;
    }
    setStudents((a) =>
      a.map((x) =>
        x.id === id
          ? {
              ...x,
              lock: {
                ownerId: s.lock.ownerId ? null : activeEmployee,
                acquiredAt: s.lock.ownerId ? null : new Date().toISOString(),
                heartbeat: s.lock.ownerId ? null : "just now",
              },
            }
          : x,
      ),
    );
    log(s.lock.ownerId ? "released lock" : "acquired lock", s.code);
  };
  const go = (id: Screen) => {
    router.push(id === "dashboard" ? "/admin" : `/${id}`);
    setQuery("");
    setSelection([]);
    setStatusFilter("All");
  };
  const searchStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          `${s.code} ${trimName(s)} ${s.email} ${employee(s.assignedTo)} ${s.nationality}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (statusFilter === "All" || s.status === statusFilter),
      ),
    [students, query, statusFilter, employees],
  );
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          `${t.title} ${employee(t.employeeId)} ${trimName(stu(t.studentId))}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (statusFilter === "All" || t.status === statusFilter),
      ),
    [tasks, query, statusFilter, employees, students],
  );
  const online = employees.filter((e) => e.online && e.active).length;
  const pendingDocs = documents.filter(
    (d) => d.status === "Pending Review" || d.status === "Rejected",
  ).length;
  const locks = students.filter((s) => s.lock.ownerId);
  const overdue = tasks.filter(
    (t) => t.status !== "Done" && t.due === "Nov 13, 2026",
  ).length;

  function headerActions() {
    if (screen === "students")
      return (
        <>
          <button
            className="btn btn-light"
            onClick={() => setModal("student-import")}
          >
            <Upload size={15} />
            Import Excel
          </button>
          <button
            className="btn btn-light"
            onClick={() => setModal("student-export")}
          >
            <Download size={15} />
            Export Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setDraft({});
              setModal("student-add");
            }}
          >
            <Plus size={15} />
            Add Student
          </button>
        </>
      );
    if (screen === "universities")
      return (
        <>
          <button
            className="btn btn-light"
            onClick={() => setModal("university-import")}
          >
            <Upload size={15} />
            Import Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setDraft({});
              setModal("university-add");
            }}
          >
            <Plus size={15} />
            Add University
          </button>
        </>
      );
    if (screen === "tasks")
      return (
        <button
          className="btn btn-primary"
          onClick={() => {
            setDraft({});
            setModal("task-add");
          }}
        >
          <Plus size={15} />
          New Task
        </button>
      );
    if (screen === "applications")
      return (
        <button
          className="btn btn-primary"
          onClick={() => {
            setDraft({});
            setModal("application-add");
          }}
        >
          <Plus size={15} />
          New Application
        </button>
      );
    if (screen === "employees")
      return (
        <button
          className="btn btn-primary"
          onClick={() => {
            setDraft({});
            setModal("employee-add");
          }}
        >
          <UserPlus size={15} />
          Add Employee
        </button>
      );
    if (screen === "reports")
      return (
        <>
          <button
            className="btn btn-light"
            onClick={() =>
              downloadText(
                `uais-${reportType.toLowerCase()}-demo.html`,
                reportHtml(`${reportType} report`, reportColumns, reportRows),
                "text/html;charset=utf-8",
              )
            }
          >
            <Download size={15} />
            Export HTML
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              downloadText(
                `uais-${reportType.toLowerCase()}-demo.csv`,
                csvText(reportColumns, reportRows),
                "text/csv;charset=utf-8",
              )
            }
          >
            <FileSpreadsheet size={15} />
            Export CSV
          </button>
        </>
      );
    return null;
  }
  const headings: Record<Screen, [string, string]> = {
    dashboard: [
      "Operations overview",
      "A little clarity for everything ahead.",
    ],
    students: [
      "Student directory",
      "Manage shared student profiles, assignments and readiness.",
    ],
    universities: [
      "Universities",
      "A structured directory of institutions, sites and admission portals.",
    ],
    applications: [
      "Applications",
      "Track applications separately from student profile statuses.",
    ],
    tasks: [
      "Tasks & assignments",
      "Coordinate admissions work with priority and ownership.",
    ],
    documents: [
      "Document control",
      "Monitor required files, reviews, and missing items.",
    ],
    reports: [
      "Interactive reports",
      "Filter, inspect and generate self-contained HTML reports.",
    ],
    employees: [
      "Employees",
      "Manage staff, responsibilities and accounts from the superuser panel.",
    ],
    attendance: [
      "Attendance",
      "Login activity and last seen—presence is not proof of hours worked.",
    ],
    activity: [
      "Activity log",
      "Demonstration audit trail of actions in this browser session.",
    ],
    settings: [
      "Workspace settings",
      "Preferences and future server policy configuration.",
    ],
    "student-portal": [
      "Student portal",
      "Student-facing profile, document requests and application milestones.",
    ],
  };
  const allReports: Record<string, { columns: string[]; rows: ReportRow[] }> = {
    Students: {
      columns: [
        "Student ID",
        "Name",
        "Nationality",
        "Status",
        "Assigned to",
        "Verified Docs",
        "Locked",
      ],
      rows: students.map((s) => ({
        "Student ID": s.code,
        Name: trimName(s),
        Nationality: s.nationality,
        Status: s.status,
        "Assigned to": employee(s.assignedTo),
        "Verified Docs": `${s.documentsVerified}/${s.documentsRequired}`,
        Locked: s.lock.ownerId ? employee(s.lock.ownerId) : "No",
      })),
    },
    Applications: {
      columns: [
        "Student",
        "University",
        "Program",
        "Status",
        "Deadline",
        "Officer",
      ],
      rows: applications.map((a) => ({
        Student: trimName(stu(a.studentId)),
        University: uni(a.universityId)?.name ?? "Unknown",
        Program: a.program,
        Status: a.status,
        Deadline: a.deadline,
        Officer: employee(a.owner),
      })),
    },
    Tasks: {
      columns: ["Task", "Student", "Assigned to", "Priority", "Due", "Status"],
      rows: tasks.map((t) => ({
        Task: t.title,
        Student: t.studentId ? trimName(stu(t.studentId)) : "Administration",
        "Assigned to": employee(t.employeeId),
        Priority: t.priority,
        Due: t.due,
        Status: t.status,
      })),
    },
    Attendance: {
      columns: [
        "Employee",
        "Logins today",
        "First login",
        "Last seen",
        "Online",
      ],
      rows: employees.map((e) => ({
        Employee: e.name,
        "Logins today": e.loginsToday,
        "First login": e.firstLogin,
        "Last seen": e.lastSeen,
        Online: e.online ? "Yes" : "No",
      })),
    },
    Documents: {
      columns: ["Student", "Category", "Status", "Reviewer", "Updated"],
      rows: documents.map((d) => ({
        Student: trimName(stu(d.studentId)),
        Category: d.category,
        Status: d.status,
        Reviewer: employee(d.reviewer),
        Updated: d.updated,
      })),
    },
  };
  const reportColumns = allReports[reportType].columns;
  const reportRows = allReports[reportType].rows.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(reportQuery.toLowerCase()),
  );
  const detail = stu(studentDetail);
  const canonicalFields = fieldsCatalog.fields as Array<{
    canonical_name: string;
    metadata_path: string;
    field_type: string;
    section: string;
    description?: string | null;
  }>;
  const canonicalDocs = Object.keys(documentsCatalog.documents);
  const basicSections = new Set([
    "personal_information",
    "contact_information",
    "identity_information",
  ]);
  const fieldGroups = [...new Set(canonicalFields.map((f) => f.section))];

  function rowButton(label: string, doAction: () => void) {
    return (
      <button className="btn btn-light btn-sm" onClick={doAction}>
        {label}
      </button>
    );
  }
  function beginWork(s: Student) {
    if (!s.lock.ownerId) lockStudent(s.id);
    router.push(`/students/${s.id}`);
  }
  function draftInput(
    key: string,
    label: string,
    placeholder = "",
    type = "text",
  ) {
    return (
      <Field label={label}>
        <input
          type={type}
          value={draft[key] ?? ""}
          placeholder={placeholder}
          onChange={(e) => setDraft((x) => ({ ...x, [key]: e.target.value }))}
        />
      </Field>
    );
  }
  function formModal() {
    if (!modal) return null;
    if (modal === "student-columns")
      return (
        <Modal title="Visible table columns" onClose={() => setModal(null)}>
          <div className="checks-grid">
            {Object.entries(viewColumns).map(([key, value]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setViewColumns((x) => ({ ...x, [key]: e.target.checked }))
                  }
                />
                {key[0].toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setModal(null)}>
            Done
          </button>
        </Modal>
      );
    if (modal === "student-import" || modal === "university-import")
      return (
        <Modal
          title={`Import ${modal === "student-import" ? "students" : "universities"} from Excel`}
          onClose={() => setModal(null)}
        >
          <div className="drop-demo">
            <Upload size={24} />
            <h3>Backend import will be added by Codex</h3>
            <p>
              Import preview, row validation, duplicate detection, lock
              awareness and atomic persistence will use the existing UAIS
              Desktop Excel contract. No file is accepted or transmitted in this
              demonstration.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(null)}>
            Understood
          </button>
        </Modal>
      );
    if (modal === "student-export")
      return (
        <Modal title="Student Excel export" onClose={() => setModal(null)}>
          <div className="drop-demo">
            <FileSpreadsheet size={24} />
            <h3>Export contract ready</h3>
            <p>
              Production exports will contain canonical student fields and
              require authorization. Here you may export a fictional CSV
              snapshot for preview only.
            </p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                downloadText(
                  "uais-students-fictional.csv",
                  csvText(
                    allReports.Students.columns,
                    allReports.Students.rows,
                  ),
                  "text/csv;charset=utf-8",
                );
                setModal(null);
              }}
            >
              <Download size={15} />
              Export fictional CSV
            </button>
          </div>
        </Modal>
      );
    if (modal === "bulk-assignment")
      return (
        <Modal
          title={`Assign ${selection.length} selected students`}
          onClose={() => setModal(null)}
        >
          <Field label="Employee">
            <select
              value={draft.assignedTo ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, assignedTo: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </Field>
          <p className="hint">
            Students locked by another employee will be skipped.
          </p>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                let skipped = 0;
                setStudents((a) =>
                  a.map((s) => {
                    if (!selection.includes(s.id)) return s;
                    if (isLockedOther(s)) {
                      skipped++;
                      return s;
                    }
                    return { ...s, assignedTo: draft.assignedTo || null };
                  }),
                );
                notify(
                  `Assignments updated in memory. ${skipped} locked student(s) skipped.`,
                );
                setSelection([]);
                setModal(null);
              }}
            >
              Assign selected
            </button>
          </div>
        </Modal>
      );
    if (modal === "student-add")
      return (
        <Modal title="Add fictional student" onClose={() => setModal(null)}>
          <div className="fields-grid">
            {draftInput("firstName", "First name")}
            {draftInput("lastName", "Last name")}
            {draftInput("email", "Email", "demo@example.test", "email")}
            {draftInput("nationality", "Nationality")}
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (
                  draft.email &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
                ) {
                  notify("Enter a valid email address.");
                  return;
                }
                if (!draft.firstName?.trim() || !draft.lastName?.trim()) {
                  notify(
                    "First and last names are required for this demonstration.",
                  );
                  return;
                }
                const id = `stu-${Date.now()}`,
                  code = `UAIS-STU-DEMO-${String(students.length + 1).padStart(4, "0")}`;
                setStudents((a) => [
                  {
                    id,
                    code,
                    firstName: draft.firstName.trim(),
                    lastName: draft.lastName.trim(),
                    email: draft.email ?? "",
                    phone: "",
                    nationality: draft.nationality ?? "",
                    assignedTo: null,
                    status: "Lead",
                    degree: "",
                    documentsVerified: 0,
                    documentsRequired: 5,
                    consent: null,
                    updated: "Today",
                    lock: { ownerId: null, acquiredAt: null, heartbeat: null },
                    fields: {
                      first_name: draft.firstName,
                      last_name: draft.lastName,
                    },
                  },
                  ...a,
                ]);
                log("created student", code);
                setModal(null);
                notify(`Fictional student ${code} added locally.`);
              }}
            >
              Create student
            </button>
          </div>
        </Modal>
      );
    if (modal === "university-add" || modal === "university-edit")
      return (
        <Modal
          title={
            modal === "university-add" ? "Add university" : "Edit university"
          }
          onClose={() => setModal(null)}
        >
          <div className="fields-grid">
            {draftInput("name", "University name")}
            {draftInput("country", "Country")}
            {draftInput("website", "Official website", "https://example.org")}
            {draftInput(
              "portal",
              "Application portal (optional)",
              "https://example.org/apply",
            )}
          </div>
          <p className="hint">
            Only HTTP(S) links are accepted. A university may have no portal;
            unknown providers remain Unclassified.
          </p>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!draft.name?.trim()) {
                  notify("University name is required.");
                  return;
                }
                if (
                  [draft.website, draft.portal].some(
                    (url) => url && !validUrl(url),
                  )
                ) {
                  notify("Website and portal must be valid HTTP(S) URLs.");
                  return;
                }
                if (modal === "university-edit") {
                  setUniversities((a) =>
                    a.map((u) =>
                      u.id === draft.id
                        ? {
                            ...u,
                            name: draft.name,
                            country: draft.country ?? "",
                            website: draft.website ?? "",
                            portal: draft.portal ?? "",
                          }
                        : u,
                    ),
                  );
                  log("edited university", draft.name);
                } else {
                  setUniversities((a) => [
                    ...a,
                    {
                      id: `uni-${Date.now()}`,
                      name: draft.name,
                      country: draft.country ?? "",
                      website: draft.website ?? "",
                      portal: draft.portal ?? "",
                      family: "Unclassified",
                      programs: 0,
                      assignedTo: "emp-1",
                      intake: "TBD",
                      active: true,
                      initials: initials(draft.name),
                    },
                  ]);
                  log("created university", draft.name);
                }
                setModal(null);
              }}
            >
              Save university
            </button>
          </div>
        </Modal>
      );
    if (modal === "task-add")
      return (
        <Modal title="Create assignment" onClose={() => setModal(null)}>
          <div className="fields-grid">
            {draftInput("title", "Task title")}
            <Field label="Student">
              <select
                value={draft.studentId ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, studentId: e.target.value }))
                }
              >
                <option value="">General administration</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {trimName(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assign to">
              <select
                value={draft.employeeId ?? "emp-2"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, employeeId: e.target.value }))
                }
              >
                {employees
                  .filter((e) => e.active)
                  .map((e) => (
                    <option value={e.id} key={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={draft.priority ?? "Medium"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, priority: e.target.value }))
                }
              >
                {["Low", "Medium", "High", "Urgent"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            {draftInput("due", "Due date (display label)", "Nov 20, 2026")}
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!draft.title?.trim()) {
                  notify("Task title required.");
                  return;
                }
                const id = `tsk-${Date.now()}`;
                setTasks((x) => [
                  {
                    id,
                    title: draft.title,
                    studentId: draft.studentId || null,
                    employeeId: draft.employeeId || "emp-2",
                    priority: (draft.priority || "Medium") as Task["priority"],
                    due: draft.due || "Not scheduled",
                    status: "To do",
                    notes: "",
                  },
                  ...x,
                ]);
                log("created task", draft.title);
                setModal(null);
              }}
            >
              Create task
            </button>
          </div>
        </Modal>
      );
    if (modal === "application-add")
      return (
        <Modal title="Create application record" onClose={() => setModal(null)}>
          <div className="fields-grid">
            <Field label="Student">
              <select
                value={draft.studentId ?? students[0].id}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, studentId: e.target.value }))
                }
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {trimName(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="University">
              <select
                value={draft.universityId ?? universities[0].id}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, universityId: e.target.value }))
                }
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            {draftInput("program", "Program")}
            {draftInput("intake", "Intake", "Sep 2027")}
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const id = `app-${Date.now()}`;
                setApplications((x) => [
                  ...x,
                  {
                    id,
                    studentId: draft.studentId ?? students[0].id,
                    universityId: draft.universityId ?? universities[0].id,
                    program: draft.program || "Program to confirm",
                    intake: draft.intake || "TBD",
                    status: "Preparing",
                    owner: "emp-1",
                    deadline: "TBD",
                    updated: "Today",
                  },
                ]);
                log("created application record", id);
                setModal(null);
              }}
            >
              Create application
            </button>
          </div>
        </Modal>
      );
    if (modal === "employee-add")
      return (
        <Modal
          title="Create employee (UI demonstration)"
          onClose={() => setModal(null)}
        >
          <div className="fields-grid">
            {draftInput("name", "Full name")}
            {draftInput("email", "Work email", "name@example.test", "email")}
            <Field label="Role">
              <select
                value={draft.role ?? "Admissions Officer"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, role: e.target.value }))
                }
              >
                {["Manager", "Admissions Officer", "Document Reviewer"].map(
                  (q) => (
                    <option key={q}>{q}</option>
                  ),
                )}
              </select>
            </Field>
            {draftInput("team", "Team", "Admissions")}
          </div>
          <p className="hint">
            No invitation, password, authorization or session is created here.
          </p>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!draft.name?.trim() || !draft.email?.includes("@")) {
                  notify("Name and valid email required.");
                  return;
                }
                setEmployees((x) => [
                  ...x,
                  {
                    id: `emp-${Date.now()}`,
                    name: draft.name,
                    initials: initials(draft.name),
                    email: draft.email,
                    role: (draft.role ??
                      "Admissions Officer") as Employee["role"],
                    team: draft.team || "Admissions",
                    active: true,
                    online: false,
                    lastSeen: "Never",
                    loginsToday: 0,
                    firstLogin: "—",
                  },
                ]);
                log("created demo employee", draft.name);
                setModal(null);
              }}
            >
              Create demo employee
            </button>
          </div>
        </Modal>
      );
    if (modal === "employee-detail") {
      const e = employees.find((e) => e.id === draft.id);
      return (
        <Modal title="Employee details" onClose={() => setModal(null)}>
          {e && (
            <>
              <div className="inline-profile">
                <Avatar name={e.name} />
                <div>
                  <strong>{e.name}</strong>
                  <small className="block-muted">{e.email}</small>
                </div>
              </div>
              <div className="kv">
                <span>Role</span>
                <strong>{e.role}</strong>
              </div>
              <div className="kv">
                <span>Team</span>
                <strong>{e.team}</strong>
              </div>
              <div className="kv">
                <span>Logins today</span>
                <strong>{e.loginsToday}</strong>
              </div>
              <div className="kv">
                <span>Last seen</span>
                <strong>{e.lastSeen}</strong>
              </div>
              <div className="kv">
                <span>Current open tasks</span>
                <strong>
                  {
                    tasks.filter(
                      (t) => t.employeeId === e.id && t.status !== "Done",
                    ).length
                  }
                </strong>
              </div>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setModal(null)}>
            Close
          </button>
        </Modal>
      );
    }
    return null;
  }
  const summary = headings[screen];
  return {
    recordFilter,
    searchStudents,
    tab,
    setTab,
    viewColumns,
    setViewColumns,
    selection,
    setSelection,
    beginWork,
    fieldGroups,
    filteredTasks,
    preview,
    setPreview,
    router,
    screen,
    studentId,
    detail,
    students,
    universities,
    applications,
    tasks,
    employees,
    documents,
    activity,
    setStudents,
    setUniversities,
    setApplications,
    setTasks,
    setEmployees,
    setDocuments,
    setActivity,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    reportType,
    setReportType,
    reportQuery,
    setReportQuery,
    taskView,
    setTaskView,
    studentPortalId,
    setStudentPortalId,
    dark,
    setDark,
    role,
    setRole,
    message,
    setMessage,
    modal,
    setModal,
    draft,
    setDraft,
    employee,
    stu,
    uni,
    isLockedOther,
    editStudent,
    lockStudent,
    go,
    log,
    notify,
    online,
    pendingDocs,
    locks,
    overdue,
    allReports,
    reportColumns,
    reportRows,
    canonicalFields,
    canonicalDocs,
    basicSections,
    rowButton,
    headerActions,
    formModal,
    draftInput,
    summary,
  };
}
export type OperationsContext = ReturnType<typeof useOperationsModel>;

export default function OperationsWorkspace(props: {
  screen: Screen;
  studentId?: string;
  recordFilter?: string;
}) {
  const ctx = useOperationsModel(props);
  const {
    preview,
    setPreview,
    screen,
    studentId,
    detail,
    message,
    setMessage,
    headerActions,
    formModal,
    summary,
  } = ctx;
  return (
    <AppShell state={preview} setState={setPreview}>
      {() => (
        <div className="operations-feature">
          <div className="content">
            {preview === "loading" ? (
              <p role="status">Loading demo preview…</p>
            ) : preview === "error" ? (
              <div role="alert">
                Demo error preview.{" "}
                <button onClick={() => setPreview("ready")}>Try again</button>
              </div>
            ) : preview === "empty" ? (
              <Empty text="No demo records in this preview." />
            ) : (
              <>
                {studentId && !detail ? (
                  <Empty text="Student not found in fictional data." />
                ) : (
                  <>
                    {!detail && (
                      <PageHead
                        title={summary[0]}
                        description={summary[1]}
                        actions={headerActions()}
                      />
                    )}
                    {screen === "students" && StudentsFeature(ctx)}
                    {screen === "universities" && UniversitiesFeature(ctx)}
                    {screen === "applications" && ApplicationsFeature(ctx)}
                    {screen === "tasks" && TasksFeature(ctx)}
                    {screen === "documents" && DocumentsFeature(ctx)}
                    {screen === "reports" && ReportsFeature(ctx)}
                    {screen === "employees" && EmployeesFeature(ctx)}
                    {screen === "attendance" && AttendanceFeature(ctx)}
                    {screen === "activity" && ActivityFeature(ctx)}
                    {screen === "settings" && <SettingsFeature />}
                    {screen === "student-portal" && StudentPortalFeature(ctx)}
                  </>
                )}
              </>
            )}
          </div>
          {message && (
            <div className="toast" role="status">
              <span>{message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage(null)}
              >
                ×
              </button>
            </div>
          )}
          {formModal()}
        </div>
      )}
    </AppShell>
  );
}
