---
phase: 01-foundation
plan: 04
subsystem: sync
tags: [excel, sheetjs, chokidar, sha256, file-watcher, import]

requires:
  - phase: 01-01
    provides: "SQLite schema with file_hashes table for content-hash tracking"
  - phase: 01-02
    provides: "BacklogRepository with create and findAll for importing items"

provides:
  - SHA-256 content hashing for Excel file change detection
  - chokidar file watcher monitoring a configurable folder for .xlsx changes
  - SheetJS-based Excel parser mapping rows to backlog items with flexible column names
  - Content-hash deduplication preventing re-import of unchanged files
  - Title-based deduplication preventing duplicate backlog items within the same import
  - Sync configuration UI with folder path, last sync time, and manual trigger
  - REST API endpoints for sync status, folder update, and manual trigger

affects:
  - Phase 2 (Squad & Capacity — imported backlog items feed into capacity)
  - Phase 3 (Sprint Planning — imported items can be added to sprints)

tech-stack:
  added: []
  patterns:
    - "File watcher pattern with chokidar for local folder monitoring"
    - "Content-hash deduplication via SHA-256 before parsing"
    - "Flexible column mapping for Excel imports (case-insensitive)"
    - "Bun.Glob for manual folder scanning on sync trigger"

key-files:
  created:
    - src/sync/hash.ts
    - src/sync/watcher.ts
    - src/sync/excel-importer.ts
    - src/components/SyncConfig.tsx
  modified:
    - server.ts
    - src/App.tsx

key-decisions:
  - "Used client-side recursive fetching for cycle prevention instead of a dedicated descendants endpoint"
  - "Manual trigger rescans all .xlsx files in the active folder using Bun.Glob"
  - "Title + type combination used as deduplication key within an import batch"

requirements-completed:
  - SYNC-01
  - SYNC-02
---

# Phase 1 Plan 04: Excel Sync Summary

**Automatic Excel file ingestion from a watched folder with content-hash deduplication and sync configuration UI**

## Performance

- **Duration:** ~15 min (inline after subagent stall)
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

### Task 1: Implement content hashing and chokidar file watcher

- Created `src/sync/hash.ts` with `sha256(buffer)` using `Bun.crypto.subtle.digest`
- Created `src/sync/watcher.ts` with `startWatcher(folderPath, db, onSync)` and `stopWatcher()`
- Watcher monitors `.xlsx` files only, computes SHA-256, compares against `file_hashes` table
- Emits sync events only for new or changed files
- Server initializes watcher on startup with default folder `./synced`

### Task 2: Build SheetJS Excel parser and backlog import service

- Created `src/sync/excel-importer.ts` with `importExcelFile(filePath, content, db)`
- Reads first sheet (or "Backlog" sheet if present)
- Flexible column mapping: Title, Type, Description, Status, Priority (case-insensitive)
- Defaults: missing/unrecognized type → "story", missing status → "backlog", missing priority → 0
- Deduplicates by title + type combination within the import batch
- Returns `{ imported, skipped }` counts
- Stores hash in `file_hashes` table after successful import

### Task 3: Create sync configuration UI and status endpoints

- Added API endpoints to `server.ts`:
  - `GET /api/sync/status` → `{ folderPath, lastSync, filesWatched }`
  - `PUT /api/sync/folder` → validates relative path, restarts watcher
  - `POST /api/sync/trigger` → rescans folder with Bun.Glob, returns counts
- Created `src/components/SyncConfig.tsx`:
  - Displays current folder, last sync time, files watched
  - Input to change folder path with validation feedback
  - "Sincronizar Agora" button for manual trigger
  - Polls status every 5 seconds
- Updated `App.tsx` with tab navigation (Backlog / Sincronização)

## Files Created/Modified

- `src/sync/hash.ts` — SHA-256 hashing utility
- `src/sync/watcher.ts` — chokidar watcher with hash-based change detection
- `src/sync/excel-importer.ts` — SheetJS parser and import service
- `src/components/SyncConfig.tsx` — sync folder config and status UI
- `server.ts` — added sync API endpoints and watcher integration
- `src/App.tsx` — tab navigation integrating SyncConfig

## Decisions Made

- Chose Bun.Glob for manual trigger scanning instead of re-walking chokidar internals
- Validation rejects absolute paths and paths containing `..` to prevent traversal
- Watcher uses `awaitWriteFinish` with 2-second stability threshold to avoid reading half-written files from OneDrive sync

## Deviations from Plan

### 1. [Positive] Bun.Glob used for manual trigger instead of chokidar internal state

- **Reason:** Chokidar's internal file list is not easily accessible for manual rescans. Bun.Glob provides a clean, native way to enumerate `.xlsx` files in the folder.
- **Impact:** Manual trigger works reliably regardless of watcher state.

## Issues Encountered

- 01-04 subagent spawn stalled (same runtime issue as 01-03). Fallback to inline execution succeeded.
- `nul` file caused `git add -A` failures earlier in the session. Removed from working tree.

## User Setup Required

- Create a folder (default: `./synced`) and place `.xlsx` files in it.
- Excel files should have columns: Title, Type, Description, Status, Priority (flexible naming).

## Next Phase Readiness

- Excel sync is complete and functional. Phase 2 can assume backlog items are present.
- No blockers.

## Self-Check: PASSED

- [x] Watcher detects new/changed .xlsx files
- [x] Content hashing prevents duplicate imports
- [x] Excel rows map to backlog items with correct defaults
- [x] Sync UI shows status and allows manual trigger
- [x] Folder path can be changed via API/UI
- [x] All task commits exist in git history

---
*Phase: 01-foundation*
*Plan: 04*
*Completed: 2026-05-31*
