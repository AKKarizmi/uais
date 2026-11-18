# Milestone 03: Employee Workspace and preview navigation

Implemented in the existing Next.js 16.4.3 repository. The original Admin Dashboard, its snapshot service, charts, filters and existing routes remain intact. The previous uncommitted continuation is preserved as baseline commit `cd0671e` on `feat/milestone-03-employee-workspace`; this feature is committed separately above it.

## Behavior and shared data

- Workspace Preview replaces the obsolete Superuser view menu. Its four actual links are `/admin`, `/employee-workspace`, `/employees`, and `/student-portal`. The same destinations are available in the profile menu and settings. The sidebar distinguishes Employee Workspace from Employee Management and marks the current route.
- The existing Student Portal and its fictional student selector remain; it now has Workspace Preview navigation back to the other interfaces. It accepts no documents or student-ID login.
- Employee Workspace uses the existing shell, dropdowns, buttons, cards, KPI cards, badges, compact tables, pagination and theme. Additional CSS only constrains the new layout and table overflow; no duplicate design system was added.
- The employee selector uses existing active `emp-*` IDs from `lib/operations/mock.ts`. It filters student assignments, task assignees, documents for assigned students, and applications owned by the employee or linked to assigned students. Empty, invalid and deactivated selections produce zero workload instead of falling back to another employee.
- Summary cards count assigned students, non-Done assigned tasks, Uploaded/Pending Review documents for assigned students, and unfinished task/open application deadlines due in the next seven days. The calculation uses the fixed November 14, 2026 UTC demo date, not the operator's clock. Unknown/TBD dates are unscheduled. Readiness is document completeness, not application eligibility. Priority is the highest pending task priority for that student.
- My Students supports search, sorting all seven data columns, pagination, and links to the existing student detail route. My Tasks supports status changes, completion, and student links.
- The queue puts overdue tasks first, then upcoming deadlines, incomplete documents, and applications in Internal Review or Submitted that need follow-up. Every item links to an implemented Tasks, Applications or student detail page.
- Repository subscriptions now live in the existing demo repository. The original React hook subscribes to it, and both new and existing task/document screens use shared update helpers. There is no additional browser storage or persistence system. Refresh resets changes.
- Document metadata reviews check the current mock student lock against the selected demo employee on each update. Conflicting controls are read-only. Required document review transitions also adjust the existing student's verified-count snapshot, without repeated increments for the same status. These are mock workflow checks, not backend authorization, file validation, or a real document review.

All previews state: “Demo navigation only. Real user roles and permissions will be enforced by UAIS Server.” No role labels simulate authentication. The 141-field and 37-document catalogs and API transport boundary remain unchanged. UAIS Desktop continues to own recording, browser automation and autofill.

## Files changed for Milestone 03

| Files | Purpose |
| --- | --- |
| `app/employee-workspace/page.tsx`, `components/employee-workspace/employee-workspace.tsx` | Employee route and interactive dashboard |
| `lib/operations/employee-workspace.ts` | Pure workload, date, priority and queue calculations |
| `lib/operations/service.ts`, `components/operations/demo-state.ts` | Shared subscriptions, task updates and lock-aware mock document reviews |
| `components/dashboard/workspace-preview.tsx`, `app-shell.tsx`, `admin-dashboard.tsx` | Real preview navigation and removal of obsolete handlers |
| `components/operations/{settings,studentPortal,tasks,documents,table,workspace}.tsx` | Shared navigation/actions and existing button reuse |
| `app/globals.css` | Scoped layout constraints for the employee view |
| `tests/employee-workspace.test.ts`, `tests/workspace-navigation.test.tsx` | Filtering, deadlines, queues, subscriptions, editing, links and admin/portal regressions |
| `tests/browser/employee-workspace.spec.ts` | Browser navigation and mobile regression flows, authored but not executed |
| `README.md`, `docs/INTEGRATION.md`, this file | Run instructions and delivery record |

## Verification on November 18, 2026

- `npm ci --cache .npm-cache --prefer-offline --fetch-retries=0 --fetch-timeout=20000`: passed with the existing npm lockfile. Dependency versions were not changed. npm reported 20 dependency advisories (8 moderate, 12 high); no forced upgrades were applied.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- `npm test`: **36 passed across 5 test files**. Includes real Base UI dropdown opening by keyboard and menuitem href assertions in jsdom, employee route rendering, selection/search/sorting, task updates, current mock locks, canonical counts, Student Portal preservation, and existing Admin Dashboard filters.
- `npm run build`: passed; `/employee-workspace` is included in the production route output.
- Browser and responsive tests: **not executed**. Browser runtime discovery returned no connected browser. jsdom tests do not establish browser navigation, visual quality, focus behavior, or responsive rendering. The Playwright flows are included for a connected test environment.
- The existing UAIS Vercel project was rechecked: `ssoProtection.deploymentType` remains `all_except_custom_domains`. Deployment is preview-only, with no promotion or protection changes.

The milestone remains frontend-only. Real Django authentication, authorization, leases, revisions, uploads, and production integration are outside this change.
