import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";

test.beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function seedBacklogFlow() {
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
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Onboarding Digital" } });
  const story = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Create logs",
      description: "audit logs",
      storyPoints: 3,
      estimatedDays: 2
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Canceled template",
      status: StoryStatus.CANCELLED,
      estimatedDays: 5
    }
  });
  return { release, sprint, feature, story };
}

test("filters backlog, previews planning impact, assigns, and returns story to backlog", async ({ page }) => {
  const { story } = await seedBacklogFlow();
  await page.goto("/backlog");

  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Create logs" })).toBeVisible();
  await expect(page.getByText("Canceled template")).toHaveCount(0);

  await page.getByLabel("Include canceled").click();
  await expect(page.getByText("Canceled template")).toBeVisible();

  await page.getByLabel("Include canceled").click();
  await page.getByRole("button", { name: "Plan" }).click();
  await expect(page.getByText("Current planned effort")).toBeVisible();
  await expect(page.getByText("After add")).toBeVisible();
  await expect(page.getByText("On track")).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/stories/${story.id}/plan`) && response.request().method() === "POST"),
    page.getByRole("button", { name: "Add to sprint" }).click()
  ]);
  await expect(page.getByText("Create logs")).toHaveCount(0);

  await page.goto(`/features/${(await prisma.story.findUniqueOrThrow({ where: { id: story.id } })).featureId}`);
  await expect(page.getByText("Sprint 1")).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/stories/${story.id}/backlog`) && response.request().method() === "POST"),
    page.getByRole("button", { name: "Move to backlog" }).click()
  ]);
  await expect(page.getByText("Backlog").first()).toBeVisible();

  await page.goto("/backlog");
  await expect(page.getByRole("cell", { name: "Create logs" })).toBeVisible();
});
