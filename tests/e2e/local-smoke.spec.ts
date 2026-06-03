import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.absence.deleteMany();
  await prisma.squadMember.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("creates and reloads a persisted squad member", async ({ page }) => {
  await page.goto("/squad");
  await page.getByLabel("Member name").fill("Ana");
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByRole("cell", { name: "Ana" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("cell", { name: "Ana" })).toBeVisible();
});
