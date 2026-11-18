# Continuation integration

## Inventory and decisions

The connected Git repository is `web/uais`, not the sibling extracted continuation. Its installed framework is **Next.js 16.4.3**, React 19, Tailwind 4, with App Router and existing Base UI/shadcn primitives. Before integration it had only `/` (redirect) and `/admin`. Students and administration navigation opened planned-feature dialogs; no student directory or student-detail route existed in this checkout.

The ZIP contains 22 entries. Its standalone `OperationsApp.tsx` duplicated the shell, dashboard, navigation, role preview, modal system, and demo data. The original dashboard components and dashboard data service remain intact. Only the shell navigation, breadcrumb, explanatory copy, and persistent banner were updated. The standalone shell and dashboard were discarded; unused draft shell styles were removed. New content styling is scoped to `.operations-feature` and cannot select the existing dashboard.

Operational views live in `components/operations/{students,universities,applications,tasks,documents,reports,employees,attendance,activity,settings,studentPortal}.tsx`. `workspace.tsx` coordinates mock state and forms. `lib/operations/service.ts` supplies a typed fictional repository. Its tab-local state survives route navigation and resets on refresh. The original dashboard deliberately remains a separate fixed snapshot, rather than changing its approved figures or charts to match the continuation's smaller dataset.

The npm lockfile is authoritative for this integration and Vercel explicitly installs with `npm ci`. The original pnpm files are retained as historical project configuration; their lockfile does not contain the added test tools. Use the npm commands in the README.

## Frontend coverage

| Area | Implemented behavior |
| --- | --- |
| Routes | `/admin`, `/students`, `/students/[id]`, `/universities`, `/applications`, `/tasks`, `/documents`, `/reports`, `/employees`, `/attendance`, `/activity`, `/settings`, `/student-portal` |
| Students | Canonical catalog reference, detail tabs, mock editable basic fields, assignment and bulk assignment, validation, lock indicators and disabled conflicting edits |
| Universities | Separate HTTP(S) website and portal actions; inactive portal actions disabled; mock editing and activation |
| Tasks | Creation, reassignment, status updates, filtering, table and board views |
| Documents | Canonical categories, mock review status changes, conflicting student lock checks; no file transfers |
| Employees | Mock creation and role/activation controls; explicit explanation that no account or invitation is created |
| Attendance | Fictional snapshot counts, first login, last seen and presence; expressly distinguished from hours worked |
| Reports | Filtered fictional datasets, standalone HTML search/keyboard sorting/print and escaped content, formula-guarded CSV |
| Portal | Selectable fictional profiles; no ID login, real uploads, credentials, or real applicant input |
| Accessibility | Real navigation links, active-route cues, existing focus-managed dialogs, keyboard-operable native controls, named search controls, table pagination and overflow regions, responsive layouts |
| UI states | Profile-menu loading/error/empty previews, retry/restore controls, filtered empty results and missing-student states |

The copied catalogs are byte-identical to the ZIP: 141 fields with 141 unique canonical names and metadata paths, and 37 document categories. Every document `legacy_canonical` value resolves to a field name. This validates the supplied release's consistency; it does not independently authenticate its provenance against an unavailable Desktop repository.

## Verification

- `npm install`: completed in the connected repository after network permission approval.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- `npm test`: 20 unit/component tests passed, including conflicts, session isolation, catalogs, locks, name validation, complete pagination, HTML escaping/search/keyboard sorting and CSV formula protection.
- `npm run build`: passed and generated all routes, including the dynamic student route.
- HTTP smoke: all 13 checked routes returned 200, including `/students/stu-1` and the original `/admin`.
- Browser flows: authored in `tests/browser/flows.spec.ts`, **not executed**. Browser runtime discovery returned no available browser. Visual QA, browser navigation/task tests and mobile layout QA remain unverified.
- Dependency installation reported 12 advisories (2 low, 10 moderate). No forced dependency upgrades were applied. An offline audit returned no advisories and is not treated as evidence that the installation advisories are resolved.

## Backend boundary and deployment

`API_CONTRACT.md` explicitly describes proposed, unimplemented Django endpoints. There is no backend URL, OpenAPI response schema, authenticated session or server implementation here. Consequently the UI remains mock-only. The API transport foundation distinguishes 401/403/409/412 and passes `If-Match`, but is not connected to the UI and does not claim server permissions, locks or authenticated writes. Production integration still needs DTO validation, CSRF/authentication, revision and lease enforcement, permissions, private document storage, authoritative attendance and audit events, and integration tests against the real server.

No role selector protects data. Student IDs never authenticate anyone. Recording, browser automation and future autofill remain owned by UAIS Desktop. Imports and uploads are disabled, with no real file inputs or transfers.

The existing `akkarizmis-projects/uais` Vercel project was inspected before deployment. It has `ssoProtection.deploymentType = all_except_custom_domains`; preview deployment domains require Vercel authentication. Deploy only a preview, preserve that protection, and do not promote this milestone to production or attach a public custom domain. Browser verification and backend/security work remain prerequisites to real applicant use.

Protected preview deployed successfully: https://uais-lxxhnabte-akkarizmis-projects.vercel.app . Vercel returned `READY` for deployment `dpl_5mhsKfovr5yt1CLFCeRfVw8ehW5C`. An unauthenticated request to `/admin` returned HTTP 302 to `vercel.com/sso-api`, confirming the sign-in gate. The production deployment was not promoted.
