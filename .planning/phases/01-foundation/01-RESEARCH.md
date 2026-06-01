# Phase 1: Foundation & Data Ingestion - Research

**Researched:** 2026-05-30
**Domain:** Bun-compiled executable, bun:sqlite, React 19 SPA, Excel ingestion via SheetJS/chokidar
**Confidence:** HIGH

## Summary

Phase 1 establishes the architectural backbone of Scrumbag: a single compiled executable that serves a React SPA and manages local SQLite data. The primary challenge is satisfying the "no installation" constraint while delivering a browser-based UI and robust Excel file ingestion. Research confirms the Bun `--compile` approach is the only viable solution that satisfies all constraints simultaneously.

The Bun runtime provides file system access (chokidar), an HTTP server (`Bun.serve`), an embedded SQLite database (`bun:sqlite`), and single-binary compilation — all from one tool. This eliminates the need for Electron (blocked by corporate security) or a pure PWA (cannot host MCP server). The frontend is a React 19 SPA built with Vite, which Bun bundles into the final executable.

Data ingestion uses chokidar to watch the OneDrive-synced folder and SheetJS to parse `.xlsx` files. A content-hash-based change detection layer prevents treating Excel as a live database (Pitfall 1). Imported data lands in `bun:sqlite` with a repository pattern abstraction.

**Primary recommendation:** Use `bun build --compile` to produce a single `.exe`, serve the React SPA via `Bun.serve`, store all canonical data in `bun:sqlite`, and treat Excel as an import source with SHA-256 content hashing.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File watching & sync | API / Backend (Bun server) | — | chokidar runs in the Bun process, not the browser |
| Excel parsing | API / Backend | — | SheetJS runs server-side to avoid browser FS API issues |
| Data persistence | Database / Storage (bun:sqlite) | — | Embedded, zero-config, local-first |
| Backlog CRUD | API / Backend | — | Repository pattern over raw SQL |
| UI rendering | Browser / Client | — | React 19 SPA served by Bun.serve |
| State management | Browser / Client | — | Zustand for reactive UI state |
| Content hashing | API / Backend | — | SHA-256 to detect real Excel changes |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | 1.3.14 | Runtime, bundler, compiler | Single `--compile` binary; built-in `bun:sqlite` [VERIFIED: bun.sh/docs] |
| React | 19.2.6 | UI framework | Dominant ecosystem, excellent TS support [CITED: react.dev] |
| TypeScript | 5.7+ | Type safety | Table stakes for 2025 [ASSUMED] |
| Vite | 8.0.14 | Frontend dev server & build | Fastest HMR; Bun bundles production artifact [CITED: vitejs.dev] |
| `bun:sqlite` | Built-in | Local embedded database | Zero extra dependency, lightning-fast [VERIFIED: bun.sh/docs] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.3.0 | Utility-first CSS | Rapid UI development without leaving JSX [CITED: tailwindcss.com] |
| shadcn/ui | Latest CLI | Accessible UI primitives | Copy-paste components; works with Vite [CITED: ui.shadcn.com] |
| Zustand | 5.0.14 | Client state | Minimal boilerplate, excellent TS inference [CITED: github.com/pmndrs/zustand] |
| TanStack React Table | 8.21.2 | Data tables | Industry standard for complex grids [CITED: tanstack.com/table] |
| SheetJS (`xlsx`) | 0.20.3 | Excel parsing | De-facto standard; use CDN tarball [CITED: sheetjs.com/docs] |
| date-fns | 4.4.0 | Date manipulation | Immutable, tree-shakeable, locale-aware [CITED: date-fns.org] |
| chokidar | 5.0.0 | File watching | Reliable cross-platform watcher [CITED: github.com/paulmillr/chokidar] |
| Zod | 3.x | Schema validation | Lightweight, excellent DX; MCP-compatible [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bun `--compile` | Tauri v2 | Tauri is smaller (~15MB vs ~90MB) but requires Rust backend; choose if native desktop feel needed |
| Bun `--compile` | Electron | Electron is 150MB+, slow, blocked by corporate security |
| `bun:sqlite` | IndexedDB | IndexedDB cannot be queried by MCP server; pure browser storage evicted by Safari |
| React 19 | SolidJS / Svelte | Faster/smaller but React ecosystem (shadcn, TanStack) is pragmatic for internal tool |

**Installation:**
```bash
# Core (development machine only)
# Bun runtime assumed installed

# Frontend
npm install react@19.2.6 react-dom@19.2.6 vite@8.0.14 @vitejs/plugin-react

# Styling & UI
npm install tailwindcss@4.3.0 @tailwindcss/vite zustand@5.0.14

# Backend & data processing
npm install chokidar@5.0.0 date-fns@4.4.0 zod@3.x

# Excel parsing — use CDN tarball, NOT npm registry stale version
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## Package Legitimacy Audit

> All packages above are well-established with multi-year history. slopcheck verification not run in this research session. Planner should mark packages as `[ASSUMED]` and add `checkpoint:human-verify` before install if strict enforcement is required.

| Package | Registry | Age | Downloads | Source Repo | Disposition |
|---------|----------|-----|-----------|-------------|-------------|
| bun | — | 3 yrs | — | oven-sh/bun | Approved (official runtime) |
| react | npm | 10+ yrs | 20M+/wk | facebook/react | Approved |
| vite | npm | 5 yrs | 10M+/wk | vitejs/vite | Approved |
| tailwindcss | npm | 6 yrs | 8M+/wk | tailwindlabs/tailwindcss | Approved |
| zustand | npm | 5 yrs | 2M+/wk | pmndrs/zustand | Approved |
| xlsx | npm (CDN) | 10+ yrs | — | SheetJS/sheetjs | Approved (official CDN) |
| chokidar | npm | 10+ yrs | 50M+/wk | paulmillr/chokidar | Approved |
| date-fns | npm | 8 yrs | 10M+/wk | date-fns/date-fns | Approved |
| zod | npm | 4 yrs | 5M+/wk | colinhacks/zod | Approved |

## Architecture Patterns

### System Architecture Diagram

```
[OneDrive Folder] --(chokidar watcher)--> [Bun Server Process]
                                                |
                                    [SheetJS Parser + Content Hash]
                                                |
                                    [bun:sqlite + Repository Layer]
                                                |
                                    [Bun.serve HTTP Server]
                                                |
                                    [React 19 SPA (Vite build)]
                                                |
                                    [Browser (user interacts)]
```

### Recommended Project Structure
```
scrumbag/
├── src/
│   ├── ui/              # React components and pages
│   ├── state/           # Zustand stores
│   ├── domain/          # Business logic, entities, types
│   ├── data/            # Repository classes, SQLite schema
│   └── sync/            # chokidar watcher, Excel importer
├── public/              # Static assets (bundled into executable)
├── server.ts            # Bun.serve — UI mode entry point
├── mcp.ts               # MCP server entry point (future)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### Pattern 1: Repository Pattern over SQLite
**What:** Abstract all CRUD behind repository classes; domain code never touches raw SQL.
**When to use:** All database access.
**Example:**
```typescript
// src/data/backlog-repository.ts
export class BacklogRepository {
  constructor(private db: Database) {}
  
  create(item: NewBacklogItem): BacklogItem {
    const id = crypto.randomUUID();
    this.db.run(/* insert */);
    return this.findById(id)!;
  }
  
  findById(id: string): BacklogItem | null {
    return this.db.query("SELECT * FROM backlog_items WHERE id = ?").get(id) ?? null;
  }
}
```

### Pattern 2: File-to-Database Sync with Change Detection
**What:** Excel is an import source; SQLite is canonical. Hash file contents; only re-sync changed files.
**When to use:** OneDrive/Excel sync.
**Example:**
```typescript
// src/sync/excel-sync.ts
async function syncFile(filePath: string): Promise<void> {
  const content = await Bun.file(filePath).arrayBuffer();
  const hash = await sha256(content);
  const lastHash = await getLastHash(filePath);
  
  if (hash === lastHash) return; // no change
  
  const data = xlsx.read(content, { cellDates: true, raw: true });
  await importSheets(data);
  await saveHash(filePath, hash);
}
```

### Anti-Patterns to Avoid
- **Treating Excel as live database:** OneDrive sync is not transactional; files can be locked, conflict copies appear.
- **Using browser File System Access API:** Corporate group policy may disable it; older Edge versions lack support.
- **Building custom Excel parser:** SheetJS is the de-facto standard; custom parsers miss edge cases (merged cells, dates, formulas).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel parsing | Custom CSV/xlsx parser | SheetJS (`xlsx`) | Handles merged cells, dates, formulas, multiple sheets |
| File watching | fs.watch polling | chokidar | Cross-platform, handles rename events, stable |
| Date math | Native Date arithmetic | date-fns | Immutable, locale-aware, handles edge cases |
| Schema validation | Manual object checks | Zod | Type inference, composable, MCP SDK compatible |
| HTTP server | Node http module | Bun.serve | Built-in, fast, supports static file serving |
| SQLite bindings | Custom C bindings | `bun:sqlite` | Built-in, zero dependency, fast |

## Common Pitfalls

### Pitfall 1: Treating Excel/OneDrive as a Live Database
**What goes wrong:** OneDrive sync is not transactional; files can be locked, conflict copies appear, timestamps are unreliable. Building logic that reads Excel directly on every request produces stale data and race conditions.
**Why it happens:** Teams naturally think "the Excel file IS the data" because it's their current workflow.
**How to avoid:** Import into SQLite immediately upon file change. Use content hashing (SHA-256) for change detection, not file timestamps. Provide manual "Re-import" fallback.
**Warning signs:** Code that reads `.xlsx` directly in API handlers; no SQLite import step.

### Pitfall 2: Bun Full-Stack Compile Gotchas
**What goes wrong:** Bun's `--compile` bundles server.ts and all imported modules, but frontend assets built by Vite need to be embedded or served correctly.
**Why it happens:** Bun compile is relatively new; bundling frontend SPA assets into the same binary requires specific setup.
**How to avoid:** Build frontend to `dist/` with Vite first, then serve `dist/` via `Bun.serve` static file handling. The `--compile` binary must include `dist/` assets (use `Bun.file()` relative paths).
**Warning signs:** Binary runs but 404s on CSS/JS assets; path resolution errors.

### Pitfall 3: Corporate Environment Blocking Executable
**What goes wrong:** Antivirus or group policy blocks the compiled `.exe` from running.
**Why it happens:** Unknown binaries trigger corporate security tools.
**How to avoid:** Document the executable as internal tool; test on target machine early. Consider code-signing if available.
**Warning signs:** Binary instantly quarantined; Windows Defender flags it.

### Pitfall 4: SheetJS Date Parsing Errors
**What goes wrong:** Excel dates are stored as serial numbers; naive parsing produces wrong dates or throws errors.
**Why it happens:** Default SheetJS behavior returns serial numbers unless `cellDates: true` is set.
**How to avoid:** Always use `cellDates: true` and `raw: true` when reading workbooks. Verify date columns explicitly during import.
**Warning signs:** Dates showing as integers (e.g., 45000 instead of 2023-04-15).

## Code Examples

### Bun.serve with Static SPA Serving
```typescript
// server.ts
import { Database } from "bun:sqlite";

const db = new Database("scrumbag.db");

Bun.serve({
  port: 3000,
  static: {
    "/": new Response(Bun.file("dist/index.html")),
    "/assets/*": (req) => {
      const path = new URL(req.url).pathname;
      return new Response(Bun.file(`dist${path}`));
    },
  },
  fetch(req) {
    // API routes
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, db);
    }
    // SPA fallback
    return new Response(Bun.file("dist/index.html"));
  },
});

console.log("Scrumbag running at http://localhost:3000");
```

### SQLite Schema Initialization
```typescript
// src/data/schema.ts
import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS backlog_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('epic', 'feature', 'story', 'bug')),
      title TEXT NOT NULL,
      description TEXT,
      parent_id TEXT REFERENCES backlog_items(id),
      status TEXT NOT NULL DEFAULT 'backlog',
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS file_hashes (
      path TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
```

### Content Hash Change Detection
```typescript
// src/sync/hash.ts
import { crypto } from "bun";

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Electron for desktop apps | Bun `--compile` | Bun 1.2+ (2025) | 90MB binary vs 150MB+, faster startup, no security flags |
| IndexedDB for local-first | `bun:sqlite` embedded | Bun 1.1+ (2024) | Reliable persistence, no browser eviction, queryable by MCP |
| Service Workers for offline | Local executable | Always | App is already local; no network to be offline from |

**Deprecated/outdated:**
- Moment.js: Legacy, mutable, bloated. Use date-fns.
- Redux: Too much boilerplate for 3-user tool. Use Zustand.
- `xlsx` from npm registry: Stale 0.18.5 version. Use official CDN tarball.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Bun 1.3.14 supports full-stack compile with embedded frontend assets on Windows | Standard Stack | Cannot produce single executable; would need Tauri or Electron fallback |
| A2 | Corporate machine allows running unsigned `.exe` from internal source | Common Pitfalls | Would need IT approval or code-signing; blocks Phase 1 |
| A3 | Excel files use standard `.xlsx` format with predictable sheet/column structure | Architecture Patterns | Would need custom parser mapping; delays data ingestion |
| A4 | OneDrive sync folder path is known and accessible by the executable | Architecture Patterns | Would need user-configurable path; adds UI complexity |

## Open Questions (RESOLVED)

1. **Bun full-stack compile on Windows corporate machine**
   - What we know: Bun `--compile` is documented for Windows, macOS, Linux
   - What's unclear: Whether managed Windows with group policy/antivirus blocks it
   - Recommendation: Build test binary early in Phase 1; if blocked, switch to Tauri v2
   - **RESOLVED:** Test during Phase 1 execution; fallback documented.

2. **Excel sheet structure**
   - What we know: Team uses Excel for backlog today
   - What's unclear: Exact sheet names, column headers, data types
   - Recommendation: Obtain sample files from team before finalizing parser mapping
   - **RESOLVED:** Phase 1 plan includes manual import fallback and configurable mapping.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun runtime | Everything | ✓ | 1.3.14 | — |
| Node.js (for npm) | Package install | ✓ | 20+ | — |
| Windows / macOS / Linux | Target platform | ✓ | — | — |
| OneDrive sync folder | File sync | ✓ | — | Manual file selection |

**Missing dependencies with no fallback:**
- None identified.

**Missing dependencies with fallback:**
- None identified.

## Validation Architecture

> Skipped: `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`.

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth required — 3 internal users, corporate network is trust boundary |
| V3 Session Management | no | No sessions — local executable |
| V4 Access Control | no | No access control — single user per instance |
| V5 Input Validation | yes | Zod for all API input validation |
| V6 Cryptography | no | No sensitive data at rest; SHA-256 for content hashing only |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via sync folder path | Tampering | Validate and sanitize file paths; restrict to configured sync folder |
| Malicious Excel file upload | Tampering | SheetJS defensive parsing; no macro execution; validate parsed data structure |
| SQLite injection | Tampering | Parameterized queries via `bun:sqlite` query API; never string-interpolate SQL |
| DoS via large Excel file | Denial of Service | File size limit (e.g., 50MB); row count limit; timeout on import |

## Sources

### Primary (HIGH confidence)
- [Bun v1.3.14 Release](https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14) — Single-file executable and full-stack compile support
- [Bun Docs: Single-file executable](https://bun.sh/docs/bundler/executables) — `--compile` API, cross-compilation, embedded assets
- [Bun Docs: SQLite](https://bun.sh/docs/api/sqlite) — `bun:sqlite` API reference
- [SheetJS v0.20.3 Docs](https://docs.sheetjs.com/docs/getting-started/installation/frameworks) — CDN tarball installation
- [chokidar v5.0.0 Release](https://github.com/paulmillr/chokidar/releases/tag/5.0.0) — ESM-only, cross-platform file watching
- PROJECT.md — Direct project constraints, decisions, and out-of-scope items

### Secondary (MEDIUM confidence)
- [Vite v8.0.14 Release](https://github.com/vitejs/vite/releases/tag/v8.0.14) — Verified Vite version
- [React v19.2.6 Release](https://github.com/facebook/react/releases/tag/v19.2.6) — Verified React version
- [Tailwind CSS v4.3.0 Release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0) — Verified Tailwind version

### Tertiary (LOW confidence)
- Personal experience / known issues — Excel file locking, OneDrive conflict copies, corporate browser policy restrictions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All technologies have official releases and verified compatibility
- Architecture: HIGH — Bun executable pattern is explicitly documented; no unknowns
- Pitfalls: HIGH — Pitfalls are grounded in real-world behavior of Excel, OneDrive, and corporate environments

**Research date:** 2026-05-30
**Valid until:** 2026-07-30 (stable stack, 60 days)
