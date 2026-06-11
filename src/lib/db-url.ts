import { resolve } from "path";
import { fileURLToPath } from "url";

export const DEFAULT_DATABASE_URL = "file:./data/squad-planner.db";

const realDatabasePath = resolve(process.cwd(), "data", "squad-planner.db");

function normalizePath(path: string) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
}

export function resolveSqliteDatabasePath(databaseUrl = getDatabaseUrl()) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Only file: SQLite database URLs are supported. Received: ${databaseUrl}`);
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl);
  }

  const filePath = databaseUrl.slice("file:".length);
  return resolve(process.cwd(), filePath);
}

export function isRealLocalDatabase(databaseUrl = getDatabaseUrl()) {
  return normalizePath(resolveSqliteDatabasePath(databaseUrl)) === normalizePath(realDatabasePath);
}

export function isTestRuntime() {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST !== undefined ||
    process.env.PLAYWRIGHT_TEST !== undefined ||
    process.env.SQUAD_PLANNER_TEST_RUN === "1"
  );
}

export function assertSafeDatabaseUrl(databaseUrl = getDatabaseUrl()) {
  if (isTestRuntime() && isRealLocalDatabase(databaseUrl)) {
    throw new Error(
      "Refusing to use real local database during tests. Set DATABASE_URL to a disposable test database."
    );
  }
}
