import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { assertSafeDatabaseUrl, getDatabaseUrl, resolveSqliteDatabasePath } from "../src/lib/db-url";

const databaseUrl = getDatabaseUrl();
assertSafeDatabaseUrl(databaseUrl);

const dbPath = resolveSqliteDatabasePath(databaseUrl);

mkdirSync(dirname(dbPath), { recursive: true });

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

CREATE TABLE IF NOT EXISTS "ReleaseEstimateBaseline" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "releaseId" TEXT NOT NULL,
  "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReleaseEstimateBaseline_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReleaseEstimateBaseline_releaseId_key" ON "ReleaseEstimateBaseline" ("releaseId");

CREATE TABLE IF NOT EXISTS "ReleaseEstimateBaselineItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "baselineId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "storyPoints" REAL,
  "estimatedDays" REAL,
  CONSTRAINT "ReleaseEstimateBaselineItem_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "ReleaseEstimateBaseline" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReleaseEstimateBaselineItem_baselineId_storyId_key" ON "ReleaseEstimateBaselineItem" ("baselineId", "storyId");
CREATE INDEX IF NOT EXISTS "ReleaseEstimateBaselineItem_storyId_idx" ON "ReleaseEstimateBaselineItem" ("storyId");

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
  "releaseId" TEXT,
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

CREATE TABLE IF NOT EXISTS "EstimateChange" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storyId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "oldValue" REAL,
  "newValue" REAL,
  "changeReason" TEXT,
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstimateChange_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EstimateChange_storyId_idx" ON "EstimateChange" ("storyId");
CREATE INDEX IF NOT EXISTS "EstimateChange_timestamp_idx" ON "EstimateChange" ("timestamp");

CREATE TABLE IF NOT EXISTS "Impediment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "reportedDate" DATETIME NOT NULL,
  "resolutionDate" DATETIME,
  "resolutionNotes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Impediment_status_idx" ON "Impediment" ("status");
CREATE INDEX IF NOT EXISTS "Impediment_reportedDate_idx" ON "Impediment" ("reportedDate");

CREATE TABLE IF NOT EXISTS "_ImpedimentToStory" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ImpedimentToStory_A_fkey" FOREIGN KEY ("A") REFERENCES "Impediment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_ImpedimentToStory_B_fkey" FOREIGN KEY ("B") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ImpedimentToStory_AB_unique" ON "_ImpedimentToStory" ("A", "B");
CREATE INDEX IF NOT EXISTS "_ImpedimentToStory_B_index" ON "_ImpedimentToStory" ("B");

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

const featureColumns = db.prepare(`PRAGMA table_info("Feature")`).all() as Array<{ name: string; notnull: number }>;
const releaseIdColumn = featureColumns.find((column) => column.name === "releaseId");

if (releaseIdColumn?.notnull === 1) {
  db.exec(`
PRAGMA foreign_keys = OFF;

CREATE TABLE "Feature_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "releaseId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Feature_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Feature_new" ("id", "releaseId", "name", "description", "lifecycleStatus", "createdAt", "updatedAt")
SELECT "id", "releaseId", "name", "description", "lifecycleStatus", "createdAt", "updatedAt" FROM "Feature";

DROP TABLE "Feature";
ALTER TABLE "Feature_new" RENAME TO "Feature";
CREATE INDEX IF NOT EXISTS "Feature_releaseId_idx" ON "Feature" ("releaseId");

PRAGMA foreign_keys = ON;
`);
}

db.close();

console.log(`SQLite schema ready at ${dbPath}`);
