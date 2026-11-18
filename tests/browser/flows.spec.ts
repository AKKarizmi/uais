import { test, expect } from "@playwright/test";
test("workspace navigation and fictional task lifecycle", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await page.getByRole("button", { name: "New Task" }).click();
  await page.getByLabel("Task title").fill("Fictional review flow");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await page
    .getByPlaceholder("Search tasks and employees…")
    .fill("Fictional review flow");
  await page
    .getByLabel("Status of Fictional review flow", { exact: true })
    .selectOption("In progress");
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await expect(page.getByLabel("Move Fictional review flow")).toHaveValue(
    "In progress",
  );
  await page.getByLabel("Move Fictional review flow").selectOption("Done");
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page
    .getByPlaceholder("Search tasks and employees…")
    .fill("Fictional review flow");
  await expect(
    page.getByLabel("Status of Fictional review flow", { exact: true }),
  ).toHaveValue("Done");
});
test("all operational routes and portal restrictions", async ({ page }) => {
  for (const route of [
    "students",
    "universities",
    "applications",
    "tasks",
    "documents",
    "reports",
    "employees",
    "attendance",
    "activity",
    "settings",
    "student-portal",
  ]) {
    await page.goto("/" + route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByText("UI prototype", { exact: false }).first(),
    ).toBeVisible();
  }
  await expect(
    page.getByText("A student ID alone is never a login credential."),
  ).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
});
