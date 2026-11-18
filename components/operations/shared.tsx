"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import React from "react";
import { CircleAlert } from "lucide-react";
import type {
  Role,
  Student,
  StudentStatus,
  TaskStatus,
} from "@/lib/operations/types";

export const APP_STATUSES: StudentStatus[] = [
  "Lead",
  "Preparing",
  "Internal Review",
  "Submitted",
  "Decision Received",
];
export const TASK_STATUSES: TaskStatus[] = [
  "To do",
  "In progress",
  "Blocked",
  "Done",
];
export const trimName = (student?: Student) =>
  student ? `${student.firstName} ${student.lastName}` : "Unknown student";
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
export const variant = (s: string) =>
  /Verified|Submitted|Decision Received|Done|Online|Active|Available|Granted/.test(
    s,
  )
    ? "good"
    : /Rejected|Blocked|Overdue|Suspended|Expired/.test(s)
      ? "bad"
      : /Pending|Review|Preparing|In progress|Locked/.test(s)
        ? "warn"
        : "neutral";
export const roleName: Record<Role, string> = {
  superuser: "Superuser",
  employee: "Employee",
  student: "Student",
};
export const validUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "good" | "bad" | "warn" | "neutral";
}) {
  return (
    <span className={`pill pill-${tone ?? variant(String(children))}`}>
      {children}
    </span>
  );
}
export function Avatar({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "sm";
}) {
  return (
    <span className={`avatar ${size === "sm" ? "avatar-sm" : ""}`}>
      {initials(name)}
    </span>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
  foot,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  foot?: React.ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="operations-feature max-h-[85vh] overflow-auto sm:max-w-2xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Fictional data only. Changes stay in this browser tab.
        </DialogDescription>
        <div className="modal-body">{children}</div>
        {foot && <footer>{foot}</footer>}
      </DialogContent>
    </Dialog>
  );
}
export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow || "UAIS OPERATIONS HUB"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export function Panel({
  title,
  sub,
  children,
  actions,
  className = "",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function KPI({
  label,
  value,
  help,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  help: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <small>{help}</small>
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <CircleAlert size={19} />
      {text}
    </div>
  );
}
export const fmt = (n: number) => n.toLocaleString("en-US");
