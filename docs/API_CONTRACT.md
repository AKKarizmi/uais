# UAIS Central API — Proposed contract v1 (NOT implemented)

The backend is the authoritative source of shared records; neither the browser nor the Desktop application connects directly to PostgreSQL. All endpoints require server-enforced authorization, record-scoped access checks and audit logging. Use OpenAPI to formalize the models before implementation.

## Objects

- `Student`: UUID internal ID, stable public code, `revision` integer, metadata JSONB using **canonical field identifiers** and vetted paths, assignment ID, creation/update metadata, soft archive state.
- `University`: ID, name, normalized country, verified website and portal URLs, provider family and detection provenance, active status.
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
