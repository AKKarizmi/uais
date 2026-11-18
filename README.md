# UAIS Web

Next.js 16.4.3 App Router frontend with React 19. The approved dashboard remains at `/admin`; `/` redirects there. Operational routes use the existing shell and a fictional, memory-only demo repository. A refresh resets demo changes. Do not enter real applicant data.

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

Milestone 03 adds [Employee Workspace](http://localhost:3000/employee-workspace). Open **Workspace Preview** on the Admin Dashboard to navigate between Admin Dashboard, Employee Workspace, Employee Management, and the existing Student Portal. The profile menu, sidebar, and Settings also link to the implemented previews.

Choose **Preview workspace as** to filter the shared fictional students, tasks, applications, and document workload. This is demo navigation, never authentication or an account switch. Task and document metadata updates share the existing tab-local repository and reset on refresh. Deadlines use the explicit November 14, 2026 snapshot. Readiness describes document completeness only.

See [Milestone 03 delivery notes](docs/MILESTONE_03.md) for changed files, test results, browser limitations, and the protected preview/PR handoff.
