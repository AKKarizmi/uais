"use client";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import type { PreviewState } from "@/lib/mock/operations";
export function DesktopFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<PreviewState>("ready");
  return (
    <AppShell state={state} setState={setState}>
      {() => (
        <div className="desktop-content">
          <header className="desktop-heading">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <span className="desktop-ready">Demo · memory only</span>
          </header>
          {state === "loading" ? (
            <p role="status">Loading demo preview…</p>
          ) : state === "error" ? (
            <div role="alert">
              Demo error preview.{" "}
              <button
                className="desktop-button"
                onClick={() => setState("ready")}
              >
                Try again
              </button>
            </div>
          ) : state === "empty" ? (
            <p>
              No records in this state preview. Choose Ready in the profile menu
              to restore the demo.
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </AppShell>
  );
}
