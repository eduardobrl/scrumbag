import { Database } from "bun:sqlite";
import type {
  BacklogItem,
  NewSprint,
  Sprint,
  SprintBacklogCandidate,
  SprintItem,
  SprintPlanningTotals,
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

  addItem(sprintId: string, backlogItemId: string): SprintItem {
    if (!this.findById(sprintId)) {
      throw new Error(`Sprint ${sprintId} not found`);
    }

    const backlogItem = this.db
      .query<BacklogItem, [string]>("SELECT * FROM backlog_items WHERE id = ?")
      .get(backlogItemId);

    if (!backlogItem) {
      throw new Error(`Backlog item ${backlogItemId} not found`);
    }

    if (backlogItem.type !== "story" && backlogItem.type !== "bug") {
      throw new Error("Only stories and bugs can be added to a sprint");
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sprintOrder = this.nextSprintOrder(sprintId);
    const boardOrder = this.nextBoardOrder(sprintId, backlogItem.status);

    try {
      this.db.run(
        `INSERT INTO sprint_items (
          id, sprint_id, backlog_item_id, sprint_order, board_order, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, sprintId, backlogItemId, sprintOrder, boardOrder, now]
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        throw new Error("Backlog item is already in this sprint");
      }
      throw err;
    }

    return {
      id,
      sprint_id: sprintId,
      backlog_item_id: backlogItemId,
      sprint_order: sprintOrder,
      board_order: boardOrder,
      created_at: now,
      backlog_item: backlogItem,
    };
  }

  removeItem(sprintId: string, backlogItemId: string): boolean {
    const result = this.db.run(
      "DELETE FROM sprint_items WHERE sprint_id = ? AND backlog_item_id = ?",
      [sprintId, backlogItemId]
    );

    if (result.changes > 0) {
      const nextPriority = this.nextBacklogPriority();
      this.db.run(
        "UPDATE backlog_items SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [nextPriority, backlogItemId]
      );
    }

    return result.changes > 0;
  }

  findAvailableBacklogItems(sprintId: string): SprintBacklogCandidate[] {
    return this.db
      .query<SprintBacklogCandidate, [string]>(
        `SELECT b.* FROM backlog_items b
        WHERE b.type IN ('story', 'bug')
          AND NOT EXISTS (
            SELECT 1 FROM sprint_items si
            WHERE si.sprint_id = ? AND si.backlog_item_id = b.id
          )
        ORDER BY b.priority DESC, b.created_at DESC`
      )
      .all(sprintId);
  }

  getSprintTotals(sprintId: string): SprintPlanningTotals {
    const row = this.db
      .query<SprintPlanningTotals, [string]>(
        `SELECT
          COALESCE(SUM(CASE WHEN b.story_points IS NOT NULL THEN b.story_points ELSE 0 END), 0) as total_story_points,
          COALESCE(SUM(CASE WHEN b.estimate_days IS NOT NULL THEN b.estimate_days ELSE 0 END), 0) as total_estimate_days,
          COALESCE(SUM(CASE WHEN b.story_points IS NULL OR b.estimate_days IS NULL THEN 1 ELSE 0 END), 0) as unestimated_count,
          COUNT(*) as total_items
        FROM sprint_items si
        JOIN backlog_items b ON b.id = si.backlog_item_id
        WHERE si.sprint_id = ?`
      )
      .get(sprintId);

    return {
      total_story_points: Number(row?.total_story_points ?? 0),
      total_estimate_days: Number(row?.total_estimate_days ?? 0),
      unestimated_count: Number(row?.unestimated_count ?? 0),
      total_items: Number(row?.total_items ?? 0),
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

  private nextSprintOrder(sprintId: string): number {
    const row = this.db
      .query<{ max_order: number | null }, [string]>(
        "SELECT MAX(sprint_order) as max_order FROM sprint_items WHERE sprint_id = ?"
      )
      .get(sprintId);
    return Number(row?.max_order ?? -1) + 1;
  }

  private nextBoardOrder(sprintId: string, status: BacklogItem["status"]): number {
    const row = this.db
      .query<{ max_order: number | null }, [string, string]>(
        `SELECT MAX(si.board_order) as max_order
        FROM sprint_items si
        JOIN backlog_items b ON b.id = si.backlog_item_id
        WHERE si.sprint_id = ? AND b.status = ?`
      )
      .get(sprintId, status);
    return Number(row?.max_order ?? -1) + 1;
  }

  private nextBacklogPriority(): number {
    const row = this.db
      .query<{ max_priority: number | null }, []>(
        "SELECT MAX(priority) as max_priority FROM backlog_items"
      )
      .get();
    return Number(row?.max_priority ?? 0) + 1;
  }
}
