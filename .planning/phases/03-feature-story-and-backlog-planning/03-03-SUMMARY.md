---
phase: 03-feature-story-and-backlog-planning
plan: "03"
subsystem: backlog-planning
tags: [backlog, sprint-planning, planned-effort, nextjs, prisma]
requires:
  - phase: 03-feature-story-and-backlog-planning
    provides: Feature and Story schema, story CRUD, and feature aggregates
provides:
  - Backlog filters and backlog list UI
  - Story-to-sprint planning preview and assignment APIs
  - Move-to-backlog behavior and sprint planned effort summaries
affects: [phase-04, sprint-board, capacity-engine, dashboard]
tech-stack:
  added: []
  patterns: [preview-before-mutation, planned-effort hook, capacity-placeholder]
key-files:
  created:
    - src/lib/backlog.ts
    - src/app/api/backlog/route.ts
    - src/app/api/stories/[id]/plan/route.ts
    - src/app/api/stories/[id]/backlog/route.ts
    - src/features/backlog/backlog-filters.tsx
    - src/features/backlog/backlog-list.tsx
    - src/features/backlog/plan-story-dialog.tsx
    - tests/backlog.test.ts
    - tests/e2e/backlog.spec.ts
  modified:
    - src/app/backlog/page.tsx
    - src/lib/sprint-planning-summary.ts
    - src/features/sprints/sprint-list.tsx
    - src/features/sprints/sprint-detail.tsx
    - src/features/releases/release-detail.tsx
requirements-completed: [BACK-01, BACK-02, BACK-03, BACK-04, FEAT-03]
key-decisions:
  - "Backlog defaults to unplanned, non-canceled stories for the selected release."
  - "Planning preview shows current and after-add planned effort while capacity remains Pending capacity until Phase 4."
patterns-established:
  - "Story sprint assignment happens through preview-first backlog APIs."
  - "Sprint planned effort now sums non-canceled assigned story estimated days."
duration: 65 min
completed: 2026-06-03
---

# Phase 03 Plan 03: Backlog Planning Summary

**Backlog filters, sprint planning preview, assignment, return-to-backlog, and planned effort updates**

## Performance

- **Duration:** 65 min
- **Started:** 2026-06-03T07:30:00-03:00
- **Completed:** 2026-06-03T08:37:00-03:00
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Added backlog query helpers with release, feature, status, text, unplanned, and canceled filters.
- Added planning preview and confirmation APIs that set sprint backlog status only after confirmation.
- Updated sprint and release planned-effort surfaces to sum assigned non-canceled story estimated days.

## Task Commits

1. **Task 1: Add backlog queries, filters, and planned-effort summary integration** - `dca60eb`
2. **Task 2: Build backlog screen with filters and planning preview** - `dca60eb`
3. **Task 3: Implement sprint assignment, return-to-backlog, and visible summary updates** - `dca60eb`

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/lib/backlog.ts` - Backlog filters, preview, assignment, and unassignment.
- `src/lib/sprint-planning-summary.ts` - Planned effort from assigned story estimated days.
- `src/app/backlog/page.tsx` and `src/features/backlog/*` - Backlog filters, list, and plan dialog.
- `src/app/api/backlog/route.ts` and story planning APIs - Backlog API surface.
- `tests/backlog.test.ts` and `tests/e2e/backlog.spec.ts` - Unit and browser coverage.

## Decisions Made

- Kept capacity, remaining, and occupancy placeholders null with `Pending capacity`, preserving Phase 4 scope.
- Used explicit plan and backlog endpoints instead of generic story PATCH for sprint assignment.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Playwright checkbox state raced with navigation; the E2E flow now waits on API responses for state-changing actions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 can build board movement, full capacity math, closure, reopening, and leakage on top of assigned stories and planned effort.

---
*Phase: 03-feature-story-and-backlog-planning*
*Completed: 2026-06-03*
