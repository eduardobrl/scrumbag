# Architecture Research

**Domain:** Browser-based Scrum capacity planning with Excel integration and MCP server
**Researched:** 2026-05-30
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI LAYER (Browser)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Sprint Board│  │  Epic View   │  │ Team Mgmt   │  │ Capacity    │        │
│  │  (Kanban)   │  │ (Forecast)  │  │ (Members)   │  │ Calculator  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                  │
├─────────┴────────────────┴────────────────┴────────────────┴──────────────────┤
│                          APPLICATION LOGIC                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │    State    │  │  Capacity   │  │   Sprint    │  │   Sync      │          │
│  │   Manager   │  │   Engine    │  │   Engine    │  │  Coordinator│          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                │                    │
├─────────┴────────────────┴────────────────┴────────────────┴──────────────────┤
│                            DATA LAYER                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                        IndexedDB (Local DB)                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Members  │ │ Features │ │ Stories  │ │ Sprints  │ │  Absences│   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INTEGRATION LAYER                                  │
│  ┌─────────────────────────┐      ┌──────────────────────────────────────┐  │
│  │   File Sync Engine      │      │         MCP Server (HTTP)            │  │
│  │ ┌──────────┐┌─────────┐ │      │  ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
│  │ │FileSystem││ SheetJS │ │      │  │  Tools  │ │Resources│ │ Prompts│ │  │
│  │ │  Access  │ │ Parser │ │      │  └─────────┘ └─────────┘ └────────┘ │  │
│  │ └──────────┘└─────────┘ │      │         ↑ JSON-RPC 2.0 ↓              │  │
│  └─────────────────────────┘      └──────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                          PLATFORM LAYER                                      │
│  ┌─────────────────────────┐      ┌──────────────────────────────────────┐  │
│  │    Service Worker         │      │     File System Access API           │  │
│  │  (Cache + Offline)        │      │  (OneDrive Folder Access)            │  │
│  └─────────────────────────┘      └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|----------------------|
| **UI Layer** | Render views, handle user interactions, display Kanban boards, capacity charts, sprint forecasts | Vanilla JS with modular components or lightweight framework |
| **State Manager** | Central reactive state for app data, coordinate between UI and data layer | Event-driven or Proxy-based reactive store |
| **Capacity Engine** | Calculate real capacity from squad size, absences, waste percentages, story points-to-days conversion | Pure JS business logic, deterministic calculations |
| **Sprint Engine** | Manage sprint lifecycle, assign stories to sprints based on capacity, track velocity | JS module with sprint state machine |
| **Sync Coordinator** | Orchestrate file watching, detect changes, trigger re-parsing, update IndexedDB | Async coordinator with debounced sync |
| **IndexedDB Store** | Persistent structured storage for all app entities, offline query support | IndexedDB API with wrapper (e.g., Dexie.js or idb) |
| **File Sync Engine** | Read Excel files from local OneDrive folder via File System Access API | `showDirectoryPicker` + file handles + `FileSystemObserver` |
| **SheetJS Parser** | Parse `.xlsx` files into structured JSON for consumption by the app | `xlsx.js` library, read as ArrayBuffer |
| **MCP Server** | Expose app data and planning tools to AI agents via HTTP transport | Custom HTTP endpoint handling JSON-RPC 2.0 |

## Recommended Project Structure

```
scrumbag/
├── index.html                    # Main PWA shell
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker (offline cache)
├── src/
│   ├── main.js                   # App bootstrap, service worker registration
│   ├── config/
│   │   └── app-config.js         # Waste tolerances, defaults, capacities
│   ├── ui/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── kanban-board.js
│   │   │   ├── sprint-card.js
│   │   │   ├── capacity-chart.js
│   │   │   └── member-avatar.js
│   │   ├── views/                # Page-level views
│   │   │   ├── board-view.js
│   │   │   ├── capacity-view.js
│   │   │   ├── epics-view.js
│   │   │   └── team-view.js
│   │   └── router.js             # Simple client-side router
│   ├── state/
│   │   ├── store.js              # Central reactive store
│   │   └── selectors.js          # Derived state selectors
│   ├── domain/
│   │   ├── capacity-calculator.js
│   │   ├── sprint-planner.js
│   │   ├── velocity-tracker.js
│   │   └── epic-forecaster.js
│   ├── data/
│   │   ├── db.js                 # IndexedDB initialization & schema
│   │   ├── repositories/         # Data access per entity
│   │   │   ├── member-repo.js
│   │   │   ├── story-repo.js
│   │   │   ├── sprint-repo.js
│   │   │   └── epic-repo.js
│   │   └── migrations/           # DB version migrations
│   ├── sync/
│   │   ├── file-watcher.js       # FileSystemAccessAPI / observer
│   │   ├── excel-parser.js       # SheetJS wrapper
│   │   ├── sync-engine.js        # Orchestrate file → DB sync
│   │   └── change-detector.js    # File hash/timestamp comparison
│   └── mcp/
│       ├── server.js             # HTTP server setup (Streamable HTTP)
│       ├── protocol.js             # JSON-RPC 2.0 message handling
│       ├── tools/                  # MCP tool implementations
│       │   ├── query-tools.js
│       │   └── planning-tools.js
│       └── resources/              # MCP resource implementations
│           └── data-resources.js
├── assets/
│   ├── icons/
│   └── styles/
└── lib/
    └── xlsx.full.min.js          # SheetJS (or via CDN)
```

### Structure Rationale

- **`ui/`:** Separates presentational concerns from business logic. Components are framework-agnostic web components or plain JS modules.
- **`domain/`:** Pure business logic with no side effects. Easy to unit test and can be reused by the MCP server.
- **`data/`:** Repository pattern abstracts IndexedDB complexity. Enables swapping storage backends without touching domain logic.
- **`sync/`:** Encapsulates the fragile file-system integration. One place to handle File System Access API quirks, permissions, and Excel parsing.
- **`mcp/`:** Isolated server layer. Since MCP uses JSON-RPC over HTTP, it lives alongside the main app but operates independently.

## Architectural Patterns

### Pattern 1: Offline-First PWA with Service Worker

**What:** Cache app shell and assets via Service Worker; use IndexedDB for data. App works without network. Background sync handles updates when connectivity returns.

**When to use:** Corporate environments with intermittent connectivity, no-install requirement.

**Trade-offs:**
- **Pros:** Works offline, feels like native app, no installation required.
- **Cons:** File System Access API still requires user interaction (directory picker). Initial load slightly heavier.

**Example:**
```javascript
// sw.js — Cache-first for assets, fall-through for data API
const CACHE_NAME = 'scrumbag-v1';
const ASSETS = ['/', '/index.html', '/src/main.js', '/assets/styles.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

### Pattern 2: Repository Pattern over IndexedDB

**What:** Abstract IndexedDB CRUD operations behind repository classes. Domain code never touches raw IDB.

**When to use:** Any non-trivial IndexedDB usage. Makes testing, migration, and debugging easier.

**Trade-offs:**
- **Pros:** Clean API, easy to mock, centralized schema changes.
- **Cons:** Thin abstraction overhead.

**Example:**
```typescript
class StoryRepository {
  async getBySprint(sprintId: string): Promise<Story[]> {
    return db.stories.where('sprintId').equals(sprintId).toArray();
  }
  async upsert(story: Story): Promise<void> {
    return db.stories.put(story);
  }
}
```

### Pattern 3: File-to-Database Sync with Change Detection

**What:** User grants persistent access to OneDrive folder. App stores file handles, reads Excel files via SheetJS, hashes content, and only re-syncs changed files.

**When to use:** External file is source of truth, app needs to stay in sync without manual import.

**Trade-offs:**
- **Pros:** Seamless sync, respects external Excel workflows.
- **Cons:** File System Access API requires user permission and may be revoked. Not available in all corporate browsers (Firefox does not support it fully).

**Example:**
```javascript
async function syncExcelFolder(dirHandle) {
  for await (const entry of dirHandle.values()) {
    if (entry.name.endsWith('.xlsx')) {
      const file = await entry.getFile();
      const hash = await hashFile(file);
      if (hash !== await db.getStoredHash(entry.name)) {
        const data = await parseExcel(file);
        await db.upsertSheetData(entry.name, data);
        await db.storeHash(entry.name, hash);
      }
    }
  }
}
```

### Pattern 4: MCP Server as Co-located HTTP Endpoint

**What:** Run an HTTP endpoint (via a small local server or Service Worker interception) that speaks MCP JSON-RPC. Exposes tools like `calculate_capacity`, `list_sprints`, and resources like `sprint://current`.

**When to use:** Need AI agents to query app state without duplicating logic.

**Trade-offs:**
- **Pros:** Single source of truth, AI can reason over live data.
- **Cons:** HTTP server must run locally; requires Streamable HTTP transport implementation.

**Example:**
```javascript
// MCP Tool exposed via HTTP
const tools = {
  calculate_capacity: async ({ sprintId }) => {
    const sprint = await sprintRepo.get(sprintId);
    const capacity = capacityEngine.compute(sprint);
    return { content: [{ type: 'text', text: JSON.stringify(capacity) }] };
  }
};
```

## Data Flow

### User Action Flow

```
[User opens app]
     ↓
[Service Worker] → serves cached shell (instant load)
     ↓
[Store initializes] → loads data from IndexedDB
     ↓
[UI renders] from reactive store state
     ↓
[User picks OneDrive folder] → FileSystemDirectoryHandle stored in IndexedDB
     ↓
[File Watcher] detects Excel changes
     ↓
[Excel Parser (SheetJS)] converts .xlsx → JSON
     ↓
[Sync Engine] merges into IndexedDB (upsert, not overwrite blindly)
     ↓
[Store notifies] → UI re-renders with new data
```

### MCP Request Flow

```
[AI Client] → HTTP POST /mcp (JSON-RPC)
     ↓
[MCP Server] → routes to tool/resource handler
     ↓
[Domain Logic] queries repositories (same code as UI)
     ↓
[IndexedDB] returns data
     ↓
[Domain Logic] formats result
     ↓
[MCP Server] → JSON-RPC response → AI Client
```

### Key Data Flows

1. **Excel Sync Flow:** OneDrive folder → File System Access API → ArrayBuffer → SheetJS → JSON objects → IndexedDB upsert → Store update → UI re-render.
2. **Capacity Calculation Flow:** Sprint selection → fetch members, absences, stories → Capacity Engine → compute available person-days → subtract waste % → suggest stories that fit.
3. **Epic Forecast Flow:** Epic selected → fetch all linked stories → sum remaining estimates → divide by average velocity → project completion sprint/date.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–10 users (current) | Single-origin PWA, local IndexedDB, no backend. File System Access API handles all data ingress. |
| 10–100 users | Consider splitting MCP server into separate lightweight process (Node/Bun). File sync remains per-client. |
| 100+ users | Would need a real backend with multi-user sync. Out of scope per PROJECT.md constraints. |

### Scaling Priorities

1. **First bottleneck:** IndexedDB single-threaded writes during bulk Excel sync. **Fix:** Batch transactions, use Web Worker for parsing.
2. **Second bottleneck:** File System Access API permission revocation. **Fix:** Graceful degradation to manual file import UI.

## Anti-Patterns

### Anti-Pattern 1: Treating Excel as the Database

**What people do:** Read Excel directly in UI components, use it as live queryable storage.

**Why it's wrong:** File I/O is async, slow, and requires user permission every session if not persisted. Prevents offline operation.

**Do this instead:** Treat Excel as an import/sync source. IndexedDB is the canonical app store. Sync on file change or manual refresh.

### Anti-Pattern 2: Monolithic State without Boundaries

**What people do:** One giant global state object with everything mixed together.

**Why it's wrong:** Capacity calculation logic leaks into UI code. MCP server has to duplicate queries or import UI modules.

**Do this instead:** Strict separation: `ui/` imports `state/`; `state/` imports `domain/` and `data/`; `mcp/` only imports `domain/` and `data/`.

### Anti-Pattern 3: Service Worker Over-Caching

**What people do:** Cache everything with a stale-while-revalidate strategy, including API calls.

**Why it's wrong:** App data (IndexedDB sync results, MCP calls) must not be cached by Service Worker. Only static assets belong in Cache API.

**Do this instead:** Use `Cache` API only for shell assets. Use IndexedDB for dynamic data. In SW `fetch` handler, explicitly bypass cache for `/mcp` and `/sync` routes.

### Anti-Pattern 4: MCP Server as Separate Codebase

**What people do:** Build MCP server in Python/Node separately, duplicating domain logic.

**Why it's wrong:** Capacity calculations, sprint rules, and epic forecasting logic diverges between app and MCP server.

**Do this instead:** Co-locate MCP server in the same project, reusing `domain/` and `data/` modules. MCP is an interface layer, not a product.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OneDrive (local sync)** | File System Access API (`showDirectoryPicker`) | User must grant persistent directory access. Handle revocation gracefully. |
| **Excel (.xlsx)** | SheetJS `XLSX.read()` from `ArrayBuffer` | Runs entirely in browser. No server needed. |
| **AI Agents (Claude, etc.)** | MCP Streamable HTTP transport on `localhost` | Server binds to `127.0.0.1` only per MCP security guidelines. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **UI ↔ State** | Events / reactive subscriptions | UI dispatches actions; store notifies subscribers. |
| **State ↔ Domain** | Direct function calls | Pure domain logic, no side effects. |
| **State ↔ Sync Engine** | Async events | Sync engine emits events on completion; state reconciles. |
| **MCP Server ↔ Data** | Repository calls (same as UI) | Shared repositories prevent duplication. |
| **MCP Server ↔ Domain** | Direct function calls | Reuses `capacity-calculator.js`, `sprint-planner.js`, etc. |

## Build Order Implications

Based on component dependencies, the recommended build sequence is:

1. **Data Layer (`data/db.js`, `data/repositories/`)**
   - Foundational for everything else. Define IndexedDB schema for members, features, stories, sprints, absences, epics.
   - *Blocks:* Domain logic, UI, MCP server.

2. **Domain Logic (`domain/`)**
   - Capacity calculator, sprint planner, epic forecaster. Pure JS, testable in isolation.
   - *Depends on:* Data layer (for read/write).
   - *Blocks:* UI views, MCP tools.

3. **File Sync Layer (`sync/`)**
   - Excel parsing and file watching. Can be developed in parallel with domain logic but needs data layer for persistence.
   - *Depends on:* Data layer.
   - *Blocks:* Capacity calculation from Excel-derived data.

4. **State Management (`state/`)**
   - Reactive store wiring domain and data to UI.
   - *Depends on:* Data layer, domain logic.
   - *Blocks:* UI components.

5. **UI Layer (`ui/`)**
   - Views and components. Most visible, but last to build because it depends on all other layers.
   - *Depends on:* State, domain logic.

6. **MCP Server (`mcp/`)**
   - Exposes tools and resources. Built last because it surfaces functionality from all previous layers.
   - *Depends on:* Domain logic, data layer.
   - *Does not block:* Any other layer.

7. **Service Worker & PWA Shell**
   - Caching strategy, offline fallback. Final polish.
   - *Depends on:* Nothing functionally, but must know asset list to cache.

## Sources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) — PWA architecture, Service Worker, offline patterns
- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — File System Access API, `showDirectoryPicker`, `FileSystemObserver`
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — Client-side structured storage
- [MDN: Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) — Service Worker asset caching
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) — Lifecycle, fetch interception, offline strategies
- [SheetJS Documentation](https://docs.sheetjs.com/) — Browser-based Excel parsing
- [Model Context Protocol: Architecture](https://modelcontextprotocol.io/docs/concepts/architecture) — MCP host/client/server concepts, primitives
- [Model Context Protocol: Transports](https://modelcontextprotocol.io/docs/concepts/transports) — stdio vs Streamable HTTP transport details
- [Model Context Protocol: Specification](https://modelcontextprotocol.io/specification/latest) — JSON-RPC 2.0 protocol definition

---
*Architecture research for: Scrum capacity planning web app (Scrumbag)*
*Researched: 2026-05-30*
