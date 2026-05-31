import { Database } from "bun:sqlite";
import { z } from "zod";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);

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
