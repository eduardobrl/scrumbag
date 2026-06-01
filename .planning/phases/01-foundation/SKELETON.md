# Walking Skeleton — Scrumbag

**Phase:** 1
**Generated:** 2026-05-30

## Capability Proven End-to-End

A user launches a single executable, opens their browser, and sees a backlog list loaded from SQLite; they can create a new backlog item (story, feature, bug, or epic) via a form, and the item persists after the app is restarted.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 SPA + Vite | Dominant ecosystem, excellent TypeScript support, fast HMR. shadcn/ui and TanStack Table available. |
| Runtime & Packaging | Bun 1.3.14 with `--compile` | Single `.exe` with zero dependencies. Built-in `bun:sqlite`, HTTP server (`Bun.serve`), and file system access. Eliminates Electron (blocked by corporate security) and Next.js (overkill for local-only). |
| Data layer | `bun:sqlite` (embedded SQLite) | Zero-config, local-first, persists across restarts. Queryable by future MCP server. Avoids IndexedDB (browser eviction) and PostgreSQL (requires install). |
| Auth | None | 3 internal users on corporate network; network is the trust boundary. No auth gates in v1. |
| Deployment target | Local executable (Windows `.exe`) | Double-click to run. No installer, no registry, no admin rights. Documented `bun run dev` for development. |
| Directory layout | Feature-based under `src/` (`src/ui/`, `src/domain/`, `src/data/`, `src/sync/`) | Clear separation: UI components, business types, data access, and sync logic each have a home. |
| Styling | Tailwind CSS 4.3.0 + shadcn/ui | Utility-first CSS for rapid development. shadcn/ui provides accessible primitives without a heavy dependency tree. |
| State management | Zustand 5.0.14 | Minimal boilerplate for client-side global state (modals, selected items). No Redux overhead for a 3-user tool. |
| Excel parsing | SheetJS (`xlsx`) 0.20.3 via CDN tarball | De-facto standard. CDN tarball avoids stale npm registry version and false-positive Snyk warnings. |
| File watching | chokidar 5.0.0 | Cross-platform, stable, handles OneDrive rename/sync events. |
| Schema validation | Zod 3.x | MCP SDK-compatible, lightweight, excellent DX. Used for API input validation. |

## Stack Touched in Phase 1

- [x] Project scaffold (Bun, Vite, React, TypeScript, Tailwind, build scripts)
- [x] Routing — SPA fallback via `Bun.serve` static handler; React Router for client-side nav
- [x] Database — `bun:sqlite` with `backlog_items` and `file_hashes` tables; repository pattern
- [x] UI — React components (list, form) wired to API via `fetch`
- [x] Deployment — `bun run dev` exercises full stack locally; `bun build --compile` produces `.exe`

## Out of Scope (Deferred to Later Slices)

- Excel file sync and automatic ingestion (Phase 1, Plan 04)
- Hierarchy display and parent-child management (Phase 1, Plan 03)
- Full backlog CRUD with edit/delete (Phase 1, Plan 02)
- Squad management and capacity calculation (Phase 2)
- Sprint planning, board, and estimation (Phase 3)
- Velocity tracking, burndown, and forecasting (Phase 4)
- MCP server for AI agents (v2)
- Authentication or multi-user support (v2)
- Enhanced offline-first sync indicators (v2)

## Subsequent Slice Plan

Each later plan adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Plan 01-02:** Full backlog CRUD — user can edit and delete items, see all types in a rich table.
- **Plan 01-03:** Hierarchy — user can nest items (epic → feature → story) and view a tree.
- **Plan 01-04:** Excel sync — user places `.xlsx` files in a folder and the app auto-imports them.
- **Phase 2:** Squad & capacity — user registers team members, absences, and sees realistic capacity.
- **Phase 3:** Sprint planning & board — user creates sprints, estimates stories, and moves cards on a Kanban board.
- **Phase 4:** Forecasting & analytics — user views velocity, burndown charts, and epic delivery forecasts.
