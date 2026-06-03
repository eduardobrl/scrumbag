import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("shows sprint list with placeholder metrics and opens detail", async ({ page }) => {
  // Create a release through the UI to generate sprints
  await page.goto("/releases");

  await page.getByLabel("Name").fill("Sprints Test Release");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByRole("cell", { name: "Sprints Test Release" }).first()).toBeVisible();

  // Open sprints page
  await page.goto("/sprints");

  // Verify release name is shown
  await expect(page.getByText("Sprints Test Release")).toBeVisible();

  // Verify sprint names are visible
  await expect(page.getByRole("link", { name: /Sprint \d+/ }).first()).toBeVisible();

  // Verify placeholder metrics
  await expect(page.getByText("Pending capacity").first()).toBeVisible();
  await expect(page.getByText("0d").first()).toBeVisible();

  // Open first sprint detail
  const sprintLink = page.getByRole("link", { name: /Sprint \d+/ }).first();
  await sprintLink.click();

  // Wait for navigation to sprint detail page
  await page.waitForURL(/\/sprints\/.+/);

  // Verify detail page shows sprint info and placeholders
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("Capacity").first()).toBeVisible();
  await expect(page.getByText("Planned effort").first()).toBeVisible();
  await expect(page.getByText("Remaining").first()).toBeVisible();
  await expect(page.getByText("Occupancy").first()).toBeVisible();
  await expect(page.getByText("Risk").first()).toBeVisible();
  await expect(page.getByText("Pending capacity").first()).toBeVisible();
});
