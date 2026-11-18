"use client";
import { PaginatedTable } from "./table";
import { Search } from "lucide-react";
import type { StudentStatus } from "@/lib/operations/types";

import { APP_STATUSES, trimName, Panel, Empty } from "./shared";
import type { OperationsContext } from "./workspace";
export function ApplicationsFeature(ctx: OperationsContext) {
  const {
    router,
    applications,
    setApplications,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    employee,
    stu,
    uni,
    isLockedOther,
    log,
  } = ctx;
  const list = applications.filter(
    (a) =>
      `${trimName(stu(a.studentId))} ${uni(a.universityId)?.name ?? ""} ${a.program}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "All" || a.status === statusFilter),
  );
  return (
    <>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, university, program…"
          />
        </label>
        <select
          aria-label="Filter records by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          {APP_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <Panel
        title="Application tracker"
        sub="Application records have independent statuses. Changes are local demonstrations only."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>University</th>
                <th>Program</th>
                <th>Intake</th>
                <th>Deadline</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => {
                        router.push(`/students/${a.studentId}`);
                      }}
                    >
                      {trimName(stu(a.studentId))}
                    </button>
                  </td>
                  <td>{uni(a.universityId)?.name ?? "Unknown"}</td>
                  <td>{a.program}</td>
                  <td>{a.intake}</td>
                  <td>{a.deadline}</td>
                  <td>{employee(a.owner)}</td>
                  <td>
                    <select
                      className="table-select"
                      value={a.status}
                      aria-label={`Application status ${a.id}`}
                      disabled={Boolean(
                        stu(a.studentId) && isLockedOther(stu(a.studentId)!),
                      )}
                      onChange={(e) => {
                        const next = e.target.value as StudentStatus;
                        setApplications((as) =>
                          as.map((x) =>
                            x.id === a.id ? { ...x, status: next } : x,
                          ),
                        );
                        log("updated application stage", a.id);
                      }}
                    >
                      {APP_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
        {!list.length && <Empty text="No matching applications." />}
      </Panel>
    </>
  );
}
