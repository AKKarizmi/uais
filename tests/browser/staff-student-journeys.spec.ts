import { test, expect } from "@playwright/test";
test("staff login safely enters Manager demo, creates a task and exits", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Manager", exact: true }).check();
  await expect(page.getByLabel("Password", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Explore Demo Workspace" }).click();
  await expect(page).toHaveURL(/\/manager-workspace$/);
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await page
    .getByLabel("Task title", { exact: true })
    .fill("Sample manager task");
  await page.getByRole("button", { name: "Create demo task" }).click();
  await expect(
    page.getByText("Sample manager task", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Exit Demo", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
test("lookup does not authorize access; explicit sample journey displays corresponding results", async ({
  page,
}) => {
  await page.goto("/track-application/results");
  await expect(
    page.getByRole("heading", {
      name: "Verification or sample selection required",
    }),
  ).toBeVisible();
  await page.goto("/track-application");
  await page.getByLabel("Unique Student ID").fill("UAIS-STU-DEMO-9999");
  await page
    .getByLabel("Registered email address")
    .fill("unknown@example.test");
  await page.getByRole("button", { name: "Continue to Verification" }).click();
  await expect(
    page.getByText(/No lookup was performed and no email was sent/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Verify Code", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Sample student", { exact: true })
    .selectOption("stu-2");
  await page
    .getByRole("button", { name: "Explore Sample Student Results" })
    .click();
  await expect(page).toHaveURL(/\/track-application\/results$/);
  await expect(page.getByText("Leo Hassan", { exact: true })).toBeVisible();
  await page
    .getByLabel("Document filter", { exact: true })
    .selectOption("Rejected");
  await expect(
    page.getByText(/Rejection details are not recorded/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Verification or sample selection required",
    }),
  ).toBeVisible();
});
test("mobile public journeys and manager tables avoid viewport overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/login", "/manager-workspace", "/track-application"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
