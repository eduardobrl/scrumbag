import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";
import { ReleaseStatus } from "@prisma/client";

test.beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.release.create({
    data: {
      name: "Release Q3 2026",
      objective: "Plan scope",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates, opens, edits, reloads, and cancels a feature", async ({ page }) => {
  await page.goto("/features");

  await expect(page.getByRole("heading", { name: "Features / Stories" })).toBeVisible();
  await page.getByLabel("Name").fill("Onboarding Digital");
  await page.getByLabel("Description").fill("Reduce onboarding friction");
  await page.getByRole("button", { name: "New Feature" }).click();

  await expect(page.getByRole("cell", { name: "Onboarding Digital" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("cell", { name: "Onboarding Digital" })).toBeVisible();

  await page.getByRole("link", { name: "View" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding Digital" })).toBeVisible();
  await expect(page.getByText("0d")).toBeVisible();
  await expect(page.getByText("This feature has no stories yet.")).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Description").fill("Updated onboarding description");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Updated onboarding description")).toBeVisible();

  await page.goto("/features");
  await page.getByRole("button", { name: "Cancel feature" }).click();
  await expect(page.getByText("Cancelled")).toBeVisible();
});
