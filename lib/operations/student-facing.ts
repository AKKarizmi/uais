import catalog from "./canonical-documents.json";
import type { Collections } from "./service";
import type { Application, DocumentStatus } from "./types";
export type StudentData = Pick<
  Collections,
  "students" | "employees" | "documents" | "applications" | "universities"
>;
export type RequirementPolicy = "recorded" | "program-sample";
export function validateTrackingInput(code: string, email: string) {
  return {
    code: /^UAIS-STU-DEMO-\d{4}$/.test(code.trim())
      ? ""
      : "Use a fictional Student ID such as UAIS-STU-DEMO-0001.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? ""
      : "Enter a valid email address.",
  };
}
export function applicationDisplay(status: string) {
  const stages: Record<
    string,
    {
      label: string;
      step: number | null;
      tone: "neutral" | "success" | "warning" | "danger";
    }
  > = {
    Lead: { label: "Preparing", step: 0, tone: "neutral" },
    Preparing: { label: "Preparing", step: 0, tone: "neutral" },
    "Internal Review": {
      label: "Under Review (UAIS staff)",
      step: 1,
      tone: "warning",
    },
    "Ready for Submission": {
      label: "Ready for Submission",
      step: 1,
      tone: "neutral",
    },
    Submitted: { label: "Submitted", step: 2, tone: "success" },
    "Decision Received": {
      label: "Decision recorded — outcome not provided",
      step: 3,
      tone: "neutral",
    },
    "Under Review": { label: "Under Review", step: 2, tone: "warning" },
    "Conditional Offer": {
      label: "Conditional Offer",
      step: null,
      tone: "warning",
    },
    Accepted: {
      label: "Accepted / Offer Received",
      step: null,
      tone: "success",
    },
    "Offer Received": {
      label: "Accepted / Offer Received",
      step: null,
      tone: "success",
    },
    Rejected: { label: "Rejected", step: null, tone: "danger" },
    Withdrawn: { label: "Withdrawn", step: null, tone: "neutral" },
  };
  return (
    stages[status] ?? {
      label: "Status not recorded",
      step: null,
      tone: "neutral" as const,
    }
  );
}
export function studentFacingResults(
  data: StudentData,
  studentId: string,
  policy: RequirementPolicy = "recorded",
  applicationId = "all",
) {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) return null;
  const apps = data.applications.filter((a) => a.studentId === student.id);
  const scopedApps = apps.filter(
    (a) => applicationId === "all" || a.id === applicationId,
  );
  const docs = data.documents.filter((d) => d.studentId === student.id);
  const required = new Set(
    docs.filter((d) => d.required).map((d) => d.category),
  );
  if (policy === "program-sample" && scopedApps.length) {
    required.add("passport");
    required.add("transcript");
    if (student.degree === "Master") required.add("degree_certificate");
    if (
      scopedApps.some(
        (a) =>
          data.universities.find((u) => u.id === a.universityId)?.country ===
          "United Kingdom",
      )
    )
      required.add("english_certificate");
  }
  const rows = Object.keys(catalog.documents).map((category) => {
    const d = docs.find((item) => item.category === category),
      status: DocumentStatus = d?.status ?? "Missing";
    return {
      category,
      label: category.replaceAll("_", " "),
      required: required.has(category),
      status,
      updated: d?.updated ?? "Not recorded",
      available: [
        "Uploaded",
        "Pending Review",
        "Verified",
        "Rejected",
      ].includes(status),
      next:
        status === "Rejected"
          ? "Ask admissions which replacement is needed. Rejection details are not recorded in this demo."
          : status === "Missing"
            ? required.has(category)
              ? `Your ${category.replaceAll("_", " ")} is missing. Contact your assigned admissions officer.`
              : "Not required by the selected demo policy."
            : "No student action recorded. No file downloads are provided.",
    };
  });
  const requiredRows = rows.filter((r) => r.required),
    received = rows.filter((r) => r.available);
  const officer = data.employees.find((e) => e.id === student.assignedTo);
  // Explicit projection: never pass raw canonical metadata, locks, task notes or credentials to student cards.
  return {
    personal: {
      name: `${student.firstName} ${student.lastName}`,
      code: student.code,
      email: student.email,
      phone: student.phone,
      nationality: student.nationality,
      updated: student.updated,
    },
    officer: officer ? { name: officer.name, team: officer.team } : null,
    applications: apps.map((a: Application) => {
      const university = data.universities.find((u) => u.id === a.universityId);
      return {
        id: a.id,
        university: university?.name ?? "University not recorded",
        country: university?.country ?? "Not recorded",
        program: a.program,
        degree: student.degree,
        intake: a.intake,
        officer:
          data.employees.find((e) => e.id === a.owner)?.name ?? "Not assigned",
        status: applicationDisplay(a.status),
        updated: a.updated,
        submission: "Not recorded",
        next:
          a.status === "Preparing"
            ? "Contact admissions about outstanding requirements."
            : a.status === "Internal Review"
              ? "Await the UAIS staff review."
              : "Contact admissions for the next recorded action.",
      };
    }),
    universityCount: new Set(apps.map((a) => a.universityId)).size,
    applicationCount: apps.length,
    documents: rows,
    counts: {
      available: received.length,
      verified: rows.filter((r) => r.status === "Verified").length,
      missingRequired: requiredRows.filter((r) => r.status === "Missing")
        .length,
      pending: rows.filter(
        (r) => r.status === "Pending Review" || r.status === "Uploaded",
      ).length,
      rejected: rows.filter((r) => r.status === "Rejected").length,
    },
    completeness: requiredRows.length
      ? {
          verified: requiredRows.filter((r) => r.status === "Verified").length,
          total: requiredRows.length,
        }
      : null,
  };
}
