"use client";
import { PaginatedTable } from "./table";
import {
  BookOpen,
  CircleAlert,
  FileCheck2,
  FileText,
  Search,
} from "lucide-react";
import type { Doc } from "@/lib/operations/types";
import { demoRepository, reviewDemoDocument } from '@/lib/operations/service';

import { trimName, Pill, Panel, KPI } from "./shared";
import type { OperationsContext } from "./workspace";
export function DocumentsFeature(ctx: OperationsContext) {
  const {
    documents,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    employee,
    stu,
    log,
    notify,
    canonicalDocs,
  } = ctx;
  const list = documents.filter(
    (d) =>
      `${trimName(stu(d.studentId))} ${d.category} ${d.status}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "All" || d.status === statusFilter),
  );
  return (
    <>
      <div className="kpi-grid kpi-small">
        <KPI
          label="Document categories"
          value={canonicalDocs.length}
          help="UAIS Desktop canonical"
          icon={BookOpen}
        />
        <KPI
          label="Awaiting review"
          value={documents.filter((d) => d.status === "Pending Review").length}
          help="Uploaded and pending"
          icon={FileCheck2}
        />
        <KPI
          label="Rejected"
          value={documents.filter((d) => d.status === "Rejected").length}
          help="Requires a new version"
          icon={CircleAlert}
        />
        <KPI
          label="Missing"
          value={documents.filter((d) => d.status === "Missing").length}
          help="Demo incomplete records"
          icon={FileText}
        />
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents or students…"
          />
        </label>
        <select
          aria-label="Filter records by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          {[
            "Missing",
            "Uploaded",
            "Pending Review",
            "Verified",
            "Rejected",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <Panel
        title="Document review queue"
        sub="No files are transferred in this prototype. Real document requirements remain configurable."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Canonical category</th>
                <th>Status</th>
                <th>Reviewer</th>
                <th>Updated</th>
                <th>Review action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{trimName(stu(d.studentId))}</td>
                  <td>{d.category.replace(/_/g, " ")}</td>
                  <td>
                    <Pill>{d.status}</Pill>
                  </td>
                  <td>{employee(d.reviewer)}</td>
                  <td>{d.updated}</td>
                  <td>
                    <select
                      aria-label={`Review ${d.id}`}
                      value={d.status}
                      className="table-select"
                      onChange={(e) => {
                        const result=reviewDemoDocument(demoRepository,d.id,e.target.value as Doc['status'],'emp-1');
                        notify(result.message);
                        if(result.ok)log("changed document review", d.id);
                      }}
                    >
                      {[
                        "Missing",
                        "Uploaded",
                        "Pending Review",
                        "Verified",
                        "Rejected",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
      </Panel>
      <p className="hint">
        Students can submit new documents to a separate pending upload queue in
        the future without modifying locked records.
      </p>
    </>
  );
}
