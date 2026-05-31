import { Database } from "bun:sqlite";
import type { SquadMember, NewSquadMember, UpdateSquadMember } from "../domain/types";

export class SquadRepository {
  constructor(private db: Database) {}

  findAll(): SquadMember[] {
    return this.db
      .query<SquadMember, []>("SELECT * FROM squad_members ORDER BY name")
      .all();
  }

  findById(id: string): SquadMember | null {
    const row = this.db
      .query<SquadMember, [string]>("SELECT * FROM squad_members WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  findByName(name: string): SquadMember | null {
    const row = this.db
      .query<SquadMember, [string]>("SELECT * FROM squad_members WHERE name = ? COLLATE NOCASE")
      .get(name);
    return row ?? null;
  }

  create(member: NewSquadMember): SquadMember {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO squad_members (id, name, role, daily_capacity_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        member.name,
        member.role,
        member.daily_capacity_hours ?? 6.0,
        now,
        now,
      ]
    );

    return {
      id,
      name: member.name,
      role: member.role,
      daily_capacity_hours: member.daily_capacity_hours ?? 6.0,
      created_at: now,
      updated_at: now,
    };
  }

  update(id: string, changes: UpdateSquadMember): SquadMember {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    const sql = `UPDATE squad_members SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    this.db.run(sql, values);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Squad member ${id} not found after update`);
    }
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM squad_members WHERE id = ?", [id]);
    return result.changes > 0;
  }
}
