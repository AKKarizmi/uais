# UAIS Desktop — Integration Backlog

Retain the existing Python 3.11+/PySide6 desktop application, OD-Recorder and workflow inspector. Do **not** add browser recording to UAIS Web. When the desktop app is ready, implement a remote repository adapter alongside its current local JSON/SQLite adapters.

| Sequence | Desktop change | Shared service/contract |
|---|---|---|
| D1 | Verify existing 141 canonical field and 37 document mappings | Canonical schema version endpoint and migration tests |
| D2 | Add login/connected-mode settings with safe session handling | Desktop OIDC login + PKCE |
| D3 | Introduce `StudentRepository` local / remote adapters | Student API, ETags, revision errors |
| D4 | Introduce `UniversityRepository` remote adapter | University and portal APIs |
| D5 | Add local cache explicitly marked non-authoritative | Offline-read policy and reconciliation |
| D6 | Acquire and heartbeat central locks during student application work | Lock lease endpoints and fencing generations |
| D7 | Implement document download/upload preflight with approved versions | Signed URLs and versioned document API |
| D8 | Send sanitized recording/workflow metadata through secure API | Recorder workflow contract; no browser session state |
| D9 | Add applications/tasks status synchronization | Application/task APIs and audit trail |
| D10 | Implement operator-approved assisted autofill and validation | Desktop execution only, human approval before irreversible actions |

Until these are verified, use controlled, versioned Excel interchange and avoid auto-sync between two independent sources of truth. Prioritize safe migration from local canonical JSON and SQLite metadata with backups and record reconciliation.
