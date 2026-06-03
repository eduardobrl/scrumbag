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

CREATE TABLE IF NOT EXISTS "Feature" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "releaseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Feature_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Story" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "featureId" TEXT NOT NULL,
  "currentSprintId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "acceptanceCriteria" TEXT,
  "storyPoints" REAL,
  "estimatedDays" REAL,
  "status" TEXT NOT NULL DEFAULT 'BACKLOG',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Story_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Story_currentSprintId_fkey" FOREIGN KEY ("currentSprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Feature_releaseId_idx" ON "Feature" ("releaseId");
CREATE INDEX IF NOT EXISTS "Story_featureId_idx" ON "Story" ("featureId");
CREATE INDEX IF NOT EXISTS "Story_currentSprintId_idx" ON "Story" ("currentSprintId");

CREATE TABLE IF NOT EXISTS "leakage_history" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storyId" TEXT NOT NULL,
  "originSprintId" TEXT NOT NULL,
  "destinationSprintId" TEXT NOT NULL,
  "eventDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusAtEvent" TEXT NOT NULL,
  CONSTRAINT "leakage_history_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "leakage_history_originSprintId_fkey" FOREIGN KEY ("originSprintId") REFERENCES "Sprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "leakage_history_destinationSprintId_fkey" FOREIGN KEY ("destinationSprintId") REFERENCES "Sprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "leakage_history_storyId_idx" ON "leakage_history" ("storyId");
CREATE INDEX IF NOT EXISTS "leakage_history_originSprintId_idx" ON "leakage_history" ("originSprintId");
`);

db.close();

console.log(`SQLite schema ready at ${dbPath}`);
