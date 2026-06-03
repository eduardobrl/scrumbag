import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates a release, shows generated sprints, and persists after reload", async ({ page }) => {
  await page.goto("/releases");

  // Fill the release form
  await page.getByLabel("Name").fill("Release Q3 2026");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");

  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  // Assert release appears in the list
  await expect(page.getByRole("cell", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByRole("table").getByText("In progress")).toBeVisible();

  // Assert sprint count is visible (should be > 0)
  const row = page.getByRole("row", { name: /Release Q3 2026/ });
  const sprintCell = row.locator("td").nth(3);
  const sprintCount = Number(await sprintCell.innerText());
  expect(sprintCount).toBeGreaterThan(0);

  // Reload and assert persistence
  await page.reload();
  await expect(page.getByRole("cell", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByRole("table").getByText("In progress")).toBeVisible();
});

test("prevents creating a second IN_PROGRESS release", async ({ page }) => {
  await page.goto("/releases");

  // Create first IN_PROGRESS release
  await page.getByLabel("Name").fill("First Release");
  await page.getByLabel("Objective").fill("First objective");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByRole("cell", { name: "First Release" })).toBeVisible();

  // Try to create a second IN_PROGRESS release
  await page.getByLabel("Name").fill("Second Release");
  await page.getByLabel("Objective").fill("Second objective");
  await page.getByLabel("Start date").fill("2026-08-01");
  await page.getByLabel("End date").fill("2026-08-31");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByText("Only one release can be in progress")).toBeVisible();
});
