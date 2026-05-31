import { Database } from "bun:sqlite";
import { z } from "zod";
import { mkdirSync, existsSync } from "node:fs";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";
import { startWatcher, stopWatcher } from "./src/sync/watcher";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);

const DEFAULT_SYNC_FOLDER = process.env.SYNC_FOLDER || "./synced";

if (!existsSync(DEFAULT_SYNC_FOLDER)) {
  mkdirSync(DEFAULT_SYNC_FOLDER, { recursive: true });
}

startWatcher(DEFAULT_SYNC_FOLDER, db, (event) => {
  console.log(`[sync] Detected ${event.isNew ? "new" : "changed"} file: ${event.filePath}`);
});

const backlogItemSchema = z.object({
  type: z.enum(["epic", "feature", "story", "bug"]),
  title: z.string().min(1),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  status: z.enum(["backlog", "in_progress", "done"]).optional(),
  priority: z.number().optional(),
});

async function parseJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
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
console.log(`[sync] Watching folder: ${DEFAULT_SYNC_FOLDER}`);

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  stopWatcher();
  server.stop();
  process.exit(0);
});
