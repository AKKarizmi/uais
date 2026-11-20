import type { Portal, University } from "@/lib/operations/types";
import type { DemoRepository } from "@/lib/operations/service";
export const providers: Record<string, string> = {
  "applyweb.com": "ApplyWeb",
  "dreamapply.com": "DreamApply",
  "commonapp.org": "Common App",
  "technolutions.net": "Slate",
  "liaisoncas.com": "Liaison CAS",
  "embark.com": "Embark",
  "uni-assist.de": "uni-assist",
  "universityadmissions.se": "University Admissions Sweden",
  "applyboard.com": "ApplyBoard",
  "campuschina.org": "CSC Scholarship",
  "csc.edu.cn": "CSC Scholarship",
};
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
export function detectFamily(url: string): string {
  if (!safeUrl(url)) return "Unclassified";
  const host = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  return (
    Object.entries(providers).find(
      ([suffix]) => host === suffix || host.endsWith(`.${suffix}`),
    )?.[1] ?? "Unclassified"
  );
}
export function portalSeeds(universities: University[]): Portal[] {
  return universities
    .filter((u) => u.portal)
    .map((u) => ({
      id: `portal-${u.id}`,
      universityId: u.id,
      name: "Admissions",
      purpose: "admission",
      url: u.portal,
      family: u.family === "Custom" ? "Unclassified" : u.family,
      familySource: "manual",
      active: u.active,
      recordingStatus: "not_recorded",
      automationStatus: "none",
      notes: "Fictional registration; no recording attached.",
    }));
}
export type UniversityRow = {
  id: string;
  university: University;
  portal?: Portal;
};
export function universityRows(
  universities: University[],
  portals: Portal[],
): UniversityRow[] {
  return universities.flatMap((u) => {
    const ps = portals.filter((p) => p.universityId === u.id);
    return ps.length
      ? ps.map((p) => ({ id: p.id, university: u, portal: p }))
      : [{ id: `university-${u.id}`, university: u }];
  });
}
export function replaceUniversities(
  repository: DemoRepository,
  universities: University[],
  portals: Portal[],
) {
  // Legacy single-portal projections stay compatible with the existing tracker and application screens.
  repository.replace(
    "universities",
    universities.map((u) => {
      const p = portals.find((p) => p.universityId === u.id);
      return {
        ...u,
        portal: p?.url ?? "",
        family: p?.family ?? "Unclassified",
      };
    }),
  );
  repository.replace("portals", portals);
}
export const universityHeaders = [
  "Name",
  "Portal",
  "Country",
  "City",
  "Website",
  "Notes",
  "Portal Name",
  "Purpose",
  "Portal Family",
  "Portal Family Source",
  "Active",
  "Portal Active",
  "Recording Status",
  "Automation Status",
  "Portal Notes",
];
export function exportUniversityRows(
  universities: University[],
  portals: Portal[],
) {
  return universityRows(universities, portals).map(
    ({ university: u, portal: p }) => ({
      Name: u.name,
      Portal: p?.url ?? "",
      Country: u.country,
      City: u.city ?? "",
      Website: u.website,
      Notes: u.notes ?? "",
      "Portal Name": p?.name ?? "",
      Purpose: p?.purpose ?? "",
      "Portal Family": p?.family ?? "",
      "Portal Family Source": p?.familySource ?? "",
      Active: u.active,
      "Portal Active": p?.active ?? "",
      "Recording Status": p?.recordingStatus ?? "",
      "Automation Status": p?.automationStatus ?? "",
      "Portal Notes": p?.notes ?? "",
    }),
  );
}
