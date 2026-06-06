---
phase: 07-impediment-tracking
plan: 01
subsystem: database-api
tags: [prisma, sqlite, next-api, impediments, vitest]
requires:
  - phase: 06-ux-polish-and-localization
    provides: "Stable local app shell, Prisma data model, story and release foundations"
provides:
  - "Story-linked impediment persistence with OPEN and RESOLVED states"
  - "Impediment data helpers for validation, release-scope inference, resolution, and impact calculations"
  - "Next API routes for creating, listing, reading, updating, and resolving impediments"
  - "Focused data/API regression tests for IMP-01 and IMP-03"
affects: [impediment-ui, timeline-impact-integration, reports, mcp]
tech-stack:
  added: []
  patterns: [story-linked release scope, final impediment resolution, business-day impact calculation]
key-files:
  created:
    - src/lib/impediments.ts
    - src/app/api/impediments/route.ts
    - src/app/api/impediments/[id]/route.ts
    - tests/impediments.test.ts
  modified:
    - prisma/schema.prisma
    - scripts/db-sync.ts
key-decisions:
  - "Impediment release scope is inferred from affected stories instead of storing a direct release relation."
  - "Resolution is final: resolved impediments cannot be reopened or resolved again."
patterns-established:
  - "Impediment API routes return { impediment } / { impediments } on success and { errors } on failure."
  - "Delivery impact is computed from affected stories and business-day duration, not persisted as a separate summary."
requirements-completed: [IMP-01, IMP-03]
duration: 15 min
completed: 2026-06-06
---

# Phase 07 Plan 01: Impediment Data And API Foundation Summary

**Story-linked impediment persistence and API routes with final resolution, release-scope validation, and business-day delivery impact calculations**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-06T03:36:31Z
- **Completed:** 2026-06-06T03:50:52Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Added `ImpedimentStatus` and `Impediment` persistence with many-to-many story links.
- Added validation that requires affected stories, rejects mixed-release selections, and infers scope through story features.
- Added helpers and API routes for create/list/detail/update/resolve flows.
- Added regression coverage for creation, invalid story selections, resolution, blocked business days, and story status preservation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Prisma schema for impediments** - `b831fe8` (feat)
2. **Task 2: Implement impediment validation and calculations** - `f535c36` (feat)
3. **Task 3: Add impediment API routes** - `36683a3` (feat)
4. **Task 4: Add data/API regression tests** - `60af09b` (test)

## Files Created/Modified

- `prisma/schema.prisma` - Adds impediment status, impediment model, story relation, and indexes.
- `scripts/db-sync.ts` - Keeps the local SQLite sync script aligned with the new impediment tables.
- `src/lib/impediments.ts` - Provides validation, CRUD, resolution, release-scope inference, and impact calculations.
- `src/app/api/impediments/route.ts` - Adds list and create endpoints.
- `src/app/api/impediments/[id]/route.ts` - Adds detail, update, and resolve endpoints.
- `tests/impediments.test.ts` - Covers data/API regressions for IMP-01 and IMP-03.

## Decisions Made

- Release scope is inferred from affected stories, matching the phase guardrail that impediments link to stories only.
- Delivery impact remains derived at read time from affected stories and dates, avoiding a denormalized summary table.
- Resolution is a final state transition that does not mutate story status or sprint assignment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added impediment DDL to the SQLite sync script**
- **Found during:** Task 2 (Implement impediment validation and calculations)
- **Issue:** `npm run db:migrate` printed success, but `tests/impediments.test.ts` failed because the hand-written `scripts/db-sync.ts` did not create the new `Impediment` and `_ImpedimentToStory` tables.
- **Fix:** Added the impediment table, indexes, implicit many-to-many relation table, and relation indexes to `scripts/db-sync.ts`.
- **Files modified:** `scripts/db-sync.ts`
- **Verification:** `npm run db:migrate`, `npm run db:generate`, and `npx vitest run tests/impediments.test.ts` pass.
- **Committed in:** `f535c36`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for local SQLite persistence correctness. No scope expansion beyond the planned impediment data foundation.

## Issues Encountered

- PowerShell blocked `npm.ps1` because script execution is disabled on this machine. Verification was rerun successfully through `npm.cmd`.
- Lint reports five pre-existing warnings outside the impediment work; no new lint errors were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 07-02 can build the impediment create/list/detail/resolve UI on top of the API routes and `toImpedimentView` payload shape. Plan 07-03 can consume the same story-linked impact data for release timeline markers.

---
*Phase: 07-impediment-tracking*
*Completed: 2026-06-06*
