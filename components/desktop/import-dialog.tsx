"use client";
import { useState } from "react";
import { Modal } from "@/components/operations/shared";
import { demoRepository } from "@/lib/operations/service";
import {
  previewStudentImport,
  previewUniversityImport,
  type ImportPlan,
} from "@/lib/desktop/imports";
import { readSpreadsheet } from "@/lib/desktop/spreadsheets";
export function ImportDialog({
  kind,
  onClose,
  notify,
}: {
  kind: "students" | "universities";
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  return (
    <Modal
      title={`Import ${kind} — fictional data only`}
      onClose={onClose}
      foot={
        <>
          <button className="desktop-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="desktop-button primary"
            disabled={!plan || busy}
            onClick={() => {
              const result = plan!.commit();
              if (result.ok) {
                notify(result.message);
                onClose();
              } else {
                setError(result.message);
                setPlan(null);
              }
            }}
          >
            Apply validated demo preview
          </button>
        </>
      }
    >
      <div className="desktop-form">
        <p>
          {kind === "students"
            ? "Web demo extension: Desktop has no student import. Use Student ID, Revision and canonical-name headers from a Web export. Existing IDs are immutable; new records must retain their Desktop STU-XXXXXXXX ID. No upload/file fields."
            : "Use Desktop university headers: Name and Portal, followed by optional Country, City, Website, Notes, Portal Name, Purpose, Portal Family, Portal Family Source, Active, Portal Active, Recording Status, Automation Status, Portal Notes. Blank optional cells leave existing values unchanged; <CLEAR> clears optional text."}
        </p>
        <label>
          Excel or CSV file
          <input
            type="file"
            accept=".xlsx,.csv"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              setPlan(null);
              setError("");
              if (!file) return;
              setBusy(true);
              try {
                const rows = await readSpreadsheet(file);
                const next =
                  kind === "students"
                    ? previewStudentImport(demoRepository, rows)
                    : previewUniversityImport(demoRepository, rows);
                setPlan(next);
                setPage(0);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {busy && <p role="status">Reading and validating workbook…</p>}
        {error && (
          <p role="alert" className="desktop-error">
            {error}
          </p>
        )}
        {plan && (
          <div>
            <h3>Validated preview</h3>
            <ul>
              {plan.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="document-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    {Object.keys(plan.rows[0] ?? {}).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.slice(page * 25, (page + 1) * 25).map((row, i) => (
                    <tr key={i}>
                      <td>{page * 25 + i + 2}</td>
                      {Object.keys(plan.rows[0] ?? {}).map((k) => (
                        <td key={k}>{row[k] || "(blank)"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sheet-pagination">
              <button disabled={!page} onClick={() => setPage(0)}>
                First
              </button>
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Preview page {page + 1} / {Math.ceil(plan.rows.length / 25)}
              </span>
              <button
                disabled={(page + 1) * 25 >= plan.rows.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
              <button
                disabled={(page + 1) * 25 >= plan.rows.length}
                onClick={() => setPage(Math.ceil(plan.rows.length / 25) - 1)}
              >
                Last
              </button>
            </div>
            <p>
              Commit rechecks that the records have not changed since this
              preview. No records are saved until you apply it.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
