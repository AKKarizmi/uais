"use client";
import { PaginatedTable } from "./table";
import {
  Activity as ActivityIcon,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Users,
} from "lucide-react";

import { Pill, Avatar, Panel, KPI } from "./shared";
import type { OperationsContext } from "./workspace";
export function AttendanceFeature(ctx: OperationsContext) {
  const { employees, online } = ctx;
  return (
    <>
      <div className="kpi-grid kpi-small">
        <KPI
          label="Logged in today"
          value={employees.filter((e) => e.loginsToday > 0).length}
          help="At least one login"
          icon={Users}
        />
        <KPI
          label="Total logins today"
          value={employees.reduce((sum, e) => sum + e.loginsToday, 0)}
          help="Events, not work hours"
          icon={CalendarCheck2}
        />
        <KPI
          label="Currently online"
          value={online}
          help="Based on demo presence"
          icon={ActivityIcon}
        />
        <KPI
          label="Absent in demo"
          value={
            employees.filter((e) => e.active && e.loginsToday === 0).length
          }
          help="No login recorded today"
          icon={CircleAlert}
        />
      </div>
      <Panel
        title="Daily login summary"
        sub="Attendance depends on configured organization timezone. Login activity alone cannot prove hours worked."
      >
        <PaginatedTable>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Login count</th>
                <th>First login</th>
                <th>Last seen</th>
                <th>Presence</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="inline-profile">
                        <Avatar name={e.name} size="sm" />
                        <strong>{e.name}</strong>
                      </div>
                    </td>
                    <td>{e.loginsToday}</td>
                    <td>{e.firstLogin}</td>
                    <td>{e.lastSeen}</td>
                    <td>
                      <Pill tone={e.online ? "good" : "neutral"}>
                        {e.online ? "Online" : "Offline"}
                      </Pill>
                    </td>
                    <td>{e.team}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </PaginatedTable>
      </Panel>
      <Panel
        title="Attendance safeguards"
        sub="Required before this becomes a real employee attendance system"
      >
        <ul className="check-list padded">
          <li>
            <CheckCircle2 size={16} /> Store individual successful login events
            and session identifiers.
          </li>
          <li>
            <CheckCircle2 size={16} /> Use timezone-aware daily summaries and
            authenticated last-activity timestamps.
          </li>
          <li>
            <CheckCircle2 size={16} /> Distinguish activity from scheduled
            attendance and paid working hours.
          </li>
          <li>
            <CheckCircle2 size={16} /> Allow authorized corrections with an
            audit trail.
          </li>
        </ul>
      </Panel>
    </>
  );
}
