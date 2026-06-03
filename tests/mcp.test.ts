import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createMcpServer } from "@/mcp/server";
import { executeTool, listToolDefinitions, tools } from "@/mcp/tools";

async function resetDb() {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.appSettings.deleteMany();
}

async function seedMcp() {
  await prisma.appSettings.create({
    data: {
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: true
    }
  });
  await prisma.squadMember.create({ data: { name: "Ana", roleType: RoleType.FULL_TIME } });
  const release = await prisma.release.create({
    data: {
      name: "Release MCP",
      objective: "Expose local data",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint MCP",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "MCP Feature" } });
  const story = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "MCP Story",
      estimatedDays: 6,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  return { release, sprint, feature, story };
}

async function withServer<T>(fn: (baseUrl: string) => Promise<T>) {
  const server = createMcpServer();
  await new Promise<void>((resolve) => server.listen(0, "localhost", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  try {
    return await fn(`http://localhost:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("MCP registry and server", () => {
  it("registers read, suggest, write, and safe tools", () => {
    const definitions = listToolDefinitions();

    expect(definitions.length).toBeGreaterThanOrEqual(10);
    expect(tools.has("get_release_summary")).toBe(true);
    expect(tools.has("suggest_capacity_risks")).toBe(true);
    expect(tools.has("create_feature")).toBe(true);
    expect(tools.get("close_sprint")?.dangerous).toBe(true);
  });

  it("serves health and tools over HTTP", async () => {
    await seedMcp();
    await withServer(async (baseUrl) => {
      const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
      const definitions = await fetch(`${baseUrl}/tools`).then((response) => response.json());

      expect(health.status).toBe("ok");
      expect(definitions.length).toBeGreaterThanOrEqual(10);
    });
  });

  it("executes read and suggest tools", async () => {
    const { release, sprint } = await seedMcp();
    const summary = await executeTool("get_release_summary", { releaseId: release.id });
    const capacity = await executeTool("get_sprint_capacity", { sprintId: sprint.id });
    const risks = await executeTool("suggest_capacity_risks", { releaseId: release.id });

    expect(summary).toMatchObject({ release: { name: "Release MCP" } });
    expect(capacity).toMatchObject({ grossCapacityDays: 5, netCapacityDays: 5 });
    expect(JSON.stringify(risks)).toContain("Sprint MCP");
  });

  it("executes write tools against SQLite", async () => {
    const { release, story } = await seedMcp();

    const created = await executeTool("create_feature", { releaseId: release.id, name: "Created by MCP" });
    const updated = await executeTool("update_story_status", { storyId: story.id, status: StoryStatus.IN_PROGRESS });
    const persisted = await prisma.story.findUniqueOrThrow({ where: { id: story.id } });

    expect(JSON.stringify(created)).toContain("Created by MCP");
    expect(JSON.stringify(updated)).toContain(StoryStatus.IN_PROGRESS);
    expect(persisted.status).toBe(StoryStatus.IN_PROGRESS);
  });

  it("requires confirmation for dangerous tools over HTTP", async () => {
    const { sprint } = await seedMcp();
    await withServer(async (baseUrl) => {
      const denied = await fetch(`${baseUrl}/tools/close_sprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId: sprint.id })
      });
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({ requiresConfirmation: true });

      const accepted = await fetch(`${baseUrl}/tools/close_sprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId: sprint.id, confirmed: true })
      });
      expect(accepted.status).toBe(200);
      expect(await prisma.sprint.findUniqueOrThrow({ where: { id: sprint.id } })).toMatchObject({
        status: SprintStatus.CLOSED
      });
    });
  });
});
