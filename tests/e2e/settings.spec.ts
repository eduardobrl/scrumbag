import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

test.beforeEach(async () => {
  await prisma.appSettings.deleteMany();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("saves settings and shows them after reload", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Intern hours").fill("5");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Intern hours")).toHaveValue("5");
  await expect(page.getByText("./data/squad-planner.db")).toBeVisible();
});
