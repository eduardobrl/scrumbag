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

test("assistant chat uses quick prompts and confirms dangerous tools", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Release Assistant",
      objective: "Ask questions",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint Assistant",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint Next",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Assistant Feature" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Assistant Story",
      estimatedDays: 2,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });

  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: "Assistant AI" })).toBeVisible();
  await expect(page.getByText("Phase 5")).toHaveCount(0);

  await page.getByPlaceholder("Type your question").fill("Is my release on track?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Release Assistant is")).toBeVisible();

  await page.getByRole("button", { name: "Suggest story redistribution" }).click();
  await expect(page.getByText("moves")).toBeVisible();

  await page.getByPlaceholder("Type your question").fill("close sprint please");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("heading", { name: "Confirm sensitive operation" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Confirm sensitive operation" })).toHaveCount(0);
  await expect(await prisma.sprint.findUniqueOrThrow({ where: { id: sprint.id } })).toMatchObject({
    status: SprintStatus.IN_PROGRESS
  });

  await page.getByPlaceholder("Type your question").fill("close sprint please");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByRole("button", { name: "Confirm and execute" }).click();
  await expect(page.getByText("Confirmed tool executed: close_sprint")).toBeVisible();
  await expect.poll(async () => (await prisma.sprint.findUniqueOrThrow({ where: { id: sprint.id } })).status).toBe(
    SprintStatus.CLOSED
  );
});
