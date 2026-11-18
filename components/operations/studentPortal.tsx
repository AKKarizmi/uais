"use client";
import {
  StudentProfileFields,
  ApplicationStatus,
} from "@/components/student-tracking/student-cards";
import { WorkspacePreview } from "@/components/dashboard/workspace-preview";
import { PaginatedTable } from "./table";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { trimName, Pill, Field, Panel, Empty } from "./shared";
import type { OperationsContext } from "./workspace";
export function StudentPortalFeature(ctx: OperationsContext) {
  const {
    students,
    applications,
    documents,
    studentPortalId,
    setStudentPortalId,
    stu,
    uni,
    notify,
    rowButton,
  } = ctx;
  const s = stu(studentPortalId) ?? students[0];
  const apps = applications.filter((a) => a.studentId === s.id);
  const docs = documents.filter((d) => d.studentId === s.id);
  return (
    <div className="student-portal">
      <div className="mb-4 flex justify-end">
        <WorkspacePreview />
      </div>
      <div className="portal-welcome">
        <span className="portal-logo">
          <GraduationCap size={22} />
        </span>
        <div>
          <span className="eyebrow">
            UAIS STUDENT PORTAL — UI DEMONSTRATION
          </span>
          <h2>Welcome, {s.firstName}</h2>
          <p>
            Track your applications, review personal details and see requested
            documents.
          </p>
        </div>
      </div>
      <div className="privacy-note">
        <ShieldCheck size={18} />
        <div>
          <strong>A student ID alone is never a login credential.</strong>
          <p>
            Production students will use a secure activation flow and
            authenticated sessions. This is a fictional preview, not an active
            student account.
          </p>
        </div>
      </div>
      <div className="toolbar">
        <Field label="Demo student profile">
          <select
            value={studentPortalId}
            onChange={(e) => setStudentPortalId(e.target.value)}
          >
            {students.map((s) => (
              <option value={s.id} key={s.id}>
                {s.code} — {trimName(s)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="two-col">
        <Panel
          title="My profile"
          sub="To correct your details, contact admissions."
        >
          <StudentProfileFields
            personal={{
              name: trimName(s),
              code: s.code,
              email: s.email,
              phone: s.phone,
              nationality: s.nationality,
              updated: s.updated,
            }}
          />
          <button
            className="btn btn-light"
            onClick={() =>
              notify(
                "Correction request is a demonstration; no message was sent.",
              )
            }
          >
            Request a correction
          </button>
        </Panel>
        <Panel
          title="My application status"
          sub="Statuses reflect manually recorded internal progress, not live university decisions."
        >
          {apps.length ? (
            apps.map((a) => (
              <div className="portal-application" key={a.id}>
                <div>
                  <strong>{uni(a.universityId)?.name}</strong>
                  <small>
                    {a.program} · {a.intake}
                  </small>
                </div>
                <ApplicationStatus value={a.status} />
              </div>
            ))
          ) : (
            <Empty text="No university applications recorded." />
          )}
        </Panel>
      </div>
      <Panel
        title="My document requests"
        sub="Uploading is disabled until authenticated storage, scanning and review workflows are connected."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.category.replace(/_/g, " ")}</td>
                  <td>
                    <Pill>{d.status}</Pill>
                  </td>
                  <td>
                    {d.status === "Missing" || d.status === "Rejected" ? (
                      rowButton("Upload (planned)", () =>
                        notify(
                          "Secure uploads are not connected. No file was requested or transferred.",
                        ),
                      )
                    ) : (
                      <span className="muted">No action required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
        {docs.length === 0 && (
          <Empty text="No document requests are configured for this demo record." />
        )}
      </Panel>
    </div>
  );
}
