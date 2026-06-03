import { beforeEach, describe, expect, it } from "vitest";
import { getOrCreateSettings, updateSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

describe("settings persistence", () => {
  beforeEach(async () => {
    await prisma.appSettings.deleteMany();
  });

  it("creates default local settings", async () => {
    const settings = await getOrCreateSettings();

    expect(settings.workingHoursFullTime).toBe(8);
    expect(settings.workingHoursIntern).toBe(6);
    expect(settings.standardDayHours).toBe(8);
    expect(settings.mcpHost).toBe("localhost");
    expect(settings.mcpPort).toBe(3333);
  });

  it("rejects invalid numeric settings", async () => {
    const result = await updateSettings({
      workingHoursFullTime: 8,
      workingHoursIntern: 0,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.workingHoursIntern).toBe("Must be greater than 0");
  });

  it("rejects invalid MCP ports", async () => {
    const result = await updateSettings({
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 70000,
      mcpEnabled: false
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.mcpPort).toContain("1 to 65535");
  });
});
