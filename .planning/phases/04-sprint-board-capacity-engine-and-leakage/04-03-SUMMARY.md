---
phase: 04-sprint-board-capacity-engine-and-leakage
plan: "03"
subsystem: sprint-execution
tags: [sprint-closure, leakage-history, prisma, sqlite, api, vitest]
requires:
  - phase: 04-sprint-board-capacity-engine-and-leakage
    provides: sprint board and capacity summaries
provides:
  - Sprint close and reopen helpers
  - Append-only leakage history records
  - Close/reopen API routes and sprint detail controls
  - Closed-sprint read-only board mode with leakage indicators
affects: [sprints, stories, leakage, dashboard, reports, mcp]
tech-stack:
  added: []
  patterns:
    - Closure mutations run through dedicated domain helper before API routes
    - Leakage records are append-only and exposed through sprint page queries
key-files:
  created:
    - src/lib/sprint-closure.ts
    - src/app/api/sprints/[id]/close/route.ts
    - src/app/api/sprints/[id]/reopen/route.ts
    - tests/sprint-closure.test.ts
    - tests/sprint-closure-api.test.ts
    - tests/e2e/sprint-closure.spec.ts
  modified:
    - prisma/schema.prisma
    - scripts/db-sync.ts
    - src/features/sprints/sprint-detail.tsx
    - src/app/sprints/[id]/page.tsx
key-decisions:
  - "LeakageHistory is mapped to the SQLite leakage_history table and has no update/delete API."
  - "Closing a sprint creates the next sprint before moving unfinished stories when no destination exists."
patterns-established:
  - "Sprint closure requires IN_PROGRESS status server-side."
  - "DONE stories remain in the origin sprint; SPRINT_BACKLOG and IN_PROGRESS stories move to the destination sprint preserving status."
requirements-completed: [SPR-04, SPR-05, SPR-06, SPR-07, SPR-08]
duration: 18 min
completed: 2026-06-03
---

# Phase 04 Plan 03: Sprint Closure And Leakage Summary

**Sprint close/reopen workflow with unfinished-story migration and append-only leakage history**

## Performance

- **Duration:** 18 min
- **Started:** 2026-06-03T12:30:00Z
- **Completed:** 2026-06-03T12:48:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added `LeakageHistory` to Prisma and SQLite sync.
- Added close/reopen helpers that validate sprint state, move unfinished stories, create a next sprint if needed, and preserve leakage records.
- Added close/reopen API routes and sprint detail confirmation modals.
- Added leakage indicators to sprint board cards and kept closed boards read-only.

## Task Commits

1. **Task 1-3: Schema, helpers, APIs, UI, and tests** - `7545c3f` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `prisma/schema.prisma` - LeakageHistory model and relations.
- `scripts/db-sync.ts` - Local SQLite leakage table and indexes.
- `src/lib/sprint-closure.ts` - Closure validation, close, reopen, auto-create, and leakage helpers.
- `src/app/api/sprints/[id]/close/route.ts` - Close endpoint.
- `src/app/api/sprints/[id]/reopen/route.ts` - Reopen endpoint.
- `src/features/sprints/sprint-detail.tsx` - Close/reopen controls and confirmation modals.
- `src/app/sprints/[id]/page.tsx` - Closure counts, destination preview, leakage query.
- `tests/sprint-closure.test.ts` - Domain behavior coverage.
- `tests/sprint-closure-api.test.ts` - API behavior coverage.
- `tests/e2e/sprint-closure.spec.ts` - Browser close/reopen/leakage flow coverage.

## Decisions Made

- Kept leakage append-only by exposing only create paths inside sprint closure.
- Preserved unfinished story statuses during migration, matching the sprint history requirement.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 can build dashboard, alerts, reports, timeline, and MCP leakage reads from the persisted leakage history and real sprint summaries.

## Self-Check: PASSED

- `npm.cmd run test -- sprint-closure.test.ts sprint-closure-api.test.ts` passed.
- Prisma Client was regenerated after schema changes.

---
*Phase: 04-sprint-board-capacity-engine-and-leakage*
*Completed: 2026-06-03*
