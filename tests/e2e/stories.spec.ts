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
      status: ReleaseStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Onboarding Digital" } });
  return { release, feature };
}

test("allows story estimate edits while the release is in PLANNING", async ({ page }) => {
  const { release, feature } = await seedFeature();

  await page.goto(`/releases/${release.id}/edit`);
  await page.getByRole("combobox", { name: "Status" }).selectOption("PLANNING");
  const updateReleaseResponse = page.waitForResponse(
    (response) => response.url().includes(`/api/releases/${release.id}`) && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  const updatedReleaseResponse = await updateReleaseResponse;
  const updatedReleaseBody = await updatedReleaseResponse.text();
  expect(updatedReleaseResponse.ok(), updatedReleaseBody).toBe(true);

  const updatedRelease = await prisma.release.findUnique({
    where: { id: release.id },
    select: { status: true }
  });
  expect(updatedRelease?.status).toBe(ReleaseStatus.PLANNING);

  await page.goto("/releases");
  await expect(page.getByRole("table").getByText("Em planejamento")).toBeVisible();

  await page.goto(`/features/${feature.id}`);

  await page.getByRole("link", { name: "Nova História" }).click();
  await expect(
    page.getByText("O modo de planejamento mantém as estimativas editáveis e ainda não cria histórico de auditoria.")
  ).toBeVisible();
  await page.getByLabel("Título").fill("Create onboarding screen");
  await page.getByLabel("Descrição").fill("Screen work");
  await page.getByLabel("Critérios de aceite").fill("User can start onboarding");
  await page.getByLabel("Story Points").fill("5");
  await page.getByLabel("Dias úteis estimados").fill("2");
  const createStoryResponse = page.waitForResponse(
    (response) => response.url().includes("/api/stories") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Salvar história" }).click();
  const createdStoryResponse = await createStoryResponse;
  const createdStoryBody = await createdStoryResponse.text();
  expect(createdStoryResponse.ok(), createdStoryBody).toBe(true);

  await expect(page.getByRole("cell", { name: "Create onboarding screen" })).toBeVisible();
  await expect(page.getByText("5").first()).toBeVisible();
  await expect(page.getByText("2d").first()).toBeVisible();
  await expect(page.getByText("Backlog").first()).toBeVisible();

  await page.getByRole("link", { name: "Editar história" }).click();
  await expect(
    page.getByText("O modo de planejamento mantém as estimativas editáveis e ainda não cria histórico de auditoria.")
  ).toBeVisible();
  await page.getByLabel("Story Points").fill("8");
  await page.getByLabel("Dias úteis estimados").fill("3");
  const updateStoryResponse = page.waitForResponse(
    (response) => response.url().includes("/api/stories/") && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Salvar história" }).click();
  const updatedStoryResponse = await updateStoryResponse;
  const updatedStoryBody = await updatedStoryResponse.text();
  expect(updatedStoryResponse.ok(), updatedStoryBody).toBe(true);

  await expect(page.getByRole("cell", { name: "Create onboarding screen" })).toBeVisible();
  await expect(page.getByText("8").first()).toBeVisible();
  await expect(page.getByText("3d").first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("cell", { name: "Create onboarding screen" })).toBeVisible();
  await expect(page.getByText("8").first()).toBeVisible();
  await expect(page.getByText("3d").first()).toBeVisible();

  await page.getByRole("link", { name: "Editar história" }).click();
  await page.getByLabel("Status").selectOption(StoryStatus.DONE);
  const updateStoryDoneResponse = page.waitForResponse(
    (response) => response.url().includes("/api/stories/") && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Salvar história" }).click();
  const updatedStoryDoneResponse = await updateStoryDoneResponse;
  const updatedStoryDoneBody = await updatedStoryDoneResponse.text();
  expect(updatedStoryDoneResponse.ok(), updatedStoryDoneBody).toBe(true);
  await expect(page.getByText("100%")).toBeVisible();

  await page.getByRole("button", { name: "Cancelar história" }).click();
  await expect(page.getByText("Cancelado")).toBeVisible();
  await expect(page.getByText("0d").first()).toBeVisible();
});
