import { expect, test } from "@playwright/test";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("close and reopen sprint with leakage display", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Closure Release",
      objective: "Closure",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const nextSprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Leakage" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Unfinished story",
      status: StoryStatus.IN_PROGRESS
    }
  });

  await page.goto(`/sprints/${sprint.id}`);
  await page.getByRole("button", { name: "Close Sprint" }).click();
  await expect(page.getByText("Unfinished stories")).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/sprints/${sprint.id}/close`)),
    page.getByRole("button", { name: "Close Sprint" }).last().click()
  ]);

  await page.goto(`/sprints/${nextSprint.id}`);
  await expect(page.getByText("Unfinished story")).toBeVisible();
  await expect(page.getByText("Vazou da Sprint Sprint 1")).toBeVisible();

  await page.goto(`/sprints/${sprint.id}`);
  await page.getByRole("button", { name: "Reopen Sprint" }).click();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/sprints/${sprint.id}/reopen`)),
    page.getByRole("button", { name: "Reopen Sprint" }).last().click()
  ]);
  await expect(page.getByRole("button", { name: "Close Sprint" })).toBeVisible();
});
