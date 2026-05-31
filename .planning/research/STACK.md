# Stack Research

**Domain:** Browser-based Scrum capacity planning tool with local Excel ingestion and MCP server
**Researched:** 2025-05-30
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Bun | 1.3.14 | Runtime, bundler, compiler | Single `--compile` binary produces a portable executable with zero dependencies. Full-stack compile (v1.2.17+) bundles frontend assets into the same binary. Built-in `bun:sqlite` eliminates a database dependency. Fast startup, native file system access. |
| React | 19.2.6 | UI framework | Dominant ecosystem, excellent TypeScript support, team familiarity likely. React 19 improves performance and ref handling. Perfect for data-heavy internal tools. |
| TypeScript | 5.7+ | Type safety | Table stakes in 2025. Catches schema mismatches between Excel, SQLite, and MCP tools early. |
| Vite | 8.0.14 | Frontend dev server & build | Fastest HMR, native ESM, mature plugin ecosystem. Used for frontend development; Bun bundles the production artifact into the final executable. |

### Database & Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `bun:sqlite` | Built-in (Bun 1.3.14) | Local embedded database | Zero extra dependency. Lightning-fast SQLite bindings. Data stays local (corporate constraint). Perfect for 3-user offline-first app. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.3.0 | Utility-first CSS | Rapid UI development without leaving HTML/JSX. v4 has improved performance and simplified configuration. |
| shadcn/ui | Latest CLI | Accessible UI primitives | Copy-paste components (Calendar, Table, Dialog, Date Picker) built on Radix. Works with Vite. Speeds up internal tool development without adding a heavy dependency. |
| Zustand | 5.0.14 | Client state management | Minimal boilerplate, excellent TypeScript inference. Ideal for lightweight global state (sprint data, UI modals) without Redux overhead. |
| TanStack React Table | 8.21.2 | Data tables | Industry standard for complex tables (sorting, filtering, virtualization). Required for capacity grids, sprint boards, and epic lists. |
| SheetJS (`xlsx`) | 0.20.3 | Excel parsing | De-facto standard for reading `.xlsx` in JavaScript. Use the official CDN tarball, not the stale npm registry version. |
| date-fns | 4.4.0 | Date manipulation | Immutable, tree-shakeable, locale-aware. Required for sprint date math, holiday handling, and capacity calculations. |
| chokidar | 5.0.0 | File watching | Reliable cross-platform file system watcher. Detects Excel changes in the OneDrive-synced folder and triggers re-imports. |
| `@modelcontextprotocol/sdk` | 1.29.0 | MCP server implementation | Official SDK for exposing tools, resources, and prompts to AI agents. Supports stdio and HTTP/SSE transports. |
| Zod | 3.x | Schema validation | MCP SDK examples use Zod 3 for tool input schemas. Stable, lightweight, excellent DX. (Zod 4 is new; verify MCP compatibility before upgrading.) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `@vitejs/plugin-react` | React Fast Refresh | Essential Vite plugin for React HMR. |
| `@tailwindcss/vite` | Tailwind v4 Vite integration | Native Vite plugin for Tailwind 4, faster than PostCSS setup. |
| `@types/react` / `@types/react-dom` | React type definitions | Use matching versions for React 19. |
| `bun-types` | Bun runtime types | Required for `bun:sqlite`, `Bun.serve`, and compile APIs. |

## Architecture Decision: The Browser + MCP Contradiction

**Problem:** A pure browser app cannot host an MCP server because MCP requires either a stdio process or an HTTP listener — both impossible inside a browser tab.

**Solution:** A single Bun-compiled executable that runs in two modes:

1. **UI Mode** (default, no args): Starts `Bun.serve` on localhost, serves the React frontend, opens the user's browser. Reads/watches the local OneDrive folder, imports Excel into `bun:sqlite`, and exposes a local REST API to the frontend.
2. **MCP Mode** (`--mcp` arg): Connects `StdioServerTransport` or `StreamableHttpServerTransport` from `@modelcontextprotocol/sdk` and exposes the same SQLite data as MCP tools/resources.

This satisfies all constraints:
- **"Sem instalação"**: One `.exe` file, double-click to run. No installer, no registry, no admin rights needed.
- **"Roda no navegador"**: The UI renders in the user's default browser.
- **"Servidor MCP"**: The same binary acts as an MCP server when launched by Claude Desktop / Cursor / VS Code.
- **"Offline-first"**: Everything is local — SQLite, file watcher, web server.

## Installation

```bash
# Install Bun runtime (development machine only)
npm install -g bun@1.3.14

# Core frontend
bun add react@19.2.6 react-dom@19.2.6
bun add -D vite@8.0.14 @vitejs/plugin-react@4.4 typescript@5.7

# Styling & UI
bun add tailwindcss@4.3.0 @tailwindcss/vite@4.3.0
bun add zustand@5.0.14
bun add @tanstack/react-table@8.21.2

# Backend & data processing
bun add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
bun add chokidar@5.0.0
bun add date-fns@4.4.0
bun add @modelcontextprotocol/sdk@1.29.0 zod@3.24.2

# Dev dependencies
bun add -D @types/react@19 @types/react-dom@19 @types/bun

# Initialize shadcn/ui
bunx shadcn@latest init
```

> **SheetJS note:** Always install from the official CDN URL. The public npm registry version is stale (0.18.5). Vendoring the tarball into your repo is recommended for corporate networks.

## Build to Single Executable

```bash
# 1. Build frontend with Vite
bunx vite build

# 2. Compile full-stack binary with Bun
# This bundles server.ts + all frontend dist assets into one .exe
bun build --compile ./server.ts --outfile scrumbag

# Cross-compile for Windows (from macOS/Linux CI)
bun build --compile --target=bun-windows-x64 ./server.ts --outfile scrumbag.exe
```

The `server.ts` entrypoint should import the built `index.html` so Bun automatically bundles the frontend assets:

```typescript
import { serve } from "bun";
import index from "./dist/index.html";

const server = serve({
  routes: {
    "/": index,
    "/api/*": { GET: req => handleApi(req) },
  },
  static: {
    "/assets/*": new Response(Bun.file(`./dist/assets/${path}`)),
  },
});

// MCP mode handled separately via CLI arg
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Packaging | Bun `--compile` | Tauri v2 | Choose Tauri if you need a true native desktop feel (system tray, native menus) or if executable size (<15MB vs ~100MB) is critical. Requires writing Rust for the backend/MCP bridge. |
| Packaging | Bun `--compile` | Electron | Avoid Electron for this use case: massive bundle size, slow startup, heavy memory usage, and corporate security teams often flag Electron apps. |
| Frontend Framework | React 19 | SolidJS / Svelte | Solid/Svelte are faster and smaller, but React's ecosystem (shadcn/ui, TanStack Table) and hiring pool make it the pragmatic choice for a corporate internal tool. |
| Database | `bun:sqlite` | IndexedDB (browser) | IndexedDB is pure browser but cannot be queried by the MCP server. SQLite is the correct choice when a shared local backend exists. |
| MCP Transport | stdio | HTTP/SSE | Use HTTP/SSE if you need to connect remote AI clients or if the host only supports HTTP (e.g., some VS Code configurations). stdio is simpler for local-only Claude Desktop integration. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js** | Overkill for a local-only app. App Router, SSR, and API routes add complexity that doesn't apply when the "server" is a local Bun process. | Vite + React SPA |
| **Electron** | 150MB+ bundles, slow startup, memory-hungry. Corporate security policies often block Electron executables. | Bun `--compile` (~90MB, faster, lighter) |
| **PostgreSQL / MySQL** | Requires separate service installation, violates "sem instalação" constraint. Massive overkill for 3 users and local data. | `bun:sqlite` |
| **PWA / Service Workers for offline** | The app is already a local executable; there's no network to be offline from. Service workers add unnecessary complexity. | Standard fetch to localhost API |
| **`xlsx` from npm registry** | Registry version is 0.18.5 (stale). Known false-positive Snyk warnings. | Official CDN tarball (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) |
| **Redux / Redux Toolkit** | Too much boilerplate for a 3-user internal tool. Zustand covers global state with 1/10th the code. | Zustand |
| **Moment.js** | Legacy, mutable, bloated. Officially in maintenance mode since 2020. | date-fns |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@modelcontextprotocol/sdk@1.29.0` | `zod@3.x` | MCP quickstart examples explicitly use `zod@3`. Zod 4 compatibility is **unverified** — test before upgrading. |
| `bun@1.3.14` | `chokidar@5.x` | Chokidar 5 is ESM-only and requires Node >= 20.19. Bun handles ESM natively. |
| `tailwindcss@4.3.0` | `vite@8.x` | Use `@tailwindcss/vite` plugin for v4 integration. |
| `react@19.2.6` | `@types/react@19.x` | Ensure type packages match major React version. |
| `bun:sqlite` | Bun >= 1.1 | Available on Windows, macOS, and Linux. Database file is created relative to CWD at runtime. |

## Sources

- [Bun v1.3.14 Release](https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14) — Verified single-file executable and full-stack compile support
- [Bun Docs: Single-file executable](https://bun.sh/docs/bundler/executables) — `--compile` API, cross-compilation, embedded assets
- [Vite v8.0.14 Release](https://github.com/vitejs/vite/releases/tag/v8.0.14) — Current stable version
- [React v19.2.6 Release](https://github.com/facebook/react/releases/tag/v19.2.6) — Current stable version
- [Tailwind CSS v4.3.0 Release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0) — Current stable version
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — Verified Vite compatibility
- [Zustand v5.0.14 Release](https://github.com/pmndrs/zustand/releases/tag/v5.0.14) — Current stable version
- [TanStack Table releases](https://github.com/TanStack/table/releases) — React Table v8.21.x current
- [date-fns v4.4.0 Release](https://github.com/date-fns/date-fns/releases/tag/v4.4.0) — Current stable version
- [chokidar v5.0.0 Release](https://github.com/paulmillr/chokidar/releases/tag/5.0.0) — Current stable version (ESM-only)
- [MCP TypeScript SDK v1.29.0 Release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v1.29.0) — Current v1.x stable
- [MCP Docs: Build a Server](https://modelcontextprotocol.io/docs/develop/build-server) — stdio/HTTP transport patterns, logging constraints
- [SheetJS v0.20.3 Docs](https://docs.sheetjs.com/docs/getting-started/installation/frameworks) — CDN tarball installation, vendoring recommendation
- [Zod v4.4.3 Release](https://github.com/colinhacks/zod/releases/tag/v4.4.3) — Note: MCP SDK compatibility unverified

---
*Stack research for: Scrum capacity planning web app (Scrumbag)*
*Researched: 2025-05-30*
