import { Database } from "bun:sqlite";
import { FIBONACCI_POINTS } from "../domain/types";
import type {
  AggregateEstimate,
  BacklogItem,
  NewBacklogItem,
  StoryPoint,
  UpdateBacklogItem,
} from "../domain/types";

export class BacklogRepository {
  constructor(private db: Database) {}

  findAll(): BacklogItem[] {
    return this.db
      .query<BacklogItem, []>("SELECT * FROM backlog_items ORDER BY created_at DESC")
      .all();
  }

  findById(id: string): BacklogItem | null {
    const row = this.db
      .query<BacklogItem, [string]>("SELECT * FROM backlog_items WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  create(item: NewBacklogItem): BacklogItem {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const storyPoints = isExecutable(item.type) ? item.story_points ?? null : null;
    const estimateDays = isExecutable(item.type) ? item.estimate_days ?? null : null;

    this.db.run(
      `INSERT INTO backlog_items (
        id, type, title, description, parent_id, status, priority,
        story_points, estimate_days, completed_at, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.type,
        item.title,
        item.description ?? null,
        item.parent_id ?? null,
        item.status ?? "backlog",
        item.priority ?? 0,
        storyPoints,
        estimateDays,
        null,
        now,
        now,
      ]
    );

    return {
      id,
      type: item.type,
      title: item.title,
      description: item.description ?? null,
      parent_id: item.parent_id ?? null,
      status: item.status ?? "backlog",
      priority: item.priority ?? 0,
      story_points: storyPoints,
      estimate_days: estimateDays,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };
  }

  update(id: string, changes: UpdateBacklogItem): BacklogItem {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Backlog item ${id} not found`);
    }

    const nextType = changes.type ?? existing.type;
    const normalizedChanges = { ...changes };
    if (!isExecutable(nextType)) {
      normalizedChanges.story_points = null;
      normalizedChanges.estimate_days = null;
      normalizedChanges.completed_at = null;
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(normalizedChanges)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    const sql = `UPDATE backlog_items SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    this.db.run(sql, values);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Backlog item ${id} not found after update`);
    }
    return updated;
  }

  updateEstimate(
    id: string,
    storyPoints: StoryPoint | null | undefined,
    estimateDays: number | null | undefined
  ): BacklogItem {
    const item = this.findById(id);
    if (!item) {
      throw new Error(`Backlog item ${id} not found`);
    }

    if (!isExecutable(item.type)) {
      throw new Error("Only stories and bugs can be estimated directly");
    }

    if (storyPoints !== null && storyPoints !== undefined && !isStoryPoint(storyPoints)) {
      throw new Error("Story points must be one of 1, 2, 3, 5, 8, 13, 21");
    }

    const fields: string[] = [];
    const values: (number | string | null)[] = [];

    if (storyPoints !== undefined) {
      fields.push("story_points = ?");
      values.push(storyPoints);
    }

    if (estimateDays !== undefined) {
      fields.push("estimate_days = ?");
      values.push(estimateDays);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    this.db.run(`UPDATE backlog_items SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      id,
    ]);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Backlog item ${id} not found after estimate update`);
    }
    return updated;
  }

  aggregateEstimate(rootId: string): AggregateEstimate {
    const row = this.db
      .query<AggregateEstimate, [string, string]>(
        `WITH RECURSIVE descendants AS (
          SELECT * FROM backlog_items WHERE id = ?
          UNION ALL
          SELECT b.* FROM backlog_items b
          JOIN descendants d ON b.parent_id = d.id
        )
        SELECT
          COALESCE(SUM(CASE WHEN type IN ('story', 'bug') THEN story_points ELSE 0 END), 0) as story_points,
          COALESCE(SUM(CASE WHEN type IN ('story', 'bug') THEN estimate_days ELSE 0 END), 0) as estimate_days
        FROM descendants
        WHERE id != ?`
      )
      .get(rootId, rootId);

    return {
      story_points: Number(row?.story_points ?? 0),
      estimate_days: Number(row?.estimate_days ?? 0),
    };
  }

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM backlog_items WHERE id = ?", [id]);
    return result.changes > 0;
  }

  findRootItems(): BacklogItem[] {
    return this.db
      .query<BacklogItem, []>(
        "SELECT * FROM backlog_items WHERE parent_id IS NULL ORDER BY priority DESC, created_at DESC"
      )
      .all();
  }

  findChildren(parentId: string): BacklogItem[] {
    return this.db
      .query<BacklogItem, [string]>(
        "SELECT * FROM backlog_items WHERE parent_id = ? ORDER BY priority DESC, created_at DESC"
      )
      .all(parentId);
  }

  findDescendants(rootId: string): BacklogItem[] {
    return this.db
      .query<BacklogItem, [string, string]>(
        `WITH RECURSIVE descendants AS (
          SELECT * FROM backlog_items WHERE id = ?
          UNION ALL
          SELECT b.* FROM backlog_items b
          JOIN descendants d ON b.parent_id = d.id
        )
        SELECT * FROM descendants WHERE id != ?`
      )
      .all(rootId, rootId);
  }
}

function isExecutable(type: BacklogItem["type"]): boolean {
  return type === "story" || type === "bug";
}

function isStoryPoint(value: number): value is StoryPoint {
  return (FIBONACCI_POINTS as readonly number[]).includes(value);
}
