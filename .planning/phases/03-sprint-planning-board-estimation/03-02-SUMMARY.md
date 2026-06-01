---
phase: 03-sprint-planning-board-estimation
plan: 02
subsystem: sprint-planning
tags: [react, sqlite, bun, capacity, sprint-membership]

requires:
  - phase: 03-sprint-planning-board-estimation
    provides: sprint CRUD, estimate fields, and sprint selection
  - phase: 02-squad-capacity-engine
    provides: capacity calculation API with waste and overrides
provides:
  - Sprint membership repository methods and REST endpoints
  - Eligible backlog picker for stories and bugs
  - Sprint scope panel with add/remove flow
  - Capacity and estimate summary with non-blocking warnings
affects: [phase-03, sprint-board, drag-and-drop, forecasting]

tech-stack:
  added: []
  patterns:
    - Two-column React planning workspace backed by sprint membership APIs
    - Advisory capacity warnings that do not block workflow changes

key-files:
  created:
    - src/components/SprintPlanningWorkspace.tsx
    - src/components/SprintBacklogPicker.tsx
    - src/components/SprintScopePanel.tsx
    - src/components/SprintCapacitySummary.tsx
  modified:
    - src/data/sprint-repository.ts
    - src/domain/types.ts
    - server.ts
    - src/App.tsx

key-decisions:
  - "Membership add/remove is validated in SprintRepository so API and future UI paths share the story/bug-only rule."
  - "Capacity is converted from hours to days at 6h/day for comparison with squad work-day estimates."
  - "Removing a sprint item raises backlog priority so it returns near the top of the available list."

patterns-established:
  - "Sprint planning components refresh through a shared refreshKey after add/remove operations."
  - "Capacity failures are represented as non-blocking UI state instead of blocking sprint planning."

requirements-completed: [SPRT-02, EST-01, EST-02]

duration: 5 min
completed: 2026-05-31
---

# Phase 03 Plan 02: Planning Workspace & Capacity Summary

**Two-column sprint planning workspace with story/bug membership, estimate totals, and advisory capacity warnings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-01T02:13:00Z
- **Completed:** 2026-06-01T02:17:58Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- Added sprint membership add/remove/read, available backlog, and totals methods.
- Added REST endpoints for sprint items, available backlog, and sprint totals.
- Built a two-column planning workspace connected to selected sprint state.
- Added capacity, day, point, and unestimated item warnings without blocking add/remove actions.

## Task Commits

1. **Tasks 1-4: Sprint planning workspace and capacity summary** - `393b0b0` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/data/sprint-repository.ts` - Adds membership, available backlog, and totals methods.
- `src/domain/types.ts` - Adds sprint planning totals and candidate types.
- `server.ts` - Adds sprint membership REST endpoints.
- `src/App.tsx` - Renders workspace for the selected sprint.
- `src/components/SprintPlanningWorkspace.tsx` - Coordinates workspace refreshes and totals.
- `src/components/SprintBacklogPicker.tsx` - Lists eligible backlog items and adds them to sprint scope.
- `src/components/SprintScopePanel.tsx` - Lists sprint scope items and removes them.
- `src/components/SprintCapacitySummary.tsx` - Shows totals, capacity, and warnings.

## Decisions Made

- Kept planning membership validation server-side and repository-side to prevent bypassing the UI.
- Kept capacity unavailable as a visible warning so users can still plan during local data/API interruptions.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope creep.

## Issues Encountered

None.

## Verification

- `bun run build` passed.
- Temporary server API smoke checks passed for available backlog filtering, add/remove membership, duplicate rejection, epic rejection, totals, unestimated count, and capacity fetch.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `03-03`: membership and manual ordering fields exist, so drag-and-drop can persist backlog priority and sprint order.

---
*Phase: 03-sprint-planning-board-estimation*
*Completed: 2026-05-31*
