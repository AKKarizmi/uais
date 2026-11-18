"use client";
import { PaginatedTable } from "./table";
import { ShieldCheck } from "lucide-react";

import { Field, Panel, Empty } from "./shared";
import type { OperationsContext } from "./workspace";
export function ReportsFeature(ctx: OperationsContext) {
  const {
    reportType,
    setReportType,
    reportQuery,
    setReportQuery,
    allReports,
    reportColumns,
    reportRows,
  } = ctx;
  return (
    <>
      <Panel
        title="Report builder"
        sub="Interactive HTML reports remain a separate, configurable module; detailed definitions can be added in a later release."
      >
        <div className="report-config">
          <Field label="Report dataset">
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReportQuery("");
              }}
            >
              {Object.keys(allReports).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Filter rows">
            <input
              aria-label="Filter by any column…"
              placeholder="Filter by any column…"
              value={reportQuery}
              onChange={(e) => setReportQuery(e.target.value)}
            />
          </Field>
          <div className="report-summary">
            <strong>{reportRows.length}</strong>
            <span>matching rows</span>
            <small>Export includes current filters</small>
          </div>
        </div>
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                {reportColumns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row, i) => (
                <tr key={i}>
                  {reportColumns.map((c) => (
                    <td key={c}>{String(row[c] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
        {reportRows.length === 0 && (
          <Empty text="No matching report records." />
        )}
        <div className="panel-bottom">
          Generated HTML includes client-side search, sortable columns, and
          print. No network connection is required to open it.
        </div>
      </Panel>
      <div className="privacy-note">
        <ShieldCheck size={18} />
        <div>
          <strong>Export confidentiality</strong>
          <p>
            Standalone HTML contains its data in the file and cannot enforce
            login permissions. Only fictional data is included here. Production
            exports will require permission checks, redaction, expiry and
            handling controls.
          </p>
        </div>
      </div>
    </>
  );
}
