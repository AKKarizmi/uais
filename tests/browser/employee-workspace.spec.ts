import { test, expect } from "@playwright/test";

test("preview menu navigates to employee, student details, portal and admin", async ({
  page,
}) => {
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Workspace Preview", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Employee Workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/employee-workspace$/);
  await expect(
    page.getByRole("heading", { name: "Employee Workspace", level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Mark complete: Confirm university requirements",
    })
    .click();
  await expect(
    page.getByLabel("Status of Confirm university requirements"),
  ).toHaveValue("Done");
  await page
    .getByLabel("Preview workspace as", { exact: true })
    .selectOption("emp-3");
  await expect(
    page.getByRole("link", { name: "Open student Maya Rahman" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Open student Leo Hassan" }).click();
  await expect(page).toHaveURL(/\/students\/stu-2$/);
  await page.getByRole("button", { name: "Demo profile menu" }).click();
  await page
    .getByRole("menuitem", { name: "Student Portal", exact: true })
    .click();
  await expect(page).toHaveURL(/\/student-portal$/);
  await expect(page.getByLabel("Demo student profile")).toBeVisible();
  await page
    .getByRole("button", { name: "Workspace Preview", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Admin Dashboard", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
});
test("mobile navigation and tables stay within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/employee-workspace");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  const navigation = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(
    navigation.getByRole("link", { name: "Employee Workspace", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await navigation
    .getByRole("link", { name: "Student Portal", exact: true })
    .click();
  await expect(page).toHaveURL(/\/student-portal$/);
  await page.goto("/employee-workspace");
  await expect(
    page.getByLabel("Preview workspace as", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
