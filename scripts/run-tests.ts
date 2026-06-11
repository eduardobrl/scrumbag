import { spawnSync } from "child_process";

const mode = process.argv[2];
const extraArgs = process.argv.slice(3);

const databaseUrls: Record<string, string> = {
  unit: "file:./data/test/squad-planner.test.db",
  e2e: "file:./data/test/squad-planner.e2e.db"
};

if (!mode || !(mode in databaseUrls)) {
  console.error("Usage: tsx scripts/run-tests.ts <unit|e2e>");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrls[mode],
  PLAYWRIGHT_BASE_URL: mode === "e2e" ? "http://localhost:3100" : process.env.PLAYWRIGHT_BASE_URL,
  SQUAD_PLANNER_TEST_RUN: "1"
};

function run(command: string) {
  const result = spawnSync(command, {
    env,
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function quoteArg(arg: string) {
  return /[\s"]/.test(arg) ? JSON.stringify(arg) : arg;
}

console.log(`Using disposable SQLite database: ${env.DATABASE_URL}`);
run("npm run db:migrate");
run([mode === "unit" ? "vitest run" : "playwright test", ...extraArgs.map(quoteArg)].join(" "));
