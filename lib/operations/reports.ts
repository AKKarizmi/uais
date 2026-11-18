/** Self-contained fictional-data HTML report generator; never feed it real PII without a permissions/privacy review. */
export type ReportRow = Record<
  string,
  string | number | boolean | null | undefined
>;
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function reportHtml(
  title: string,
  columns: string[],
  rows: ReportRow[],
): string {
  const headings = columns
    .map(
      (c) =>
        `<th scope="col" data-col="${escapeHtml(c)}" tabindex="0">${escapeHtml(c)} ▲▼</th>`,
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — UAIS demo</title><style>
  body{font:14px system-ui,sans-serif;color:#233148;background:#f6f8fb;margin:0;padding:32px}main{max-width:1200px;margin:auto}h1{font-size:24px}header{display:flex;justify-content:space-between;gap:12px;align-items:center}small{color:#64748b}.paper{background:white;border:1px solid #e6eaf0;border-radius:12px;padding:20px;margin-top:20px;overflow:auto}input{padding:10px 12px;border:1px solid #d6deea;border-radius:7px;min-width:230px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{text-align:left;padding:11px;border-bottom:1px solid #eef1f5;white-space:nowrap}th{color:#5c6b81;background:#f8fafc;cursor:pointer;user-select:none}tr:hover{background:#f7f9fc}button{background:#31567f;color:white;border:0;border-radius:7px;padding:10px 14px;cursor:pointer}.warning{color:#8b5e22;margin-top:12px}
  </style></head><body><main><header><div><small>UAIS WEB · Interactive HTML Report · Fictional data only</small><h1>${escapeHtml(title)}</h1></div><button id="print">Print</button></header><p class="warning">Demonstration output. This standalone file has no login protection. Do not include real applicant data.</p><div class="paper"><input id="search" aria-label="Filter report rows" placeholder="Search report…"><small id="count">${rows.length} rows</small><table><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table></div></main><script>
  const search=document.querySelector('#search'), tbody=document.querySelector('tbody'), count=document.querySelector('#count');
  const all=[...tbody.rows]; search.addEventListener('input',()=>{let n=0; all.forEach(tr=>{let ok=tr.innerText.toLowerCase().includes(search.value.toLowerCase());tr.hidden=!ok;if(ok)n++});count.textContent=n+' rows'});
  const headers=[...document.querySelectorAll('th')];headers.forEach((th,i)=>{let direction=1;const sort=()=>{direction*=-1;[...tbody.rows].sort((a,b)=>a.cells[i].innerText.localeCompare(b.cells[i].innerText,undefined,{numeric:true})*direction).forEach(tr=>tbody.appendChild(tr));};th.addEventListener('click',sort);th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sort()}})});
  document.querySelector('#print').addEventListener('click',()=>window.print());
  </script></body></html>`;
}
export function csvText(columns: string[], rows: ReportRow[]): string {
  const escape = (value: unknown) => {
    const safe = String(value ?? "").replace(/^[\s]*[=+@-]/, "'$&");
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return (
    "\ufeff" +
    [
      columns.map(escape).join(","),
      ...rows.map((row) => columns.map((c) => escape(row[c])).join(",")),
    ].join("\r\n")
  );
}
