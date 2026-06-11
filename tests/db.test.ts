import { afterEach, describe, expect, it, vi } from "vitest";

const realDatabaseUrl = "file:./data/squad-planner.db";

describe("database safety", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("refuses to use the real local database during tests", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = realDatabaseUrl;

    let imported: typeof import("../src/lib/db") | undefined;

    try {
      await expect(
        (async () => {
          imported = await import("../src/lib/db");
        })()
      ).rejects.toThrow("Refusing to use real local database during tests");
    } finally {
      await imported?.prisma.$disconnect();

      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
    }
  });
});
