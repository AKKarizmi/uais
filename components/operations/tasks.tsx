"use client";
import { PaginatedTable } from "./table";
import { Search } from "lucide-react";
import type { TaskStatus } from "@/lib/operations/types";

import { TASK_STATUSES, trimName, Pill, Panel } from "./shared";
import type { OperationsContext } from "./workspace";
export function TasksFeature(ctx: OperationsContext) {
  const {
    filteredTasks,
    employees,
    setTasks,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    taskView,
    setTaskView,
    stu,
    log,
  } = ctx;
  return (
    <>
      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and employees…"
          />
        </label>
        <select
          aria-label="Filter records by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          {TASK_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="view-toggle">
          <button
            className={taskView === "table" ? "selected" : ""}
            onClick={() => setTaskView("table")}
          >
            Table
          </button>
          <button
            className={taskView === "board" ? "selected" : ""}
            onClick={() => setTaskView("board")}
          >
            Board
          </button>
        </div>
      </div>
      {taskView === "table" ? (
        <Panel
          title="Assignment queue"
          sub="Task status is separate from university submission status."
        >
          <PaginatedTable>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Student</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                      <small className="block-muted">{t.notes}</small>
                    </td>
                    <td>
                      {t.studentId
                        ? trimName(stu(t.studentId))
                        : "Administration"}
                    </td>
                    <td>
                      <select
                        className="table-select"
                        aria-label={`Assign task ${t.title}`}
                        value={t.employeeId}
                        onChange={(e) => {
                          setTasks((x) =>
                            x.map((y) =>
                              y.id === t.id
                                ? { ...y, employeeId: e.target.value }
                                : y,
                            ),
                          );
                          log("reassigned task", t.id);
                        }}
                      >
                        {employees
                          .filter((e) => e.active)
                          .map((e) => (
                            <option value={e.id} key={e.id}>
                              {e.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <Pill
                        tone={
                          t.priority === "Urgent"
                            ? "bad"
                            : t.priority === "High"
                              ? "warn"
                              : "neutral"
                        }
                      >
                        {t.priority}
                      </Pill>
                    </td>
                    <td>{t.due}</td>
                    <td>
                      <select
                        className="table-select"
                        aria-label={`Status of ${t.title}`}
                        value={t.status}
                        onChange={(e) => {
                          setTasks((x) =>
                            x.map((y) =>
                              y.id === t.id
                                ? { ...y, status: e.target.value as TaskStatus }
                                : y,
                            ),
                          );
                          log("updated task status", t.id);
                        }}
                      >
                        {TASK_STATUSES.map((st) => (
                          <option key={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PaginatedTable>
        </Panel>
      ) : (
        <div className="board-grid">
          {TASK_STATUSES.map((status) => (
            <section key={status} className="board-col">
              <div className="board-head">
                <strong>{status}</strong>
                <Pill>
                  {filteredTasks.filter((t) => t.status === status).length}
                </Pill>
              </div>
              {filteredTasks
                .filter((t) => t.status === status)
                .map((t) => (
                  <div className="task-card" key={t.id}>
                    <strong>{t.title}</strong>
                    <small>
                      {t.studentId
                        ? trimName(stu(t.studentId))
                        : "Administration"}
                    </small>
                    <div>
                      <Pill>{t.priority}</Pill>
                      <span>{t.due}</span>
                    </div>
                    <select
                      value={t.status}
                      aria-label={`Move ${t.title}`}
                      onChange={(e) =>
                        setTasks((x) =>
                          x.map((y) =>
                            y.id === t.id
                              ? { ...y, status: e.target.value as TaskStatus }
                              : y,
                          ),
                        )
                      }
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
