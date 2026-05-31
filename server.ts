import { Database } from "bun:sqlite";
import { z } from "zod";
import { mkdirSync, existsSync } from "node:fs";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";
import { startWatcher, stopWatcher } from "./src/sync/watcher";
import { importExcelFile } from "./src/sync/excel-importer";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);

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
  port: 3000,
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
