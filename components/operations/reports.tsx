"use client";
import { PaginatedTable } from "./table";
import { ShieldCheck } from "lucide-react";

import { Field, Panel, Empty } from "./shared";
import type { OperationsContext } from "./workspace";
import { downloadText, reportBundleHtml } from "@/lib/operations/reports";
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
        className="report-builder"
        title="Report builder"
        sub="Seven UAIS datasets with search, sorting, printable offline HTML and guarded CSV. Attendance is presence, not work hours."
        actions={
          <div className="report-export">
            <button
              className="desktop-button"
              onClick={() =>
                downloadText(
                  "uais-seven-datasets-fictional.html",
                  reportBundleHtml(allReports),
                  "text/html;charset=utf-8",
                )
              }
            >
              Export all seven tabs · HTML
            </button>
            <small>Includes all datasets and rows.</small>
          </div>
        }
      >
        <div
          className="desktop-tabs"
          role="tablist"
          aria-label="Report datasets"
        >
          {Object.keys(allReports).map((name, i, names) => (
            <button
              key={name}
              role="tab"
              id={`report-tab-${i}`}
              aria-controls="report-dataset"
              tabIndex={name === reportType ? 0 : -1}
              aria-selected={name === reportType}
              onClick={() => {
                setReportType(name);
                setReportQuery("");
              }}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? names.length - 1
                        : (i +
                            (e.key === "ArrowRight" ? 1 : names.length - 1)) %
                          names.length;
                  setReportType(names[next]);
                  setReportQuery("");
                  document.getElementById(`report-tab-${next}`)?.focus();
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>
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
        <div
          role="tabpanel"
          id="report-dataset"
          aria-labelledby={`report-tab-${Object.keys(allReports).indexOf(reportType)}`}
        >
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
        </div>
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
