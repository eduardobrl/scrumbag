import { Database } from "bun:sqlite";
import type {
  BacklogItem,
  NewSprint,
  NewSprintItem,
  Sprint,
  SprintItem,
  UpdateSprint,
} from "../domain/types";

type SprintItemRow = SprintItem & {
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
};

export class SprintRepository {
  constructor(private db: Database) {}

  findAll(): Sprint[] {
    return this.db
      .query<Sprint, []>("SELECT * FROM sprints ORDER BY start_date DESC")
      .all();
  }

  findById(id: string): Sprint | null {
    const row = this.db
      .query<Sprint, [string]>("SELECT * FROM sprints WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  create(sprint: NewSprint): Sprint {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO sprints (id, goal, start_date, end_date, status, closed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sprint.goal,
        sprint.start_date,
        sprint.end_date,
        sprint.status ?? "planned",
        null,
        now,
        now,
      ]
    );

    return {
      id,
      goal: sprint.goal,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status ?? "planned",
      closed_at: null,
      created_at: now,
      updated_at: now,
    };
  }

  update(id: string, changes: UpdateSprint): Sprint {
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

    this.db.run(`UPDATE sprints SET ${fields.join(", ")} WHERE id = ?`, values);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Sprint ${id} not found after update`);
    }
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM sprints WHERE id = ?", [id]);
    return result.changes > 0;
  }

  addItem(item: NewSprintItem): SprintItem {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO sprint_items (
        id, sprint_id, backlog_item_id, sprint_order, board_order, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.sprint_id,
        item.backlog_item_id,
        item.sprint_order ?? 0,
        item.board_order ?? 0,
        now,
      ]
    );

    return {
      id,
      sprint_id: item.sprint_id,
      backlog_item_id: item.backlog_item_id,
      sprint_order: item.sprint_order ?? 0,
      board_order: item.board_order ?? 0,
      created_at: now,
    };
  }

  findItems(sprintId: string): SprintItem[] {
    const rows = this.db
      .query<SprintItemRow, [string]>(
        `SELECT
          si.id,
          si.sprint_id,
          si.backlog_item_id,
          si.sprint_order,
          si.board_order,
          si.created_at,
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
        FROM sprint_items si
        JOIN backlog_items b ON b.id = si.backlog_item_id
        WHERE si.sprint_id = ?
        ORDER BY si.sprint_order ASC`
      )
      .all(sprintId);

    return rows.map((row) => ({
      id: row.id,
      sprint_id: row.sprint_id,
      backlog_item_id: row.backlog_item_id,
      sprint_order: row.sprint_order,
      board_order: row.board_order,
      created_at: row.created_at,
      backlog_item: {
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
    }));
  }
}
