# Desktop / Web parity — milestone 03.5

## Reference audit, before implementation

Authoritative source: `UAIS_v2_Excel_Repairs_and_Student_Export/UAIS_V2` (read only). Reviewed `gui.py`, `schema.py`, `students.py`, `metadata_validation.py`, `student_form_options.py`, `student_io.py`, `universities.py`, `university_io.py`, `portal_families.py`, `resolver.py`, and both canonical catalogs. All 11 images in that directory's `Screenshots.zip` were inspected. They include older screens: the latest source's four editor tabs take precedence. Original screenshots contain personal information and are excluded from the repository/deployments.

The Next.js repository is a real App Router application: Next 16.4.3, React 19, Tailwind 4, Base UI. Existing routes and fictional record relationships are retained. The 141-field and 37-document catalogs match Desktop byte for byte. There is no live Django backend. Role selection and locks are simulations, not access controls.

SDM secondary reference: `sdm_v4.9.5.1_crashfix_source.zip`, report design, reconciliation, staff reports and report generators. Transferable behaviors are offline escaped reports, filters, explicit review states and stale-preview rejection. Specialized SDM admission criteria and credential exports are not canonical UAIS fields.

| Desktop source / screenshot | Previous Web | Implementation target | Required boundary |
| --- | --- | --- | --- |
| Navy 235px sidebar, five core modules | Light operations sidebar | Shared Desktop tokens; five core links, separated Web operations | Retain all existing routes |
| Dashboard four metrics and four workflow steps | Approved charts at /admin | /dashboard Desktop overview; retain /admin charts | Live demo counts; no invented recordings |
| Students split grid/details/documents | Paginated directory | Interactive canonical grid and selection-driven 37-category panel | Fictional memory state only |
| Four-tab metadata editor, 11 Basic paths | Flat Web fields, extra tabs | Basic, grouped Advanced, Documents, validated Advanced JSON | Immutable ID, optimistic revision and simulated lock checks |
| 141 canonical definitions, schema 1.1 metadata | Canonical catalogs, flat field cache | Adapter uses catalog paths; retain existing fixture IDs | No second canonical catalog; no Desktop filesystem writes |
| Student Excel export, 104 scalar fields | CSV only | Three-sheet Excel export, export configuration | Desktop student import is unsupported; Web import is explicitly a demo extension |
| University and many portal entities | One portal string on university | Separate portal collection, spreadsheet rows per portal, purpose/family/status | Stable IDs; safe HTTP(S); conservative host detection |
| University import preview and optional blank semantics | Basic form | Validated Excel/CSV preview; blank=no update, <CLEAR> explicit clear | Revalidate stale preview; no partial commit |
| Recorder capture and inspection | Absent | Registered portals and workflow metadata | OD-Recorder/automation stay on Desktop; no Web recording engine |
| System & Resolver diagnostics | Absent | Canonical lookup, validation, demo index info | File resolution unavailable, never synthesize local file paths |
| SDM reports and staff operations | Existing tasks/reports/roles | Preserve and restyle; seven generic report datasets | No SDM specialized admission rules |
| Desktop local locks/backups | Memory mock locks | Batch validation, expected revisions, audit messages | Server 409/412, durable history/auth await Django |

## Verification record

Source inspection and screenshot comparison above precede UI implementation. Runtime checks and visual evidence are recorded below after implementation; type checking alone does not establish visual parity.

## Delivered implementation

- Shared Segoe UI and Desktop color tokens, 235px navy sidebar with five core destinations. Existing `/admin` charts remain under Web operations; `/dashboard` uses four Desktop metrics and workflow cards from the shared demo repository. Additional Web pages and staff/public journeys retain their routes.
- Student grid: Student ID, Name, Email, Passport, Highest Degree by default; grouped canonical presets and configurable scalar columns. Selected record details and all 37 exact document directories appear beside the grid. Full editor uses the source's 11 Basic paths, grouped Advanced fields, Documents, and controlled Advanced JSON. Twenty Desktop choice lists are extracted from source without executing Desktop code. Select fields remain editable text with suggestions, booleans are nullable, dates are strict ISO dates.
- Both grids have in-cell editing (F2/Enter), arrow/Tab/Home/End movement, Shift ranges, row/column selection, quoted TSV copy/paste, pointer/keyboard column resizing, two frozen columns, native filter controls, sorting, complete first/previous/next/last pagination and validated bulk changes. Student batches check locks and expected revisions before writing any cells; cell editing retains the revision at the start of editing. Assignment/stage/consent remain separate Web workflow annotations with demo audit events.
- Real Excel student export: `Students`, `Field Guide`, `Read Me`; 104 scalar canonical fields plus original ID/revision/update timestamp, configurable subset and current search. Upload filenames/paths are excluded. University exports preserve one row per portal or portal-less university. Formula-like CSV/Excel strings are guarded, not executable formulas.
- Excel/CSV imports require a validated, paginated preview and a fresh snapshot at commit. New student imports retain `STU-XXXXXXXX`; existing fixture IDs are unchanged. Unknown columns, duplicate identities, invalid scalar values, formulas, unsafe URLs and stale previews fail before changes. University blanks are no-ops and `<CLEAR>` explicitly clears optional text. Manual portal family overrides survive URL changes; automatic matching checks exact provider hosts/subdomains. Unknown portals remain Unclassified.
- Recorder is a read-only registration/workflow inspector with unavailable engine/session states. Resolver reports real canonical names, kinds, paths and fictional scalar values. Upload resolution is unavailable; no local file path or recording artifact is fabricated.
- Reports retain safe individual HTML/CSV exports and add seven dataset tabs plus an escaped, self-contained seven-tab report with search, sorting, keyboard tab navigation and print. Presence is explicitly different from work hours.

## Remaining differences and verification limits

The supplied Windows screenshots were visually inspected and used to compare screen structure and source styles. The Web implementation intentionally retains its persistent demo banner, profile/preview toolbar, Web operation groups, mobile navigation and browser-native form controls. It is not a pixel-identical Qt rendering. Dark mode is a Web adaptation. Narrow screens stack the student details below the horizontally scrollable grid; Desktop uses a fixed splitter.

**Before/after Web screenshots and browser visual comparisons are not delivered.** Browser runtime initialization returned `No browser is available`; documented discovery returned an empty browser list. No fallback screenshots, generated mockups or source-only claims are substituted for browser evidence. `tests/browser/desktop-parity.spec.ts` includes actual task journeys and desktop/mobile screenshot capture for the next connected-browser run. All 10 browser tests are discoverable; they have not been executed in this environment. Browser rendering, native clipboard behavior, downloads and mobile visual parity remain unverified.

Imports are a Web demo extension and are limited to 5 MB / 5,000 rows (Desktop university import allows larger batches). Current imports accept exact Desktop export headers; the Desktop importer's additional header aliases are not implemented. Student export is a snapshot; formula-guard prefixes are retained as literal text on reimport. Presets and column widths are in component memory and are not saved to an account. Clipboard paste is bounded to the visible page/columns and 10,000 cells. The Web grid is not a formula calculation engine.

All records are fictional and memory-only. File upload/preferred-file editing/folder access, persistent backups, authenticated shared state, Django permissions/locks/audits, 409/412 HTTP responses and PostgreSQL synchronization remain unimplemented. Conflict outcomes here simulate those checks; they do not provide real concurrency protection. Student IDs never authenticate anyone. New records do not assume that all 37 document categories are required. Desktop local mode and its data files were not modified.

## Checks in the connected repository

- `npm ci` and dependency installs completed. Added ExcelJS and Prettier; installation reports 22 dependency advisories (10 moderate, 12 high), including pre-existing advisories. No forced dependency upgrade was applied.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`: passed. 80 unit/component tests in 9 files, including existing regressions and canonical validation, batch locks/revisions, stable imports, provider lookalikes, real Excel workbook output, grid editing/copy/paste/filter/pagination, multi-portal forms, four editor tabs and offline seven-tab report behavior.
- HTTP smoke: 21 staff/public/core routes returned 200, including the original `/admin` and dynamic student details. This is server-rendering evidence, not browser execution.
- `npm run test:browser -- --list`: 10 tests discovered in 4 files. Execution and visual checks remain pending as described above.
- Vercel project `akkarizmis-projects/uais` inspected: preview SSO remains `all_except_custom_domains`. Deploy a new preview only; do not promote production, change protection or attach a custom domain.
