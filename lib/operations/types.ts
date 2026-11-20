export type StudentStatus =
  "Lead" | "Preparing" | "Internal Review" | "Submitted" | "Decision Received";
export type TaskStatus = "To do" | "In progress" | "Blocked" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type DocumentStatus =
  "Missing" | "Uploaded" | "Pending Review" | "Verified" | "Rejected";
export type Role = "superuser" | "employee" | "student";
export type Screen =
  | "dashboard"
  | "students"
  | "universities"
  | "applications"
  | "tasks"
  | "documents"
  | "reports"
  | "employees"
  | "attendance"
  | "activity"
  | "settings"
  | "student-portal";
export type Lock = {
  ownerId: string | null;
  heartbeat: string | null;
  acquiredAt: string | null;
};
export type Student = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  assignedTo: string | null;
  status: StudentStatus;
  degree: string;
  documentsVerified: number;
  documentsRequired: number;
  consent: boolean | null;
  updated: string;
  lock: Lock;
  fields: Record<string, string | boolean | number | null>;
  /** Actual Desktop schema 1.1 metadata; optional only for legacy demo fixtures. */
  metadata?: Record<string, unknown>;
  revision?: number;
};
export type Portal = {
  id: string;
  universityId: string;
  name: string;
  purpose: string;
  url: string;
  family: string;
  familySource: "auto" | "manual";
  active: boolean;
  recordingStatus: string;
  automationStatus: string;
  notes: string;
};
export type University = {
  id: string;
  name: string;
  country: string;
  website: string;
  portal: string;
  family: string;
  programs: number;
  assignedTo: string;
  intake: string;
  active: boolean;
  initials: string;
  city?: string;
  notes?: string;
};
export type Application = {
  id: string;
  studentId: string;
  universityId: string;
  program: string;
  intake: string;
  status: StudentStatus;
  owner: string;
  deadline: string;
  updated: string;
};
export type Task = {
  id: string;
  title: string;
  studentId: string | null;
  employeeId: string;
  priority: Priority;
  due: string;
  status: TaskStatus;
  notes: string;
};
export type Employee = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Superuser" | "Manager" | "Admissions Officer" | "Document Reviewer";
  team: string;
  active: boolean;
  online: boolean;
  lastSeen: string;
  loginsToday: number;
  firstLogin: string;
};
export type Doc = {
  id: string;
  studentId: string;
  category: string;
  required: boolean;
  status: DocumentStatus;
  reviewer: string;
  updated: string;
};
export type Activity = {
  id: string;
  by: string;
  action: string;
  object: string;
  when: string;
};
