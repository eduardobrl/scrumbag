import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import { csvFromRows, excelFromSheets } from "@/lib/export";
import { prisma } from "@/lib/db";
import { generateReport } from "@/lib/reports";
import { REPORT_TYPES } from "@/lib/report-types";

async function resetDb() {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.appSettings.deleteMany();
}

async function seedReports() {
  await prisma.appSettings.create({
    data: {
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    }
  });
  await prisma.squadMember.create({ data: { name: "Ana", roleType: RoleType.FULL_TIME } });

  const release = await prisma.release.create({
    data: {
      name: "Release Reports",
      objective: "Export status",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint1 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.CLOSED
    }
  });
  const sprint2 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Report Feature" } });
  const done = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint1.id,
      title: "Finished export",
      storyPoints: 5,
      estimatedDays: 3,
      status: StoryStatus.DONE
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint2.id,
      title: "Active export",
      storyPoints: 5,
      estimatedDays: 4,
      status: StoryStatus.IN_PROGRESS
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Backlog export",
      storyPoints: 3,
      estimatedDays: 2,
      status: StoryStatus.BACKLOG
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint2.id,
      title: "Canceled export",
      estimatedDays: 9,
      status: StoryStatus.CANCELLED
    }
  });
  await prisma.leakageHistory.create({
    data: {
      storyId: done.id,
      originSprintId: sprint1.id,
      destinationSprintId: sprint2.id,
      eventDate: new Date("2026-07-12T00:00:00.000Z"),
      statusAtEvent: StoryStatus.IN_PROGRESS
    }
  });

  return { release, sprint1, sprint2 };
}

beforeEach(async () => {
  await resetDb();
});

describe("generateReport", () => {
  it("generates all report types with columns", async () => {
    const { release } = await seedReports();

    for (const type of REPORT_TYPES) {
      const report = await generateReport(type, release.id);
      expect(report.title).toBeTruthy();
      expect(report.columns.length).toBeGreaterThan(0);
    }
  });

  it("returns release planning row with release name, sprint count, and progress", async () => {
    const { release } = await seedReports();
    const report = await generateReport("release-planning", release.id);

    expect(report.rows[0]).toMatchObject({
      releaseName: "Release Reports",
      sprintCount: 2,
      progressPercentage: 38
    });
  });

  it("returns sprint capacity rows with gross, net, and planned values", async () => {
    const { release } = await seedReports();
    const report = await generateReport("sprint-capacity", release.id);

    expect(report.rows).toHaveLength(2);
    expect(report.rows[0]).toMatchObject({
      sprintName: "Sprint 1",
      grossCapacityDays: 5,
      netCapacityDays: 4,
      plannedEffortDays: 3
    });
  });

  it("excludes canceled and unplanned stories from stories-by-sprint", async () => {
    const { release } = await seedReports();
    const report = await generateReport("stories-by-sprint", release.id);

    expect(report.rows.map((row) => row.storyTitle)).toEqual(["Finished export", "Active export"]);
  });

  it("orders leakage rows by event date descending", async () => {
    const { release, sprint1, sprint2 } = await seedReports();
    const feature = await prisma.feature.findFirstOrThrow({ where: { releaseId: release.id } });
    const story = await prisma.story.create({
      data: {
        featureId: feature.id,
        currentSprintId: sprint2.id,
        title: "New leak",
        status: StoryStatus.IN_PROGRESS
      }
    });
    await prisma.leakageHistory.create({
      data: {
        storyId: story.id,
        originSprintId: sprint2.id,
        destinationSprintId: sprint1.id,
        eventDate: new Date("2026-07-14T00:00:00.000Z"),
        statusAtEvent: StoryStatus.IN_PROGRESS
      }
    });

    const report = await generateReport("leakage", release.id);
    expect(report.rows[0].storyTitle).toBe("New leak");
  });

  it("calculates planned-vs-capacity difference as planned minus capacity", async () => {
    const { release } = await seedReports();
    const report = await generateReport("planned-vs-capacity", release.id);

    expect(report.rows[0]).toMatchObject({ difference: -1 });
  });
});

describe("export utilities", () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "notes", label: "Notes" }
  ];
  const rows = [{ name: "Release", notes: 'Has "quotes", commas' }];

  it("export csv starts with BOM, includes headers, and escapes cells", () => {
    const csv = csvFromRows(columns, rows);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Name,Notes");
    expect(csv).toContain('"Has ""quotes"", commas"');
  });

  it("export excel returns a parsable workbook", () => {
    const buffer = excelFromSheets([{ name: "Export", columns, rows }]);
    const workbook = XLSX.read(buffer);
    const sheet = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets.Export, { header: 1 });

    expect(buffer.length).toBeGreaterThan(0);
    expect(workbook.SheetNames).toContain("Export");
    expect(sheet).toHaveLength(2);
  });
});
