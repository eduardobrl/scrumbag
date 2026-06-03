import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.appSettings.findFirst();

  if (!existing) {
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
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
