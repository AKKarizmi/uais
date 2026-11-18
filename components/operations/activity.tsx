"use client";

import { Panel } from "./shared";
import type { OperationsContext } from "./workspace";
export function ActivityFeature(ctx: OperationsContext) {
  const { activity } = ctx;
  return (
    <Panel
      title="Activity events"
      sub="Session-local illustration. In production, records must come from server audit logs."
    >
      <div className="timeline activity-long">
        {activity.map((a) => (
          <div key={a.id}>
            <b>{a.by}</b> {a.action}
            <span>{a.object}</span>
            <small>{a.when}</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}
