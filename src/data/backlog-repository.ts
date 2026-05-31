import { Database } from "bun:sqlite";
import type { BacklogItem, NewBacklogItem, UpdateBacklogItem } from "../domain/types";

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

    this.db.run(
      `INSERT INTO backlog_items (id, type, title, description, parent_id, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.type,
        item.title,
        item.description ?? null,
        item.parent_id ?? null,
        item.status ?? "backlog",
        item.priority ?? 0,
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
      created_at: now,
      updated_at: now,
    };
  }

  update(id: string, changes: UpdateBacklogItem): BacklogItem {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(changes)) {
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

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM backlog_items WHERE id = ?", [id]);
    return result.changes > 0;
  }
}
