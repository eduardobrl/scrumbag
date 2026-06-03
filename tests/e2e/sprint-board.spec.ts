import { expect, test } from "@playwright/test";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("add story from backlog", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Release Board",
      objective: "Execute sprint",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Board" } });
  const story = await prisma.story.create({
    data: { featureId: feature.id, title: "Drag card", storyPoints: 3, estimatedDays: 2 }
  });
  await prisma.story.create({
    data: { featureId: feature.id, title: "Canceled card", status: StoryStatus.CANCELLED, estimatedDays: 1 }
  });

  await page.goto(`/sprints/${sprint.id}`);
  await expect(page.getByRole("heading", { name: "Sprint board" })).toBeVisible();
  await expect(page.getByText("Backlog da Sprint")).toBeVisible();
  await page.getByRole("button", { name: "Add Story" }).click();
  await expect(page.getByLabel("Story")).toHaveValue(story.id);
  await expect(page.getByText("Canceled card")).toHaveCount(0);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/stories/${story.id}/plan`)),
    page.getByRole("button", { name: "Adicionar" }).click()
  ]);
  await expect(page.getByText("Drag card")).toBeVisible();
});
