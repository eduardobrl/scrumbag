import { Database } from "bun:sqlite";
import { z } from "zod";
import { mkdirSync, existsSync } from "node:fs";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";
import { SprintRepository } from "./src/data/sprint-repository";
import { SquadRepository } from "./src/data/squad-repository";
import { AbsenceRepository } from "./src/data/absence-repository";
import { CapacityService } from "./src/services/capacity-service";
import { startWatcher, stopWatcher } from "./src/sync/watcher";
import { importExcelFile } from "./src/sync/excel-importer";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);
const sprintRepo = new SprintRepository(db);
const squadRepo = new SquadRepository(db);
const absenceRepo = new AbsenceRepository(db);
const capacityService = new CapacityService(db);

let activeSyncFolder = process.env.SYNC_FOLDER || "./synced";
const port = Number(process.env.PORT ?? 3000);

function ensureFolder(folderPath: string) {
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  }
}

function startSyncWatcher(folderPath: string) {
  ensureFolder(folderPath);
  startWatcher(folderPath, db, async (result) => {
    console.log(`[sync] Processed ${result.filePath}: ${result.imported} imported, ${result.skipped} skipped`);
  });
}

ensureFolder(activeSyncFolder);
startSyncWatcher(activeSyncFolder);

const backlogItemSchema = z.object({
  type: z.enum(["epic", "feature", "story", "bug"]),
  title: z.string().min(1),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  status: z.enum(["backlog", "in_progress", "done"]).optional(),
  priority: z.number().optional(),
  story_points: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal(13),
    z.literal(21),
  ]).nullable().optional(),
  estimate_days: z.number().nonnegative().nullable().optional(),
});

const backlogUpdateSchema = backlogItemSchema.partial();

const sprintBaseSchema = z.object({
  goal: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["planned", "active", "closed"]).optional(),
});

const sprintSchema = sprintBaseSchema
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be >= start_date",
    path: ["end_date"],
  });

const sprintUpdateSchema = sprintBaseSchema.partial().refine(
  (data) => {
    if (!data.start_date || !data.end_date) return true;
    return data.end_date >= data.start_date;
  },
  {
    message: "end_date must be >= start_date",
    path: ["end_date"],
  }
);

const estimateSchema = z.object({
  story_points: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal(13),
    z.literal(21),
  ]).nullable().optional(),
  estimate_days: z.number().nonnegative().nullable().optional(),
});

const sprintItemSchema = z.object({
  backlog_item_id: z.string().min(1),
});

const backlogReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    priority: z.number().int(),
  })).min(1),
});

const sprintReorderSchema = z.object({
  items: z.array(z.object({
    backlog_item_id: z.string().min(1),
    sprint_order: z.number().int().nonnegative(),
  })).min(1),
});

const folderPathSchema = z.object({
  folderPath: z.string().refine(
    (val) => !val.startsWith("/") && !val.startsWith("\\") && !val.includes("..")
  ),
});

const squadMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  daily_capacity_hours: z.number().positive().optional(),
});

const absenceSchema = z.object({
  member_id: z.string().nullable().optional(),
  type: z.enum(["vacation", "sick_leave", "unpaid_leave", "holiday", "other"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
});

const dateRangeSchema = z
  .object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be >= start_date",
    path: ["end_date"],
  })
  .refine((data) => daysBetween(data.start_date, data.end_date) <= 365, {
    message: "date range cannot exceed 365 days",
    path: ["end_date"],
  });

const wasteConfigSchema = z.object({
  waste_percentage: z.number().min(0).max(100),
});

const capacityOverrideSchema = z
  .object({
    member_id: z.string().min(1),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    override_hours: z.number().positive(),
    reason: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be >= start_date",
    path: ["end_date"],
  });

async function parseJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function getSyncStatus() {
  const filesWatched = db
    .query<{ count: number }, []>("SELECT COUNT(*) as count FROM file_hashes")
    .get()?.count ?? 0;

  const lastSyncRow = db
    .query<{ synced_at: string }, []>("SELECT synced_at FROM file_hashes ORDER BY synced_at DESC LIMIT 1")
    .get();

  return {
    folderPath: activeSyncFolder,
    lastSync: lastSyncRow?.synced_at ?? null,
    filesWatched,
  };
}

const server = Bun.serve({
  port,
  static: {
    "/": new Response(Bun.file("dist/index.html")),
    "/assets/*": (req) => {
      const path = new URL(req.url).pathname;
      return new Response(Bun.file(`dist${path}`));
    },
  },
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/sync/status") {
      if (req.method === "GET") {
        return Response.json(getSyncStatus());
      }
    }

    if (url.pathname === "/api/sync/folder") {
      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = folderPathSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: "Invalid folder path. Must be relative and cannot contain '..'" },
            { status: 400 }
          );
        }

        stopWatcher();
        activeSyncFolder = parseResult.data.folderPath;
        ensureFolder(activeSyncFolder);
        startSyncWatcher(activeSyncFolder);

        return Response.json(getSyncStatus());
      }
    }

    if (url.pathname === "/api/sync/trigger") {
      if (req.method === "POST") {
        const files = await Array.fromAsync(
          new Bun.Glob("*.xlsx").scan({ cwd: activeSyncFolder, onlyFiles: true })
        );

        let totalImported = 0;
        let totalSkipped = 0;

        for (const file of files) {
          const filePath = `${activeSyncFolder}/${file}`;
          try {
            const content = await Bun.file(filePath).arrayBuffer();
            const result = await importExcelFile(filePath, content, db);
            totalImported += result.imported;
            totalSkipped += result.skipped;
          } catch (err) {
            console.error(`[sync] Manual trigger failed for ${filePath}:`, err);
          }
        }

        return Response.json({ scanned: true, imported: totalImported, skipped: totalSkipped });
      }
    }

    if (url.pathname === "/api/sprints") {
      if (req.method === "GET") {
        return Response.json(sprintRepo.findAll());
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = sprintSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        const created = sprintRepo.create(parseResult.data);
        return Response.json(created, { status: 201 });
      }
    }

    const sprintMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)$/);
    if (sprintMatch) {
      const id = sprintMatch[1];

      if (req.method === "GET") {
        const sprint = sprintRepo.findById(id);
        if (!sprint) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(sprint);
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = sprintUpdateSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        const existing = sprintRepo.findById(id);
        if (!existing) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const merged = {
          start_date: parseResult.data.start_date ?? existing.start_date,
          end_date: parseResult.data.end_date ?? existing.end_date,
        };
        if (merged.end_date < merged.start_date) {
          return Response.json({ error: "end_date must be >= start_date" }, { status: 400 });
        }

        const updated = sprintRepo.update(id, parseResult.data);
        return Response.json(updated);
      }

      if (req.method === "DELETE") {
        const deleted = sprintRepo.delete(id);
        if (!deleted) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    const sprintItemsMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)\/items$/);
    if (sprintItemsMatch) {
      const sprintId = sprintItemsMatch[1];
      if (!sprintRepo.findById(sprintId)) {
        return Response.json({ error: "Sprint not found" }, { status: 404 });
      }

      if (req.method === "GET") {
        return Response.json(sprintRepo.findItems(sprintId));
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = sprintItemSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        try {
          const created = sprintRepo.addItem(sprintId, parseResult.data.backlog_item_id);
          return Response.json(created, { status: 201 });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to add sprint item";
          const status = message.includes("not found") ? 404 : 400;
          return Response.json({ error: message }, { status });
        }
      }
    }

    const sprintItemReorderMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)\/items\/reorder$/);
    if (sprintItemReorderMatch) {
      const sprintId = sprintItemReorderMatch[1];
      if (!sprintRepo.findById(sprintId)) {
        return Response.json({ error: "Sprint not found" }, { status: 404 });
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = sprintReorderSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        const updated = sprintRepo.reorderItems(sprintId, parseResult.data.items);
        return Response.json({ updated });
      }
    }

    const sprintItemDeleteMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)\/items\/([^/]+)$/);
    if (sprintItemDeleteMatch) {
      const sprintId = sprintItemDeleteMatch[1];
      const itemId = sprintItemDeleteMatch[2];
      if (!sprintRepo.findById(sprintId)) {
        return Response.json({ error: "Sprint not found" }, { status: 404 });
      }

      if (req.method === "DELETE") {
        const removed = sprintRepo.removeItem(sprintId, itemId);
        if (!removed) {
          return Response.json({ error: "Sprint item not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    const sprintAvailableMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)\/available-backlog$/);
    if (sprintAvailableMatch) {
      const sprintId = sprintAvailableMatch[1];
      if (!sprintRepo.findById(sprintId)) {
        return Response.json({ error: "Sprint not found" }, { status: 404 });
      }

      if (req.method === "GET") {
        return Response.json(sprintRepo.findAvailableBacklogItems(sprintId));
      }
    }

    const sprintTotalsMatch = url.pathname.match(/^\/api\/sprints\/([^/]+)\/totals$/);
    if (sprintTotalsMatch) {
      const sprintId = sprintTotalsMatch[1];
      if (!sprintRepo.findById(sprintId)) {
        return Response.json({ error: "Sprint not found" }, { status: 404 });
      }

      if (req.method === "GET") {
        return Response.json(sprintRepo.getSprintTotals(sprintId));
      }
    }

    if (url.pathname === "/api/backlog") {
      if (req.method === "GET") {
        const root = url.searchParams.get("root");
        const parentId = url.searchParams.get("parent_id");

        if (root === "true") {
          const items = backlogRepo.findRootItems();
          return Response.json(items);
        }

        if (parentId) {
          const items = backlogRepo.findChildren(parentId);
          return Response.json(items);
        }

        const items = backlogRepo.findAll();
        return Response.json(items);
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = backlogItemSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        try {
          const created = backlogRepo.create(parseResult.data);
          return Response.json(created, { status: 201 });
        } catch (err) {
          return Response.json(
            { error: "Failed to create backlog item" },
            { status: 500 }
          );
        }
      }
    }

    if (url.pathname === "/api/backlog/reorder") {
      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = backlogReorderSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        const updated = backlogRepo.reorder(parseResult.data.items);
        return Response.json({ updated });
      }
    }

    const backlogEstimateMatch = url.pathname.match(/^\/api\/backlog\/([^/]+)\/estimate$/);
    if (backlogEstimateMatch) {
      const id = backlogEstimateMatch[1];

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = estimateSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        try {
          const updated = backlogRepo.updateEstimate(
            id,
            parseResult.data.story_points,
            parseResult.data.estimate_days
          );
          return Response.json(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update estimate";
          const status = message.includes("not found") ? 404 : 400;
          return Response.json({ error: message }, { status });
        }
      }
    }

    const backlogAggregateMatch = url.pathname.match(/^\/api\/backlog\/([^/]+)\/aggregate-estimate$/);
    if (backlogAggregateMatch) {
      const id = backlogAggregateMatch[1];

      if (req.method === "GET") {
        if (!backlogRepo.findById(id)) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(backlogRepo.aggregateEstimate(id));
      }
    }

    const backlogItemMatch = url.pathname.match(/^\/api\/backlog\/([^/]+)$/);
    if (backlogItemMatch) {
      const id = backlogItemMatch[1];

      if (req.method === "GET") {
        const item = backlogRepo.findById(id);
        if (!item) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(item);
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = backlogUpdateSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        try {
          const updated = backlogRepo.update(id, parseResult.data);
          return Response.json(updated);
        } catch {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
      }

      if (req.method === "DELETE") {
        const deleted = backlogRepo.delete(id);
        if (!deleted) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    if (url.pathname === "/api/squad") {
      if (req.method === "GET") {
        const members = squadRepo.findAll();
        return Response.json(members);
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = squadMemberSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        try {
          const created = squadRepo.create(parseResult.data);
          return Response.json(created, { status: 201 });
        } catch (err) {
          return Response.json(
            { error: "Failed to create squad member" },
            { status: 500 }
          );
        }
      }
    }

    const squadMemberMatch = url.pathname.match(/^\/api\/squad\/([^/]+)$/);
    if (squadMemberMatch) {
      const id = squadMemberMatch[1];

      if (req.method === "GET") {
        const member = squadRepo.findById(id);
        if (!member) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(member);
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        try {
          const updated = squadRepo.update(id, body as Record<string, unknown>);
          return Response.json(updated);
        } catch {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
      }

      if (req.method === "DELETE") {
        const deleted = squadRepo.delete(id);
        if (!deleted) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    if (url.pathname === "/api/absences") {
      if (req.method === "GET") {
        const memberId = url.searchParams.get("member_id");
        if (memberId) {
          const absences = absenceRepo.findByMember(memberId);
          return Response.json(absences);
        }
        const absences = absenceRepo.findAll();
        return Response.json(absences);
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = absenceSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        const data = parseResult.data;
        if (data.start_date > data.end_date) {
          return Response.json(
            { error: "end_date must be >= start_date" },
            { status: 400 }
          );
        }

        try {
          const created = absenceRepo.create(data);
          return Response.json(created, { status: 201 });
        } catch (err) {
          return Response.json(
            { error: "Failed to create absence" },
            { status: 500 }
          );
        }
      }
    }

    if (url.pathname === "/api/absences/holidays") {
      if (req.method === "GET") {
        const holidays = absenceRepo.findHolidays();
        return Response.json(holidays);
      }
    }

    if (url.pathname === "/api/capacity") {
      if (req.method === "GET") {
        const parseResult = dateRangeSchema.safeParse({
          start_date: url.searchParams.get("start_date"),
          end_date: url.searchParams.get("end_date"),
        });

        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        return Response.json(
          capacityService.calculate(parseResult.data.start_date, parseResult.data.end_date)
        );
      }
    }

    if (url.pathname === "/api/config/waste") {
      if (req.method === "GET") {
        return Response.json({ waste_percentage: capacityService.getWastePercentage() });
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = wasteConfigSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        return Response.json(capacityService.setWastePercentage(parseResult.data.waste_percentage));
      }
    }

    if (url.pathname === "/api/capacity-overrides") {
      if (req.method === "GET") {
        return Response.json(capacityService.getAllOverrides());
      }

      if (req.method === "POST") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = capacityOverrideSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        if (!squadRepo.findById(parseResult.data.member_id)) {
          return Response.json({ error: "member_id not found" }, { status: 400 });
        }

        return Response.json(capacityService.createOverride(parseResult.data), { status: 201 });
      }
    }

    const capacityOverrideMatch = url.pathname.match(/^\/api\/capacity-overrides\/([^/]+)$/);
    if (capacityOverrideMatch) {
      const id = capacityOverrideMatch[1];

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        const parseResult = capacityOverrideSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            { error: parseResult.error.errors.map((e) => e.message).join("; ") },
            { status: 400 }
          );
        }

        if (!squadRepo.findById(parseResult.data.member_id)) {
          return Response.json({ error: "member_id not found" }, { status: 400 });
        }

        const updated = capacityService.updateOverride(id, parseResult.data);
        if (!updated) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(updated);
      }

      if (req.method === "DELETE") {
        const deleted = capacityService.deleteOverride(id);
        if (!deleted) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    const absenceMatch = url.pathname.match(/^\/api\/absences\/([^/]+)$/);
    if (absenceMatch) {
      const id = absenceMatch[1];

      if (req.method === "GET") {
        const absence = absenceRepo.findById(id);
        if (!absence) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json(absence);
      }

      if (req.method === "PUT") {
        const body = await parseJson(req);
        if (body instanceof Response) return body;

        try {
          const updated = absenceRepo.update(id, body as Record<string, unknown>);
          return Response.json(updated);
        } catch {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
      }

      if (req.method === "DELETE") {
        const deleted = absenceRepo.delete(id);
        if (!deleted) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    // SPA fallback for non-API routes
    return new Response(Bun.file("dist/index.html"));
  },
});

console.log(`Scrumbag running at http://localhost:${port}`);
console.log(`[sync] Watching folder: ${activeSyncFolder}`);

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  stopWatcher();
  server.stop();
  process.exit(0);
});
