# Pitfalls Research

**Domain:** Browser-based Scrum capacity planning & sprint management (offline-first, Excel/OneDrive data source, MCP server)
**Researched:** 2026-05-30
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Treating Excel/OneDrive as a Live Database

**What goes wrong:**
The app reads Excel files from a OneDrive-synced folder as its primary data source. Teams often assume this behaves like an API or database — it does not. Files can be locked by Excel while being edited, sync can produce conflict copies (`Filename (1).xlsx`), timestamps are unreliable for change detection, and partial writes can corrupt reads. The app crashes, shows stale data, or silently imports garbage.

**Why it happens:**
OneDrive sync is not transactional. Excel holds file locks. Developers treat `lastModified` timestamps as change signals, but OneDrive may touch files without content changes. Concurrent edits by the 3 users (or by Excel auto-save) create race conditions that web apps are not built to handle.

**How to avoid:**
- Use **content hashing** (SHA-256 of file contents) to detect actual changes, not timestamps.
- Implement **file-lock detection**: skip files that are open/locked by another process; retry with backoff.
- Watch for **OneDrive conflict filenames** (` (1)`, ` - Copy`) and surface them to the user.
- Import Excel data into a proper **local cache** (IndexedDB/OPFS) immediately; never query Excel directly on every interaction.
- Provide a **manual "Re-import" button** as a fallback when auto-detection fails.
- Use a library like **SheetJS (xlsx)** with defensive parsing: set `cellDates: true`, `raw: true`, and validate headers before processing rows.

**Warning signs:**
- App shows data that doesn't match what's currently in Excel.
- "Failed to read file" errors appearing intermittently.
- Duplicate entries appearing after a user edits a file.
- OneDrive folder shows `Filename (1).xlsx` conflict copies.

**Phase to address:**
Phase 1 (Excel sync & data import). This must be solved before any other feature is built, because every downstream feature depends on reliable data ingestion.

---

### Pitfall 2: Browser Storage Eviction Destroys Local State

**What goes wrong:**
The app stores sprint data, backlog, and capacity calculations in IndexedDB or OPFS for offline use. In corporate environments with Safari or managed Chrome profiles, the browser evicts origin data aggressively — sometimes within 7 days of no use (Safari's cross-site tracking prevention). Users open the app and all their locally entered data (stories, absences, sprint plans) is gone.

**Why it happens:**
Browser storage is **best-effort by default**, not permanent. Safari proactively deletes script-created data for origins with no user interaction in 7 days. Corporate policies may restrict storage further. IndexedDB/OPFS is cleared all at once when evicted — there's no partial deletion.

**How to avoid:**
- Call `navigator.storage.persist()` after a meaningful user gesture (e.g., after first import or first save), but **do not** ask on page load — users will deny confusing prompts.
- Export a **recoverable backup** to a user-visible file (e.g., JSON export to Downloads) after significant changes.
- Provide an **"Export my data"** button that creates a portable backup.
- Monitor storage with `navigator.storage.estimate()` and warn users when approaching quotas.
- Treat the Excel files in OneDrive as the **source of truth for import**, but the app's local state (entered stories, capacity configs) must have an export/backup path because it lives only in the browser.

**Warning signs:**
- Users report "all my stories disappeared" after not using the app for a week.
- `QuotaExceededError` in logs.
- App works fine on Chrome but loses data on Safari.

**Phase to address:**
Phase 2 (Offline storage & squad management). Build persistence request and backup export as core requirements of the storage layer, not as afterthoughts.

---

### Pitfall 3: Capacity Formulas That Look Right But Match No One's Reality

**What goes wrong:**
The app calculates "real capacity" by subtracting absences and "waste" from total working days. But if the formulas don't match how the team actually accounts for time — e.g., counting partial absences as full days, double-counting holidays, or ignoring that "waste" varies by sprint — the numbers become theater. Users stop trusting the tool and revert to gut-feel planning.

**Why it happens:**
Capacity planning is domain-specific. Developers implement textbook formulas (capacity = days × people − absences − overhead%) without validating against the squad's actual process. The PM and Tech Lead have implicit rules (e.g., "we don't count the Friday before a long weekend") that aren't captured.

**How to avoid:**
- Start with **manual entry of capacity** and compare to the app's calculation for 2-3 sprints before automating.
- Expose the **calculation breakdown** transparently in the UI: "Capacity = 10 days × 5 people = 50 days. Minus 3 days PTO (Ana) = 47. Minus 15% overhead = 40.95 → 41 days."
- Allow **per-squad configuration** of waste categories and percentages; don't hardcode industry averages.
- Support **partial-day absences** (e.g., half-day medical appointment) from day one.
- Add a **"Override calculated capacity"** field so the Tech Lead can adjust when reality diverges from the formula.

**Warning signs:**
- Users consistently ignore the suggested capacity number.
- Feedback: "this says we have 41 days but we know we only have about 30."
- Team maintains a separate spreadsheet "to check the app's math."

**Phase to address:**
Phase 2 (Capacity calculation). The calculation engine must be validated against real sprint data before Phase 4 (forecasting) builds on top of it.

---

### Pitfall 4: Over-Engineering Offline-First Sync

**What goes wrong:**
The project has an offline-first constraint and 3 users. Developers build a complex CRDT-based sync system, real-time collaboration, or conflict resolution engine. This adds months of work, introduces bugs, and is completely unnecessary for 3 co-located users who already coordinate via chat.

**Why it happens:**
"Offline-first" is interpreted as "Google Docs-style real-time sync." But the requirement is only that the app works during intermittent connectivity — not that multiple users edit simultaneously and merge changes. OneDrive already handles file sync; the app doesn't need to reinvent it.

**How to avoid:**
- Use a **simple local-first architecture**: app reads/writes to local IndexedDB/OPFS, periodically imports/exports Excel, and treats the browser as the runtime environment.
- For multi-user: since only 3 people use it and OneDrive syncs Excel, **serialize writes through the Excel file** rather than building a sync protocol.
- If a user needs to edit while offline, queue changes locally and apply on next Excel re-import, with **last-write-wins** semantics (acceptable for 3 trusted users).
- Do NOT implement operational transforms, CRDTs, or WebRTC sync unless explicitly required later.

**Warning signs:**
- Sprint 3 is still "building the sync layer" with no working capacity calculator.
- Team debates CRDT libraries instead of story estimation UX.
- App has a "sync status indicator" that nobody asked for.

**Phase to address:**
Phase 1 (Architecture decision). Lock the simplicity of the offline strategy before any implementation starts.

---

### Pitfall 5: Epic Forecasting Presented as Certainty

**What goes wrong:**
The app forecasts epic delivery dates based on capacity and story estimates. It shows a single date: "Epic X will be done by July 15." The team misses the date, stakeholders are disappointed, and the tool is blamed. In reality, forecasting is probabilistic; presenting a single date is a lie.

**Why it happens:**
 deterministic math (sum of story points ÷ velocity = weeks) produces a single number. Developers display it directly. But velocity varies, scope creeps, and unplanned work happens. A single-date forecast ignores variance entirely.

**How to avoid:**
- Always present **ranges or confidence intervals**: "With 50% confidence: Aug 1–15. With 90% confidence: Aug 1–Sep 1."
- Use **Monte Carlo simulation** if possible (even a simple 100-run simulation with velocity variance), or at minimum show best-case / expected / worst-case.
- Update forecasts **automatically when scope changes** — never show a stale forecast.
- Label clearly: "Based on current backlog and average velocity of last 3 sprints."
- Allow exclusion of uncertain stories from forecast with a toggle.

**Warning signs:**
- Stakeholders quote the app date in meetings as a commitment.
- Users say "the app said we'd finish by June and we didn't."
- Forecast date doesn't change when new stories are added to the epic.

**Phase to address:**
Phase 4 (Epic forecasting). The forecasting UI must be designed to communicate uncertainty, not just compute a date.

---

### Pitfall 6: Building the MCP Server on an Unstable Data Model

**What goes wrong:**
An MCP server is built early to let AI agents query sprint data. The underlying data model changes frequently in early phases (new fields, renamed entities, schema migrations). MCP tools break, AI agents return wrong answers, and users lose trust in the AI integration.

**Why it happens:**
MCP servers expose the internal data model directly via `resources` and `tools`. In a greenfield project, the schema is volatile for the first 2-3 phases. Every refactoring breaks the MCP contract.

**How to avoid:**
- Defer the MCP server to **Phase 5**, after the core data model (squad, capacity, stories, sprints) has stabilized.
- If built earlier, define a **stable MCP-facing schema** (a projection/decoupled DTO layer) rather than exposing internal IDs and fields directly.
- Version MCP tools (`get_sprint_v1`) so schema changes don't break existing clients.
- Provide **read-only tools first**; never expose write operations until the data model is frozen.
- Document the MCP schema as a public API with deprecation policies.

**Warning signs:**
- AI agent returns "sprint not found" after a data model refactor.
- MCP server code has `// TODO: update this when schema changes` comments.
- AI answers reference fields that no longer exist.

**Phase to address:**
Phase 5 (MCP server). Must come after Phase 3 when the core domain model is stable.

---

### Pitfall 7: Assuming File System Access API Works in the Corporate Environment

**What goes wrong:**
The app uses the File System Access API (`showDirectoryPicker`) to let users select the OneDrive folder. In the corporate environment, this API may be disabled by group policy, the browser may not support it (older Edge versions), or the user may not have permission to access the synced folder location. The app simply doesn't work on first run.

**Why it happens:**
File System Access API requires user-initiated picker interaction and **readwrite permissions** that persist across sessions. Corporate environments often disable file system access for web apps via GPO/Intune. The OneDrive folder may be in a protected location.

**How to avoid:**
- Provide a **fallback drag-and-drop or `<input type="file">` flow** for importing Excel files when File System Access API is unavailable or denied.
- Cache imported data aggressively so the app remains usable even if folder access is lost later.
- Do not require `showDirectoryPicker` on first load; allow users to **manually upload files** and optionally "Link folder" later.
- Test in the actual corporate browser configuration (likely managed Edge/Chrome) before assuming the API works.

**Warning signs:**
- "The app says I need to give permission but nothing happens."
- App works on developer's machine but not on the PM's laptop.
- Console shows `NotAllowedError: The request is not allowed by the user agent or the platform in the current context.`

**Phase to address:**
Phase 1 (Data import). The import flow must degrade gracefully and not depend solely on File System Access API.

---

### Pitfall 8: Board UX That Requires More Clicks Than a Spreadsheet

**What goes wrong:**
The sprint board (Kanban/Scrum board) is built with modern UI patterns — drag-and-drop, modals, animated transitions — but ends up slower to update than the Excel spreadsheet it replaces. Users abandon the board and edit stories directly in Excel, defeating the purpose of the app.

**Why it happens:**
Browser-based tools often optimize for visual polish over interaction speed. For a tool used by a Tech Lead and PM daily, **speed of update** matters more than aesthetics. Every extra click, loading state, or animation is friction.

**How to avoid:**
- Optimize for **keyboard-driven updates**: type to search, Enter to edit, arrow keys to navigate columns.
- Support **bulk operations**: move multiple stories between columns, edit estimates for multiple items at once.
- Make the board **immediately editable inline**; avoid modal dialogs for common actions.
- Ensure the board renders in **<100ms** for the expected backlog size (<200 stories).
- Measure: time-to-update a story status should be faster than finding the row in Excel and changing a cell.

**Warning signs:**
- Users edit Excel directly and only open the app to "see the forecast."
- Feedback: "it's pretty but it's slower than my spreadsheet."
- Board has loading spinners on every column change.

**Phase to address:**
Phase 3 (Sprint board). UX must be benchmarked against Excel speed during development.

---

### Pitfall 9: Ignoring That "Waste" Is Not a Constant

**What goes wrong:**
The app allows configuring a "waste percentage" (e.g., 20% for meetings, support, incidents). Teams set it once and forget it. But waste varies dramatically by sprint — one sprint has a production incident eating 30%, another is quiet at 10%. Using a static average makes capacity planning no better than a guess.

**Why it happens:**
Developers model waste as a single configurable percentage because it's easy to implement. But the real world doesn't work that way. The tool becomes a "set it and forget it" configuration that drifts from reality.

**How to avoid:**
- Track **actual waste per sprint** by category (meetings, support, incidents, unplanned work) and compare to planned waste.
- Show a **trend chart** of planned vs. actual waste over the last 6 sprints.
- Suggest waste adjustments based on historical averages, but let the user override per sprint.
- Allow marking specific stories as "unplanned" after sprint start and automatically recalculate capacity consumed.

**Warning signs:**
- Waste percentage hasn't been changed in 6 months but team says "this sprint was totally different."
- Actual completed work is consistently 15-20% off from planned capacity.
- Users mentally subtract their own "fudge factor" on top of the app's number.

**Phase to address:**
Phase 2 (Capacity calculation) for tracking; Phase 4 (Dashboards/insights) for trend visualization.

---

### Pitfall 10: OneDrive Sync Detection That Misses Changes or Polls Excessively

**What goes wrong:**
The app sets up a `setInterval` loop to poll the OneDrive folder every few seconds, or uses the File System Observer API (limited support) to watch for changes. Polling drains laptop battery, triggers antivirus scans, and still misses changes that happen while the app is closed. Alternatively, relying solely on File System Observer means changes are missed in browsers without support.

**Why it happens:**
There's no reliable, cross-browser, low-latency way for a web app to watch a folder for changes. File System Observer is Chrome-only and experimental. Polling is the fallback, but naive implementation causes performance issues.

**How to avoid:**
- Use **adaptive polling**: poll every 30 seconds when the app is active, every 5 minutes when backgrounded, and force-check on window focus.
- Store the last known file hash; only re-parse when hash changes.
- Provide a **"Sync now" button** for immediate refresh.
- Accept that the app will not have real-time sync. Design UX around **manual refresh + periodic auto-check**, not push notifications.
- If File System Observer is available, use it as an optimization but never as the only mechanism.

**Warning signs:**
- Laptop fans spin up when the app is open.
- Antivirus flags the app for excessive file access.
- User edits Excel, saves, and the app doesn't reflect changes for minutes.

**Phase to address:**
Phase 1 (Excel sync). The sync strategy must balance responsiveness with resource usage.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems specific to this domain.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Parse Excel directly in UI thread | No Web Worker setup | UI freezes on large files (>1000 rows); Chrome may kill the tab | Never — use a Web Worker for parsing |
| Store all state in a single giant JSON blob in IndexedDB | Simple to implement | Impossible to query partial data; slow updates; merge conflicts on concurrent writes | Only in prototype, migrate before Phase 2 |
| Hardcode 3 users and skip auth | Faster to ship | Adding a 4th user requires a rewrite; no audit trail of who changed what | MVP only; add configurable user list before Phase 3 |
| Use `lastModified` timestamp for change detection | Easy to implement | Misses content-equal file touches; false positives on OneDrive metadata sync | Never — always use content hashing |
| Render the entire backlog in DOM | Simple list component | Board becomes unusable at >100 stories; jank on scroll | Never — implement virtualization or pagination |
| Single-date epic forecast | Easy math, clear UI | Users treat it as a commitment; loss of trust when missed | Never — always show ranges or confidence intervals |

## Integration Gotchas

Common mistakes when connecting to external services and browser APIs.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **OneDrive sync folder** | Assuming folder path is always `~/OneDrive/...` | Let user pick folder via picker; store handle in IndexedDB; fallback to drag-and-drop |
| **Excel parsing (SheetJS)** | Parsing as strings, losing dates/numbers | Use `cellDates: true`, `raw: true`; validate column headers; reject files with unexpected sheets |
| **File System Access API** | Requesting persistent directory handle on first load without user gesture | Trigger picker after explicit "Link folder" button click; handle `AbortError` gracefully |
| **IndexedDB** | Opening DB without version migration plan | Start at version 1; use `onupgradeneeded` to migrate; never delete object stores in upgrade |
| **MCP Server** | Exposing internal DB schema directly | Build a stable projection layer; version tools; read-only first; validate tool inputs strictly |
| **Service Worker (offline)** | Aggressive caching of static assets only | Cache app shell + implement IndexedDB for dynamic data; show offline indicator; don't cache Excel files |

## Performance Traps

Patterns that work at small scale but fail as data grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Rendering entire backlog in DOM** | Scroll jank, slow paint, browser freeze on drag | Virtualized list (e.g., `react-window`) or pagination | >50 items visible at once |
| **Synchronous Excel parsing on main thread** | UI freezes for 2-10 seconds; "Page unresponsive" warning | Offload to Web Worker; stream large files | >500 rows or >5 sheets |
| **Recalculating capacity on every render** | Board stutters when dragging cards; slow typing in estimate fields | Memoize capacity with `useMemo`/selectors; recalculate only when inputs change | >20 squad members or >100 stories |
| **Storing file handles without IndexedDB backup** | App loses folder access on browser restart; user must re-pick | Serialize handles to IndexedDB; restore on load; fallback to manual re-select | Every browser restart (handles are session-scoped in some cases) |
| **Loading all historical sprints into memory** | App startup slows over time; memory usage grows unbounded | Lazy-load past sprints; keep only current + next 2 sprints in memory | >12 sprints of history |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **MCP server exposes raw file paths** | AI agent leaks local file system structure (e.g., `C:\Users\Name\OneDrive\...`) | Sanitize paths in MCP responses; return relative IDs, not absolute paths |
| **MCP tools allow unfiltered SQL/JSON queries** | Prompt injection allows AI to exfiltrate or corrupt local data | Strictly define allowed tools with validated parameters; never expose generic query endpoints |
| **Storing Excel files in OPFS without encryption** | Sensitive sprint data (names, PTO, project names) sits unencrypted on disk | OPFS is origin-private but not encrypted; if data is sensitive, encrypt at rest with a user-derived key |
| **Trusting Excel content as safe** | Malicious Excel file (XLSX can embed scripts/objects) imported into app | Parse only data cells with SheetJS; disable macro execution; validate sheet names and cell types |
| **App served over HTTP in corporate intranet** | Man-in-the-middle injection of service worker or data | Serve over HTTPS even internally; use `localhost` for development; register service worker only on secure origins |

## UX Pitfalls

Common user experience mistakes in browser-based planning tools.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Hidden capacity math** | Users don't trust the number because they can't see how it was derived | Always show an expandable "How we calculated this" breakdown |
| **Sprint board without Excel-like keyboard navigation** | Power users (Tech Lead) are slower than in their spreadsheet | Support arrow keys, Enter to edit, Esc to cancel, Tab to move fields |
| **Drag-and-drop as the only way to move stories** | Imprecise on trackpads; frustrating for bulk moves | Provide dropdown "Move to sprint" and bulk-select + move actions |
| **No empty state for "no sprints yet"** | First-time users hit a blank screen and don't know what to do | Show a guided setup: "1. Import your Excel → 2. Add your squad → 3. Plan your first sprint" |
| **Overhead/waste shown only as a percentage** | Users don't connect 20% to actual hours lost | Show both: "20% overhead ≈ 2 days per person this sprint" |
| **Forecast buried in a report tab** | Stakeholders (portfolio manager) can't find delivery dates | Show forecast prominently on the epic detail view; update in real time as scope changes |
| **No indication that data is stale** | User makes decisions based on old Excel data | Show "Last synced: 10 min ago" with a refresh button; warn if sync failed |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces for this specific domain.

- [ ] **Excel import:** Often missing header validation — verify that unexpected column names don't silently corrupt data.
- [ ] **Excel import:** Often missing date parsing — verify that Excel serial dates are converted to JS Dates correctly.
- [ ] **Offline support:** Often missing data export — verify users can recover data if browser storage is cleared.
- [ ] **Capacity calculation:** Often missing partial-day support — verify half-day absences don't get rounded to full days.
- [ ] **Sprint board:** Often missing bulk actions — verify users can select and move multiple stories.
- [ ] **Epic forecast:** Often missing confidence ranges — verify the UI doesn't show a single deterministic date.
- [ ] **OneDrive sync:** Often missing conflict detection — verify the app warns when OneDrive creates conflict copies.
- [ ] **MCP server:** Often missing input validation — verify AI agents cannot request non-existent sprints or inject malformed queries.
- [ ] **Browser storage:** Often missing persistence request — verify `navigator.storage.persist()` is called after a user gesture.
- [ ] **Corporate deployment:** Often missing HTTPS or fallback for File System Access API — verify the app works on the actual target browser configuration.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Browser storage wiped** | HIGH | Restore from manual JSON export if available; otherwise re-import Excel and re-enter local data (stories, absences). Prevention (backup export) is the only real defense. |
| **Excel corruption / bad import** | MEDIUM | Maintain a "raw import log" of the last 10 file hashes and parsed results. Allow reverting to a known-good import state. |
| **MCP schema breakage** | MEDIUM | Version MCP tools (`_v1`, `_v2`). Keep old tool versions working as aliases/shims for at least one release cycle. |
| **Capacity formula mistrusted** | LOW | Add manual override field immediately. Show calculation transparently. Validate against next 2 sprints and adjust formula. |
| **OneDrive sync stops working** | LOW | Fallback to drag-and-drop file import. Allow manual "Import Excel" at any time. Don't block the app if folder watch fails. |
| **Board too slow** | LOW | Switch to virtualized rendering. Add pagination if virtualization is too complex for the current phase. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Excel/OneDrive as database (Pitfall 1) | Phase 1 | Import 5 real Excel files without error; detect and surface conflict copies; verify hash-based change detection |
| Browser storage eviction (Pitfall 2) | Phase 2 | Test on Safari with 7 days of no use; verify data survives with `persist()` granted; verify export produces valid JSON backup |
| Capacity formulas vs. reality (Pitfall 3) | Phase 2 | Compare app calculation to Tech Lead's manual calculation for 2 sprints; allow override and track variance |
| Over-engineering offline sync (Pitfall 4) | Phase 1 | Architecture review: no CRDTs, no WebRTC, no OT. Verify sync is last-write-wins + periodic poll. |
| Epic forecasting certainty (Pitfall 5) | Phase 4 | UI review: no single dates without confidence intervals; test with scope changes to verify forecast updates |
| MCP server on unstable model (Pitfall 6) | Phase 5 | Schema freeze checklist: no breaking changes to core entities for 2 weeks before MCP build starts |
| File System Access API failure (Pitfall 7) | Phase 1 | Test import flow on managed corporate Edge/Chrome without File System Access API enabled; verify fallback works |
| Board slower than spreadsheet (Pitfall 8) | Phase 3 | Time 10 status updates on board vs. 10 cell edits in Excel; board must be faster or equal |
| Static waste percentage (Pitfall 9) | Phase 2 + Phase 4 | Track actual waste per sprint starting Phase 2; visualize trends in Phase 4; suggest adjustments |
| OneDrive sync detection issues (Pitfall 10) | Phase 1 | Monitor CPU/network in DevTools; verify no excessive polling; test file change detection with manual edits |

## Sources

- [RxDB: IndexedDB Max Storage Size Limit](https://rxdb.info/articles/indexeddb-max-storage-limit.html) — Browser-specific quota limits, eviction handling
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Official browser storage eviction policies, per-browser quotas
- [web.dev: Persistent storage](https://web.dev/articles/persistent-storage) — When and how to request persistent storage, browser heuristics
- [web.dev: Origin private file system](https://web.dev/articles/origin-private-file-system) — OPFS usage, limitations, not user-visible
- [Electric SQL: Developing local-first software](https://electric-sql.com/blog/2023/02/09/developing-local-first-software) — Local-first architecture trade-offs, dynamic partial replication, live queries
- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — File System Access API, picker requirements, permission model
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — Transactional model, storage limits, same-origin policy
- [Smashing Magazine: Progressive Web Apps](https://www.smashingmagazine.com/2016/08/a-beginners-guide-to-progressive-web-apps/) — Service workers, offline patterns, app shell
- [Model Context Protocol: Introduction](https://modelcontextprotocol.io/introduction) — MCP server concepts, data exposure risks
- [GitHub: SheetJS/sheetjs](https://github.com/SheetJS/sheetjs) — Excel parsing library, date/cell handling considerations
- Personal experience / known issues — Excel file locking behavior, OneDrive conflict copy generation, corporate browser policy restrictions

---
*Pitfalls research for: Browser-based Scrum capacity planning & sprint management*
*Researched: 2026-05-30*
