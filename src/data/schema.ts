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

  addColumnIfMissing(db, "backlog_items", "story_points", "INTEGER");
  addColumnIfMissing(db, "backlog_items", "estimate_days", "REAL");
  addColumnIfMissing(db, "backlog_items", "completed_at", "TEXT");

  db.run(`
    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      release_id TEXT REFERENCES releases(id) ON DELETE SET NULL,
      goal TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','closed')),
      closed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  addColumnIfMissing(db, "sprints", "release_id", "TEXT REFERENCES releases(id) ON DELETE SET NULL");

  db.run(`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','closed')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS release_features (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      feature_id TEXT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      start_sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
      end_sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
      board_order INTEGER NOT NULL DEFAULT 0,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(release_id, feature_id)
    );
  `);

  backfillDefaultRelease(db);

  db.run("CREATE INDEX IF NOT EXISTS idx_sprints_release_id ON sprints(release_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_release_features_release_id ON release_features(release_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_release_features_feature_id ON release_features(feature_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_release_features_start_sprint ON release_features(start_sprint_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_release_features_end_sprint ON release_features(end_sprint_id)");

  db.run(`
    CREATE TRIGGER IF NOT EXISTS backlog_story_bug_parent_required_insert
    BEFORE INSERT ON backlog_items
    WHEN NEW.type IN ('story', 'bug')
      AND (
        NEW.parent_id IS NULL OR
        NOT EXISTS (
          SELECT 1 FROM backlog_items parent
          WHERE parent.id = NEW.parent_id AND parent.type = 'feature'
        )
      )
    BEGIN
      SELECT RAISE(ABORT, 'Stories and bugs must belong to a feature');
    END;
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS backlog_story_bug_parent_required_update
    BEFORE UPDATE ON backlog_items
    WHEN NEW.type IN ('story', 'bug')
      AND (
        NEW.parent_id IS NULL OR
        NOT EXISTS (
          SELECT 1 FROM backlog_items parent
          WHERE parent.id = NEW.parent_id AND parent.type = 'feature'
        )
      )
    BEGIN
      SELECT RAISE(ABORT, 'Stories and bugs must belong to a feature');
    END;
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS backlog_feature_delete_with_children_blocked
    BEFORE DELETE ON backlog_items
    WHEN OLD.type = 'feature'
      AND EXISTS (
        SELECT 1 FROM backlog_items child
        WHERE child.parent_id = OLD.id AND child.type IN ('story', 'bug')
      )
    BEGIN
      SELECT RAISE(ABORT, 'Cannot delete a feature with stories or bugs');
    END;
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sprint_items (
      id TEXT PRIMARY KEY,
      sprint_id TEXT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
      backlog_item_id TEXT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      sprint_order INTEGER NOT NULL DEFAULT 0,
      board_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sprint_id, backlog_item_id)
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

  db.run(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.run(`
    INSERT OR IGNORE INTO app_config (key, value)
    VALUES ('waste_percentage', '15');
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS capacity_overrides (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES squad_members(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      override_hours REAL NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function addColumnIfMissing(
  db: Database,
  tableName: string,
  columnName: string,
  columnDefinition: string
): void {
  const columns = db
    .query<{ name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all();

  if (!columns.some((column) => column.name === columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

function backfillDefaultRelease(db: Database): void {
  const orphanSprintRow = db
    .query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM sprints WHERE release_id IS NULL"
    )
    .get();

  if (!orphanSprintRow?.count) return;

  const range = db
    .query<{ start_date: string | null; end_date: string | null }, []>(
      "SELECT MIN(start_date) as start_date, MAX(end_date) as end_date FROM sprints WHERE release_id IS NULL"
    )
    .get();

  const releaseId = "release-inicial";
  const startDate = range?.start_date ?? new Date().toISOString().slice(0, 10);
  const endDate = range?.end_date ?? startDate;
  const now = new Date().toISOString();

  db.run(
    `INSERT OR IGNORE INTO releases (
      id, name, description, start_date, end_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      releaseId,
      "Release inicial",
      "Release criada automaticamente para sprints existentes.",
      startDate,
      endDate,
      "planned",
      now,
      now,
    ]
  );

  db.run("UPDATE sprints SET release_id = ? WHERE release_id IS NULL", [releaseId]);
}
