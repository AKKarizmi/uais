"use client";
import { PaginatedTable } from "./table";
import { ExternalLink, Search } from "lucide-react";

import { validUrl, Pill, Panel } from "./shared";
import type { OperationsContext } from "./workspace";
export function UniversitiesFeature(ctx: OperationsContext) {
  const {
    universities,
    setUniversities,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    setModal,
    setDraft,
    employee,
    log,
    rowButton,
  } = ctx;
  const list = universities.filter(
    (u) =>
      `${u.name} ${u.country} ${u.family}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "All" || (statusFilter === "Active") === u.active),
  );
  return (
    <>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search universities and countries…"
          />
        </label>
        <select
          aria-label="Filter records by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <span className="toolbar-count">{list.length} institutions</span>
      </div>
      <Panel
        title="University directory"
        sub="Separate official website and admission portal links; unknown portal families remain unclassified."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>University</th>
                <th>Country</th>
                <th>Portal family</th>
                <th>Programs</th>
                <th>Assigned officer</th>
                <th>Active</th>
                <th>Links</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="university-title">
                      <span className="university-logo">{u.initials}</span>
                      <div>
                        <strong>{u.name}</strong>
                        <small>Intake: {u.intake}</small>
                      </div>
                    </div>
                  </td>
                  <td>{u.country}</td>
                  <td>
                    <Pill>{u.family}</Pill>
                  </td>
                  <td>{u.programs}</td>
                  <td>{employee(u.assignedTo)}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Active status of ${u.name}`}
                      checked={u.active}
                      onChange={(e) => {
                        setUniversities((a) =>
                          a.map((x) =>
                            x.id === u.id
                              ? { ...x, active: e.target.checked }
                              : x,
                          ),
                        );
                        log("changed university status", u.name);
                      }}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      {validUrl(u.website) ? (
                        <a
                          className="btn btn-light btn-sm"
                          href={u.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website <ExternalLink size={13} />
                        </a>
                      ) : (
                        <Pill tone="bad">Invalid URL</Pill>
                      )}
                      {u.active && validUrl(u.portal) ? (
                        <a
                          className="btn btn-light btn-sm"
                          href={u.portal}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Portal <ExternalLink size={13} />
                        </a>
                      ) : (
                        <Pill tone="warn">
                          {u.active ? "No portal" : "Portal inactive"}
                        </Pill>
                      )}
                    </div>
                  </td>
                  <td>
                    {rowButton("Edit", () => {
                      setDraft({
                        id: u.id,
                        name: u.name,
                        country: u.country,
                        website: u.website,
                        portal: u.portal,
                        family: u.family,
                      });
                      setModal("university-edit");
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaginatedTable>
      </Panel>
    </>
  );
}
