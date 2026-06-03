import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates a release, opens detail, edits objective, and sees change after reload", async ({ page }) => {
  await page.goto("/releases");

  // Create an IN_PROGRESS release
  await page.getByLabel("Name").fill("Release Q3 2026");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  // Wait for the release to appear in the list
  await expect(page.getByRole("table").getByRole("cell", { name: "Release Q3 2026" }).first()).toBeVisible();

  // Verify global header shows active release
  await expect(page.locator("header").getByText("Release Q3 2026")).toBeVisible();
  await expect(page.locator("header").getByText("In progress")).toBeVisible();

  // Open detail via view button
  const row = page.getByRole("table").getByRole("row", { name: /Release Q3 2026/ }).first();
  await row.getByRole("link", { name: "View" }).click();

  // Verify detail page content
  await expect(page.getByRole("heading", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByText("2026-07-01 to 2026-07-31")).toBeVisible();

  // Verify sprints table
  await expect(page.getByRole("cell", { name: "Sprint 1" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Pending capacity" }).first()).toBeVisible();

  // Edit the release
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit release" })).toBeVisible();

  // Change objective
  await page.getByLabel("Objective").fill("Updated Q3 objective");
  await page.getByRole("button", { name: "Save changes" }).click();

  // Should redirect back to detail
  await expect(page.getByRole("heading", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByText("Updated Q3 objective")).toBeVisible();

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByRole("heading", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByText("Updated Q3 objective")).toBeVisible();
});

test("shows release list with status, sprints, meetings, and support columns", async ({ page }) => {
  await page.goto("/releases");

  // Create a release
  await page.getByLabel("Name").fill("Release Q3 2026");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  // Verify list columns
  await expect(page.getByRole("table").getByRole("cell", { name: "Release Q3 2026" }).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Period" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Sprints" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Meetings" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Support" })).toBeVisible();
});

test("release detail shows sprint planned effort, capacity, and risk placeholders", async ({ page }) => {
  await page.goto("/releases");

  // Create an IN_PROGRESS release
  await page.getByLabel("Name").fill("Release Q3 2026");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  // Open detail
  const row = page.getByRole("table").getByRole("row", { name: /Release Q3 2026/ }).first();
  await row.getByRole("link", { name: "View" }).click();

  // Verify sprint table columns
  await expect(page.getByRole("columnheader", { name: "Planned effort" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Capacity" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Remaining" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Risk" })).toBeVisible();

  // Verify placeholder values
  await expect(page.getByRole("cell", { name: "0d" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Pending capacity" }).first()).toBeVisible();
});

test("release edit page renders all inputs", async ({ page }) => {
  await page.goto("/releases");

  // Create a release
  await page.getByLabel("Name").fill("Release Q3 2026");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  // Open edit page
  const row = page.getByRole("table").getByRole("row", { name: /Release Q3 2026/ }).first();
  await row.getByRole("link", { name: "Edit" }).click();

  // Wait for edit page to load
  await expect(page.getByRole("heading", { name: "Edit release" })).toBeVisible();

  // Verify all inputs are present
  await expect(page.getByLabel("Name")).toHaveValue("Release Q3 2026");
  await expect(page.getByLabel("Objective")).toHaveValue("Plan Q3 scope");
  await expect(page.getByLabel("Start date")).toHaveValue("2026-07-01");
  await expect(page.getByLabel("End date")).toHaveValue("2026-07-31");
  await expect(page.getByLabel("Sprint length (business days)")).toHaveValue("10");
  await expect(page.getByLabel("Meeting %")).toHaveValue("10");
  await expect(page.getByLabel("Support %")).toHaveValue("20");
  await expect(page.getByRole("combobox", { name: "Status" })).toHaveValue("PLANNED");
});
