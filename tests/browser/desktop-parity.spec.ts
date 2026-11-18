import { test, expect } from "@playwright/test";

test("Desktop core navigation, canonical grid editing and four metadata tabs", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await navigation.getByRole("link", { name: "Students", exact: true }).click();
  const grid = page.getByRole("grid", { name: "Student spreadsheet" });
  await grid.getByText("Leo Hassan", { exact: true }).click();
  await expect(
    page
      .getByRole("complementary")
      .getByRole("heading", { name: "Leo Hassan" }),
  ).toBeVisible();
  const email = grid.getByRole("gridcell", {
    name: "leo@example.test",
    exact: true,
  });
  await email.focus();
  await email.press("F2");
  await page
    .getByLabel("Edit Email", { exact: true })
    .fill("edited@example.test");
  await page.getByLabel("Edit Email", { exact: true }).press("Enter");
  await expect(
    grid.getByRole("gridcell", { name: "edited@example.test", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Metadata", exact: true })
    .click();
  for (const name of [
    "Basic Fields",
    "Advanced Fields",
    "Documents",
    "Advanced JSON",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await navigation.getByRole("link", { name: "Recorder", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start recording · Desktop only" }),
  ).toBeDisabled();
  await navigation
    .getByRole("link", { name: "System & Resolver", exact: true })
    .click();
  await page.getByRole("button", { name: "Resolve", exact: true }).click();
  await expect(page.getByLabel("Resolver result")).toContainText(
    "identity.first_name",
  );
});

test("university has multiple portals with distinct website and portal actions", async ({
  page,
}) => {
  await page.goto("/universities");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page
    .getByLabel("University name *", { exact: true })
    .fill("Fictional Test University");
  await page
    .getByLabel("University website", { exact: true })
    .fill("https://example.test");
  await page
    .getByLabel("Portal URL", { exact: true })
    .fill("https://fictional.dreamapply.com");
  await page
    .getByRole("button", { name: "Save demo metadata", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Portal", exact: true }).click();
  await page
    .getByLabel("Portal URL", { exact: true })
    .fill("https://second.example.test");
  await page.getByLabel("Portal name", { exact: true }).fill("Scholarships");
  await page
    .getByRole("button", { name: "Save demo metadata", exact: true })
    .click();
  const grid = page.getByRole("grid", { name: "University spreadsheet" });
  await expect(
    grid.getByText("Fictional Test University", { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "University Website ↗", exact: true }),
  ).toHaveAttribute("href", "https://example.test");
  await expect(
    page.getByRole("link", { name: "Open Portal ↗", exact: true }),
  ).toHaveAttribute("href", "https://second.example.test");
});

test("Desktop and mobile screenshots for manual comparison", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of [
    "dashboard",
    "students",
    "universities",
    "recorder",
    "system-resolver",
  ]) {
    await page.goto(`/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`${route}-desktop.png`),
      fullPage: true,
    });
  }
  await page.goto("/students/stu-2");
  await page.screenshot({
    path: testInfo.outputPath("metadata-editor-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/students");
  await expect(
    page.getByRole("grid", { name: "Student spreadsheet" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("students-mobile.png"),
    fullPage: true,
  });
});
