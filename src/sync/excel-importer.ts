import * as xlsx from "xlsx";
import type { Database } from "bun:sqlite";
import { BacklogRepository } from "../data/backlog-repository";
import type { NewBacklogItem } from "../domain/types";

export async function importExcelFile(
  filePath: string,
  content: ArrayBuffer,
  db: Database
): Promise<{ imported: number; skipped: number }> {
  const workbook = xlsx.read(content, { cellDates: true, raw: true });

  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "backlog") ??
    workbook.SheetNames[0];

  if (!sheetName) {
    return { imported: 0, skipped: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const repo = new BacklogRepository(db);
  let imported = 0;
  let skipped = 0;

  const existingTitles = new Set(
    repo.findAll().map((item) => `${item.title.toLowerCase()}|${item.type}`)
  );

  for (const row of rows) {
    const keys = Object.keys(row);
    const titleKey = keys.find((k) => k.toLowerCase() === "title") ?? keys[0];
    const typeKey = keys.find((k) => k.toLowerCase() === "type");
    const descKey = keys.find((k) => k.toLowerCase() === "description");
    const statusKey = keys.find((k) => k.toLowerCase() === "status");
    const priorityKey = keys.find((k) => k.toLowerCase() === "priority");

    const title = String(row[titleKey] ?? "").trim();
    if (!title) continue;

    const rawType = String(row[typeKey ?? ""] ?? "").trim().toLowerCase();
    const type = ["epic", "feature", "story", "bug"].includes(rawType)
      ? rawType
      : "story";

    const key = `${title.toLowerCase()}|${type}`;
    if (existingTitles.has(key)) {
      skipped++;
      continue;
    }

    const status = String(row[statusKey ?? ""] ?? "").trim().toLowerCase();
    const validStatus = ["backlog", "in_progress", "done"].includes(status)
      ? status
      : "backlog";

    const priorityNum = Number(row[priorityKey ?? ""]);
    const priority = Number.isFinite(priorityNum) ? priorityNum : 0;

    const item: NewBacklogItem = {
      type,
      title,
      description: descKey ? String(row[descKey] ?? "").trim() || undefined : undefined,
      status: validStatus,
      priority,
      parent_id: null,
    };

    repo.create(item);
    existingTitles.add(key);
    imported++;
  }

  return { imported, skipped };
}
