import { Database } from "bun:sqlite";
import type { Absence, NewAbsence, UpdateAbsence } from "../domain/types";

export class AbsenceRepository {
  constructor(private db: Database) {}

  findAll(): Absence[] {
    return this.db
      .query<Absence, []>("SELECT * FROM absences ORDER BY start_date DESC")
      .all();
  }

  findById(id: string): Absence | null {
    const row = this.db
      .query<Absence, [string]>("SELECT * FROM absences WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  create(absence: NewAbsence): Absence {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO absences (id, member_id, type, start_date, end_date, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        absence.member_id ?? null,
        absence.type,
        absence.start_date,
        absence.end_date,
        absence.description ?? null,
        now,
      ]
    );

    return {
      id,
      member_id: absence.member_id ?? null,
      type: absence.type,
      start_date: absence.start_date,
      end_date: absence.end_date,
      description: absence.description ?? null,
      created_at: now,
    };
  }

  update(id: string, changes: UpdateAbsence): Absence {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    const sql = `UPDATE absences SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    this.db.run(sql, values);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Absence ${id} not found after update`);
    }
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.run("DELETE FROM absences WHERE id = ?", [id]);
    return result.changes > 0;
  }

  findByMember(memberId: string): Absence[] {
    return this.db
      .query<Absence, [string]>(
        "SELECT * FROM absences WHERE member_id = ? ORDER BY start_date DESC"
      )
      .all(memberId);
  }

  findByDateRange(start: string, end: string): Absence[] {
    return this.db
      .query<Absence, [string, string]>(
        "SELECT * FROM absences WHERE start_date <= ? AND end_date >= ? ORDER BY start_date DESC"
      )
      .all(end, start);
  }

  findHolidays(): Absence[] {
    return this.db
      .query<Absence, []>(
        "SELECT * FROM absences WHERE member_id IS NULL ORDER BY start_date DESC"
      )
      .all();
  }
}
