import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";
import { ReleaseStatus, StoryStatus } from "@prisma/client";

test.beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function seedFeature() {
  const release = await prisma.release.create({
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
  return prisma.feature.create({ data: { releaseId: release.id, name: "Onboarding Digital" } });
}

test("creates, edits, and cancels stories while feature metrics update", async ({ page }) => {
  const feature = await seedFeature();
  await page.goto(`/features/${feature.id}`);

  await page.getByRole("link", { name: "New Story" }).click();
  await page.getByLabel("Title").fill("Create onboarding screen");
  await page.getByLabel("Description").fill("Screen work");
  await page.getByLabel("Acceptance criteria").fill("User can start onboarding");
  await page.getByLabel("Story Points").fill("5");
  await page.getByLabel("Estimated business days").fill("2");
  await page.getByRole("button", { name: "Save story" }).click();

  await expect(page.getByRole("cell", { name: "Create onboarding screen" })).toBeVisible();
  await expect(page.getByText("5").first()).toBeVisible();
  await expect(page.getByText("2d").first()).toBeVisible();
  await expect(page.getByText("Backlog").first()).toBeVisible();

  await page.getByRole("link", { name: "Edit story" }).click();
  await page.getByLabel("Status").selectOption(StoryStatus.DONE);
  await page.getByRole("button", { name: "Save story" }).click();
  await expect(page.getByText("100%")).toBeVisible();

  await page.getByRole("button", { name: "Cancel story" }).click();
  await expect(page.getByText("Cancelled")).toBeVisible();
  await expect(page.getByText("0d").first()).toBeVisible();
});
