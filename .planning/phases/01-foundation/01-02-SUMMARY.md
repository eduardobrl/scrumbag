---
phase: 01-foundation
plan: 02
subsystem: api
tags: [bun, sqlite, react, tailwind, zod, crud]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Walking skeleton with Bun server, SQLite schema, minimal React SPA, and backlog create/list"
provides:
  - Full CRUD repository pattern over SQLite (findById, update, delete)
  - Typed domain types with BacklogItemType and BacklogItemStatus unions
  - REST API endpoints for GET/PUT/DELETE /api/backlog/:id with Zod validation
  - React BacklogList component with edit/delete actions
  - React BacklogForm component for create/edit with client-side validation
  - App.tsx integration wiring UI to API with state management
affects:
  - 01-03 (Hierarchy — will extend backlog items with parent-child relationships)
  - 01-04 (Excel Sync — imported items will use the same backlog_items table)
  - Phase 2 (Squad & Capacity — backlog items feed into capacity calculations)

# Tech tracking
tech-stack:
  added: [zod]
  patterns:
    - "Repository pattern with parameterized queries over bun:sqlite"
    - "Zod schema validation on API input boundaries"
    - "React controlled form components with useEffect reset on mode change"
    - "SPA state management with useState + useEffect fetch pattern"

key-files:
  created:
    - src/components/BacklogList.tsx
    - src/components/BacklogForm.tsx
  modified:
    - src/domain/types.ts
    - src/data/backlog-repository.ts
    - server.ts
    - src/App.tsx

key-decisions:
  - "Dynamic UPDATE query builder in repository builds SET clauses only from provided fields, avoiding null overwrites"
  - "BacklogForm emits NewBacklogItem shape even during edit; App.tsx closes over editingItem.id to dispatch PUT"

patterns-established:
  - "Repository pattern: all DB access goes through typed repository classes with parameterized queries"
  - "API validation: Zod schemas on POST/PUT boundaries before repository access"
  - "Generic error responses: no raw exception details or stack traces leaked to client"

requirements-completed:
  - BACK-01

# Metrics
duration: 18min
completed: 2026-05-31
---

# Phase 1 Plan 2: Backlog CRUD Summary

**Full backlog CRUD vertical slice: typed domain unions, SQLite repository with dynamic updates, Zod-validated REST API, and React table/form UI with edit/delete actions.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-31T03:37:00Z
- **Completed:** 2026-05-31T03:41:30Z
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Added BacklogItemType ("epic" | "feature" | "story" | "bug") and BacklogItemStatus ("backlog" | "in_progress" | "done") union types for type safety across stack
- Extended BacklogRepository with findById, update (dynamic SET clause), and delete using parameterized queries
- Implemented GET /api/backlog/:id, PUT /api/backlog/:id, DELETE /api/backlog/:id with proper HTTP status codes
- Enhanced POST /api/backlog with Zod schema validation (type enum, title min(1), optional description/status/priority)
- Added parseJson helper for safe JSON body parsing returning 400 on SyntaxError
- Built BacklogList table component with localized type/status badges and Edit/Delete buttons with confirm dialog
- Built BacklogForm component supporting both create and edit modes with client-side title validation
- Integrated everything in App.tsx with fetch-on-mount, create/update/delete handlers, and editing state management

## Task Commits

Each task was committed atomically:

1. **Task 1: Define domain types and extend repository with full CRUD** - `c3677dd` (feat)
2. **Task 2: Implement full backlog REST API with validation** - `be7f72a` (feat)
3. **Task 3: Build backlog list and form UI components** - `dc10508` (feat)

## Files Created/Modified
- `src/domain/types.ts` - Added BacklogItemType, BacklogItemStatus, UpdateBacklogItem; refined existing interfaces to use union types
- `src/data/backlog-repository.ts` - Added findById, update (dynamic SET), delete; all queries parameterized
- `server.ts` - Added GET/PUT/DELETE /api/backlog/:id, Zod validation on POST, parseJson helper, generic error responses
- `src/components/BacklogList.tsx` - Table with Type/Title/Status/Actions columns, localized labels, hover states
- `src/components/BacklogForm.tsx` - Controlled form with type/status selects, title/description inputs, create/edit mode switching, Cancel button
- `src/App.tsx` - Integrated BacklogForm and BacklogList, managed items/editingItem/loading state, wired fetch handlers

## Decisions Made
- Dynamic UPDATE query builder in repository constructs SET clauses only from fields present in the changes object, preventing accidental null overwrites of unspecified columns
- BacklogForm stays agnostic of API calls and just emits form data; App.tsx determines whether to POST or PUT based on editingItem state
- Client-side title validation (non-empty check) provides immediate feedback before API call; server-side Zod validation serves as the authoritative gate

## Deviations from Plan

### Auto-fixed Issues

None — plan executed without unplanned auto-fixes.

### Verification Adjustments

**1. SPA curl verification limitation**
- **Found during:** Task 3 verification
- **Issue:** The plan's automated verify script (`curl -s http://localhost:3000 | grep -c "Backlog"`) cannot pass for a React SPA because "Backlog" is rendered client-side by JavaScript and is not present in the initial HTML shell served by Bun.serve.
- **Fix:** Verified via build success (`bun run build` passes), server start (`bun server.ts` serves the app), and full end-to-end API flow (create → list → update → delete → validation errors).
- **Files modified:** None

**2. Bun Windows background-process crash**
- **Found during:** Task 1 verification
- **Issue:** `bun run dev &` followed by curl requests triggered a Bun v1.3.13 internal assertion failure on Windows (panic: Internal assertion failure).
- **Fix:** Worked around by testing repository logic directly against an in-memory `:memory:` SQLite database via `bun -e` script. Subsequent server starts with `timeout` succeeded without crashes.
- **Files modified:** None

---

**Total deviations:** 0 auto-fixed, 2 verification workarounds
**Impact on plan:** No functional impact. Workarounds were due to SPA architecture and Windows runtime behavior, not code issues.

## Issues Encountered
- `updated_at` format inconsistency after SQLite `CURRENT_TIMESTAMP` ("YYYY-MM-DD HH:MM:SS") vs JS `Date.toISOString()` ("YYYY-MM-DDTHH:MM:SS.sssZ") — inherited from 01-01 where `created_at` uses JS Date and `update` uses SQLite default. Functional, but noted for future standardization.

## Known Stubs

None — all UI components are wired to live API data. No placeholder text, hardcoded empty values, or unconnected data sources.

## Threat Flags

No new threat flags introduced beyond the plan's threat model (T-01-02b, T-01-04, T-01-05, T-01-06). All mitigations are in place:
- Parameterized queries in repository (mitigates T-01-02b)
- Generic `{ error: string }` responses without stack traces (mitigates T-01-04)
- `parseJson` helper catches SyntaxError before repository access (mitigates T-01-05)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backlog CRUD foundation is complete and ready for 01-03 (Hierarchy) to add parent-child relationships
- Repository already supports `parent_id` field from 01-01 schema
- UI table and form can be extended to show/edit parent assignments
- No blockers

## Self-Check: PASSED

- [x] `src/components/BacklogList.tsx` exists
- [x] `src/components/BacklogForm.tsx` exists
- [x] `src/domain/types.ts` exists
- [x] `src/data/backlog-repository.ts` exists
- [x] `server.ts` exists
- [x] `src/App.tsx` exists
- [x] `.planning/phases/01-foundation/01-02-SUMMARY.md` exists
- [x] Commit `c3677dd` found in git log
- [x] Commit `be7f72a` found in git log
- [x] Commit `dc10508` found in git log

---
*Phase: 01-foundation*
*Completed: 2026-05-31*
