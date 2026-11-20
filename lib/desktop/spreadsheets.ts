import type { Student } from "@/lib/operations/types";
import { getPath, metadataFor, scalarFields } from "./metadata";

export type ImportRow = Record<string, string>;
export const literalCell = (value: unknown) =>
  typeof value === "boolean"
    ? value
    : /^[\s]*[=+@-]/.test(String(value ?? ""))
      ? `'${String(value)}`
      : String(value ?? "");
export function parseDelimited(input: string, delimiter = ","): string[][] {
  const rows: string[][] = [[]];
  let value = "",
    quoted = false;
  const text = input.replace(/^\ufeff/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && (quoted || value === "")) {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === delimiter || c === "\r" || c === "\n")) {
      rows.at(-1)!.push(value);
      value = "";
      if (c !== delimiter) {
        if (c === "\r" && text[i + 1] === "\n") i++;
        rows.push([]);
      }
    } else value += c;
  }
  if (quoted) throw new Error("Unclosed quoted CSV cell.");
  rows.at(-1)!.push(value);
  return rows.filter((r) => r.some((c) => c.trim()));
}
export async function readSpreadsheet(file: File): Promise<ImportRow[]> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Demo imports are limited to 5 MB.");
  let cells: string[][];
  if (/\.csv$/i.test(file.name)) cells = parseDelimited(await file.text());
  else if (/\.xlsx$/i.test(file.name)) {
    const { Workbook } = await import("exceljs");
    const book = new Workbook();
    await book.xlsx.load(await file.arrayBuffer());
    const sheet = book.getWorksheet(1);
    if (!sheet) throw new Error("Workbook has no worksheets.");
    if (sheet.rowCount > 5001 || sheet.columnCount > 160)
      throw new Error("Demo imports allow at most 5,000 rows and 160 columns.");
    cells = [];
    sheet.eachRow((row) => {
      const line: string[] = [];
      for (let i = 1; i <= sheet.columnCount; i++) {
        const cell = row.getCell(i);
        if (
          cell.type === 6 ||
          cell.formula ||
          (cell.value &&
            typeof cell.value === "object" &&
            "sharedFormula" in cell.value)
        )
          throw new Error(
            `Formula cell ${cell.address} is not allowed. Paste values only.`,
          );
        line.push(
          cell.value instanceof Date
            ? cell.value.toISOString().slice(0, 10)
            : cell.text,
        );
      }
      cells.push(line);
    });
  } else throw new Error("Choose an .xlsx or .csv file.");
  if (cells.length < 2) throw new Error("No data rows found.");
  if (cells.length > 5001)
    throw new Error("Demo imports allow at most 5,000 rows.");
  const headers = cells[0].map((h) => h.trim());
  if (
    headers.some((h) => !h) ||
    new Set(headers.map((h) => h.toLowerCase())).size !== headers.length
  )
    throw new Error("Blank or duplicate column headers.");
  if (
    headers.some((h) => ["__proto__", "prototype", "constructor"].includes(h))
  )
    throw new Error("Unsafe column header.");
  return cells.slice(1).map((line, index) => {
    if (
      line.length > headers.length &&
      line.slice(headers.length).some(Boolean)
    )
      throw new Error(`Row ${index + 2} has extra cells.`);
    const result: ImportRow = {};
    headers.forEach((header, i) => {
      const value = line[i] ?? "";
      if (/^\s*[=+@]/.test(value))
        throw new Error(
          `Row ${index + 2}: formula-like cells are not accepted.`,
        );
      result[header] = value;
    });
    return result;
  });
}
export async function makeWorkbook(
  sheets: { name: string; headers: string[]; rows: unknown[][] }[],
) {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  book.creator = "UAIS Web fictional-data demo";
  for (const data of sheets) {
    const sheet = book.addWorksheet(data.name);
    sheet.addRow(data.headers.map(literalCell));
    data.rows.forEach((r) => sheet.addRow(r.map(literalCell)));
    sheet.views = [
      { state: "frozen", xSplit: Math.min(3, data.headers.length), ySplit: 1 },
    ];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, sheet.rowCount), column: data.headers.length },
    };
    sheet.columns.forEach((c) => (c.width = 24));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF175CD3" },
    };
  }
  return book.xlsx.writeBuffer();
}
export async function studentWorkbook(
  students: Student[],
  paths = scalarFields.map((f) => f.metadata_path),
) {
  const fields = scalarFields.filter((f) => paths.includes(f.metadata_path));
  return makeWorkbook([
    {
      name: "Students",
      headers: [
        "Student ID",
        "Revision",
        "Updated At",
        ...fields.map((f) => f.canonical_name),
      ],
      rows: students.map((s) => {
        const m = metadataFor(s);
        return [
          s.code,
          s.revision ?? 1,
          m.updated_at,
          ...fields.map((f) => getPath(m, f.metadata_path)),
        ];
      }),
    },
    {
      name: "Field Guide",
      headers: ["Canonical Field", "Metadata Path", "Field Type", "Section"],
      rows: fields.map((f) => [
        f.canonical_name,
        f.metadata_path,
        f.field_type,
        f.section,
      ]),
    },
    {
      name: "Read Me",
      headers: ["UAIS fictional-data export"],
      rows: [
        ["Schema 1.1; Desktop canonical fields. Student IDs are preserved."],
        ["This is a demo export. Do not include real applicant data."],
        ["Files, directories and upload metadata are excluded."],
        [
          "Desktop has no student import. Web preview import is a demo-only extension.",
        ],
        ["Blank values are not specified; booleans are Yes/No or true/false."],
        [
          "Formula-like strings are guarded; no executable formulas are generated.",
        ],
      ],
    },
  ]);
}
export function downloadWorkbook(filename: string, buffer: ArrayBuffer) {
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
