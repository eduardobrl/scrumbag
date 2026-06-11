import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";
import { ReleaseStatus, StoryStatus } from "@prisma/client";

test.beforeEach(async () => {
  await prisma.estimateChange.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates a release, moves it through PLANNING, and persists after reload", async ({ page }) => {
  await page.goto("/releases");

  // Fill the release form
  await page.getByLabel("Nome").fill("Release Q3 2026");
  await page.getByLabel("Objetivo").fill("Plan Q3 scope");
  await page.getByLabel("Data de início").fill("2026-07-01");
  await page.getByLabel("Data de término").fill("2026-07-31");
  await page.getByLabel("Duração da sprint (dias úteis)").fill("10");
  await page.getByLabel("Reuniões %").fill("10");
  await page.getByLabel("Sustentação %").fill("20");

  const createReleaseResponse = page.waitForResponse(
    (response) => response.url().includes("/api/releases") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Salvar e gerar sprints" }).click();
  const createdReleaseResponse = await createReleaseResponse;
  const createdReleaseBody = await createdReleaseResponse.text();
  expect(createdReleaseResponse.ok(), createdReleaseBody).toBe(true);

  // Assert release appears in the list
  await expect(page.getByRole("cell", { name: "Release Q3 2026" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Planejado")).toBeVisible();

  // Assert sprint count is visible (should be > 0)
  const row = page.getByRole("row", { name: /Release Q3 2026/ });
  const sprintCell = row.locator("td").nth(3);
  const sprintCount = Number(await sprintCell.innerText());
  expect(sprintCount).toBeGreaterThan(0);

  const release = await prisma.release.findFirst({ where: { name: "Release Q3 2026" }, select: { id: true } });
  expect(release).toBeTruthy();
  if (!release) {
    return;
  }

  await page.goto(`/releases/${release.id}/edit`);
  await page.getByRole("combobox", { name: "Status" }).selectOption("PLANNING");
  const updateReleaseResponse = page.waitForResponse(
    (response) => response.url().includes(`/api/releases/${release.id}`) && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  const updatedReleaseResponse = await updateReleaseResponse;
  const updatedReleaseBody = await updatedReleaseResponse.text();
  expect(updatedReleaseResponse.ok(), updatedReleaseBody).toBe(true);

  const updatedRelease = await prisma.release.findFirst({
    where: { id: release.id },
    select: { status: true }
  });
  expect(updatedRelease?.status).toBe("PLANNING");

  await page.goto("/releases");
  await expect(page.getByRole("table").getByText("Em planejamento")).toBeVisible();

  // Reload and assert persistence
  await page.reload();
  await expect(page.getByRole("table").getByText("Em planejamento")).toBeVisible();
});

test("prevents creating a second IN_PROGRESS release", async ({ page }) => {
  await page.goto("/releases");

  // Create first IN_PROGRESS release
  await page.getByLabel("Nome").fill("First Release");
  await page.getByLabel("Objetivo").fill("First objective");
  await page.getByLabel("Data de início").fill("2026-07-01");
  await page.getByLabel("Data de término").fill("2026-07-31");
  await page.getByLabel("Duração da sprint (dias úteis)").fill("10");
  await page.getByLabel("Reuniões %").fill("10");
  await page.getByLabel("Sustentação %").fill("20");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  const createFirstReleaseResponse = page.waitForResponse(
    (response) => response.url().includes("/api/releases") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Salvar e gerar sprints" }).click();
  const firstReleaseResponse = await createFirstReleaseResponse;
  const firstReleaseBody = await firstReleaseResponse.text();
  expect(firstReleaseResponse.ok(), firstReleaseBody).toBe(true);

  await expect(page.getByRole("cell", { name: "First Release" })).toBeVisible();

  // Try to create a second IN_PROGRESS release
  await page.getByLabel("Nome").fill("Second Release");
  await page.getByLabel("Objetivo").fill("Second objective");
  await page.getByLabel("Data de início").fill("2026-08-01");
  await page.getByLabel("Data de término").fill("2026-08-31");
  await page.getByRole("combobox", { name: "Status" }).selectOption("IN_PROGRESS");
  const createSecondReleaseResponse = page.waitForResponse(
    (response) => response.url().includes("/api/releases") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Salvar e gerar sprints" }).click();
  const secondReleaseResponse = await createSecondReleaseResponse;
  const secondReleaseBody = await secondReleaseResponse.text();
  expect(secondReleaseResponse.ok(), secondReleaseBody).toBe(false);

  await expect(page.getByText("Only one release can be in progress")).toBeVisible();
});

test("shows release estimate drift after post-go-live changes", async ({ page }) => {
  const release = await prisma.release.create({
    data: {
      name: "Release Drift",
      objective: "See estimate drift",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Drift Feature" } });
  const story = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Baselined story",
      storyPoints: 8,
      estimatedDays: 3,
      status: StoryStatus.BACKLOG
    }
  });
  const addedStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Added after baseline",
      storyPoints: 13,
      estimatedDays: 5,
      status: StoryStatus.BACKLOG
    }
  });
  const baseline = await prisma.releaseEstimateBaseline.create({
    data: {
      releaseId: release.id,
      capturedAt: new Date("2026-07-10T00:00:00.000Z"),
      items: {
        create: {
          storyId: story.id,
          storyPoints: 5,
          estimatedDays: 2
        }
      }
    }
  });
  await prisma.story.update({
    where: { id: addedStory.id },
    data: { createdAt: new Date(baseline.capturedAt.getTime() + 1000) }
  });
  await prisma.estimateChange.createMany({
    data: [
      { storyId: story.id, field: "storyPoints", oldValue: 5, newValue: 8, changeReason: "Scope grew" },
      { storyId: story.id, field: "estimatedDays", oldValue: 2, newValue: 3, changeReason: "Scope grew" }
    ]
  });

  await page.goto(`/releases/${release.id}`);
  await expect(page.getByText("Variação de estimativas")).toBeVisible();
  await expect(page.getByText("Baseline versus estimativas atuais das histórias capturadas no go-live.")).toBeVisible();
  await expect(page.getByText("Comparando 1 histórias, 1 alteradas, 0 canceladas desde a baseline, 1 adicionadas após a baseline.")).toBeVisible();
  await expect(page.getByText("+3")).toBeVisible();
  await expect(page.getByText("+1")).toBeVisible();
});
