import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
const dbPath = join(dataDir, "squad-planner.db");

mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS "SquadMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "roleType" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Absence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "memberId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Absence_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SquadMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Holiday" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "AppSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workingHoursFullTime" REAL NOT NULL DEFAULT 8,
  "workingHoursIntern" REAL NOT NULL DEFAULT 6,
  "standardDayHours" REAL NOT NULL DEFAULT 8,
  "mcpHost" TEXT NOT NULL DEFAULT 'localhost',
  "mcpPort" INTEGER NOT NULL DEFAULT 3333,
  "mcpEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Release" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "description" TEXT,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "defaultSprintLengthBusinessDays" INTEGER NOT NULL DEFAULT 10,
  "meetingPercentage" REAL NOT NULL DEFAULT 0,
  "supportPercentage" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Sprint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "releaseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goal" TEXT,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Sprint_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Sprint_releaseId_idx" ON "Sprint" ("releaseId");
`);

db.close();

console.log(`SQLite schema ready at ${dbPath}`);
