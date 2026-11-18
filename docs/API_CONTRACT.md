# UAIS Central API — Proposed contract v1 (NOT implemented)

The backend is the authoritative source of shared records; neither the browser nor the Desktop application connects directly to PostgreSQL. All endpoints require server-enforced authorization, record-scoped access checks and audit logging. Use OpenAPI to formalize the models before implementation.

## Objects

- `Student`: UUID internal ID, stable public code, `revision` integer, metadata JSONB using **canonical field identifiers** and vetted paths, assignment ID, creation/update metadata, soft archive state.
- `University`: stable ID/code, name, country, city, website, notes and active status. Portal registration is a separate one-to-many entity.
- `Portal`: stable ID, university ID, name, purpose, URL, portal family, family source (`auto`/`manual`), active flag, recording/automation metadata and notes. A university may have zero or many portals.
- `Application`: unique ID, student ID, university ID, program/intake, internal stage, submission evidence, assigned officer, deadlines.
- `Document`: immutable version ID, student ID, canonical document category, private object key, checksum, review state and reviewer; category requirements are separate policy records.
- `Task`: ID, owner, assignee, status, priority, deadline, application/student linkage, comments and audit trail.
- `Employee`: ID, identity-provider account, roles, teams, activation/suspension, assigned cases.
- `LockLease`: student ID, holder user/session ID, lease generation, expiry, reason, renewal, release, override audit.
- `AttendanceEvent`: employee ID, successful login/logout/action session event timestamps, source (`web`/`desktop`), user timezone preference and organization timezone.

## Suggested endpoints (examples)

| Method | Endpoint | Required behavior |
|---|---|---|
| GET | `/api/v1/students` | Query/filters/pagination and scoped permissions |
| GET/PATCH | `/api/v1/students/{id}` | Canonical typed values, `ETag` / `If-Match` revision checks |
| POST | `/api/v1/students` | Create with canonical validation and generated stable code |
| GET/POST | `/api/v1/universities` | Verified URL handling and approved portal provenance |
| GET/POST/PATCH | `/api/v1/portals` | Preserve university relationship, purpose, URL/family provenance, active and recording/automation metadata |
| GET/POST/PATCH | `/api/v1/applications` | Separate internal stages, verified submission evidence |
| GET/POST/PATCH | `/api/v1/tasks` | Assignee/role checks, comments and notices |
| GET/POST | `/api/v1/documents` | Metadata only; secure upload initiation via dedicated API |
| POST | `/api/v1/documents/{id}/review` | Review authorization and audit trail |
| POST | `/api/v1/students/{id}/lock/acquire` | Atomic lease acquire; 409 conflict with safe owner detail |
| POST | `/api/v1/students/{id}/lock/renew` | Requires holder and generation token |
| POST | `/api/v1/students/{id}/lock/release` | Authorized release, idempotent |
| POST | `/api/v1/students/{id}/lock/override` | Manager/superuser permission and mandatory reason |
| GET | `/api/v1/employees` | Admin scoped; no private authentication secrets |
| GET | `/api/v1/attendance` | Authenticated login event data, organization timezone |
| GET | `/api/v1/reports/{kind}` | Policy-scoped report data, not unrestricted client queries |
| POST | `/api/v1/spreadsheets/students/preview` | Dry-run validation, workbook revision checks, conflict list |
| POST | `/api/v1/spreadsheets/students/commit` | Explicit approval, bounded, safe import with lock enforcement |
| POST | `/api/v1/recordings` | Future desktop-only sanitized workflow metadata |

## Concurrency and locking

Use atomic PostgreSQL acquisition/lease renewal with a lease token or fencing generation. An expired session MUST NOT be allowed to commit stale changes, even if its lock appeared valid when data was loaded. Every PATCH should check the current student's revision as well as lease/permission state. Staff should still be able to read records permitted by their role during a lock. Student uploads are staged and do not mutate a protected student record before authorized review. Server events can push lock and record changes to connected browser sessions.

## Authentication and separation

Use server-managed auth (MFA for employees; invitation/activation plus authenticated student sessions). Student public codes are **not** secrets or credentials. Desktop auth should use a native-app browser-based login flow with PKCE. Never put university portal passwords, cookies, MFA tokens, browser profiles or real applicant documents into workflow metadata or test reports.

## Real-time data

The web client should receive server-generated student/task/application updates through authenticated WebSockets or a fallback polling/subscription strategy. Browser-side mock lock booleans must never be trusted by the server.

## Canonical schema versioning

`src/canonical-fields.json` and `src/canonical-documents.json` are exact copies from the supplied UAIS Desktop release. The API contract should include a `canonical_schema_version` and explicit migration mapping when desktop schema versions change. Required field rules must remain policy-based (by country/university/program/stage) and are **not** inferred from the UI.

## Milestone 03: proposed staff and student identity contracts (not implemented)

The current frontend implements no authentication endpoints, credential checking, email delivery, or server sessions. Its memory-only preview role, employee selector, and ten-minute fictional sample context are navigation preferences, not evidence of identity. Staff login and email-code verification controls are unavailable. An ordinary tracker form never matches ID/email against records; all syntactically valid entries receive the same unavailable-verification message. Only explicit sample selection opens fictional results.

### DTO conventions

All endpoints below are same-origin HTTPS. Bodies and responses are JSON unless the response is 204. Validate lengths and syntax on the server; reject unknown properties. Error DTO: `{ "error": { "code": "VALIDATION_ERROR", "message": "Safe user-facing message", "fields": { "email": ["Invalid format"] } } }`. Never echo passwords, verification codes, arbitrary submitted data, staff-only notes, or account-existence information.

`StaffUser = { id: UUID, display_name: string, roles: ("admin"|"manager"|"employee")[], teams: UUID[] }`. These roles come from server-managed membership, not a client-selected role. `TaskDTO = { id: UUID, title: string, student_id: UUID|null, assignee_id: UUID, priority: "Low"|"Medium"|"High"|"Urgent", due_at: ISO8601|null, status: "To do"|"In progress"|"Blocked"|"Done", revision: integer }`.

### Staff authentication and workspaces

| Endpoint | Request and response | Server responsibilities |
| --- | --- | --- |
| `POST /api/v1/auth/login` | `{email,password}` → `{user:StaffUser,mfa_required:boolean}` or generic credential error | Password verification, MFA challenge where required, rate/attempt limits, login audit, rotate session ID; never trust a role from the form |
| `POST /api/v1/auth/logout` | Empty → 204 | Revoke session, invalidate cookie; idempotent |
| `GET /api/v1/auth/me` | Empty → `{user:StaffUser}` | 401 without a valid staff session; authoritative roles |
| `POST /api/v1/auth/password-reset/request` | `{email}` → generic 202 `{message:"If eligible, reset instructions will be sent."}` | Identical response for unknown/known emails; single-use, short-lived reset tokens, abuse controls and authorized email delivery |
| `GET /api/v1/employees/me` | Empty → public staff profile with team membership | Identity comes from the session |
| `GET /api/v1/employees/me/workload` | Query `{as_of?,cursor?,limit?}` → counts plus paginated assigned student/task/document summaries | Scoped assignment checks, authoritative requirements and timezone, server-defined date window |
| `GET /api/v1/manager/team-summary` | Query `{team_id?,employee_id?,stage?,priority?,cursor?,limit?}` → team, assignment, application, document and deadline aggregates | Manager scope restricted to managed teams; 403 for unauthorized team scopes |
| `GET /api/v1/students` | Query filters and cursor pagination → scoped student DTOs | Role/record-scoped field projection; canonical schema version |
| `GET /api/v1/tasks` | Query filters/cursor → `{items:TaskDTO[],next_cursor:null|string}` | Staff/team/assignee scope; no unrestricted staff data from student sessions |
| `POST /api/v1/tasks` | New-task fields → TaskDTO + ETag, 201 | Assignee/team/link validation, audit, optional configured notifications |
| `PATCH /api/v1/tasks/{id}` | Permitted changed fields, `If-Match` → TaskDTO + new ETag | 412 for stale revision, 403 for forbidden assignments; record locks as applicable |

Use secure HttpOnly staff cookies, appropriate SameSite policy, bounded idle/absolute expiration, session rotation and revocation. State-changing requests need server-validated CSRF tokens and Origin checks. Do not put bearer tokens or passwords in browser storage. Staff and student sessions must be distinct and cannot be promoted to one another. The current `createApiTransport` preserves credentials and `If-Match` and distinguishes 401/403/409/412; it is **not wired into these previews**. CSRF-token acquisition, DTO validation, MFA and live integration remain to be implemented before enabling real writes.

### Student verification and results

| Endpoint | Request and response | Server responsibilities |
| --- | --- | --- |
| `POST /api/v1/student-tracking/verification/request` | `{public_student_id,email}` → generic 202 `{message:"If the details match, verification instructions will be sent.",request_id:opaque}` | Equal public behavior for matched/unmatched pairs; cryptographically secure short-lived code or signed link, no record payload or existence flag; rate limiting by IP, identifier and recipient |
| `POST /api/v1/student-tracking/verification/confirm` | `{request_id,code}` → `{expires_at:ISO8601}` plus student-scoped cookie | Atomically enforce short expiry, attempt limits, one-time consumption, anti-replay and abuse controls; generic invalid/expired response without account enumeration |
| `GET /api/v1/student-tracking/me` | No student identifier → `{profile:{public_id,full_name,email,phone,nationality,updated_at,date_of_birth?},admissions_contact?:{display_name,team}}` | Student identity comes exclusively from a valid verified session. Project approved student-visible fields only; DOB requires a defined visibility policy |
| `GET /api/v1/student-tracking/me/applications` | Cursor query → student application DTOs and separate `distinct_university_count` / `total_application_count` | Owner scope from session; recorded staff stages, explicit outcome/status adapter; no portal credentials or internal notes |
| `GET /api/v1/student-tracking/me/documents` | Query `{application_id?,status?,cursor?,limit?}` → document metadata, requirement-policy version and counts | Verify ownership of selected application, evaluate country/university/program/stage requirements; distinguish available/verified/missing/pending/rejected; no unrestricted object URLs |
| `POST /api/v1/student-tracking/logout` | Empty → 204 | Revoke student session/cookie and audit |

Student DTOs must not include raw canonical JSON, editing leases, employee security metadata, notes, private staff comments, university login secrets or file-storage keys. Application DTOs should include university/country/program/degree/intake, student-visible assigned officer, recorded status and optional submission timestamp, update timestamp, recorded next action. Rejection/withdrawal are explicit outcomes, never successful timeline steps. Unknown decision outcomes stay unknown. Requirements must be versioned policy decisions, not a rule that all 37 categories are required. No file-transfer endpoints are implemented by this milestone.

Student routes must return 401 without a valid student-scoped session, even if ID/email are correct. Resource ownership failures return safe 403/404 behavior without leaking other student records. Use 400/422 for safe validation failures, 429 with Retry-After for throttling, 409 for conflicting lock leases, and 412 for failed revision preconditions. Record verification request/attempt/success/logout audit events without storing codes, passwords, session cookies or raw private identifiers in logs. Production request acknowledgments require appropriate delivery timing and anti-enumeration review; the frontend's generic unavailable message is not an implemented delivery system.

### PostgreSQL identity, persistence and Desktop compatibility

Use UUID internal primary keys and globally unique, stable public student identifiers under a database unique constraint. Generate collision-safe public codes on the server with retry on constraint conflicts. Never recycle an issued code, including after archive/deletion; preserve an issuance/tombstone record. Public codes identify records but are not authentication secrets. Do not expose sequential database keys as login credentials. Existing fictional `UAIS-STU-DEMO-*` codes are retained for previews and must not become a production issuance scheme.

Persist staff/team membership, assignment history, canonical student metadata/schema version, application outcomes, requirement-policy versions, document-version review history and audit events in PostgreSQL with transactional constraints. Use separate revocable staff/student session records (store token/code hashes where appropriate), bounded expiry and transactional one-time verification consumption. Revisions, fencing lease generations, assignment changes and auditable overrides remain server-authoritative. Browser memory filters and sample expiry cannot substitute for any of these checks.

UAIS Desktop should consume the same authenticated canonical student, university, task, application, document and lease endpoints. Desktop-native sign-in uses a browser-based PKCE flow and scoped API access; recording/OD-Recorder, the recording inspector, university portal intelligence and future human-supervised automation remain Desktop responsibilities. Web previews neither record workflows nor operate university browsers. Test live web/Desktop conflict, revision, canonical migration and permission behavior against the real server before real applicant use.


### Milestone 03.5 Desktop interoperability (proposed, not connected)

Student metadata follows Desktop schema 1.1: `student_id`, positive integer `revision`, managed `created_at`/`updated_at`, canonical nested sections, `referees` arrays and `documents` entries using exact catalog directories. The authoritative catalogs remain 141 definitions / 37 document categories. Nullable booleans are distinct from false; dates are ISO YYYY-MM-DD text; editable select suggestions are not closed enums. Web assignment, stage and consent-review annotations are separate workflow fields, not new canonical definitions.

Import/sync must preserve every existing Desktop `STU-XXXXXXXX` public identifier and university/portal relationship. An internal UUID mapping may be created without renaming public Desktop IDs. Desktop local storage remains functional until a separately approved synchronization protocol is implemented. Desktop student Excel export is a snapshot; student import is a Web extension, not an existing Desktop capability. Server import preview/commit must enforce scope, locks, revisions, transactional validation and stale-preview rejection.

The milestone UI uses only the memory repository. Its 409/412 messages simulate service outcomes; they are not server responses. The existing API transport is a foundation only. Before live wiring, define OpenAPI DTOs, authentication/CSRF, scoped permissions, ETags/leases, private document access and authoritative audits, then run integration tests against the implemented Django service. No environment switch enables live data.

The Web resolver must not construct or expose Desktop local file paths. Upload resolution requires a separately authorized file service and an explicit preferred-file reference. Recorder and automation artifacts remain Desktop-owned; registry status strings cannot enable an engine or prove the existence of an artifact.
