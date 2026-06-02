---
phase: 04-release-planning-ux-redesign
plan: 01
subsystem: database-api
tags: [sqlite, releases, sprint-release, backlog-hierarchy]
requires:
  - phase: 03-sprint-planning-board-estimation
    provides: sprint CRUD, sprint board, estimates, and backlog hierarchy
provides:
  - Release schema and repository
  - Release-scoped sprint persistence
  - Release feature membership
  - Story and bug feature-parent validation
affects: [phase-04, phase-05, forecasting]
tech-stack:
  added: []
  patterns: [repository validation plus SQLite triggers, additive migration]
key-files:
  created: [src/data/release-repository.ts]
  modified: [src/data/schema.ts, src/domain/types.ts, src/data/sprint-repository.ts, src/data/backlog-repository.ts, server.ts]
key-decisions:
  - "Existing sprints are backfilled into Release inicial to preserve local data."
  - "Stories and bugs are guarded in both repository code and SQLite triggers."
patterns-established:
  - "Release-scoped repositories validate cross-entity ownership before writes."
requirements-completed: [REL-01, REL-02, REL-03]
duration: 16 min
completed: 2026-06-01
---

# Phase 04 Plan 01: Release Data Foundation Summary

**Release-first SQLite model with release-scoped sprints, feature membership, and hard story/bug parent guards**

## Performance

- **Duration:** 16 min
- **Started:** 2026-06-01T21:52:56-03:00
- **Completed:** 2026-06-01T22:08:21-03:00
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments

- Added release and release feature persistence with safe migration.
- Added `release_id` to sprints and release-aware sprint lookup.
- Blocked orphan stories/bugs through repository validation and SQLite triggers.
- Exposed release CRUD and release-scoped sprint/feature endpoints.

## Task Commits

1. **Release data foundation and API** - `05d2493` (feat)

## Files Created/Modified

- `src/data/release-repository.ts` - Release CRUD, feature membership, allocation validation.
- `src/data/schema.ts` - Release tables, sprint release_id, triggers, and default release backfill.
- `src/domain/types.ts` - Release, release feature, board summary, and sprint release_id types.
- `src/data/sprint-repository.ts` - Release-aware sprint reads and sprint item membership validation.
- `src/data/backlog-repository.ts` - Feature-parent validation for stories and bugs.
- `server.ts` - Release and release-scoped sprint/feature API routes.

## Decisions Made

- Kept legacy sprint reads working while moving creation into release context.
- Used additive SQLite migration instead of table rebuild to avoid local data loss.

## Deviations from Plan

None - plan executed as written, with the release planning service also introduced in the same backend commit to keep API contracts coherent.

## Issues Encountered

None for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for release board calculations and UI consumption.

---
*Phase: 04-release-planning-ux-redesign*
*Completed: 2026-06-01*
