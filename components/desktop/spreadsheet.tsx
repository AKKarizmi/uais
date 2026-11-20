"use client";
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type GridColumn<T> = {
  key: string;
  label: string;
  width?: number;
  editable?: boolean;
  value: (row: T) => unknown;
};
export type CellChange<T> = { row: T; key: string; text: string };
export function parseClipboard(text: string): string[][] {
  const rows: string[][] = [[]];
  let value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && (quoted || value === "")) {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "\t" || c === "\n" || c === "\r")) {
      rows.at(-1)!.push(value);
      value = "";
      if (c !== "\t") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        rows.push([]);
      }
    } else value += c;
  }
  if (quoted) throw new Error("Clipboard has an unclosed quoted cell.");
  rows.at(-1)!.push(value);
  if (rows.length > 1 && rows.at(-1)!.length === 1 && rows.at(-1)![0] === "")
    rows.pop();
  if (rows.reduce((n, r) => n + r.length, 0) > 10000)
    throw new Error("Paste at most 10,000 cells at once.");
  return rows;
}
const display = (v: unknown) =>
  v === null || v === undefined
    ? ""
    : typeof v === "boolean"
      ? v
        ? "Yes"
        : "No"
      : String(v);
const tsvCell = (v: unknown) => {
  const text = display(v);
  return /[\t\n\r"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
export function Spreadsheet<T extends { id: string }>({
  label,
  rows,
  columns,
  defaults,
  presets,
  onSelect,
  onOpen,
  onCommit,
  onVisibleColumns,
  initialSelected,
  isReadonly,
}: {
  label: string;
  rows: T[];
  columns: GridColumn<T>[];
  defaults: string[];
  presets?: Record<string, string[]>;
  onSelect?: (row: T) => void;
  onOpen?: (row: T) => void;
  onCommit: (changes: CellChange<T>[]) => { ok: boolean; message: string };
  onVisibleColumns?: (keys: string[]) => void;
  initialSelected?: string;
  isReadonly?: (row: T) => boolean;
}) {
  const [visible, setVisible] = useState(defaults);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [sort, setSort] = useState({ key: "", direction: 1 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<string[]>(
    initialSelected ? [initialSelected] : [],
  );
  const [active, setActive] = useState({ row: 0, col: 0 });
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [editing, setEditing] = useState<{
    id: string;
    key: string;
    text: string;
    originalRow: T;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [bulk, setBulk] = useState("");
  const grid = useRef<HTMLTableElement>(null);
  const shown = visible.flatMap((key) => columns.filter((c) => c.key === key));
  const filtered = rows
    .filter((r) =>
      columns.every(
        (c) =>
          !filters[c.key] ||
          display(c.value(r))
            .toLowerCase()
            .includes(filters[c.key].toLowerCase()),
      ),
    )
    .sort((a, b) => {
      const c = columns.find((c) => c.key === sort.key);
      return c
        ? display(c.value(a)).localeCompare(display(c.value(b)), undefined, {
            numeric: true,
          }) * sort.direction
        : 0;
    });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const validActive = {
    row: Math.max(0, Math.min(active.row, Math.max(0, paged.length - 1))),
    col: Math.max(0, Math.min(active.col, Math.max(0, shown.length - 1))),
  };
  function changeVisible(keys: string[]) {
    setVisible(keys);
    onVisibleColumns?.(keys);
    setAnchor(null);
    setActive({ row: 0, col: 0 });
  }
  function focus(row: number, col: number, extend = false) {
    const pos = {
      row: Math.max(0, Math.min(row, paged.length - 1)),
      col: Math.max(0, Math.min(col, shown.length - 1)),
    };
    if (extend) setAnchor(anchor ?? validActive);
    else setAnchor(null);
    setActive(pos);
    if (paged[pos.row]) onSelect?.(paged[pos.row]);
    grid.current
      ?.querySelector<HTMLElement>(
        `[data-row="${pos.row}"][data-col="${pos.col}"]`,
      )
      ?.focus();
  }
  function startEdit(r: T, c: GridColumn<T>) {
    if (c.editable && !isReadonly?.(r))
      setEditing({
        id: r.id,
        key: c.key,
        text: display(c.value(r)),
        originalRow: r,
      });
    else
      setMessage(
        "This cell is read-only. Check the record lock and choose an editable column.",
      );
  }
  function finishEdit() {
    if (!editing) return;
    const row = rows.find((r) => r.id === editing.id);
    if (!row) {
      setEditing(null);
      return;
    }
    const result = onCommit([
      { row: editing.originalRow, key: editing.key, text: editing.text },
    ]);
    setMessage(result.message);
    setEditing(null);
  }
  function keys(e: KeyboardEvent, r: number, c: number) {
    if (editing) return;
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight"
    ) {
      e.preventDefault();
      focus(
        r + (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0),
        c + (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0),
        e.shiftKey,
      );
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      focus(
        e.ctrlKey ? (e.key === "Home" ? 0 : paged.length - 1) : r,
        e.key === "Home" ? 0 : shown.length - 1,
        e.shiftKey,
      );
    } else if (e.key === "Tab") {
      const index = r * shown.length + c + (e.shiftKey ? -1 : 1);
      if (index >= 0 && index < paged.length * shown.length) {
        e.preventDefault();
        focus(Math.floor(index / shown.length), index % shown.length);
      }
    } else if (e.key === "F2" || e.key === "Enter") {
      e.preventDefault();
      startEdit(paged[r], shown[c]);
    } else if (e.key === " " && e.shiftKey) {
      e.preventDefault();
      setSelected(
        selected.includes(paged[r].id)
          ? selected.filter((id) => id !== paged[r].id)
          : [...selected, paged[r].id],
      );
    } else if (e.key === "Escape") setAnchor(null);
  }
  const frozen = (i: number): CSSProperties =>
    i < 2
      ? {
          position: "sticky",
          left:
            38 +
            shown
              .slice(0, i)
              .reduce((n, c) => n + (widths[c.key] ?? c.width ?? 160), 0),
          zIndex: 2,
        }
      : {};
  const inRange = (r: number, c: number) =>
    anchor &&
    r >= Math.min(anchor.row, validActive.row) &&
    r <= Math.max(anchor.row, validActive.row) &&
    c >= Math.min(anchor.col, validActive.col) &&
    c <= Math.max(anchor.col, validActive.col);
  return (
    <section className="desktop-sheet" aria-label={label}>
      <div className="sheet-controls">
        <label>
          View{" "}
          <select
            aria-label={`${label} column preset`}
            onChange={(e) =>
              changeVisible(
                e.target.value === "default"
                  ? defaults
                  : (presets?.[e.target.value] ?? defaults),
              )
            }
            defaultValue="default"
          >
            <option value="default">Desktop default</option>
            {Object.keys(presets ?? {}).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <details>
          <summary>Columns ({shown.length})</summary>
          <div className="column-picker">
            {columns.map((c) => (
              <label key={c.key}>
                <input
                  type="checkbox"
                  checked={visible.includes(c.key)}
                  disabled={defaults.slice(0, 2).includes(c.key)}
                  onChange={(e) =>
                    changeVisible(
                      e.target.checked
                        ? [...visible, c.key]
                        : visible.filter((k) => k !== c.key),
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </details>
        <button
          type="button"
          onClick={() => {
            const row = paged[validActive.row],
              col = shown[validActive.col];
            if (row && col) startEdit(row, col);
          }}
        >
          Edit cell (F2)
        </button>
        <details>
          <summary>
            Bulk edit (
            {selected.filter((id) => rows.some((r) => r.id === id)).length})
          </summary>
          <div className="bulk-editor">
            <label>
              Value for {shown[validActive.col]?.label}
              <input
                aria-label="Bulk cell value"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
            </label>
            <button
              disabled={!selected.length || !shown[validActive.col]?.editable}
              onClick={() => {
                const result = onCommit(
                  rows
                    .filter((r) => selected.includes(r.id))
                    .map((row) => ({
                      row,
                      key: shown[validActive.col].key,
                      text: bulk,
                    })),
                );
                setMessage(result.message);
              }}
            >
              Apply to selected rows
            </button>
          </div>
        </details>
      </div>
      <p className="sheet-help">
        Arrows / Tab: move · F2 / Enter: edit · Shift+arrows: range ·
        Shift+Space: select row · Ctrl/Cmd+C / V: copy / paste · First two
        columns frozen on wide screens. Double-click ID to open metadata.
      </p>
      <div className="sheet-scroll">
        <table
          ref={grid}
          role="grid"
          aria-label={label}
          aria-rowcount={filtered.length + 1}
          aria-colcount={shown.length + 1}
          onCopy={(e) => {
            if (editing) return;
            const a = anchor ?? validActive;
            const text = paged
              .slice(
                Math.min(a.row, validActive.row),
                Math.max(a.row, validActive.row) + 1,
              )
              .map((r) =>
                shown
                  .slice(
                    Math.min(a.col, validActive.col),
                    Math.max(a.col, validActive.col) + 1,
                  )
                  .map((c) => tsvCell(c.value(r)))
                  .join("\t"),
              )
              .join("\r\n");
            e.clipboardData.setData("text/plain", text);
            e.preventDefault();
            setMessage("Selected cells copied.");
          }}
          onPaste={(e) => {
            if (editing) return;
            e.preventDefault();
            try {
              const data = parseClipboard(
                e.clipboardData.getData("text/plain"),
              );
              const changes: CellChange<T>[] = [];
              data.forEach((line, ri) =>
                line.forEach((text, ci) => {
                  const row = paged[validActive.row + ri],
                    col = shown[validActive.col + ci];
                  if (!row || !col)
                    throw new Error(
                      "Paste exceeds the current page or visible columns. No cells changed.",
                    );
                  if (!col.editable || isReadonly?.(row))
                    throw new Error(
                      `${col.label} is read-only. No cells changed.`,
                    );
                  changes.push({ row, key: col.key, text });
                }),
              );
              const result = onCommit(changes);
              setMessage(result.message);
            } catch (error) {
              setMessage((error as Error).message);
            }
          }}
        >
          <colgroup>
            <col style={{ width: 38 }} />
            {shown.map((c) => (
              <col
                key={c.key}
                style={{ width: widths[c.key] ?? c.width ?? 160 }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="row-selector">
                <input
                  type="checkbox"
                  aria-label="Select all matching rows"
                  checked={
                    filtered.length > 0 &&
                    filtered.every((r) => selected.includes(r.id))
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? filtered.map((r) => r.id) : [],
                    )
                  }
                />
              </th>
              {shown.map((c, i) => (
                <th
                  key={c.key}
                  style={frozen(i)}
                  aria-sort={
                    sort.key === c.key
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    aria-label={`Select ${c.label} column`}
                    onClick={() => {
                      setAnchor({ row: 0, col: i });
                      setActive({ row: paged.length - 1, col: i });
                    }}
                  >
                    {c.label}
                  </button>
                  <button
                    aria-label={`Sort ${c.label}`}
                    onClick={() => {
                      setSort({
                        key: c.key,
                        direction: sort.key === c.key ? -sort.direction : 1,
                      });
                      setPage(0);
                    }}
                  >
                    ↕
                  </button>
                  <span
                    role="separator"
                    aria-label={`Resize ${c.label}`}
                    aria-orientation="vertical"
                    aria-valuemin={90}
                    aria-valuemax={600}
                    aria-valuenow={widths[c.key] ?? c.width ?? 160}
                    tabIndex={0}
                    className="column-resizer"
                    onKeyDown={(e) => {
                      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                        e.preventDefault();
                        setWidths((w) => ({
                          ...w,
                          [c.key]: Math.min(
                            600,
                            Math.max(
                              90,
                              (w[c.key] ?? c.width ?? 160) +
                                (e.key === "ArrowRight" ? 16 : -16),
                            ),
                          ),
                        }));
                      }
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const start = e.clientX,
                        width = widths[c.key] ?? c.width ?? 160;
                      const move = (event: PointerEvent) =>
                        setWidths((w) => ({
                          ...w,
                          [c.key]: Math.min(
                            600,
                            Math.max(90, width + event.clientX - start),
                          ),
                        }));
                      const end = () => {
                        window.removeEventListener("pointermove", move);
                        window.removeEventListener("pointerup", end);
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", end, { once: true });
                    }}
                  />
                </th>
              ))}
            </tr>
            <tr className="sheet-filters">
              <th />
              {shown.map((c, i) => (
                <th key={c.key} style={frozen(i)}>
                  <input
                    aria-label={`Filter ${c.label}`}
                    value={filters[c.key] ?? ""}
                    onChange={(e) => {
                      setFilters({ ...filters, [c.key]: e.target.value });
                      setPage(0);
                    }}
                    placeholder="Filter…"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr
                key={row.id}
                aria-rowindex={safePage * pageSize + ri + 2}
                aria-selected={selected.includes(row.id)}
                className={
                  selected.includes(row.id) || initialSelected === row.id
                    ? "selected"
                    : ""
                }
              >
                <td className="row-selector">
                  <input
                    type="checkbox"
                    aria-label={`Select row ${safePage * pageSize + ri + 1}`}
                    checked={selected.includes(row.id)}
                    onChange={(e) => {
                      setSelected(
                        e.target.checked
                          ? [...selected, row.id]
                          : selected.filter((id) => id !== row.id),
                      );
                      onSelect?.(row);
                    }}
                  />
                </td>
                {shown.map((col, ci) => (
                  <td
                    role="gridcell"
                    key={col.key}
                    data-row={ri}
                    data-col={ci}
                    style={frozen(ci)}
                    tabIndex={
                      ri === validActive.row && ci === validActive.col ? 0 : -1
                    }
                    aria-readonly={!col.editable || !!isReadonly?.(row)}
                    aria-selected={!!inRange(ri, ci)}
                    className={inRange(ri, ci) ? "cell-range" : ""}
                    onFocus={() => setActive({ row: ri, col: ci })}
                    onClick={(e) => {
                      if (editing) return;
                      if (e.shiftKey) setAnchor(anchor ?? validActive);
                      else setAnchor(null);
                      setActive({ row: ri, col: ci });
                      onSelect?.(row);
                    }}
                    onDoubleClick={() =>
                      ci === 0 && onOpen ? onOpen(row) : startEdit(row, col)
                    }
                    onKeyDown={(e) => keys(e, ri, ci)}
                  >
                    {editing?.id === row.id && editing.key === col.key ? (
                      <input
                        autoFocus
                        aria-label={`Edit ${col.label}`}
                        value={editing.text}
                        onChange={(e) =>
                          setEditing({ ...editing, text: e.target.value })
                        }
                        onBlur={finishEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditing(null);
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            finishEdit();
                          }
                          e.stopPropagation();
                        }}
                      />
                    ) : (
                      <span title={display(col.value(row))}>
                        {display(col.value(row)) || "—"}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!paged.length && (
          <p className="sheet-empty">
            No matching records. Clear filters or add a fictional record.
          </p>
        )}
      </div>
      <div className="sheet-pagination">
        <span>
          {filtered.length ? safePage * pageSize + 1 : 0}–
          {Math.min((safePage + 1) * pageSize, filtered.length)} of{" "}
          {filtered.length}
        </span>
        <label>
          Rows{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button
          disabled={safePage === 0}
          onClick={() => {
            setPage(0);
            setAnchor(null);
          }}
        >
          First
        </button>
        <button
          disabled={safePage === 0}
          onClick={() => {
            setPage(safePage - 1);
            setAnchor(null);
          }}
        >
          Previous
        </button>
        <span>
          Page {safePage + 1} / {pages}
        </span>
        <button
          disabled={safePage === pages - 1}
          onClick={() => {
            setPage(safePage + 1);
            setAnchor(null);
          }}
        >
          Next
        </button>
        <button
          disabled={safePage === pages - 1}
          onClick={() => {
            setPage(pages - 1);
            setAnchor(null);
          }}
        >
          Last
        </button>
      </div>
      <p role="status" className="sheet-status">
        {message}
      </p>
    </section>
  );
}
