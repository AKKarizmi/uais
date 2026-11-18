import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  for (const route of ["tasks", "reports"]) {
    test(`${route} keeps text inside its panel at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${route}`);
      const table = page.getByRole("region", { name: "Scrollable data table" });
      await expect(table.getByRole("columnheader").first()).toBeVisible();
      const layout = await table.evaluate((node) => {
        const panel = node.closest("section")!;
        const firstCell = node.querySelector("tbody td")!;
        const text = document.createRange();
        text.selectNodeContents(firstCell);
        return {
          panelLeft: panel.getBoundingClientRect().left,
          panelRight: panel.getBoundingClientRect().right,
          scrollLeft: node.getBoundingClientRect().left,
          scrollRight: node.getBoundingClientRect().right,
          textLeft: text.getBoundingClientRect().left,
          hiddenRows: node.scrollHeight > node.clientHeight + 1,
          pageOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      expect(layout.scrollLeft).toBeGreaterThanOrEqual(layout.panelLeft);
      expect(layout.scrollRight).toBeLessThanOrEqual(layout.panelRight);
      expect(layout.textLeft).toBeGreaterThan(layout.panelLeft + 8);
      expect(layout.hiddenRows).toBe(false);
      expect(layout.pageOverflow).toBe(false);
      await expect(
        page.getByRole("navigation", { name: "Table pagination" }),
      ).toBeVisible();
      if (route === "tasks") {
        await page.getByRole("button", { name: "Next", exact: true }).click();
        await expect(
          page.getByText("Page 2 of 2", { exact: true }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("button", {
            name: "Export all seven tabs · HTML",
            exact: true,
          }),
        ).toBeVisible();
        const exportButton = page.getByRole("button", {
          name: "Export all seven tabs · HTML",
          exact: true,
        });
        const header = page.getByRole("heading", {
          name: "Report builder",
          exact: true,
        });
        expect(
          await exportButton.evaluate(
            (node) => !!node.closest(".panel-heading"),
          ),
        ).toBe(true);
        await expect(header).toBeVisible();
      }
      await page.screenshot({
        path: testInfo.outputPath(`${route}-${width}px.png`),
        fullPage: true,
      });
    });
  }
}
