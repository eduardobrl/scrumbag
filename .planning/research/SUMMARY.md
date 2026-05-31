# Project Research Summary

**Project:** Scrumbag
**Domain:** Browser-based Scrum capacity planning tool with local Excel ingestion and MCP server
**Researched:** 2026-05-30
**Confidence:** HIGH (with one critical architectural conflict requiring resolution)

## Executive Summary

Scrumbag is a local-first, single-executable Scrum capacity planning tool for a small corporate squad (3 users). It must run without installation ("sem instalação"), render in the browser, ingest data from Excel files synced via OneDrive, and expose an MCP server for AI agent integration. Research confirms the dominant pattern for this class of tool is a lightweight local server bundled into a single executable that serves a React SPA and doubles as an MCP backend.

The recommended approach is a **Bun-compiled single executable** (`bun build --compile`) that runs in two modes: UI mode (default) starts `Bun.serve` on localhost and serves the React frontend, while MCP mode (`--mcp` arg) exposes the same SQLite data via the MCP SDK. This satisfies all hard constraints: no installation, browser-based UI, offline-first operation via `bun:sqlite`, and MCP server capability. The frontend should be a React 19 SPA built with Vite, using Tailwind CSS and shadcn/ui for rapid UI development, TanStack Table for data grids, and Zustand for lightweight state management.

The primary risks are (1) a significant conflict between the STACK researcher (who correctly identified the Bun-compiled executable + `bun:sqlite` architecture) and the ARCHITECTURE researcher (who proposed a pure PWA with IndexedDB and File System Access API, which cannot host an MCP server); (2) treating Excel/OneDrive as a live database rather than a sync source; and (3) building capacity formulas that don't match the team's real process. Mitigation: adopt the STACK.md architecture as canonical, treat Excel as an import source with content hashing, validate capacity calculations against manual team estimates for 2-3 sprints before locking formulas, and defer the MCP server until the data model stabilizes.

## Key Findings

### Recommended Stack

See full research: [STACK.md](STACK.md)

The stack is built around **Bun 1.3.14** as the runtime, bundler, and compiler. Its `--compile` flag produces a single portable executable (~90MB) with zero dependencies, which is the only viable way to satisfy the "no installation" constraint while also hosting an MCP server. `bun:sqlite` is the embedded database — zero extra dependency, lightning-fast, and data stays local. **React 19.2.6 + Vite 8.0.14** form the frontend; Vite is used for dev/HMR, and Bun bundles the production frontend assets into the final executable. TypeScript 5.7+ is table stakes.

**Core technologies:**
- **Bun 1.3.14**: Runtime, bundler, compiler — single `--compile` binary, full-stack compile support, built-in `bun:sqlite`
- **React 19.2.6**: UI framework — dominant ecosystem, excellent TS support, React 19 performance improvements
- **TypeScript 5.7+**: Type safety — catches schema mismatches early
- **Vite 8.0.14**: Frontend dev server & build — fastest HMR; Bun bundles the production artifact into the final `.exe`
- **`bun:sqlite`**: Local embedded database — zero extra dependency, data stays local, perfect for 3-user offline app
- **Tailwind CSS 4.3.0 + shadcn/ui**: Styling and accessible UI primitives — rapid development without heavy dependencies
- **Zustand 5.0.14**: Client state — minimal boilerplate, excellent TS inference
- **TanStack React Table 8.21.2**: Data tables — industry standard for complex capacity grids and sprint boards
- **SheetJS (`xlsx`) 0.20.3**: Excel parsing — de-facto standard; install from official CDN tarball, not stale npm registry
- **date-fns 4.4.0**: Date math — immutable, tree-shakeable, locale-aware for sprint/holiday calculations
- **chokidar 5.0.0**: File watching — reliable cross-platform watcher for OneDrive-synced folder changes
- **`@modelcontextprotocol/sdk` 1.29.0 + Zod 3.x**: MCP server implementation — official SDK; Zod 3 for tool input schemas (Zod 4 compatibility unverified)

**What NOT to use:** Next.js (overkill for local-only), Electron (150MB+, slow, blocked by corporate security), PostgreSQL/MySQL (violates "no install"), Redux (too much boilerplate), Moment.js (legacy), PWA Service Workers for offline (the app is already a local executable; there's no network to be offline from — though caching static assets is fine).

> **Architecture Decision (Canonical):** The single Bun executable runs in two modes: UI Mode (default, serves React SPA via `Bun.serve`) and MCP Mode (`--mcp` arg, exposes SQLite data via MCP SDK transports). This is the only architecture that satisfies all constraints simultaneously. The ARCHITECTURE.md proposal of a pure PWA with IndexedDB and File System Access API is incompatible with hosting an MCP server and should be discarded in favor of the STACK.md approach.

### Expected Features

See full research: [FEATURES.md](FEATURES.md)

**Must have (table stakes):**
- **Backlog Management** — structured place for stories, features, bugs, epics; hierarchy expected
- **Sprint Planning & Time-boxing** — create sprints with start/end dates and goals; manual scope selection
- **Story Point Estimation** — Fibonacci scale (1, 2, 3, 5, 8, 13, 21)
- **Sprint Board (Kanban)** — To Do, In Progress, Done minimum; visual workflow is non-negotiable
- **Velocity Tracking** — rolling average of completed story points per sprint (last 3-5)
- **Basic Burndown Chart** — ideal vs. actual remaining effort by day
- **Team Member Management + Absence/Holiday Tracking** — names, roles, capacity, availability; required for realistic capacity
- **Work Item Hierarchy** — epics → features → stories; essential for portfolio forecasting

**Should have (competitive differentiators):**
- **Realistic Capacity Calculation** — adjust for absences, holidays, part-time status; this is the #1 promised value
- **Epic Delivery Forecasting** — connect sprint-level capacity to long-term epic completion; Monte Carlo or linear projection
- **Excel/OneDrive Synchronization** — auto-detect file changes, parse structured sheets, map to internal data model
- **MCP Server / AI Agent Integration** — expose capacity, backlog, forecasts via MCP protocol; novel in this space
- **Sprint Story Suggestions** — recommend stories that fit remaining adjusted capacity
- **Waste/Overhead Tracking** — meetings, support, incidents, context switching; configurable categories
- **Dual Estimation (Story Points + Days)** — points for sprint planning, days for epic/calendar forecasting

**Defer (v2+):**
- Planning Poker Integration — manual entry works for 3 users
- Custom Board Columns — fixed workflow is fine
- Multi-Squad/Portfolio Views — one squad now
- Advanced Analytics (Cycle Time, CFD) — not essential for core capacity planning

**Anti-features to explicitly avoid:** Complex multi-user auth/SSO (only 3 users), native mobile app (out of scope), real-time collaborative editing (OneDrive already syncs; no CRDT needed), automatic notifications (out of scope), advanced BI/dashboards ("básicos são suficientes"), direct Jira/Azure DevOps integration (impossible given constraints), built-in chat, complex workflow engine, public API/REST server (MCP is the chosen pattern), time tracking per task (conflicts with story points).

### Architecture Approach

See full research: [ARCHITECTURE.md](ARCHITECTURE.md)

> **⚠️ CRITICAL CONFLICT:** ARCHITECTURE.md proposes a pure browser PWA with IndexedDB, Service Worker, and File System Access API. This architecture **cannot host an MCP server** because browsers cannot run stdio processes or HTTP listeners accessible to external AI clients. The STACK.md researcher explicitly solved this contradiction with a Bun-compiled executable. **The STACK.md architecture MUST be adopted as canonical.** Elements from ARCHITECTURE.md (repository pattern, separation of concerns, offline resilience) should be adapted to the Bun-server context.

**Adopted architecture (based on STACK.md, incorporating patterns from ARCHITECTURE.md):**

The system is a single compiled binary with a layered architecture:

1. **UI Layer (Browser)** — React 19 SPA served by `Bun.serve`; views: Sprint Board, Epic Forecast, Team Management, Capacity Calculator
2. **Application Logic (Server + Client)** —
   - **State Manager (Client)**: Zustand for reactive UI state
   - **Capacity Engine (Server/Shared)**: Pure JS business logic; deterministic capacity calculations
   - **Sprint Engine (Server/Shared)**: Sprint lifecycle, story assignment based on capacity
   - **Sync Coordinator (Server)**: chokidar file watching, Excel change detection, SQLite upserts
3. **Data Layer** — `bun:sqlite` embedded database; repository pattern abstracts schema; entities: Members, Features, Stories, Sprints, Absences, Epics
4. **Integration Layer** —
   - **File Sync Engine**: chokidar watches OneDrive folder; SheetJS parses `.xlsx`; content hashing detects real changes
   - **MCP Server**: Exposes tools/resources via MCP SDK (stdio or Streamable HTTP); binds to `127.0.0.1` only
5. **Platform Layer** — Bun runtime provides file system access, HTTP server, SQLite, and compilation to single executable

**Key patterns to follow:**
- **Repository Pattern over SQLite**: Abstract CRUD behind repository classes; domain code never touches raw SQL
- **File-to-Database Sync with Change Detection**: Excel is an import source; SQLite is canonical. Hash file contents; only re-sync changed files
- **MCP Server as Co-located Interface**: Reuse `domain/` and `data/` modules; MCP is an interface layer, not a separate product
- **Strict Layer Boundaries**: `ui/` → `state/` → `domain/` + `data/`; `mcp/` only imports `domain/` and `data/`

**Build order implications:**
1. Data Layer (`bun:sqlite` schema + repositories)
2. Domain Logic (capacity calculator, sprint planner, velocity tracker, epic forecaster)
3. File Sync Layer (chokidar + SheetJS + sync engine)
4. State Management (Zustand wiring)
5. UI Layer (React views and components)
6. MCP Server (exposes tools/resources from stable domain)
7. Build & compile to single executable

### Critical Pitfalls

See full research: [PITFALLS.md](PITFALLS.md)

1. **Treating Excel/OneDrive as a Live Database** — OneDrive sync is not transactional; files can be locked, conflict copies appear, timestamps are unreliable. **Avoid by:** content hashing (SHA-256) for change detection, importing into `bun:sqlite` immediately, providing manual "Re-import" fallback, and using defensive SheetJS parsing (`cellDates: true`, `raw: true`). This must be solved in Phase 1 before any downstream feature is built.

2. **Browser Storage Eviction (if any client-side caching is used)** — While `bun:sqlite` in the executable avoids browser storage limits, any client-side IndexedDB or OPFS usage is best-effort and can be evicted by Safari in 7 days. **Avoid by:** keeping canonical data in `bun:sqlite` on the server side, providing JSON export/backup buttons, and calling `navigator.storage.persist()` only after meaningful user gestures if any browser storage is used.

3. **Capacity Formulas That Don't Match Reality** — Textbook formulas often ignore how teams actually account for time. **Avoid by:** starting with manual capacity entry, comparing app calculation to Tech Lead's manual calculation for 2-3 sprints, exposing a transparent "How we calculated this" breakdown, supporting partial-day absences, and adding an override field.

4. **Over-Engineering Offline-First Sync** — Only 3 users; OneDrive already syncs Excel. **Avoid by:** simple local-first architecture (SQLite is local), periodic polling with adaptive intervals, and last-write-wins semantics. Do NOT build CRDTs, WebRTC sync, or operational transforms.

5. **Epic Forecasting Presented as Certainty** — Deterministic math produces a single date that ignores variance. **Avoid by:** always showing ranges or confidence intervals (e.g., "50% confidence: Aug 1–15"), using Monte Carlo or best/expected/worst-case scenarios, and updating forecasts automatically when scope changes.

6. **Building MCP Server on Unstable Data Model** — Early schema volatility breaks AI agent contracts. **Avoid by:** deferring MCP to Phase 5, defining a stable MCP-facing schema projection, versioning tools (`_v1`, `_v2`), and exposing read-only tools first.

7. **Assuming File System Access API Works in Corporate Environment** — Group policy may disable it; older Edge versions lack support. **Avoid by:** the Bun-server architecture using chokidar on the local file system avoids this entirely. If any browser file picking is used, provide drag-and-drop fallback.

8. **Board UX Slower Than a Spreadsheet** — Power users will abandon the board if it's slower than Excel. **Avoid by:** optimizing for keyboard navigation, inline editing, bulk operations, and <100ms render time for the expected backlog size.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Data Ingestion
**Rationale:** Every downstream feature depends on reliable data ingestion. The Excel/OneDrive sync is the most fragile integration and must be hardened first. Also resolves the architecture conflict by establishing the Bun-compiled executable scaffold.
**Delivers:** Single executable scaffold, `bun:sqlite` schema, repository layer, Excel parsing via SheetJS, chokidar file watching, content-hash-based change detection, manual import fallback, initial backlog and team member data models.
**Uses:** Bun, `bun:sqlite`, chokidar, SheetJS, Zod
**Implements:** Data Layer, File Sync Layer, Domain Logic (basic entities)
**Addresses (FEATURES.md):** Backlog Management (initial), Team Member Management (initial), Excel/OneDrive Sync
**Avoids (PITFALLS.md):** Pitfall 1 (Excel as DB), Pitfall 7 (FS Access API failure — using chokidar instead), Pitfall 10 (OneDrive sync detection — adaptive polling + hashing)

### Phase 2: Capacity Engine & Squad Management
**Rationale:** The realistic capacity calculation is the #1 differentiator and the core value proposition. It must be validated against real team data before any forecasting or sprint planning builds on top of it.
**Delivers:** Team member CRUD, absence/holiday tracking, realistic capacity calculation engine with transparent breakdown, partial-day absence support, manual override field, per-squad waste configuration (simple percentage for v1).
**Uses:** date-fns for date math
**Implements:** Capacity Engine, expanded Domain Logic
**Addresses (FEATURES.md):** Team Member Management, Absence/Holiday Tracking, Realistic Capacity Calculation, Waste/Overhead Tracking (basic)
**Avoids (PITFALLS.md):** Pitfall 3 (capacity formulas vs. reality), Pitfall 9 (static waste percentage — track actual vs. planned)

### Phase 3: Sprint Planning & Board
**Rationale:** Table stakes for daily Scrum practice. The board must feel faster than Excel or users will bypass it. Depends on capacity engine from Phase 2.
**Delivers:** Sprint creation with start/end dates, story point estimation (Fibonacci), sprint board (Kanban: To Do / In Progress / Done), drag-and-drop and keyboard-driven navigation, inline editing, bulk operations, basic burndown chart.
**Uses:** TanStack React Table, shadcn/ui components, Zustand for client state
**Implements:** UI Layer (views and components), Sprint Engine
**Addresses (FEATURES.md):** Sprint Planning & Time-boxing, Story Point Estimation, Sprint Board, Basic Burndown Chart
**Avoids (PITFALLS.md):** Pitfall 8 (board slower than spreadsheet — benchmark against Excel)

### Phase 4: Forecasting & Velocity
**Rationale:** Builds on completed sprints from Phase 3. Must present uncertainty, not false certainty. Epic forecasting is critical for the portfolio manager stakeholder.
**Delivers:** Velocity tracking (rolling average), epic delivery forecasting with confidence intervals / ranges, work item hierarchy visualization, scope-change-aware forecast updates.
**Implements:** Velocity Tracker, Epic Forecaster
**Addresses (FEATURES.md):** Velocity Tracking, Epic Delivery Forecasting, Work Item Hierarchy, Dual Estimation (Points + Days)
**Avoids (PITFALLS.md):** Pitfall 5 (forecasting as certainty — ranges/Monte Carlo)

### Phase 5: MCP Server & AI Integration
**Rationale:** Defer until data model is stable to avoid breaking AI agent contracts. The MCP server reuses domain logic and repositories from previous phases.
**Delivers:** MCP server running in `--mcp` mode, stable tool schema projection, read-only tools first (`query_capacity`, `list_sprints`, `get_backlog`), resources (`sprint://current`, `epic://{id}`), validated input schemas via Zod.
**Uses:** `@modelcontextprotocol/sdk`, Zod 3.x
**Implements:** MCP Server layer
**Addresses (FEATURES.md):** MCP Server, AI Agent Integration
**Avoids (PITFALLS.md):** Pitfall 6 (MCP on unstable model — schema freeze for 2 weeks before build)

### Phase 6: Polish & Advanced Differentiators
**Rationale:** Add value-adding features once core is solid and validated. These are "should haves" that improve the daily experience.
**Delivers:** Sprint story suggestions based on remaining capacity, waste/overhead trend visualization, offline resilience improvements (adaptive polling, sync status indicators), JSON data export/backup, UI polish.
**Implements:** Enhanced UI, Dashboards/Insights
**Addresses (FEATURES.md):** Sprint Story Suggestions, Waste/Overhead Tracking (advanced), Offline-First Support (enhancements)
**Avoids (PITFALLS.md):** Pitfall 4 (over-engineering offline sync — keep it simple), Pitfall 2 (storage eviction — export/backup)

### Phase Ordering Rationale

- **Data before logic:** Phase 1 establishes the SQLite schema and repository pattern that everything else depends on.
- **Capacity before planning:** Phase 2 validates the core differentiator (realistic capacity) before building sprint planning (Phase 3) and forecasting (Phase 4) on top of potentially wrong formulas.
- **Sprints before forecasts:** Phase 3 produces the historical velocity data required by Phase 4's epic forecasting.
- **Stable model before MCP:** Phase 5 is deliberately last among functional phases because MCP tool contracts break when schemas change. The data model must be frozen.
- **Simplicity over sophistication:** Phases 1 and 2 explicitly avoid over-engineering (no CRDTs, no real-time sync, no complex offline protocols) that would delay delivering core value.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Medium — need to verify Bun full-stack compile with embedded React assets in the actual target environment (Windows corporate machine). Also need to confirm SheetJS CDN tarball works in corporate network or plan vendoring.
- **Phase 2:** Medium — capacity formula must be validated with the actual squad's process. This is domain-specific research, not library research.
- **Phase 4:** Medium — need to decide between simple linear projection vs. Monte Carlo simulation for epic forecasting. Monte Carlo is more accurate but more complex; research team tolerance for probabilistic outputs.
- **Phase 5:** Medium — MCP SDK v1.29.0 is relatively new; need to verify stdio vs. Streamable HTTP transport choice based on the AI clients the team actually uses (Claude Desktop, Cursor, VS Code).

Phases with standard patterns (skip research-phase):
- **Phase 3:** HIGH confidence — Kanban boards, drag-and-drop, and burndown charts are well-documented patterns. TanStack Table and React DnD are mature.
- **Phase 6:** HIGH confidence — suggestions and trend charts are standard UI/data viz problems.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies have official releases, verified compatibility matrices, and the Bun `--compile` approach is explicitly documented. SheetJS CDN tarball installation is verified. |
| Features | HIGH | Based on extensive market analysis of agile tools and direct project constraints from PROJECT.md. Feature priorities are clear and well-justified. |
| Architecture | MEDIUM-HIGH | The STACK.md architecture is correct and well-reasoned, but the ARCHITECTURE.md conflict (pure PWA vs. Bun executable) introduces uncertainty until the team commits to the Bun approach. Once resolved, patterns are standard. |
| Pitfalls | HIGH | Pitfalls are grounded in real-world browser storage limits, Excel file locking behavior, OneDrive conflict copy generation, and corporate browser policy restrictions. Most are known issues from personal experience and documented sources. |

**Overall confidence:** HIGH (pending resolution of the architecture conflict between STACK.md and ARCHITECTURE.md)

### Gaps to Address

- **Architecture conflict (CRITICAL):** The ARCHITECTURE.md researcher designed a pure browser PWA (IndexedDB, Service Worker, File System Access API) that is incompatible with the MCP server requirement. The STACK.md researcher solved this with a Bun-compiled executable + `bun:sqlite`. The team must explicitly adopt the STACK.md architecture and adapt ARCHITECTURE.md patterns (repository pattern, layer separation) to the Bun-server context. **Action:** During planning, lock the architecture decision and update any references to IndexedDB as canonical storage to `bun:sqlite`.
- **Capacity formula validation:** The realistic capacity calculation is domain-specific. Research cannot determine the exact formula the squad uses. **Action:** During Phase 2 planning, schedule a session with the Tech Lead to capture their current manual calculation and compare it to the app's output for 2-3 sprints.
- **MCP transport choice:** The MCP SDK supports stdio and HTTP/SSE. The choice depends on which AI clients the team uses. **Action:** During Phase 5 planning, verify whether Claude Desktop (stdio) or VS Code/Cursor (HTTP) is the primary target and select transport accordingly.
- **Corporate browser/network realities:** The "no installation" and "offline-first" constraints assume the executable runs on managed Windows machines. **Action:** During Phase 1, test the compiled `.exe` on the actual target corporate machine (managed Edge/Chrome, potential antivirus scanning, group policies).
- **Excel schema mapping:** The structure of the Excel files (sheet names, column headers, data types) is not yet known. **Action:** During Phase 1, obtain sample Excel files from the team to design the parser mapping.

## Sources

### Primary (HIGH confidence)
- [Bun v1.3.14 Release](https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14) — Single-file executable and full-stack compile support
- [Bun Docs: Single-file executable](https://bun.sh/docs/bundler/executables) — `--compile` API, cross-compilation, embedded assets
- [MCP Docs: Build a Server](https://modelcontextprotocol.io/docs/develop/build-server) — stdio/HTTP transport patterns
- [MCP TypeScript SDK v1.29.0 Release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/1.29.0) — Official SDK
- [SheetJS v0.20.3 Docs](https://docs.sheetjs.com/docs/getting-started/installation/frameworks) — CDN tarball installation
- [Smartsheet — 12 Best Agile Management Software Tools in 2026](https://www.smartsheet.com/content/best-agile-management-software) — Comprehensive feature comparison
- [Upskillist — 10 Best Agile Tools for Scrum Teams 2026](https://www.upskillist.com/blog/10-best-agile-tools-for-scrum-teams-2025/) — Detailed feature breakdowns
- [Wikipedia — Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development)) — Authoritative framework reference
- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — File System Access API limitations
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Browser storage eviction policies
- [web.dev: Persistent storage](https://web.dev/articles/persistent-storage) — Persistent storage request patterns
- PROJECT.md — Direct project constraints, decisions, and out-of-scope items

### Secondary (MEDIUM confidence)
- [Electric SQL: Developing local-first software](https://electric-sql.com/blog/2023/02/09/developing-local-first-software) — Local-first architecture trade-offs
- [Smashing Magazine: Progressive Web Apps](https://www.smashingmagazine.com/2016/08/a-beginners-guide-to-progressive-web-apps/) — Service worker patterns
- Personal experience / known issues — Excel file locking, OneDrive conflict copies, corporate browser policy restrictions

### Tertiary (LOW confidence)
- [RxDB: IndexedDB Max Storage Size Limit](https://rxdb.info/articles/indexeddb-max-storage-limit.html) — Browser-specific quota limits (less relevant if `bun:sqlite` is canonical, but useful for any client-side caching)

---
*Research completed: 2026-05-30*
*Ready for roadmap: yes (pending architecture conflict resolution)*
