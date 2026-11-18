# UAIS Web

Next.js 16.4.3 App Router frontend with React 19. `/` redirects to `/login`; the approved dashboard remains at `/admin`. Staff previews and student tracking use the existing shell/components and one fictional, memory-only operational repository. A refresh resets demo changes and preview/sample context. Do not enter real applicant data.

Use Node 24 or newer and the npm lockfile for this continuation:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Browser flows are in `tests/browser`; run `npm run test:browser` in an environment with a supported test browser installed. This command starts the development server if one is not already running. Component tests use jsdom.

See [integration notes](docs/INTEGRATION.md) for the inventory, acceptance details, verification results, and remaining backend work. [API_CONTRACT.md](docs/API_CONTRACT.md) describes proposed endpoints, not an implemented service.

Vercel uses `npm ci` explicitly. Keep preview deployment protection enabled on the `uais` Vercel project. Only fictional data is shipped. Student uploads, account invitations, authentication, browser automation, recording, and autofill are not implemented by this frontend. Milestone 03.5 adds explicitly labeled, in-memory Excel/CSV import previews for fictional records; they never write Desktop files or call a backend.

Milestone 03 now includes `/login`, `/manager-workspace`, the existing `/employee-workspace`, `/track-application`, and `/track-application/results`. Login's **Admin | Manager | Employee** selector changes the explicit **Explore Demo Workspace** destination. Password entry and real sign-in are disabled. **Workspace Preview** links to Admin Dashboard, Manager Workspace, Employee Workspace, Employee Management, the existing Student Portal, Student Application Tracker, and Back to Login. Sidebar visibility is demo presentation, never access control.

Choose **Preview workspace as** to filter the shared fictional students, tasks, applications, and document workload. This is demo navigation, never authentication or an account switch. Task and document metadata updates share the existing tab-local repository and reset on refresh. Deadlines use the explicit November 14, 2026 snapshot. Readiness describes document completeness only.

The Student Tracker never matches ordinary ID/email input to a record or claims to send email. Its verification controls are unavailable until server integration. **Explore Sample Student Results** explicitly selects an existing fictional profile; sample context expires after ten minutes and resets on refresh. Direct results access without that context shows a safe access-required state. No files, credentials, staff notes, or raw canonical metadata are shown by the student-facing cards.

See [complete Milestone 03 notes](docs/MILESTONE_03_FULL.md) for current routes, changed modules, actual verification results, API boundaries, limitations, and protected preview/PR delivery. [Earlier employee-only notes](docs/MILESTONE_03.md) are retained as history.

Milestone 03.5 adds the Desktop-style `/dashboard`, student split view and canonical spreadsheet, four-tab metadata editor, multi-portal university spreadsheet, `/recorder` inspector and `/system-resolver`. The existing `/admin` analytics and Web workspaces remain available. Both grids support keyboard editing, range copy/paste, row/column selection, resizing, frozen columns, presets, sort, filters, pagination and validated bulk changes. Excel exports use real XLSX workbooks; the student export has the Desktop's three sheets and 104 scalar fields. Desktop itself has no student import; the Web import is a demo extension. Reports now offer seven generic UAIS datasets and a self-contained seven-tab HTML export.

There is **no demo email/password**. Open `/login`, select Admin, Manager or Employee, then choose **Explore Demo Workspace**. Vercel's sign-in gate protects the preview deployment; the application's role preview provides no authentication. See the [Desktop/Web parity report](docs/DESKTOP_WEB_PARITY.md) for reference evidence, tests, limits and outstanding browser visual verification.
