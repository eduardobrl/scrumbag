import { Database } from "bun:sqlite";
import { z } from "zod";
import { mkdirSync, existsSync } from "node:fs";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";
import { SquadRepository } from "./src/data/squad-repository";
import { AbsenceRepository } from "./src/data/absence-repository";
import { startWatcher, stopWatcher } from "./src/sync/watcher";
import { importExcelFile } from "./src/sync/excel-importer";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);
const squadRepo = new SquadRepository(db);
const absenceRepo = new AbsenceRepository(db);

let activeSyncFolder = process.env.SYNC_FOLDER || "./synced";

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

async function parseJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
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
  port: 3002,
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

        try {
          const updated = backlogRepo.update(id, body as Record<string, unknown>);
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

console.log("Scrumbag running at http://localhost:3000");
console.log(`[sync] Watching folder: ${activeSyncFolder}`);

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  stopWatcher();
  server.stop();
  process.exit(0);
});
