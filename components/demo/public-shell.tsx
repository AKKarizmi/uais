import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
export function PublicShell({
  children,
  student = false,
}: {
  children: ReactNode;
  student?: boolean;
}) {
  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <a href="#public-content" className="skip-link">
        Skip to content
      </a>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-5">
        <Link
          href={student ? "/track-application" : "/login"}
          className="flex items-center gap-2 font-semibold"
        >
          <span className="brand-mark">
            <GraduationCap aria-hidden="true" />
          </span>
          UAIS {student ? "Student Tracker" : "Operations Hub"}
        </Link>
        <Link
          href={student ? "/login" : "/track-application"}
          className="text-sm underline"
        >
          {student ? "Back to Staff Login" : "Student Application Tracker"}
        </Link>
      </header>
      <main
        id="public-content"
        className="mx-auto w-full max-w-6xl px-4 pb-10"
        tabIndex={-1}
      >
        <p className="mb-5 rounded-md border bg-background p-3 text-sm">
          Fictional demonstration only. No real sign-in, identity verification,
          or applicant data.
        </p>
        {children}
      </main>
    </div>
  );
}
