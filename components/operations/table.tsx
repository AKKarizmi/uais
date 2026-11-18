"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
import { Button } from "@/components/ui/button";
import styles from "./table.module.css";

export function PaginatedTable({ children }: { children: ReactNode }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  let total = 0;
  let pages = 1;
  let current = 1;
  const table = Children.map(children, (child) => {
    if (
      !isValidElement<{ children: ReactNode }>(child) ||
      child.type !== "table"
    )
      return child;
    return cloneElement(
      child,
      {},
      Children.map(child.props.children, (section) => {
        if (
          !isValidElement<{ children: ReactNode }>(section) ||
          section.type !== "tbody"
        )
          return section;
        const rows = Children.toArray(section.props.children);
        total = rows.length;
        pages = Math.max(1, Math.ceil(total / size));
        current = Math.min(page, pages);
        return cloneElement(
          section as ReactElement<{ children: ReactNode }>,
          {},
          rows.slice((current - 1) * size, current * size),
        );
      }),
    );
  });
  return (
    <>
      <div
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-label="Scrollable data table"
      >
        {table}
      </div>
      {total === 0 && (
        <p className="p-4" role="status">
          No matching records.
        </p>
      )}
      <nav aria-label="Table pagination" className={styles.pagination}>
        <label>
          Rows per page{" "}
          <select
            aria-label="Rows per page"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <span className={styles.range} aria-live="polite">
          {total ? (current - 1) * size + 1 : 0}–
          {Math.min(current * size, total)} of {total}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={current === 1}
          onClick={() => setPage(current - 1)}
        >
          Previous
        </Button>
        <span className={styles.page}>
          Page {current} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Next
        </Button>
      </nav>
    </>
  );
}
