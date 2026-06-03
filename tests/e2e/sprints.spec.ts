import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("shows sprint list with capacity metrics and opens detail", async ({ page }) => {
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

  // Verify release name is shown (scoped to heading to avoid matching header)
  await expect(page.getByRole("heading", { name: "Sprints Test Release" })).toBeVisible();

  // Verify sprint names are visible
  await expect(page.getByRole("link", { name: /Sprint \d+/ }).first()).toBeVisible();

  // Verify capacity metrics
  await expect(page.getByText("On track").first()).toBeVisible();
  await expect(page.getByText("0d").first()).toBeVisible();

  // Open first sprint detail
  const sprintLink = page.getByRole("link", { name: /Sprint \d+/ }).first();
  await sprintLink.click();

  // Wait for navigation to sprint detail page
  await page.waitForURL(/\/sprints\/.+/);

  // Verify detail page shows sprint info and capacity metrics
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("Gross capacity").first()).toBeVisible();
  await expect(page.getByText("Net capacity").first()).toBeVisible();
  await expect(page.getByText("Planned effort").first()).toBeVisible();
  await expect(page.getByText("Remaining").first()).toBeVisible();
  await expect(page.getByText("Occupancy").first()).toBeVisible();
  await expect(page.getByText("Risk").first()).toBeVisible();
  await expect(page.getByText("On track").first()).toBeVisible();
});

test("edits sprint goal and shows updated value on detail", async ({ page }) => {
  // Create a release through the UI to generate sprints
  await page.goto("/releases");

  await page.getByLabel("Name").fill("Edit Sprint Release");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByRole("cell", { name: "Edit Sprint Release" }).first()).toBeVisible();

  // Open sprints page and navigate to first sprint
  await page.goto("/sprints");
  const sprintLink = page.getByRole("link", { name: /Sprint \d+/ }).first();
  await sprintLink.click();
  await page.waitForURL(/\/sprints\/.+/);

  // Click Edit button
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.waitForURL(/\/sprints\/.+\/edit/);

  // Edit the goal
  await page.getByLabel("Goal").fill("Stabilize release planning");
  await page.getByRole("button", { name: "Save changes" }).click();

  // Wait for redirect back to detail
  await page.waitForURL(/\/sprints\/.+(?!\/edit)/);

  // Verify updated goal is visible
  await expect(page.getByText("Stabilize release planning")).toBeVisible();
});

test("blocks overlapping sprint date edits", async ({ page }) => {
  // Create a release through the UI to generate sprints
  await page.goto("/releases");

  await page.getByLabel("Name").fill("Overlap Test Release");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByRole("cell", { name: "Overlap Test Release" }).first()).toBeVisible();

  // Open sprints page
  await page.goto("/sprints");

  // Open Sprint 1 edit
  const sprint1Link = page.getByRole("link", { name: "Sprint 1" });
  await sprint1Link.click();
  await page.waitForURL(/\/sprints\/.+/);

  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.waitForURL(/\/sprints\/.+\/edit/);

  // Try to make Sprint 1 overlap with Sprint 2 by extending end date
  await page.getByLabel("End date").fill("2026-07-20");
  await page.getByRole("button", { name: "Save changes" }).click();

  // Should show overlap error
  await expect(page.getByText("Sprint dates cannot overlap")).toBeVisible();
});

test("shows gap warning for non-overlapping business-day gap", async ({ page }) => {
  // Create a release through the UI to generate sprints
  await page.goto("/releases");

  await page.getByLabel("Name").fill("Gap Test Release");
  await page.getByLabel("Objective").fill("Plan Q3 scope");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-31");
  await page.getByLabel("Sprint length (business days)").fill("10");
  await page.getByLabel("Meeting %").fill("10");
  await page.getByLabel("Support %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save and generate sprints" }).click();

  await expect(page.getByRole("cell", { name: "Gap Test Release" }).first()).toBeVisible();

  // Open sprints page and navigate to Sprint 2
  await page.goto("/sprints");

  const sprint2Link = page.getByRole("link", { name: "Sprint 2" });
  await sprint2Link.click();
  await page.waitForURL(/\/sprints\/.+/);

  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.waitForURL(/\/sprints\/.+\/edit/);

  // Move Sprint 2 start date later to create a business-day gap
  await page.getByLabel("Start date").fill("2026-07-20");
  await page.getByRole("button", { name: "Save changes" }).click();

  // Wait for redirect back to detail after successful save
  await page.waitForURL(/\/sprints\/.+(?!\/edit)/);

  // Should show gap warning on the detail page
  await expect(page.getByText("Gap in release schedule")).toBeVisible();
});
