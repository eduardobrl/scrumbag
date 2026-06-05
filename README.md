# Squad Planner

Squad Planner is a local-first release planning app for a single squad. Phase 1 runs on localhost, stores data in SQLite, and proves the app shell plus the first squad member create/list flow.

## Local Setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The default SQLite database path is `./data/squad-planner.db`. Prisma reads the local SQLite datasource from `prisma.config.ts`, and `npm run db:migrate` prepares that local database file. The generated database file is ignored by git so it can be backed up or moved manually.

## Useful Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run db:seed
```

The dev server binds to `localhost` by default through `npm run dev`.

## Mcp example

  "mcp": {
    "squad-planner": {
      "type": "local",
      "command": ["npx", "tsx", "src/mcp/mcp-stdio.ts"],
      "enabled": true
    }
  }
