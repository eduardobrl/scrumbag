import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS backlog_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('epic', 'feature', 'story', 'bug')),
      title TEXT NOT NULL,
      description TEXT,
      parent_id TEXT REFERENCES backlog_items(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS file_hashes (
      path TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS squad_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      daily_capacity_hours REAL NOT NULL DEFAULT 6.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS absences (
      id TEXT PRIMARY KEY,
      member_id TEXT REFERENCES squad_members(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('vacation','sick_leave','unpaid_leave','holiday','other')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
