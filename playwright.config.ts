import { defineConfig, devices } from "@playwright/test";

const isSquadPlannerTestRun = process.env.SQUAD_PLANNER_TEST_RUN === "1";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? (isSquadPlannerTestRun ? "http://localhost:3100" : "http://localhost:3000");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: isSquadPlannerTestRun ? "npm run dev -- -p 3100" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isSquadPlannerTestRun,
    timeout: 120000
  }
});
