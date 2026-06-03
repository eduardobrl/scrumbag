import { expect, test } from "@playwright/test";
import { ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.appSettings.deleteMany();

  await prisma.appSettings.create({
    data: {
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    }
  });
  await prisma.squadMember.create({ data: { name: "Ana", roleType: RoleType.FULL_TIME } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("dashboard renders live metrics, alerts, sprint links, and header capacity", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Release Dashboard",
      objective: "Show health",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint Live",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint Empty",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Timeline Feature" } });
  await prisma.feature.create({ data: { releaseId: release.id, name: "Feature Without Stories" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Done",
      storyPoints: 5,
      estimatedDays: 3,
      status: StoryStatus.DONE
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Too much",
      storyPoints: 5,
      estimatedDays: 99,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Release Dashboard", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Planned effort")).toBeVisible();
  await expect(page.getByText("Capacity: 102.0 / 10.0 days")).toBeVisible();
  await expect(page.getByText("Feature Without Stories has no active stories.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sprint Live", exact: true })).toHaveAttribute(
    "href",
    `/sprints/${sprint.id}`
  );
  await expect(page.getByText("2040%")).toBeVisible();
  await expect(page.getByText("Timeline Feature")).toBeVisible();
});
