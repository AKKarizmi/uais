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

/** Seven generic UAIS datasets; SDM admission-specific rules are deliberately absent. */
export function reportBundleHtml(
  datasets: Record<string, { columns: string[]; rows: ReportRow[] }>,
): string {
  const entries = Object.entries(datasets);
  const tabs = entries
    .map(
      ([name], i) =>
        `<button role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-index="${i}">${escapeHtml(name)}</button>`,
    )
    .join("");
  const panels = entries
    .map(
      ([name, data], i) =>
        `<section role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" ${i ? "hidden" : ""}><h2>${escapeHtml(name)}</h2><label>Search ${escapeHtml(name)} <input aria-label="Search ${escapeHtml(name)}" type="search"></label><p class="count">${data.rows.length} rows</p><div class="scroll"><table><thead><tr>${data.columns.map((c) => `<th scope="col" aria-sort="none"><button>${escapeHtml(c)}</button></th>`).join("")}</tr></thead><tbody>${data.rows.map((row) => `<tr>${data.columns.map((c) => `<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAIS fictional operations report</title><style>body{margin:0;background:#f5f7fb;color:#101828;font:14px 'Segoe UI',Arial,sans-serif}main{max-width:1400px;margin:auto;padding:28px}h1{font-size:26px}.notice{padding:14px;background:#fffaeb;border:1px solid #fedf89;border-radius:8px}nav{display:flex;gap:5px;overflow:auto;padding:16px 0}button,input{font:inherit;border:1px solid #d0d5dd;border-radius:6px;background:white;padding:8px 12px;color:#101828;cursor:pointer}button[aria-selected=true]{background:#175cd3;color:white}section{background:white;padding:20px;border:1px solid #eaecf0;border-radius:10px}.scroll{overflow:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:10px;border-bottom:1px solid #eaecf0;white-space:nowrap}th{background:#f5f7fb}th button{border:0;background:none;padding:0;font-weight:600}input{cursor:text}button:focus-visible,input:focus-visible{outline:2px solid #2563eb;outline-offset:2px}[hidden]{display:none!important}@media print{nav,input,.print{display:none}main{padding:0}.scroll{overflow:visible}td,th{white-space:normal}}</style></head><body><main><h1>UAIS operations report</h1><p class="notice">Fictional data only. This self-contained file has no authentication or permission protection. Do not include real applicant data. Attendance counts logins and last seen; it does not measure work hours.</p><button class="print" id="print">Print current tab</button><nav role="tablist" aria-label="Report datasets">${tabs}</nav>${panels}</main><script>
  const tabs=[...document.querySelectorAll('[role=tab]')], panels=[...document.querySelectorAll('[role=tabpanel]')];
  function activate(i){tabs.forEach((t,j)=>{t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;panels[j].hidden=i!==j});tabs[i].focus()}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(i));tab.addEventListener('keydown',e=>{let n=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(n!==null){e.preventDefault();activate(n)}})});
  panels.forEach(panel=>{const body=panel.querySelector('tbody'),rows=[...body.rows],search=panel.querySelector('input'),count=panel.querySelector('.count');search.addEventListener('input',()=>{let n=0;rows.forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(search.value.toLowerCase());if(!row.hidden)n++});count.textContent=n+' rows'});panel.querySelectorAll('th').forEach((th,i)=>{let ascending=true;th.querySelector('button').addEventListener('click',()=>{[...body.rows].sort((a,b)=>a.cells[i].textContent.localeCompare(b.cells[i].textContent,undefined,{numeric:true})*(ascending?1:-1)).forEach(row=>body.appendChild(row));panel.querySelectorAll('th').forEach(h=>h.setAttribute('aria-sort','none'));th.setAttribute('aria-sort',ascending?'ascending':'descending');ascending=!ascending})})});
  document.querySelector('#print').addEventListener('click',()=>window.print());
  </script></body></html>`;
}
