import { Database } from "bun:sqlite";
import { initSchema } from "./src/data/schema";
import { BacklogRepository } from "./src/data/backlog-repository";

const db = new Database("scrumbag.db");
initSchema(db);

const backlogRepo = new BacklogRepository(db);

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
        try {
          const body = await req.json();
          const created = backlogRepo.create(body);
          return Response.json(created, { status: 201 });
        } catch (err) {
          return Response.json(
            { error: "Failed to create backlog item", detail: String(err) },
            { status: 400 }
          );
        }
      }
    }

    // SPA fallback for non-API routes
    return new Response(Bun.file("dist/index.html"));
  },
});

console.log("Scrumbag running at http://localhost:3000");
