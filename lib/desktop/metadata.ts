import catalog from "@/lib/operations/canonical-fields.json";
import documents from "@/lib/operations/canonical-documents.json";
import options from "./reference-options.json";
import type { Student } from "@/lib/operations/types";
import type { DemoRepository } from "@/lib/operations/service";

export const canonicalFields = catalog.fields;
export const canonicalDocuments = Object.entries(documents.documents);
export const scalarFields = canonicalFields.filter(
  (f) => f.field_type !== "upload",
);
export const basicPaths = [
  "identity.first_name",
  "identity.last_name",
  "identity.full_name",
  "identity.gender",
  "identity.date_of_birth",
  "identity.nationality",
  "contact.email",
  "contact.mobile_phone",
  "passport.number",
  "passport.expiry_date",
  "education.highest_degree",
];
export const fieldLabel = (path: string) =>
  (
    ({
      "passport.number": "Passport number",
      "passport.expiry_date": "Passport expiry date",
    }) as Record<string, string>
  )[path] ??
  path
    .split(".")
    .at(-1)!
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export const choices = options as Record<string, string[]>;
export const groupFor = (path: string) => {
  const root = path.split(".")[0];
  return (
    [
      ["Identity, passport & travel", "identity", "passport"],
      ["Contact & emergency contact", "contact", "emergency_contact"],
      ["Education & languages", "education", "languages"],
      ["Family & referees", "family", "referees"],
      ["Health & employment", "health", "employment"],
      [
        "Applications, scholarships & legal",
        "scholarships",
        "application_preferences",
        "finance",
        "legal",
      ],
      ["Regional details", "regional"],
    ].find((g) => g.slice(1).includes(root))?.[0] ?? "Other details"
  );
};
export function getPath(
  record: Record<string, unknown>,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (obj, key) =>
        obj && typeof obj === "object"
          ? (obj as Record<string, unknown>)[key]
          : undefined,
      record,
    );
}
export function setPath(
  record: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const keys = path.split(".");
  if (keys.some((k) => ["__proto__", "prototype", "constructor"].includes(k)))
    throw new Error("Unsafe metadata path.");
  let cursor = record;
  keys.slice(0, -1).forEach((key, i) => {
    if (!cursor[key] || typeof cursor[key] !== "object")
      cursor[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  cursor[keys.at(-1)!] = value;
}
export function metadataFor(student: Student): Record<string, unknown> {
  const result: Record<string, unknown> = student.metadata
    ? structuredClone(student.metadata)
    : {
        schema_version: "1.1",
        student_id: student.code,
        revision: student.revision ?? 1,
        created_at: "2026-11-14T09:00:00Z",
        updated_at: "2026-11-14T09:00:00Z",
        identity: {},
        health: {},
        employment: {},
        passport: {},
        contact: {},
        emergency_contact: {},
        referees: [{}, {}],
        education: { history: [] },
        languages: {},
        family: {},
        finance: {},
        legal: {},
        scholarships: {},
        application_preferences: {},
        regional: {},
        documents: {},
        extra: {},
      };
  if (!student.metadata) {
    canonicalFields.forEach((f) =>
      setPath(
        result,
        f.metadata_path,
        student.fields[f.canonical_name] ?? null,
      ),
    );
    canonicalDocuments.forEach(([key, d]) =>
      setPath(result, `documents.${key}`, {
        directory: d.directory,
        preferred_file: null,
        files: [],
      }),
    );
  }
  // Existing Web operations edit these projections. They always reflect the same record.
  Object.entries({
    "identity.first_name": student.firstName,
    "identity.last_name": student.lastName,
    "contact.email": student.email,
    "contact.mobile_phone": student.phone,
    "identity.nationality": student.nationality,
    "education.highest_degree": student.degree,
  }).forEach(([path, value]) => setPath(result, path, value || null));
  if (!student.metadata)
    setPath(
      result,
      "identity.full_name",
      `${student.firstName} ${student.lastName}`.trim(),
    );
  result.revision = student.revision ?? 1;
  return result;
}
export function studentDisplayName(student: Student): string {
  return (
    String(getPath(metadataFor(student), "identity.full_name") ?? "").trim() ||
    `${student.firstName} ${student.lastName}`.trim() ||
    student.code
  );
}
/** Web workflow annotations are not additions to the canonical Desktop catalog. */
export function updateStudentWorkflow(
  repository: DemoRepository,
  id: string,
  revision: number,
  patch: Partial<Pick<Student, "assignedTo" | "status" | "consent">>,
) {
  const current = repository.read("students").find((s) => s.id === id);
  if (!current) return { ok: false, message: "Student no longer exists." };
  if (current.lock.ownerId && current.lock.ownerId !== "emp-1")
    return {
      ok: false,
      message: "Another demo employee holds this lock (409).",
    };
  if ((current.revision ?? 1) !== revision)
    return {
      ok: false,
      message: "Stale workflow revision (412). Reload and reconcile.",
    };
  if (
    patch.assignedTo &&
    !repository
      .read("employees")
      .some((e) => e.id === patch.assignedTo && e.active)
  )
    return { ok: false, message: "Choose an active demo employee." };
  repository.replace(
    "students",
    repository
      .read("students")
      .map((s) =>
        s.id === id
          ? { ...s, ...patch, revision: revision + 1, updated: "Demo session" }
          : s,
      ),
  );
  repository.replace("activity", [
    {
      id: crypto.randomUUID(),
      by: "Alex Morgan (demo)",
      action: "updated Web student workflow annotations",
      object: current.code,
      when: "just now",
    },
    ...repository.read("activity"),
  ]);
  return {
    ok: true,
    message:
      "Demo workflow updated; revision advanced. Canonical fields retain their Desktop meaning.",
  };
}
export function parseScalar(
  path: string,
  text: string,
): string | boolean | null {
  const field = scalarFields.find((f) => f.metadata_path === path);
  if (!field) throw new Error(`Unknown scalar path: ${path}`);
  const value = text.trim();
  if (!value) return null;
  if (field.field_type === "boolean") {
    if (/^(true|yes)$/i.test(value)) return true;
    if (/^(false|no)$/i.test(value)) return false;
    throw new Error(
      `${fieldLabel(path)}: use Yes, No, or blank (not specified).`,
    );
  }
  if (
    field.field_type === "date" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value)
  )
    throw new Error(`${fieldLabel(path)}: use a valid YYYY-MM-DD date.`);
  if (path.endsWith("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new Error(`${fieldLabel(path)}: enter a valid email.`);
  return value;
}
export function safeFilename(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 240 &&
    !/[\\/:]/.test(value) &&
    ![...value].some((c) => c.charCodeAt(0) < 32) &&
    !/[. ]$/.test(value) &&
    ![".", ".."].includes(value) &&
    !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(value)
  );
}
export function validateMetadata(
  metadata: Record<string, unknown>,
  current: Student,
): string[] {
  const errors: string[] = [];
  if (metadata.student_id !== current.code)
    errors.push("Student ID is immutable.");
  if (metadata.schema_version !== "1.1")
    errors.push("Expected Desktop schema_version 1.1.");
  if (metadata.revision !== (current.revision ?? 1))
    errors.push("Revision changed; reload and reconcile (412).");
  const original = metadataFor(current);
  if (
    metadata.created_at !== original.created_at ||
    metadata.updated_at !== original.updated_at
  )
    errors.push("Timestamps are managed by the service.");
  const checkKeys = (v: unknown): boolean =>
    !!v &&
    typeof v === "object" &&
    Object.entries(v).some(
      ([k, child]) =>
        ["__proto__", "prototype", "constructor"].includes(k) ||
        checkKeys(child),
    );
  if (checkKeys(metadata)) errors.push("Unsafe object keys.");
  const roots = Object.keys(original);
  if (Object.keys(metadata).some((k) => !roots.includes(k)))
    errors.push(
      "Unknown top-level metadata section. Use extra for extensions.",
    );
  const object = (v: unknown) =>
    !!v && typeof v === "object" && !Array.isArray(v);
  for (const root of [
    "identity",
    "health",
    "employment",
    "passport",
    "contact",
    "emergency_contact",
    "education",
    "languages",
    "family",
    "finance",
    "legal",
    "scholarships",
    "application_preferences",
    "regional",
    "documents",
    "extra",
  ]) {
    if (!object(metadata[root]))
      errors.push(`Expected object section: ${root}`);
  }
  if (
    !Array.isArray(metadata.referees) ||
    metadata.referees.length < 2 ||
    !metadata.referees.every(object)
  )
    errors.push(
      "referees must be an array of record objects (including indexes 0 and 1).",
    );
  if (!Array.isArray(getPath(metadata, "education.history")))
    errors.push("education.history must remain an array.");
  for (const f of scalarFields) {
    const v = getPath(metadata, f.metadata_path);
    if (v === undefined) {
      errors.push(`Missing ${f.metadata_path}`);
      continue;
    }
    if (v === null) continue;
    if (
      f.field_type === "boolean"
        ? typeof v !== "boolean"
        : typeof v !== "string"
    ) {
      errors.push(`Invalid type at ${f.metadata_path}`);
      continue;
    }
    try {
      if (typeof v === "string") parseScalar(f.metadata_path, v);
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  for (const [key, definition] of canonicalDocuments) {
    const d = getPath(metadata, `documents.${key}`) as Record<
      string,
      unknown
    > | null;
    if (
      !d ||
      d.directory !== definition.directory ||
      !Array.isArray(d.files) ||
      !d.files.every(safeFilename) ||
      (d.preferred_file !== null &&
        (!safeFilename(d.preferred_file) ||
          !d.files.includes(d.preferred_file)))
    )
      errors.push(`Invalid canonical document metadata: ${key}`);
    // File operations need a real backend. JSON cannot impersonate uploads or delete file references.
    if (
      JSON.stringify(d) !==
      JSON.stringify(getPath(original, `documents.${key}`))
    )
      errors.push(`Document file metadata is read-only in this demo: ${key}`);
  }
  return errors;
}
export type MetadataEdit = {
  id: string;
  revision: number;
  metadata: Record<string, unknown>;
};
export function saveMetadataBatch(
  repository: DemoRepository,
  edits: MetadataEdit[],
  actor = "emp-1",
) {
  const students = repository.read("students");
  if (new Set(edits.map((e) => e.id)).size !== edits.length)
    return {
      ok: false,
      message: "Duplicate record in edit batch. No cells changed.",
    };
  const replacements = new Map<string, Student>();
  for (const edit of edits) {
    const current = students.find((s) => s.id === edit.id);
    if (!current)
      return { ok: false, message: "Student no longer exists. Reload." };
    if (current.lock.ownerId && current.lock.ownerId !== actor)
      return {
        ok: false,
        message: `${current.code}: another demo employee holds this lock (409). No cells changed.`,
      };
    if ((current.revision ?? 1) !== edit.revision)
      return {
        ok: false,
        message: `${current.code}: stale revision (412). Reload and reconcile. No cells changed.`,
      };
    const errors = validateMetadata(edit.metadata, current);
    if (errors.length)
      return {
        ok: false,
        message: `${current.code}: ${errors.join(" ")} No cells changed.`,
      };
    const metadata = structuredClone(edit.metadata);
    metadata.revision = edit.revision + 1;
    metadata.updated_at = new Date().toISOString();
    const text = (p: string) => String(getPath(metadata, p) ?? "");
    const fields = { ...current.fields };
    scalarFields.forEach((f) => {
      fields[f.canonical_name] = getPath(metadata, f.metadata_path) as
        string | boolean | null;
    });
    replacements.set(current.id, {
      ...current,
      metadata,
      revision: edit.revision + 1,
      fields,
      firstName: text("identity.first_name"),
      lastName: text("identity.last_name"),
      email: text("contact.email"),
      phone: text("contact.mobile_phone"),
      nationality: text("identity.nationality"),
      degree: text("education.highest_degree"),
      updated: "Demo session",
    });
  }
  repository.replace(
    "students",
    students.map((s) => replacements.get(s.id) ?? s),
  );
  repository.replace("activity", [
    {
      id: crypto.randomUUID(),
      by: "Alex Morgan (demo)",
      action: `saved canonical metadata for ${edits.length} record(s); revisions checked`,
      object: edits
        .map((e) => students.find((s) => s.id === e.id)!.code)
        .join(", "),
      when: "just now",
    },
    ...repository.read("activity"),
  ]);
  return {
    ok: true,
    message:
      "Demo metadata saved. Revisions checked; changes reset on refresh.",
  };
}
