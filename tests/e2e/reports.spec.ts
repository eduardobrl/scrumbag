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

test("reports page generates a report and downloads csv and excel", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Release Reports UI",
      objective: "Report status",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint Report",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Report Feature" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Report Story",
      storyPoints: 3,
      estimatedDays: 2,
      status: StoryStatus.DONE
    }
  });

  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await page.getByLabel("Report type").selectOption("stories-by-sprint");
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByRole("columnheader", { name: "Sprint" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Story", exact: true })).toBeVisible();
  await expect(page.getByText("Report Story")).toBeVisible();

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);

  const xlsxDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel" }).click();
  const xlsxDownload = await xlsxDownloadPromise;
  expect(xlsxDownload.suggestedFilename()).toMatch(/\.xlsx$/);
});
