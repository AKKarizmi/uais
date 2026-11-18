"use client";
import { PaginatedTable } from "./table";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  ClipboardList,
  Search,
  Users,
} from "lucide-react";
import type { Employee } from "@/lib/operations/types";

import { Pill, Avatar, Panel, KPI } from "./shared";
import type { OperationsContext } from "./workspace";
export function EmployeesFeature(ctx: OperationsContext) {
  const {
    tasks,
    employees,
    setEmployees,
    query,
    setQuery,
    setModal,
    setDraft,
    log,
    online,
    rowButton,
  } = ctx;
  const list = employees.filter((e) =>
    `${e.name} ${e.email} ${e.role} ${e.team}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="kpi-grid kpi-small">
        <KPI
          label="Total employees"
          value={employees.length}
          help="Fictional accounts"
          icon={Users}
        />
        <KPI
          label="Active employees"
          value={employees.filter((e) => e.active).length}
          help="Not suspended"
          icon={CheckCircle2}
        />
        <KPI
          label="Online now"
          value={online}
          help="Sample presence"
          icon={ActivityIcon}
        />
        <KPI
          label="Team members with tasks"
          value={new Set(tasks.map((t) => t.employeeId)).size}
          help="Assigned work"
          icon={ClipboardList}
        />
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees or roles…"
          />
        </label>
      </div>
      <Panel
        title="Employee management"
        sub="Superuser operations are a UI demonstration. Real account changes require secure backend authorization."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Team</th>
                <th>Active</th>
                <th>Presence</th>
                <th>Open tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="inline-profile">
                      <Avatar name={e.name} size="sm" />
                      <div>
                        <strong>{e.name}</strong>
                        <small className="block-muted">{e.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="table-select"
                      aria-label={`Role of ${e.name}`}
                      value={e.role}
                      onChange={(ev) => {
                        setEmployees((x) =>
                          x.map((y) =>
                            y.id === e.id
                              ? {
                                  ...y,
                                  role: ev.target.value as Employee["role"],
                                }
                              : y,
                          ),
                        );
                        log("changed demo employee role", e.name);
                      }}
                    >
                      {[
                        "Superuser",
                        "Manager",
                        "Admissions Officer",
                        "Document Reviewer",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>{e.team}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${e.name} account enabled`}
                      checked={e.active}
                      disabled={e.id === "emp-1"}
                      onChange={(ev) => {
                        setEmployees((x) =>
                          x.map((y) =>
                            y.id === e.id
                              ? {
                                  ...y,
                                  active: ev.target.checked,
                                  online: ev.target.checked ? y.online : false,
                                }
                              : y,
                          ),
                        );
                        log("changed demo account state", e.name);
                      }}
                    />
                  </td>
                  <td>
                    <Pill tone={e.online ? "good" : "neutral"}>
                      {e.online ? "Online" : "Offline"}
                    </Pill>
                  </td>
                  <td>
                    {
                      tasks.filter(
                        (t) => t.employeeId === e.id && t.status !== "Done",
                      ).length
                    }
                  </td>
                  <td>
                    {rowButton("Details", () => {
                      setDraft({ id: e.id });
                      setModal("employee-detail");
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
