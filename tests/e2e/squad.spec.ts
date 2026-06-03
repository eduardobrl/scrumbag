import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.absence.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.appSettings.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates squad calendar data and shows summary after reload", async ({ page }) => {
  await page.goto("/squad");

  await page.getByLabel("Member name").fill("Carla");
  await page.getByLabel("Schedule").selectOption("INTERN");
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByRole("cell", { name: "Carla" })).toBeVisible();
  await expect(page.getByTestId("metric-daily-capacity")).toContainText("6h");

  await page.getByLabel("Start date").fill("2026-07-10");
  await page.getByLabel("End date").fill("2026-07-12");
  await page.getByLabel("Notes").fill("Planned absence");
  await page.getByRole("button", { name: "Add absence" }).click();
  await expect(page.getByRole("cell", { name: "Planned absence" })).toBeVisible();

  await page.getByLabel("Date", { exact: true }).fill("2026-07-09");
  await page.getByLabel("Name", { exact: true }).fill("Local holiday");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await expect(page.getByRole("cell", { name: "Local holiday" })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("metric-active-members")).toContainText("1");
  await expect(page.getByTestId("metric-future-absences")).toContainText("1");
  await expect(page.getByTestId("metric-holidays")).toContainText("1");
  await expect(page.getByText("Sprint impact appears after Phase 2 creates sprints.")).toBeVisible();
});
