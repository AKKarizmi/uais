import { expect, it } from "vitest";
import { csvText, reportHtml } from "../lib/operations/reports";

it("escapes untrusted cells and titles in standalone HTML", () => {
  const html = reportHtml(
    "<script>bad()</script>",
    ["Name"],
    [{ Name: "</td><script>alert(1)</script>" }],
  );
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("Fictional data only");
  expect(html).toContain("addEventListener('keydown'");
  expect(html).not.toMatch(/<script[^>]+src=/);
});
it.each(['=HYPERLINK("x")', " +SUM(1,2)", "\t@SUM(1)", "-10", "\r=1"])(
  "guards CSV formula %s",
  (value) => {
    expect(csvText(["Name"], [{ Name: value }])).toContain("\"'");
  },
);
it("quotes embedded separators, quotes, and newlines", () => {
  expect(csvText(["Name"], [{ Name: 'a,"b"\nc' }])).toContain('"a,""b""\nc"');
});
it("exports a report whose search and keyboard sorting work without network access", () => {
  const html = reportHtml(
    "Demo",
    ["Name"],
    [{ Name: "Alpha" }, { Name: "Zulu" }],
  );
  document.documentElement.innerHTML = html;
  // jsdom has no layout engine; innerText is represented by textContent here.
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      return this.textContent;
    },
  });
  const script = document.querySelector("script")!.textContent!;
  new Function(script)();
  const search = document.querySelector<HTMLInputElement>("#search")!;
  search.value = "Zulu";
  search.dispatchEvent(new Event("input"));
  expect(document.querySelector("#count")!.textContent).toBe("1 rows");
  expect(document.querySelectorAll("tr[hidden]")).toHaveLength(1);
  document
    .querySelector("th")!
    .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(document.querySelector("tbody tr")!.textContent).toBe("Zulu");
});
