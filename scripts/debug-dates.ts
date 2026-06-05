import { prisma } from "../src/lib/db";
import { ReleaseStatus, SprintStatus } from "@prisma/client";

async function main() {
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();

  const release = await prisma.release.create({
    data: {
      name: "Test",
      objective: "Test",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    }
  });

  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-24T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });

  const read = await prisma.sprint.findUnique({ where: { id: sprint.id } });
  console.log("Stored startDate:", sprint.startDate.toISOString());
  console.log("Read startDate:", read?.startDate.toISOString());
  console.log("Read startDate getDay:", read?.startDate.getDay());
  console.log("Normalized:", new Date(read!.startDate.toISOString().slice(0, 10) + "T00:00:00.000Z").toISOString());
  console.log("Normalized getDay:", new Date(read!.startDate.toISOString().slice(0, 10) + "T00:00:00.000Z").getDay());

  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.$disconnect();
}

main();
