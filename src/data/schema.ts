import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
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
}
