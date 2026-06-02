import { Database } from "bun:sqlite";
import type {
  BacklogItem,
  NewRelease,
  Release,
  ReleaseFeature,
  Sprint,
  UpdateRelease,
} from "../domain/types";

type ReleaseFeatureRow = ReleaseFeature & {
  item_id: string;
  item_type: BacklogItem["type"];
  item_title: string;
  item_description: string | null;
  item_parent_id: string | null;
  item_status: BacklogItem["status"];
  item_priority: number;
  item_story_points: BacklogItem["story_points"];
  item_estimate_days: number | null;
  item_completed_at: string | null;
  item_created_at: string;
  item_updated_at: string;
  release_status: Release["status"];
};

export class ReleaseRepository {
  constructor(private db: Database) {}

  findAll(): Release[] {
    return this.db
      .query<Release, []>(
        "SELECT * FROM releases ORDER BY start_date DESC, created_at DESC"
      )
      .all();
  }

  findById(id: string): Release | null {
    return this.db.query<Release, [string]>("SELECT * FROM releases WHERE id = ?").get(id) ?? null;
  }

  create(release: NewRelease): Release {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO releases (
        id, name, description, start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        release.name,
        release.description ?? null,
        release.start_date,
        release.end_date,
        release.status ?? "planned",
        now,
        now,
      ]
    );

    return {
      id,
      name: release.name,
      description: release.description ?? null,
      start_date: release.start_date,
      end_date: release.end_date,
      status: release.status ?? "planned",
      created_at: now,
      updated_at: now,
    };
  }

  update(id: string, changes: UpdateRelease): Release {
    const existing = this.findById(id);
    if (!existing) throw new Error(`Release ${id} not found`);

    const fields: string[] = [];
    const values: (string | null)[] = [];
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value as string | null);
      }
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    this.db.run(`UPDATE releases SET ${fields.join(", ")} WHERE id = ?`, values);

    const updated = this.findById(id);
    if (!updated) throw new Error(`Release ${id} not found after update`);
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM releases WHERE id = ?", [id]);
    return result.changes > 0;
  }

  findSprints(releaseId: string): Sprint[] {
    return this.db
      .query<Sprint, [string]>(
        "SELECT * FROM sprints WHERE release_id = ? ORDER BY start_date ASC"
      )
      .all(releaseId);
  }

  findFeatures(releaseId: string): ReleaseFeature[] {
    const rows = this.db
      .query<ReleaseFeatureRow, [string]>(
        `SELECT
          rf.*,
          r.status as release_status,
          b.id as item_id,
          b.type as item_type,
          b.title as item_title,
          b.description as item_description,
          b.parent_id as item_parent_id,
          b.status as item_status,
          b.priority as item_priority,
          b.story_points as item_story_points,
          b.estimate_days as item_estimate_days,
          b.completed_at as item_completed_at,
          b.created_at as item_created_at,
          b.updated_at as item_updated_at
        FROM release_features rf
        JOIN releases r ON r.id = rf.release_id
        JOIN backlog_items b ON b.id = rf.feature_id
        WHERE rf.release_id = ? AND b.type = 'feature'
        ORDER BY rf.board_order ASC, rf.added_at ASC`
      )
      .all(releaseId);

    return rows.map((row) => this.mapReleaseFeatureRow(row));
  }

  findAvailableFeatures(releaseId: string): BacklogItem[] {
    return this.db
      .query<BacklogItem, [string]>(
        `SELECT b.* FROM backlog_items b
        WHERE b.type = 'feature'
          AND NOT EXISTS (
            SELECT 1 FROM release_features rf
            WHERE rf.release_id = ? AND rf.feature_id = b.id
          )
        ORDER BY b.priority DESC, b.created_at DESC`
      )
      .all(releaseId);
  }

  addFeature(releaseId: string, featureId: string): ReleaseFeature {
    const release = this.findById(releaseId);
    if (!release) throw new Error(`Release ${releaseId} not found`);

    const feature = this.db
      .query<BacklogItem, [string]>("SELECT * FROM backlog_items WHERE id = ?")
      .get(featureId);
    if (!feature) throw new Error(`Backlog item ${featureId} not found`);
    if (feature.type !== "feature") {
      throw new Error("Only features can be added to a release");
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const boardOrder = this.nextBoardOrder(releaseId);

    try {
      this.db.run(
        `INSERT INTO release_features (
          id, release_id, feature_id, start_sprint_id, end_sprint_id, board_order, added_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, releaseId, featureId, null, null, boardOrder, now]
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        throw new Error("Feature is already in this release");
      }
      throw err;
    }

    return {
      id,
      release_id: releaseId,
      feature_id: featureId,
      start_sprint_id: null,
      end_sprint_id: null,
      board_order: boardOrder,
      added_at: now,
      added_during_execution: release.status === "active",
      feature,
    };
  }

  removeFeature(releaseId: string, featureId: string): boolean {
    const result = this.db.run(
      "DELETE FROM release_features WHERE release_id = ? AND feature_id = ?",
      [releaseId, featureId]
    );
    return result.changes > 0;
  }

  reorderFeatures(
    releaseId: string,
    items: { feature_id: string; board_order: number }[]
  ): number {
    let updated = 0;
    const update = this.db.prepare(
      "UPDATE release_features SET board_order = ? WHERE release_id = ? AND feature_id = ?"
    );
    const apply = this.db.transaction((rows: typeof items) => {
      for (const item of rows) {
        const result = update.run(item.board_order, releaseId, item.feature_id);
        updated += result.changes;
      }
    });
    apply(items);
    return updated;
  }

  updateFeatureAllocation(
    releaseId: string,
    featureId: string,
    allocation: {
      start_sprint_id?: string | null;
      end_sprint_id?: string | null;
      board_order?: number;
    }
  ): ReleaseFeature {
    const current = this.findFeatures(releaseId).find(
      (item) => item.feature_id === featureId
    );
    if (!current) {
      throw new Error("Feature is not in this release");
    }

    const startSprintId =
      allocation.start_sprint_id !== undefined
        ? allocation.start_sprint_id
        : current.start_sprint_id;
    const endSprintId =
      allocation.end_sprint_id !== undefined ? allocation.end_sprint_id : current.end_sprint_id;
    const boardOrder =
      allocation.board_order !== undefined ? allocation.board_order : current.board_order;

    if (boardOrder < 0) throw new Error("board_order must be nonnegative");
    if ((startSprintId && !endSprintId) || (!startSprintId && endSprintId)) {
      throw new Error("Feature allocation requires both start and end sprint");
    }

    if (startSprintId && endSprintId) {
      this.validateSprintSpan(releaseId, startSprintId, endSprintId);
    }

    this.db.run(
      `UPDATE release_features
       SET start_sprint_id = ?, end_sprint_id = ?, board_order = ?
       WHERE release_id = ? AND feature_id = ?`,
      [startSprintId, endSprintId, boardOrder, releaseId, featureId]
    );

    const updated = this.findFeatures(releaseId).find(
      (item) => item.feature_id === featureId
    );
    if (!updated) throw new Error("Feature allocation not found after update");
    return updated;
  }

  findFeatureChildren(featureId: string): BacklogItem[] {
    return this.db
      .query<BacklogItem, [string, string]>(
        `WITH RECURSIVE descendants AS (
          SELECT * FROM backlog_items WHERE id = ?
          UNION ALL
          SELECT b.* FROM backlog_items b
          JOIN descendants d ON b.parent_id = d.id
        )
        SELECT * FROM descendants
        WHERE id != ? AND type IN ('story', 'bug')`
      )
      .all(featureId, featureId);
  }

  private validateSprintSpan(
    releaseId: string,
    startSprintId: string,
    endSprintId: string
  ): void {
    const sprints = this.findSprints(releaseId);
    const startIndex = sprints.findIndex((sprint) => sprint.id === startSprintId);
    const endIndex = sprints.findIndex((sprint) => sprint.id === endSprintId);
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Feature allocation sprints must belong to the release");
    }
    if (startIndex > endIndex) {
      throw new Error("Feature allocation start sprint must be before end sprint");
    }
  }

  private nextBoardOrder(releaseId: string): number {
    const row = this.db
      .query<{ max_order: number | null }, [string]>(
        "SELECT MAX(board_order) as max_order FROM release_features WHERE release_id = ?"
      )
      .get(releaseId);
    return Number(row?.max_order ?? -1) + 1;
  }

  private mapReleaseFeatureRow(row: ReleaseFeatureRow): ReleaseFeature {
    return {
      id: row.id,
      release_id: row.release_id,
      feature_id: row.feature_id,
      start_sprint_id: row.start_sprint_id,
      end_sprint_id: row.end_sprint_id,
      board_order: row.board_order,
      added_at: row.added_at,
      added_during_execution: row.release_status === "active",
      feature: {
        id: row.item_id,
        type: row.item_type,
        title: row.item_title,
        description: row.item_description,
        parent_id: row.item_parent_id,
        status: row.item_status,
        priority: row.item_priority,
        story_points: row.item_story_points,
        estimate_days: row.item_estimate_days,
        completed_at: row.item_completed_at,
        created_at: row.item_created_at,
        updated_at: row.item_updated_at,
      },
    };
  }
}
