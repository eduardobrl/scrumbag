import { Database } from "bun:sqlite";
import type { BacklogItem, NewBacklogItem } from "../domain/types";

export class BacklogRepository {
  constructor(private db: Database) {}

  findAll(): BacklogItem[] {
    return this.db
      .query<BacklogItem, []>("SELECT * FROM backlog_items ORDER BY created_at DESC")
      .all();
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
}
