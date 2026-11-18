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

Vercel uses `npm ci` explicitly. Keep preview deployment protection enabled on the `uais` Vercel project. Only fictional data is shipped. Student upload, imports, account invitations, authentication, browser automation, recording, and autofill are not implemented by this frontend.

Milestone 03 now includes `/login`, `/manager-workspace`, the existing `/employee-workspace`, `/track-application`, and `/track-application/results`. Login's **Admin | Manager | Employee** selector changes the explicit **Explore Demo Workspace** destination. Password entry and real sign-in are disabled. **Workspace Preview** links to Admin Dashboard, Manager Workspace, Employee Workspace, Employee Management, the existing Student Portal, Student Application Tracker, and Back to Login. Sidebar visibility is demo presentation, never access control.

Choose **Preview workspace as** to filter the shared fictional students, tasks, applications, and document workload. This is demo navigation, never authentication or an account switch. Task and document metadata updates share the existing tab-local repository and reset on refresh. Deadlines use the explicit November 14, 2026 snapshot. Readiness describes document completeness only.

The Student Tracker never matches ordinary ID/email input to a record or claims to send email. Its verification controls are unavailable until server integration. **Explore Sample Student Results** explicitly selects an existing fictional profile; sample context expires after ten minutes and resets on refresh. Direct results access without that context shows a safe access-required state. No files, credentials, staff notes, or raw canonical metadata are shown by the student-facing cards.

See [complete Milestone 03 notes](docs/MILESTONE_03_FULL.md) for current routes, changed modules, actual verification results, API boundaries, limitations, and protected preview/PR delivery. [Earlier employee-only notes](docs/MILESTONE_03.md) are retained as history.
