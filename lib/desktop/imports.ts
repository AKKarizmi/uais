import type { DemoRepository } from "@/lib/operations/service";
import type { Portal, Student, University } from "@/lib/operations/types";
import {
  getPath,
  metadataFor,
  parseScalar,
  saveMetadataBatch,
  scalarFields,
  setPath,
  validateMetadata,
} from "./metadata";
import {
  detectFamily,
  replaceUniversities,
  safeUrl,
  universityHeaders,
} from "./universities";
import type { ImportRow } from "./spreadsheets";
export type ImportPlan = {
  summary: string[];
  rows: ImportRow[];
  commit: () => { ok: boolean; message: string };
};
export function newStudent(code: string, name: string): Student {
  return {
    id: code,
    code,
    firstName: name,
    lastName: "",
    email: "",
    phone: "",
    nationality: "",
    assignedTo: null,
    status: "Lead",
    degree: "",
    documentsVerified: 0,
    documentsRequired: 0,
    consent: null,
    updated: "Demo session",
    lock: { ownerId: null, acquiredAt: null, heartbeat: null },
    fields: {},
    revision: 1,
  };
}
export function previewStudentImport(
  repository: DemoRepository,
  rows: ImportRow[],
): ImportPlan {
  const snapshot = JSON.stringify(repository.read("students"));
  const known = repository.read("students");
  const planned = new Map<string, Student>();
  const edits: {
    id: string;
    revision: number;
    metadata: Record<string, unknown>;
  }[] = [];
  const allowed = [
    "Student ID",
    "Revision",
    "Updated At",
    ...scalarFields.map((f) => f.canonical_name),
  ];
  rows.forEach((row, i) => {
    if (Object.keys(row).some((k) => !allowed.includes(k)))
      throw new Error(`Row ${i + 2}: unknown canonical column.`);
    const id = row["Student ID"]?.trim();
    const existing = known.find((s) => s.code === id);
    if (!id || (!existing && !/^STU-[A-Z0-9]{8}$/.test(id)))
      throw new Error(
        `Row ${i + 2}: provide the original Desktop Student ID (STU-XXXXXXXX).`,
      );
    if (planned.has(id)) throw new Error(`Duplicate Student ID ${id}.`);
    if (existing && existing.lock.ownerId && existing.lock.ownerId !== "emp-1")
      throw new Error(`${id}: locked by another demo employee.`);
    if (existing && Number(row.Revision) !== (existing.revision ?? 1))
      throw new Error(`${id}: Revision must match the current record.`);
    const student = existing ?? newStudent(id, "");
    const metadata = metadataFor(student);
    for (const f of scalarFields)
      if (f.canonical_name in row)
        setPath(
          metadata,
          f.metadata_path,
          parseScalar(f.metadata_path, row[f.canonical_name]),
        );
    const errors = validateMetadata(metadata, student);
    if (errors.length) throw new Error(errors.join(" "));
    if (existing)
      edits.push({
        id: existing.id,
        revision: existing.revision ?? 1,
        metadata,
      });
    else {
      const text = (p: string) => String(getPath(metadata, p) ?? "");
      planned.set(id, {
        ...student,
        metadata,
        firstName: text("identity.first_name"),
        lastName: text("identity.last_name"),
        email: text("contact.email"),
        phone: text("contact.mobile_phone"),
        nationality: text("identity.nationality"),
        degree: text("education.highest_degree"),
      });
    }
    if (existing) planned.set(id, existing);
  });
  return {
    rows: structuredClone(rows),
    summary: [
      `${rows.length} records validated. IDs preserved.`,
      `${edits.length} updates; ${rows.length - edits.length} additions.`,
      "Web-only demo extension: Desktop does not import students. No files or directories are imported.",
    ],
    commit: () => {
      if (JSON.stringify(repository.read("students")) !== snapshot)
        return {
          ok: false,
          message:
            "Records changed after preview. Preview again; nothing imported.",
        };
      const result = edits.length
        ? saveMetadataBatch(repository, edits)
        : { ok: true, message: "" };
      if (!result.ok) return result;
      const additions = [...planned.values()].filter(
        (s) => !known.some((k) => k.code === s.code),
      );
      repository.replace("students", [
        ...repository.read("students"),
        ...additions,
      ]);
      return {
        ok: true,
        message: "Fictional records imported in memory. Original IDs retained.",
      };
    },
  };
}
const bool = (text: string, fallback: boolean) => {
  if (!text) return fallback;
  if (/^(true|yes|1)$/i.test(text)) return true;
  if (/^(false|no|0)$/i.test(text)) return false;
  throw new Error("Active must be Yes/No or true/false.");
};
export function previewUniversityImport(
  repository: DemoRepository,
  rows: ImportRow[],
): ImportPlan {
  const snapshot = JSON.stringify([
    repository.read("universities"),
    repository.read("portals"),
  ]);
  const universities: University[] = structuredClone(
    repository.read("universities"),
  );
  const portals: Portal[] = structuredClone(repository.read("portals"));
  const seen = new Set<string>();
  let added = 0;
  rows.forEach((row, i) => {
    if (Object.keys(row).some((k) => !universityHeaders.includes(k)))
      throw new Error(`Row ${i + 2}: unsupported university header.`);
    const name = row.Name?.trim(),
      url = row.Portal?.trim() ?? "";
    if (!name) throw new Error(`Row ${i + 2}: Name is required.`);
    if (url && !safeUrl(url))
      throw new Error(
        `Row ${i + 2}: Portal must be an HTTP(S) URL without credentials.`,
      );
    if (row.Website && row.Website !== "<CLEAR>" && !safeUrl(row.Website))
      throw new Error(`Row ${i + 2}: invalid Website.`);
    const identity = `${name.toLowerCase()}|${url}`;
    if (seen.has(identity))
      throw new Error(`Row ${i + 2}: duplicate university/portal.`);
    seen.add(identity);
    let u = universities.find(
      (u) => u.name.toLowerCase() === name.toLowerCase(),
    );
    if (!u) {
      u = {
        id: `uni-${crypto.randomUUID()}`,
        name,
        country: "",
        website: "",
        portal: "",
        family: "Unclassified",
        programs: 0,
        assignedTo: "",
        intake: "",
        active: true,
        initials: name.slice(0, 2).toUpperCase(),
      };
      universities.push(u);
      added++;
    }
    const patch = <T extends object>(
      obj: T,
      key: keyof T,
      text: string | undefined,
    ) => {
      if (text?.trim())
        obj[key] = (text.trim() === "<CLEAR>" ? "" : text.trim()) as T[keyof T];
    };
    patch(u, "country", row.Country);
    patch(u, "city", row.City);
    patch(u, "website", row.Website);
    patch(u, "notes", row.Notes);
    u.active = bool(row.Active?.trim() ?? "", u.active);
    if (url) {
      let p = portals.find((p) => p.universityId === u.id && p.url === url);
      if (!p) {
        p = {
          id: `portal-${crypto.randomUUID()}`,
          universityId: u.id,
          name: "Admissions",
          purpose: "admission",
          url,
          family: detectFamily(url),
          familySource: "auto",
          active: true,
          recordingStatus: "not_recorded",
          automationStatus: "none",
          notes: "",
        };
        portals.push(p);
      }
      patch(p, "name", row["Portal Name"]);
      patch(p, "purpose", row.Purpose);
      patch(p, "notes", row["Portal Notes"]);
      if (row["Recording Status"]?.trim()) {
        if (
          !["not_recorded", "recorded", "needs_review"].includes(
            row["Recording Status"],
          )
        )
          throw new Error("Invalid Recording Status.");
        p.recordingStatus = row["Recording Status"];
      }
      if (row["Automation Status"]?.trim()) {
        if (
          !["none", "mapped", "ready", "needs_review"].includes(
            row["Automation Status"],
          )
        )
          throw new Error("Invalid Automation Status.");
        p.automationStatus = row["Automation Status"];
      }
      if (
        row["Portal Family Source"] &&
        !["auto", "manual"].includes(row["Portal Family Source"])
      )
        throw new Error("Portal Family Source must be auto or manual.");
      if (row["Portal Family"]?.trim()) {
        p.family =
          row["Portal Family"] === "<CLEAR>"
            ? "Unclassified"
            : row["Portal Family"];
        p.familySource = "manual";
      }
      if (row["Portal Family Source"] === "auto") {
        p.familySource = "auto";
        p.family = detectFamily(url);
      } else if (row["Portal Family Source"] === "manual")
        p.familySource = "manual";
      p.active = bool(row["Portal Active"]?.trim() ?? "", p.active);
    }
  });
  return {
    rows: structuredClone(rows),
    summary: [
      `${rows.length} rows validated; ${added} new universities.`,
      "Blank optional cells leave existing values unchanged. <CLEAR> clears optional text.",
      "University and portal identities are matched together. Portal-less universities are supported.",
      "Recording/automation values are imported metadata, never evidence of a runnable Web engine.",
    ],
    commit: () => {
      if (
        JSON.stringify([
          repository.read("universities"),
          repository.read("portals"),
        ]) !== snapshot
      )
        return {
          ok: false,
          message:
            "University registry changed after preview. Preview again; nothing imported.",
        };
      replaceUniversities(repository, universities, portals);
      return {
        ok: true,
        message: "Fictional university and portal metadata imported in memory.",
      };
    },
  };
}
