"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PublicShell } from "@/components/demo/public-shell";
import { useDemoContext } from "@/components/demo/use-demo-context";
import { activeSample, demoContextStore } from "@/lib/demo/context";
import { useOperationalData } from "@/components/operations/use-operational-data";
import {
  studentFacingResults,
  type RequirementPolicy,
} from "@/lib/operations/student-facing";
import { StudentProfileFields } from "./student-cards";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/shared";
import { PaginatedTable } from "@/components/operations/table";
export default function StudentResults() {
  const context = useDemoContext(),
    data = useOperationalData();
  const [now, setNow] = useState(Date.now),
    [policy, setPolicy] = useState<RequirementPolicy>("recorded"),
    [application, setApplication] = useState("all"),
    [filter, setFilter] = useState("All"),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const id = activeSample(context, now),
    model = id ? studentFacingResults(data, id, policy, application) : null;
  if (!model)
    return (
      <PublicShell student>
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <h1 className="text-2xl font-semibold">
              Verification or sample selection required
            </h1>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {context.sample
                ? "This fictional sample context has expired or is unavailable."
                : "A direct visit does not establish identity or select a student."}{" "}
              Private results will require a server-verified student session.
              This preview contains fictional records only.
            </p>
            <Button render={<Link href="/track-application" />}>
              Return to Student Tracker
            </Button>
          </CardContent>
        </Card>
      </PublicShell>
    );
  const rows = model.documents.filter(
    (d) =>
      filter === "All" ||
      (filter === "Available" && d.available) ||
      (filter === "Missing" && d.status === "Missing" && d.required) ||
      (filter === "Pending Review" &&
        (d.status === "Pending Review" || d.status === "Uploaded")) ||
      (filter === "Rejected" && d.status === "Rejected"),
  );
  return (
    <PublicShell student>
      <div className="student-results grid min-w-0 gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              Student application results
            </h1>
            <p className="text-sm">
              Fictional sample — identity has not been verified. No live
              university portal synchronization.
            </p>
          </div>
          <Button
            variant="outline"
            render={
              <Link
                href="/track-application"
                onClick={() => demoContextStore.exit()}
              />
            }
          >
            Exit sample
          </Button>
        </div>
        {notice && (
          <p
            role="status"
            aria-label="Demo feedback"
            className="rounded border bg-background p-3"
          >
            {notice}
          </p>
        )}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Personal Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <StudentProfileFields personal={model.personal} />
            <Button
              variant="outline"
              onClick={() =>
                setNotice(
                  "Demo correction request only. No message was transmitted.",
                )
              }
            >
              Request Correction
            </Button>
          </CardContent>
        </Card>
        <section
          aria-label="Application totals"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {[
            ["Universities Applied To", model.universityCount],
            ["Total Applications", model.applicationCount],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardHeader>{label}</CardHeader>
              <CardContent>
                <strong className="text-2xl">{value}</strong>
              </CardContent>
            </Card>
          ))}
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">University Applications</h2>
            <p className="text-sm text-muted-foreground">
              Statuses are updates recorded by UAIS staff. The stage guide is
              not a dated event history or a verified university decision.
            </p>
          </CardHeader>
          <CardContent className="grid gap-5">
            {model.applications.length ? (
              model.applications.map((a) => (
                <article
                  key={a.id}
                  className="min-w-0 space-y-3 rounded border p-4"
                >
                  <h3 className="font-medium">
                    {a.university} · {a.program}
                  </h3>
                  <StatusBadge tone={a.status.tone}>
                    {a.status.label}
                  </StatusBadge>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    {[
                      ["Country", a.country],
                      ["Degree", a.degree],
                      ["Intake", a.intake],
                      ["Admissions officer", a.officer],
                      ["Submission date", a.submission],
                      ["Last update", a.updated],
                      ["Next action", a.next],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted-foreground">
                          {label}
                        </dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {a.status.step !== null ? (
                    <ol
                      aria-label={`Stage guide for ${a.program}`}
                      className="flex flex-wrap gap-2 text-xs"
                    >
                      {[
                        "Preparing",
                        "UAIS staff review",
                        "Submitted",
                        "Decision recorded",
                      ].map((stage, index) => (
                        <li
                          key={stage}
                          aria-current={
                            index === a.status.step ? "step" : undefined
                          }
                          className={`rounded border p-2 ${index === a.status.step ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          {stage}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm">
                      This outcome is shown separately from the progress guide.
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p>No applications recorded for this fictional student.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Documents</h2>
            <p className="text-sm text-muted-foreground">
              37 canonical categories; only the selected applicable mock
              requirements are mandatory. Counts come from explicit document
              rows, not the staff profile's legacy readiness snapshot.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <label>
                Requirements
                <select
                  className="ml-2 min-h-10 max-w-full rounded border bg-background"
                  value={policy}
                  onChange={(e) =>
                    setPolicy(e.target.value as RequirementPolicy)
                  }
                >
                  <option value="recorded">Recorded demo requirements</option>
                  <option value="program-sample">
                    Provisional program/country example
                  </option>
                </select>
              </label>
              <label>
                Requirement application
                <select
                  className="ml-2 min-h-10 max-w-full rounded border bg-background"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                >
                  <option value="all">All recorded applications</option>
                  {model.applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.university} · {a.program}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm">
              Provisional examples add passport/transcript per application, a
              degree certificate for Master's study, and an English certificate
              for a UK application. These are fictional demonstration rules, not
              real university policies.
            </p>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Available / Received", model.counts.available],
                ["Verified", model.counts.verified],
                ["Missing Required", model.counts.missingRequired],
                ["Pending Review", model.counts.pending],
              ].map(([label, value]) => (
                <div key={label} className="rounded border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p>
              {model.completeness
                ? `${model.completeness.verified}/${model.completeness.total} required documents verified`
                : "No applicable requirements recorded. Completeness cannot yet be assessed."}
            </p>
            {model.completeness && (
              <progress
                className="w-full"
                aria-label="Required document completeness"
                value={model.completeness.verified}
                max={model.completeness.total}
              />
            )}
            <label>
              Document filter
              <select
                className="ml-2 min-h-10 rounded border bg-background"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "All",
                  "Available",
                  "Missing",
                  "Pending Review",
                  "Rejected",
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <PaginatedTable key={`${id}-${policy}-${application}-${filter}`}>
              <table>
                <thead>
                  <tr>
                    {[
                      "Document category",
                      "Requirement",
                      "Status",
                      "Last updated",
                      "File indicator",
                      "Next action",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.category}>
                      <td>{d.label}</td>
                      <td>
                        {d.required ? "Required" : "Optional / not required"}
                      </td>
                      <td>
                        <StatusBadge>{d.status}</StatusBadge>
                      </td>
                      <td>{d.updated}</td>
                      <td>
                        {d.available
                          ? "Receipt metadata only; no file provided"
                          : "No receipt recorded"}
                      </td>
                      <td className="max-w-md whitespace-normal">{d.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PaginatedTable>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Contact Admissions</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              {model.officer
                ? `${model.officer.name} · ${model.officer.team}`
                : "No admissions officer assigned."}
            </p>
            <p className="text-sm">
              Contact your admissions office through its established channels.
              Buttons below only demonstrate feedback; no messages are sent.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setNotice(
                    "Demo assistance request only. No message was transmitted.",
                  )
                }
              >
                Request Assistance
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setNotice(
                    "Demo information correction only. No message was transmitted.",
                  )
                }
              >
                Request Information Correction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
