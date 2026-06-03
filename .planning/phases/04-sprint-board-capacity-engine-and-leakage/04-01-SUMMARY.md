---
phase: 04-sprint-board-capacity-engine-and-leakage
plan: "01"
subsystem: ui
tags: [nextjs, react, sprint-board, api, playwright, vitest]
requires:
  - phase: 03-feature-story-and-backlog-planning
    provides: backlog stories, story planning endpoint, sprint planned-effort summary
provides:
  - Three-column sprint board with fixed workflow columns
  - Story status update API for board drag-and-drop
  - Add-story dialog using existing backlog planning preview and assignment flow
affects: [sprints, stories, backlog, capacity, leakage]
tech-stack:
  added: []
  patterns:
    - Native HTML5 drag-and-drop for local board movement
    - Client dialog backed by existing story planning API
key-files:
  created:
    - src/features/sprints/sprint-board.tsx
    - src/features/sprints/add-story-dialog.tsx
    - src/app/api/stories/[id]/status/route.ts
    - tests/sprint-board.test.ts
    - tests/e2e/sprint-board.spec.ts
  modified:
    - src/app/sprints/[id]/page.tsx
    - src/lib/stories.ts
key-decisions:
  - "Reused the Phase 3 /api/stories/{id}/plan endpoint for add-story confirmation to preserve backlog planning behavior."
  - "Used native HTML5 drag-and-drop instead of adding a board library for this MVP slice."
patterns-established:
  - "Sprint board columns map directly to SPRINT_BACKLOG, IN_PROGRESS, and DONE story statuses."
  - "Board API accepts only workflow statuses and rejects BACKLOG/CANCELLED moves."
requirements-completed: [BOARD-01, BOARD-02, BOARD-03]
duration: 16 min
completed: 2026-06-03
---

# Phase 04 Plan 01: Sprint Board Foundation Summary

**Three-column sprint board with persisted story status changes and backlog story assignment preview**

## Performance

- **Duration:** 16 min
- **Started:** 2026-06-03T12:00:00Z
- **Completed:** 2026-06-03T12:16:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added the sprint board with "Backlog da Sprint", "Em Execucao", and "Finalizado" columns.
- Added a story status PATCH endpoint and wired board drops to persist status changes.
- Added an add-story dialog that lists unplanned non-canceled backlog stories and confirms assignment through the existing planning API.

## Task Commits

1. **Task 1-3: Sprint board, status API, and add-story dialog** - `48d63ee` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/features/sprints/sprint-board.tsx` - Board columns, cards, drag-and-drop, read-only mode hook, and leakage display hook.
- `src/features/sprints/add-story-dialog.tsx` - Backlog story selector with planning preview and confirmation.
- `src/app/api/stories/[id]/status/route.ts` - Board status update endpoint with workflow status whitelist.
- `src/app/sprints/[id]/page.tsx` - Loads sprint stories and renders the board below sprint details.
- `src/lib/stories.ts` - Exports story status validation for the status API.
- `tests/sprint-board.test.ts` - Fixed column/status mapping coverage.
- `tests/e2e/sprint-board.spec.ts` - Add-story board flow coverage.

## Decisions Made

- Reused existing Phase 3 planning mutation for adding stories so capacity preview behavior stays centralized.
- Kept the board dependency-free with native drag-and-drop for the local-first MVP.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- PowerShell blocked `npm.ps1`; verification used `npm.cmd` instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 04-02 capacity integration. The board already exposes the add-story preview path that capacity can enrich.

## Self-Check: PASSED

- `npm.cmd run test -- sprint-board.test.ts` passed.
- Board columns and status mappings are covered by unit test.

---
*Phase: 04-sprint-board-capacity-engine-and-leakage*
*Completed: 2026-06-03*
