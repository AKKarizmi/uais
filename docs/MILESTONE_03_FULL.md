# Milestone 03: complete staff and student demo journeys

This extends the existing `AKKarizmi/uais` Next.js 16.4.3 / React 19 application on branch `feat/m03-staff-manager-student-tracking`. It builds on the earlier Employee Workspace work without replacing the approved Admin Dashboard. There are no new dependencies or backend endpoints.

## Implemented journeys

| Route / area | Behavior |
| --- | --- |
| `/` | Redirects to `/login` |
| `/login` | Native, keyboard-operable Admin/Manager/Employee radio segments, role descriptions, email syntax feedback, disabled password input and Sign In, show/hide action, password-reset explanation, separate demo entry and Student Tracker link |
| `/admin` | Approved dashboard cards, charts, fixed snapshot and filters retained; Workspace Preview expanded |
| `/manager-workspace` | Six filtered summary cards, team/employee workload filters, workload inspection, existing student/task links, application stage and linked-task-priority filters, exact application-record navigation, shared task creation/reassignment/priority/deadline/status/completion |
| `/employee-workspace` | Existing employee selection and shared workload retained; selection now lives in central demo context. Student table adds nationality and application count; document rows include required/optional and last update |
| `/student-portal` | Existing broader fictional self-service interface and selector retained; approved profile fields and status adapter are shared with tracking |
| `/track-application` | Fictional ID/email syntax validation; identical unavailable-verification response for matched and unmatched input; disabled server-code verification interface and explicit expired-state example; separate sample selection/action |
| `/track-application/results` | Approved read-only fields, distinct university and total application metrics, recorded stages and stage guide, requirement-aware documents/filtering, completeness, admissions contact and honest demo feedback. Missing/expired context shows an access-required state with no selected profile |
| Existing operational routes | Students/details, universities, applications, tasks, documents, reports, employees, attendance, activity and settings remain reachable. `/applications?record=<id>` filters the exact linked record and offers Show all applications |

Every Workspace Preview destination is a real link. The shared profile and settings menus use those links; Exit Demo clears navigation/sample preferences and returns to Login. Manager/Employee sidebars reuse AppShell and present relevant operational items; ordinary manager navigation omits system settings and employee administration. The Workspace Preview menu remains explicitly a way to switch fictional interfaces, not a permission grant.

## Architecture and data rules

- `lib/demo/context.ts` is a memory-only external store for preview role, existing fictional employee ID, demo indication and expiring sample selection. It is not an authenticated session and stores no passwords, cookies, tokens or email submissions. Exit resets preferences; it does not permanently persist or delete the operational demo repository. Refresh resets both stores.
- The existing operational repository remains the only student/task/application/document registry. `useOperationalData` reads its existing subscriptions. Manager task writes use a validated helper over that same repository, so employee and original operational views see the changes.
- Team summary figures derive from filtered active employees, their assigned students/tasks and associated applications/documents. Task priority filters for applications derive from pending tasks linked to the student, since Application has no persisted priority field. Upcoming/overdue calculations use the existing November 14, 2026 UTC mock snapshot and seven-day window, not the browser clock. The Admin Dashboard's separate approved snapshot is clearly identified rather than replaced.
- Student fields use an explicit projection of name, public code, email, phone, nationality and record update. No DOB is invented. No raw canonical JSON, lock data, task notes, staff comments, credentials or private file keys are passed to student cards.
- Application status values in the repository are unchanged. The display adapter supports existing stages and explicit future outcomes. Generic Decision Received remains an unknown outcome; rejection, withdrawal and conditional offers are not successful linear progression steps. The stage guide is not invented event history, submission evidence or live portal synchronization.
- All 37 document categories are preserved. Default requirements come from existing document `required` flags. An explicitly provisional per-application example can add passport/transcript, a degree certificate for Master's study, and an English certificate for a UK application. These are not real university rules. Missing optional categories never become missing-required counts. Tracker counts/completeness come from explicit document rows and the selected requirement policy, rather than the staff profile's legacy summary snapshot. Received, verified, pending, missing-required and rejected metadata remain distinct. No file availability, download URL or rejection explanation is invented; the UI states when only receipt metadata exists.
- Sample context is separate from ID/email entry, lasts at most ten minutes in browser memory, and disappears on refresh. A direct server render of results has no sample and shows the safe access state. This gate is purely for fictional demonstration flow; production private records must never be shipped to the client before server authorization.
- The canonical 141 student fields and 37 document categories are untouched. PostgreSQL uniqueness, stable public ID generation/tombstones, revisions, leases, permissions, verification and cookie/CSRF requirements are proposed in `API_CONTRACT.md`. No fake API routes were created. Desktop remains responsible for canonical mapping, university portal intelligence, OD-Recorder, recording inspector and future human-supervised automation.

## Changed modules

New routes: `app/login`, `app/manager-workspace`, `app/track-application` and its `results` child. Root redirects to Login; the Applications route accepts a validated optional record filter.

New reusable pieces: `components/demo/{login,public-shell,use-demo-context}`, `components/operations/{use-operational-data,work-section}`, `components/student-tracking/{tracker,results,student-cards}`, `components/manager-workspace/manager-workspace`. Existing AppShell, Workspace Preview, employee view, Student Portal, Applications feature, Button wrapper and scoped layout styles were adapted. Link-rendered Buttons now retain link semantics without native-button warnings.

New pure selectors/helpers: `lib/operations/{manager-workspace,student-facing}` and `lib/demo/context`; shared date helpers stay with the existing employee-workspace selectors. All live authentication/session/CSRF/Django work remains unimplemented.

## Verification on November 18, 2026

- `npm ci --cache .npm-cache --prefer-offline --fetch-retries=0 --fetch-timeout=20000`: passed with the existing lockfile. Installation reported 20 advisories (8 moderate, 12 high). No forced or unrelated dependency upgrades were applied.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- `npm test`: **59 tests passed across 7 files**, including login role descriptions/navigation, disabled credentials, exit context, manager filters/assignments/task creation, exact application IDs, lookup non-enumeration, sample selection/expiry, personal-field projection, deduplicated university counts, requirement-aware documents, status outcomes, prior employee/admin/portal behavior, editing locks, schema counts and report export protections.
- `npm run build`: passed; all new routes are in the App Router build output.
- Local production HTTP checks matched expected rendered content for `/login`, `/admin`, `/manager-workspace`, `/employee-workspace`, `/students`, `/student-portal`, `/track-application` and `/track-application/results`. Direct results showed the access-required heading and no selected sample email. `/` followed its redirect to `/login`.
- All 18 page routes returned 200 locally; the additional `/applications?record=app-1` check confirmed exact record filtering, without showing the `app-2` status control.
- Browser/runtime discovery returned no connected browser. Playwright staff/student and mobile flows are included in `tests/browser/staff-student-journeys.spec.ts` but **not executed**. jsdom interactions and HTTP content checks do not verify browser navigation, real focus behavior, screenshots or responsive layouts. These remain QA limitations.

## Production boundary

Password sign-in, reset delivery, ordinary student lookup/verification, private file transfer, authoritative roles, server sessions, persistence, CSRF enforcement and multi-user permissions are not implemented. Frontend selection/filtering and sample expiry provide no production security. The demo contains fictional data only and requires the existing protected Vercel Preview. Do not promote to production, attach a public domain or introduce real applicant records.

## Delivery

- Implementation commit: `a24d001` on `feat/m03-staff-manager-student-tracking`.
- Pull request: https://github.com/AKKarizmi/uais/pull/2 . This is stacked on the earlier Employee Workspace branch/PR #1; merge that prerequisite before this extension. Neither PR was merged by this work.
- Protected preview: https://uais-7jcca785c-akkarizmis-projects.vercel.app/login . Deployment `dpl_DcLytBuz3jevj8sk2vyuTW7tBLE2` is **Ready**, target **preview**, confirmed with `vercel inspect`.
- Signed-in Vercel CLI HTTP requests verified expected deployed H1 content on all eight required routes listed above. The direct results page showed the safe access-required heading and no selected sample email. These are HTTP content checks, not browser interaction tests.
- An anonymous request to `/track-application/results` returned HTTP **302** to `vercel.com/sso-api`, confirming the Vercel sign-in gate. The existing project's SSO mode remains `all_except_custom_domains`. No production promotion, public custom domain or protection-disabling change was made.
